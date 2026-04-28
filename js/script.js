// ================= IMPORTS =================
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// ================= MAIN =================
document.addEventListener("DOMContentLoaded", () => {
  // ================= NAVBAR TOGGLE =================
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (window.scrollY > 20) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  });

  // ================= NAVBAR AUTH =================
  const navAuth = document.getElementById("nav-auth");

  if (navAuth) {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) return;

        const userData = snap.data();

        let dashboard = "pages/student-dashboard.html";
        if (userData.role === "Tutor") {
          dashboard = "pages/tutor-dashboard.html";
        }

        navAuth.innerHTML = `
          <a href="${dashboard}" class="nav-btn nav-btn-secondary">Profile</a>
          <button id="logoutNav" class="nav-btn nav-btn-primary">Logout</button>
        `;

        document
          .getElementById("logoutNav")
          ?.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = "pages/login.html";
          });
      } else {
        navAuth.innerHTML = `
          <a href="pages/login.html" class="nav-btn nav-btn-secondary">Login</a>
          <a href="pages/signup.html" class="nav-btn nav-btn-primary">Get Started</a>
        `;
      }
    });
  }

  // ================= HOME SEARCH =================
if (
  window.location.pathname.includes("index.html") ||
  window.location.pathname === "/"
) {

  const searchBtn = document.getElementById("search-btn");

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const filters = {
        city: document.getElementById("city")?.value.trim().toLowerCase() || "",
        area: document.getElementById("area")?.value.trim().toLowerCase() || "",
        subject: document.getElementById("subject")?.value.toLowerCase() || "",
        board: document.getElementById("Board")?.value.toLowerCase() || "",
        classLevel: document.getElementById("Class")?.value || "",
        mode: document.getElementById("mode")?.value.toLowerCase() || "",
      };

      localStorage.setItem("filters", JSON.stringify(filters));
      localStorage.setItem("isSearch", "true");

      window.location.href = "pages/findTutor.html";
    });
  }
}


// ================= AUTOCOMPLETE (SEPARATE BLOCK) =================

document.addEventListener("DOMContentLoaded", () => {

  const cityInput = document.getElementById("city");
  const suggestionBox = document.getElementById("city-suggestions");

  console.log("City Input:", cityInput);

  const cities = [
    "Delhi", "Dehradun", "Mumbai", "Meerut",
    "Noida", "Gurgaon", "Ghaziabad",
    "Chandigarh", "Pune", "Bangalore"
  ];

  if (!cityInput || !suggestionBox) return;

  cityInput.addEventListener("input", () => {
    const value = cityInput.value.toLowerCase();

    suggestionBox.innerHTML = "";

    if (!value) return;

    const filtered = cities
      .filter(city => city.toLowerCase().startsWith(value) || city.toLowerCase().includes(value))
      .slice(0, 5);

    filtered.forEach(city => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.innerText = city;

      div.addEventListener("click", () => {
        cityInput.value = city;
        suggestionBox.innerHTML = "";
      });

      suggestionBox.appendChild(div);
    });
  });

});

  // ================= TUTOR PROFILE =================
  if (window.location.pathname.includes("tutor-profile")) {
    const params = new URLSearchParams(window.location.search);
    const tutorId = params.get("id");

    let currentUser = null;
    let currentRole = "";

    // ================= AUTH FIRST =================
    onAuthStateChanged(auth, async (user) => {
      currentUser = user;

      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        currentRole = (snap.data().role || "").toLowerCase();
      }

      loadProfile();
      loadTutorListings(); // NOW role is ready
    });

    // ================= PROFILE =================
    async function loadProfile() {
      if (!tutorId) return;

      try {
        const docSnap = await getDoc(doc(db, "users", tutorId));

        if (!docSnap.exists()) {
          console.log("No user found");
          return;
        }

        const t = docSnap.data();

        // ✅ Clean + safe name handling
        let name = "Tutor";

        if (t.name && typeof t.name === "string") {
          const trimmed = t.name.trim();

          // ❌ reject numbers-only names
          if (trimmed !== "" && !/^\d+$/.test(trimmed)) {
            name = trimmed;
          }
        }

        // fallback → email username
        if (name === "Tutor" && t.email) {
          name = t.email.split("@")[0];
        }

        // capitalize
        name = name.charAt(0).toUpperCase() + name.slice(1);

        // ✅ Set UI
        document.getElementById("tutor-name").textContent = name;
        document.getElementById("tutor-degree").textContent = t.role || "";
        document.getElementById("tutor-location").textContent = t.email || "";

        document.getElementById("tutor-about").textContent =
          t.bio && t.bio.trim() !== ""
            ? t.bio
            : "This tutor hasn't added a bio yet.";
      } catch (err) {
        console.error("Load profile error:", err);
      }
    }
    // ================= LISTINGS =================
    async function loadTutorListings() {
      const container = document.getElementById("tutor-listings");

      const q = query(
        collection(db, "listings"),
        where("tutorId", "==", tutorId),
      );

      const snapshot = await getDocs(q);

      container.innerHTML = "";

      const isStudent = currentRole === "student";
      const isOwner = currentUser && currentUser.uid === tutorId;

      snapshot.forEach((docSnap) => {
        const l = docSnap.data();

        const div = document.createElement("div");

        div.innerHTML = `
      <div class="listing-card">
        <h4>${l.title}</h4>
        <p>${l.subject}</p>
        <p>₹${l.price}</p>

        ${isStudent ? `<button class="request-btn">Request</button>` : ""}

        ${isOwner ? `<button class="delete-btn">Delete</button>` : ""}
      </div>
    `;

        const requestBtn = div.querySelector(".request-btn");

        if (requestBtn) {
          requestBtn.addEventListener("click", async () => {
            const user = auth.currentUser;

            if (!user) {
              alert("Please login first");
              window.location.href = "login.html";
              return;
            }

            try {
              await addDoc(collection(db, "requests"), {
                listingId: docSnap.id,
                tutorId: l.tutorId,
                studentId: user.uid,
                status: "pending",
                createdAt: new Date(),
              });

              alert("Request sent");
              loadTutorListings(); // refresh
            } catch (err) {
              console.error(err);
              alert("Error sending request");
            }
          });
        }

        container.appendChild(div);

        // ✅ DELETE LOGIC (CORRECT PLACE)
        if (isOwner) {
          div
            .querySelector(".delete-btn")
            .addEventListener("click", async () => {
              const confirmDelete = confirm("Delete this listing?");
              if (!confirmDelete) return;

              try {
                await deleteDoc(doc(db, "listings", docSnap.id));

                alert("Listing deleted");
                div.remove();
              } catch (err) {
                console.error(err);
                alert("Error deleting listing");
              }
            });
        }
      });
    }
    // ================= EDIT PROFILE =================
    const editBtn = document.getElementById("edit-profile-btn");

    editBtn.onclick = () => {
      document.getElementById("edit-form").style.display = "block";
    };

    document.getElementById("save-profile").onclick = async () => {
      const name = document.getElementById("edit-name").value;
      const bio = document.getElementById("edit-bio").value;

      try {
        await updateDoc(doc(db, "users", tutorId), {
          name,
          bio,
        });

        alert("Profile updated ✅");
        location.reload();
      } catch (err) {
        console.error(err);
        alert("Update failed");
      }
    };

    // ================= EDIT BUTTON VISIBILITY =================
    onAuthStateChanged(auth, (user) => {
      if (!user) return;

      if (user.uid !== tutorId) {
        editBtn.style.display = "none";
      }
    });
  }

  // ===== EXPLORE ANIMATION =====

  const reveal = document.querySelector(".reveal-section");

  if (reveal) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(reveal);
  }

  // ===== PARALLAX EFFECT =====

  const card = document.querySelector(".instagram-card");

  if (card) {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 25;
      const rotateY = (centerX - x) / 25;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0) rotateY(0)";
    });
  }

  const contactForm = document.getElementById("contactForm");

  contactForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("contactName").value;
    const email = document.getElementById("contactEmail").value;
    const subject = document.getElementById("contactSubject").value;
    const message = document.getElementById("contactMessage").value;

    try {
      await addDoc(collection(db, "contacts"), {
        name,
        email,
        subject,
        message,
        createdAt: new Date(),
      });

      alert("Message sent successfully");
      contactForm.reset();
    } catch (err) {
      console.error(err);
      alert("Error sending message");
    }
  });
});
