import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  updateDoc,
  orderBy,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  if (
    !window.location.pathname.includes("student-dashboard") &&
    !window.location.pathname.includes("tutor-dashboard")
  )
    return;

  async function loadBookings(userEmail) {
    const bookingList = document.getElementById("bookingList");

    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);
    bookingList.innerHTML = "";

    let hasBookings = false;
    let bookingsArr = [];

    snapshot.forEach((docSnap) => {
      const b = docSnap.data();
      bookingsArr.push(b);
      const bookingId = docSnap.id;

      if (b.userEmail !== userEmail) return;

      hasBookings = true;

      const div = document.createElement("div");
      div.classList.add("session-card");

      const formattedDate = new Date(b.date).toLocaleDateString();

      div.innerHTML = `
  <div class="session-top">
    <h4>${b.subject}</h4>
   <span class="status ${b.status || "pending"}">${b.status || "pending"}</span>
  </div>

  <p><strong>Tutor:</strong> ${b.tutorName}</p>

  <div class="session-meta">
    <span>📅 ${formattedDate}</span>
    <span>⏰ ${b.time}</span>
  </div>

  <div class="session-actions">
    <button class="cancel-btn">Cancel</button>
  </div>
`;

      bookingList.appendChild(div);

      const cancelBtn = div.querySelector(".cancel-btn");

      cancelBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to cancel this session?")) return;

        try {
          await deleteDoc(doc(db, "bookings", bookingId));

          // Remove card from UI
          div.remove();
        } catch (err) {
          console.error("Cancel failed:", err);
        }
      });
    });

    if (hasBookings) {
      // NEXT SESSION
      const next = bookingsArr[0];

      const nextDiv = document.createElement("div");
      nextDiv.classList.add("next-session");

      nextDiv.innerHTML = `
    <h4>⏰ Next Session</h4>
    <p><strong>${next.subject}</strong> with ${next.tutorName}</p>
    <p>${next.date} • ${next.time}</p>
  `;

      bookingList.appendChild(nextDiv);

      // LEARNING STATS
      const statsDiv = document.createElement("div");
      statsDiv.classList.add("learning-box");

      statsDiv.innerHTML = `
    <h4>📈 Your Learning</h4>

    <div class="learning-stats">
      <div>
        <h3>${bookingsArr.length}</h3>
        <p>Sessions</p>
      </div>

      <div>
        <h3>${new Set(bookingsArr.map((b) => b.subject)).size}</h3>
        <p>Subjects</p>
      </div>
    </div>

    <p class="learning-msg">
      Keep going — consistency builds mastery 🦙
    </p>
  `;

      bookingList.appendChild(statsDiv);
    }

    if (!hasBookings) {
      bookingList.innerHTML = `
  <div class="empty-state">
    <img src="../assets/llamo.png" class="llama-img" />

    <h4>No sessions yet</h4>
    <p>Your learning journey starts here. Let’s find your perfect tutor 🦙</p>

    <a href="findTutor.html" class="cta-btn">Book Session</a>
  </div>
`;
    }
  }

  async function loadRequests(userId) {
    const container = document.getElementById("bookingList");

    console.log("Current Tutor UID:", userId);

    const q = query(collection(db, "requests"), where("tutorId", "==", userId));

    const snapshot = await getDocs(q);

    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `<p>No requests yet</p>`;
      return;
    }

    for (const docSnap of snapshot.docs) {
      const r = docSnap.data();

      // 🔹 Get student data
      const userSnap = await getDoc(doc(db, "users", r.studentId));
      const studentName = userSnap.exists() ? userSnap.data().name : "Student";

      // 🔹 Get listing data
      const listingSnap = await getDoc(doc(db, "listings", r.listingId));
      const listingTitle = listingSnap.exists()
        ? listingSnap.data().title
        : "Class";

      const div = document.createElement("div");
      div.classList.add("request-card");

      // get student email
      let studentEmail = "";
      if (userSnap.exists()) {
        studentEmail = userSnap.data().email || "";
      }

      // show contact only if accepted
      let extra = "";
      if (r.status === "accepted") {
        extra = `<p style="color:green;"><b>Contact:</b> ${studentEmail}</p>`;
      }

      div.innerHTML = `
  <h4>${listingTitle}</h4>
  <p><b>Student:</b> ${studentName}</p>
  <p><b>Status:</b> ${r.status}</p>
  ${extra}

  ${
    r.status === "pending"
      ? `
      <div class="req-actions">
        <button class="accept-btn" onclick="acceptRequest('${docSnap.id}')">Accept</button>
        <button class="reject-btn" onclick="rejectRequest('${docSnap.id}')">Reject</button>
      </div>
    `
      : ""
  }
`;
      container.appendChild(div);
    }
  }

  async function loadStudentRequests(userId) {
    const container = document.getElementById("bookingList");

    const q = query(
      collection(db, "requests"),
      where("studentId", "==", userId),
    );

    const snapshot = await getDocs(q);

    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `<p>No requests yet</p>`;
      return;
    }

    for (const docSnap of snapshot.docs) {
      const r = docSnap.data();

      // 🔹 Get tutor info
      const tutorSnap = await getDoc(doc(db, "users", r.tutorId));
      let tutorName = "Tutor";
      let tutorEmail = "";

      if (tutorSnap.exists()) {
        const t = tutorSnap.data();
        tutorName = t.name || t.email?.split("@")[0] || "Tutor";
        tutorEmail = t.email || "";
      }

      // 🔹 Get listing title
      const listingSnap = await getDoc(doc(db, "listings", r.listingId));
      let listingTitle = listingSnap.exists()
        ? listingSnap.data().title
        : "Class";

      const div = document.createElement("div");
      div.classList.add("request-card");

      // KEY LOGIC: show contact after accept
      let extra = "";
      if (r.status === "accepted") {
        extra = `<p style="color:green;"><b>Contact:</b> ${tutorEmail}</p>`;
      }

      let feedbackBtn = "";

      if (r.status === "accepted") {
        feedbackBtn = `
    <button class="feedback-btn" data-tutor="${r.tutorId}">
      Give Feedback
    </button>
  `;
      }

      div.innerHTML = `
  <h4>${listingTitle}</h4>
  <p><b>Tutor:</b> ${tutorName}</p>
  <p><b>Status:</b> ${r.status}</p>
  ${extra}
  ${feedbackBtn}
`;
      container.appendChild(div);
    }
  }
  console.log("DASHBOARD RUNNING");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    try {
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) return;

      const userData = snap.data();
      const role = (userData.role || "").trim().toLowerCase();

      console.log("FINAL ROLE:", role);

      document.getElementById("profileName").textContent =
        userData.name || "N/A";

      document.getElementById("profileEmail").textContent =
        userData.email || "N/A";

      document.getElementById("username").textContent = userData.name || "User";

      console.log("User role:", role);

      if (role === "student") {
        loadStudentRequests(user.uid);
      } else if (role === "tutor") {
        console.log("Calling loadRequests...");
        loadRequests(user.uid);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  });

  const form = document.getElementById("listingForm");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in");
        return;
      }

      const title = document.getElementById("title").value;
      const subject = document.getElementById("subject").value;
      const classLevel = document.getElementById("classLevel").value;
      const board = document.getElementById("board").value;
      const mode = document.getElementById("mode").value;
      const price = document.getElementById("price").value;
      const description = document.getElementById("description").value;

      try {
        await addDoc(collection(db, "listings"), {
          tutorId: user.uid,
          title,
          subject,
          classLevel,
          board,
          mode,
          price,
          description,
          createdAt: new Date(),
        });

        alert("Listing Added Successfully!");
        form.reset();
      } catch (error) {
        console.error(error);
        alert("Error adding listing");
      }
    });
  }

  window.acceptRequest = async function (requestId) {
    try {
      await updateDoc(doc(db, "requests", requestId), {
        status: "accepted",
      });

      alert("Request accepted. You can now contact the student.");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("Error accepting request");
    }
  };

  window.rejectRequest = async function (requestId) {
    try {
      await updateDoc(doc(db, "requests", requestId), {
        status: "rejected",
      });

      alert("Request rejected");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("Error rejecting request");
    }
  };

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await auth.signOut();
        window.location.href = "login.html";
      } catch (err) {
        console.error("Logout error:", err);
        alert("Error logging out");
      }
    });
  }

  // 🔥 FEEDBACK LOGIC STARTS HERE
  let selectedTutorId = null;

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("feedback-btn")) {
      selectedTutorId = e.target.dataset.tutor;

      document.getElementById("feedbackSection").style.display = "block";

      document.getElementById("feedbackMsg").innerText =
        "Give feedback for this tutor";

        document.getElementById("feedbackSection").scrollIntoView({
  behavior: "smooth"
});

      console.log("Selected tutor:", selectedTutorId);
    }
  });

  document
    .getElementById("submitFeedback")
    .addEventListener("click", async () => {
      const rating = document.getElementById("rating").value;
      const feedbackText = document.getElementById("feedbackText").value;

      if (!rating || !feedbackText) {
        alert("Please fill all fields");
        return;
      }

      try {
        await addDoc(collection(db, "feedback"), {
          tutorId: selectedTutorId,
          rating,
          feedbackText,
          createdAt: new Date(),
        });

        alert("Feedback submitted!");

        document.getElementById("feedbackSection").style.display = "none";
        document.getElementById("feedbackText").value = "";
        document.getElementById("rating").value = "";

      } catch (err) {
        console.error(err);
        alert("Error submitting feedback");
      }
    });
});
