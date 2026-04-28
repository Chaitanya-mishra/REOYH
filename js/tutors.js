import {
  addDoc,
  collection,
  query, 
  where, 
  doc, 
  getDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("tutors.js loaded");

// ================= BECOME TUTOR =================
if (window.location.pathname.includes("become-tutor.html")) {
  console.log("Become Tutor page");

  const form = document.getElementById("tutorForm");

  if (!form) {
    console.log("Form not found");
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("tutorMsg");

    if (msg) {
      msg.textContent = "Submitting...";
      msg.style.color = "#555";
    }

    const user = auth.currentUser;

    if (!user) {
      if (msg) {
        msg.textContent = "Login first!";
        msg.style.color = "red";
      }
    }

    const data = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      city: document.getElementById("city").value.trim(),
      subject: document.getElementById("subject").value.trim(),
      mode: document.getElementById("mode").value,
      experience: document.getElementById("experience").value.trim(),
      price: document.getElementById("price").value.trim(),
      description: document.getElementById("description").value.trim(),
      userId: user.uid,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, "tutors"), data);

      console.log("Saved to Firestore");

      if (msg) {
        msg.textContent = "Tutor profile created successfully!";
        msg.style.color = "green";
      }

      form.reset();
    } catch (err) {
      console.error("Error:", err);

      if (msg) {
        msg.textContent = "Something went wrong. Try again.";
        msg.style.color = "red";
      }
    }
  });
}

// ================= FIND TUTOR =================

if (window.location.pathname.includes("findTutor.html")) {
  const container = document.getElementById("tutor-container");
  let currentRole = "";

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      currentRole = (snap.data().role || "").toLowerCase();
    }

    console.log("ROLE:", currentRole);
    loadListings();
  });

  async function loadListings() {
    try {
      const snapshot = await getDocs(collection(db, "listings"));

      const isSearch = localStorage.getItem("isSearch") === "true";
      const filters = JSON.parse(localStorage.getItem("filters")) || {};

      container.innerHTML = "";

      for (const docSnap of snapshot.docs) {
        const t = docSnap.data();
        const tutorId = t.tutorId;
        const subject = (t.subject || "").toLowerCase();

        // FILTERS
if (isSearch) {

  const subject = (t.subject || "").toLowerCase();
  const board = (t.board || "").toLowerCase();
  const mode = (t.mode || "").toLowerCase();
  const classLevel = t.classLevel || "";

  const match =
    (!filters.subject || subject.includes(filters.subject)) &&
    (!filters.classLevel || classLevel === filters.classLevel) &&
    (!filters.board || board === filters.board) &&
    (!filters.mode || mode === filters.mode);

  if (!match) continue;
}
        const isStudent = currentRole === "student";

        // ================= GET TUTOR NAME =================
        let tutorName = "Tutor";

        if (tutorId) {
          const tutorSnap = await getDoc(doc(db, "users", tutorId));
          if (tutorSnap.exists()) {
            const u = tutorSnap.data();

            if (u.name && u.name.trim() !== "") {
              tutorName = u.name;
            } else if (u.email) {
              tutorName = u.email.split("@")[0];
            }
          }
        }

        // ================= CHECK EXISTING REQUEST =================
        let requestStatus = null;

        if (isStudent) {
          const user = auth.currentUser;

          if (user) {
            const q = query(
              collection(db, "requests"),
              where("studentId", "==", user.uid),
              where("listingId", "==", docSnap.id)
            );

            const existing = await getDocs(q);

            if (!existing.empty) {
              requestStatus = existing.docs[0].data().status;
            }
          }
        }

        // ================= BUTTON STATE =================
        let requestButtonHTML = "";

        if (isStudent) {
          if (!requestStatus) {
            requestButtonHTML = `<button class="request-btn">Request</button>`;
          } else if (requestStatus === "pending") {
            requestButtonHTML = `<button disabled>Requested</button>`;
          } else if (requestStatus === "accepted") {
            requestButtonHTML = `<button disabled style="background:green;color:white;">Accepted</button>`;
          } else if (requestStatus === "rejected") {
            requestButtonHTML = `<button disabled style="background:red;color:white;">Rejected</button>`;
          }
        }

        // ================= CARD =================
        const div = document.createElement("div");
        div.innerHTML = `
          <div class="tutor-card">
            <h3>${t.title || "Untitled"}</h3>
            <p><strong>Tutor:</strong> ${tutorName}</p>
            <p><strong>Subject:</strong> ${t.subject || "-"}</p>
            <p><strong>Class:</strong> ${t.classLevel || "-"}</p>
            <p><strong>Board:</strong> ${t.board || "-"}</p>
            <p><strong>Mode:</strong> ${t.mode || "-"}</p>
            <p><strong>Price:</strong> ₹${t.price || 0}</p>
            <p>${t.description || ""}</p>

            <div class="card-actions">
              <button class="view-btn">View Profile</button>
              ${requestButtonHTML}
            </div>
          </div>
        `;

        container.appendChild(div);

        // VIEW PROFILE
        div.querySelector(".view-btn").addEventListener("click", () => {
          if (!tutorId) return;
          window.location.href = `tutor-profile.html?id=${tutorId}`;
        });

        // ================= REQUEST CLICK =================
        if (isStudent && !requestStatus) {
          const requestBtn = div.querySelector(".request-btn");

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
                tutorId: tutorId,
                studentId: user.uid,
                status: "pending",
                createdAt: new Date(),
              });

              alert("Request sent successfully");

              loadListings(); // refresh UI

            } catch (err) {
              console.error(err);
              alert("Error sending request");
            }
          });
        }
      }

      if (container.innerHTML === "") {
        container.innerHTML =
          `<p style="font-size: 18px;">No listings found</p>`;
      }

      localStorage.removeItem("isSearch");
      localStorage.removeItem("filters");

    } catch (err) {
      console.error("Error loading listings:", err);
    }
  }
}