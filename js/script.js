// ================= IMPORTS =================
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc
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
          <a href="${dashboard}" class="login-btn">Profile</a>
          <button id="logoutNav" class="cta-btn">Logout</button>
        `;

        document.getElementById("logoutNav")?.addEventListener("click", async () => {
          await signOut(auth);
          window.location.href = "pages/login.html";
        });

      } else {
        navAuth.innerHTML = `
          <a href="pages/login.html" class="login-btn">Login</a>
          <a href="pages/signup.html" class="cta-btn">Register</a>
        `;
      }
    });
  }

  // ================= HOME SEARCH =================
// ================= HOME SEARCH =================
if (
  window.location.pathname.includes("index.html") ||
  window.location.pathname === "/"
) {
  const searchBtn = document.getElementById("search-btn");

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {

      const subject =
        document.getElementById("subject")?.value.toLowerCase() || "";

      const city =
        document.getElementById("city")?.value.toLowerCase() || "";

      const mode =
        document.getElementById("Mode")?.value.toLowerCase() || "";

      const filters = { subject, city, mode };

      console.log("Saving filters:", filters);

      localStorage.setItem("filters", JSON.stringify(filters));

      window.location.href = "pages/findTutor.html";
    });
  }
}



// ================= TUTOR PROFILE =================
if (window.location.pathname.includes("tutor-profile")) {

  const params = new URLSearchParams(window.location.search);
  const tutorId = params.get("id");

  async function loadProfile() {
    try {
      const docRef = doc(db, "tutors", tutorId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const t = docSnap.data();

        document.getElementById("tutor-name").textContent = t.name;
        document.getElementById("tutor-degree").textContent = t.subject;
        document.getElementById("tutor-location").textContent = t.city;
        document.getElementById("tutor-price").textContent = "₹" + t.price;
        document.getElementById("tutor-about").textContent = t.description || "No description";

        const bookBtn = document.getElementById("book-btn");

if (bookBtn) {
  bookBtn.addEventListener("click", () => {

    const bookingData = {
      name: document.getElementById("tutor-name").textContent,
      subject: document.getElementById("tutor-degree").textContent,
      price: document.getElementById("tutor-price").textContent.replace("₹", ""),
      tutorId: tutorId
    };

    console.log("Saving from profile:", bookingData);

    localStorage.setItem("bookingData", JSON.stringify(bookingData));

    window.location.href = "booksession.html";
  });
}

      } else {
        console.log("No tutor found");
      }

    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }

  loadProfile();
}



  // RUN ONLY ON BOOKING PAGE
  if (!window.location.pathname.includes("booksession")) return;

  console.log("BOOKING PAGE RUNNING");

  // GET DATA
  const data = JSON.parse(localStorage.getItem("bookingData"));
  const summary = document.getElementById("booking-summary");
  const msg = document.getElementById("bookingMsg");

  // SHOW SUMMARY
  if (data && summary) {
    summary.innerHTML = `
      <h3>You are booking</h3>
      <p><b>${data.name}</b></p>
      <p>${data.subject}</p>
      <p>₹${data.price}/hour</p>
    `;
  } else {
    summary.innerHTML = "<p>No tutor selected ❌</p>";
    return;
  }

  // TIME SELECTION
  let selectedTime = "";

  const timeBtns = document.querySelectorAll(".time-btn");

  timeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      timeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedTime = btn.innerText;
    });
  });

  // CONFIRM BOOKING
  document.getElementById("confirm-booking").addEventListener("click", async () => {

    const date = document.getElementById("sessionDate").value;

    if (!date || !selectedTime) {
      msg.textContent = "Select date and time";
      msg.style.color = "red";
      return;
    }

    try {
      await addDoc(collection(db, "bookings"), {
        tutorId: data.tutorId,
        tutorName: data.name,
        subject: data.subject,
        price: data.price,
        date: date,
        time: selectedTime,
        createdAt: serverTimestamp()
      });

      msg.textContent = "Booking confirmed ✅";
      msg.style.color = "green";

      localStorage.removeItem("bookingData");

    } catch (err) {
      console.error(err);
      msg.textContent = "Booking failed ❌";
      msg.style.color = "red";
    }
  });

});
