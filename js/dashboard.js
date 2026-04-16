import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  if (
    !window.location.pathname.includes("student-dashboard") &&
    !window.location.pathname.includes("tutor-dashboard")
  ) return;

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

  document.getElementById("profileName").textContent =
    userData.name || "N/A";

  document.getElementById("profileEmail").textContent =
    userData.email || "N/A";

  document.getElementById("username").textContent =
    userData.name || "User";

} catch (err) {
  console.error("Dashboard error:", err);
}
  });

});