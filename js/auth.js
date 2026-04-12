// 🔥 Firebase imports
import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  setDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // ================= SIGNUP =================
  if (window.location.pathname.includes("signup.html")) {
    const form = document.getElementById("signup-form");
    const msg = document.getElementById("signupMsg");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
          document.getElementById("confirm-password").value;
        const role = document.getElementById("role").value;

        msg.style.color = "red";
        msg.textContent = "";

        // Validation
        if (
          !name ||
          !email ||
          !phone ||
          !password ||
          !confirmPassword ||
          role === "default"
        ) {
          msg.textContent = "Please fill all fields properly.";
          return;
        }

        if (password.length < 6) {
          msg.textContent = "Password must be at least 6 characters.";
          return;
        }

        if (password !== confirmPassword) {
          msg.textContent = "Passwords do not match.";
          return;
        }

        try {
          // Create user
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          const user = userCredential.user;

          // Store extra data
          await setDoc(doc(db, "users", user.uid), {
            name,
            email,
            phone,
            role,
            createdAt: new Date(),
          });

          msg.style.color = "green";
          msg.textContent = "Signup successful! Redirecting...";

          setTimeout(() => {
            window.location.href = "login.html";
          }, 1500);
        } catch (error) {
          msg.style.color = "red";
          msg.textContent = error.message;
        }
      });
    }
  }

  // ================= LOGIN =================
  if (window.location.pathname.includes("login.html")) {
    const form = document.getElementById("login-form");
    const msg = document.getElementById("loginMsg");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("password").value;

        msg.style.color = "red";
        msg.classList.add("Emsg");
        msg.textContent = "";

        if (!email || !password) {
          msg.textContent = "Please fill all fields.";
          return;
        }

        try {
          // Login user
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );
          const user = userCredential.user;

          // Fetch user data
          const docSnap = await getDoc(doc(db, "users", user.uid));

          if (!docSnap.exists()) {
            msg.textContent = "User data not found.";
            return;
          }

          const userData = docSnap.data();

          msg.style.color = "green";
          msg.classList.add("Smsg");
          msg.textContent = "Login successful! Redirecting...";

          setTimeout(() => {
            window.location.href =
              userData.role === "Student"
                ? "student-dashboard.html"
                : "tutor-dashboard.html";
          }, 1500);
        } catch (error) {
          msg.style.color = "red";

          if (error.code === "auth/invalid-credential") {
            msg.textContent = "Invalid email or password.";
          } else if (error.code === "auth/user-not-found") {
            msg.textContent = "No account found with this email.";
          } else if (error.code === "auth/wrong-password") {
            msg.textContent = "Incorrect password.";
          } else {
            msg.textContent = "Something went wrong. Please try again.";
          }
        }
      });
    }

    const forgotBtn = document.getElementById("forgotPassword");

    if (forgotBtn) {
      forgotBtn.addEventListener("click", async () => {
        const email = document.getElementById("login-email").value.trim();

        if (!email) {
          msg.style.color = "red";
          msg.classList.add("Emsg");
          msg.textContent = "Enter your email first.";
          return;
        }

        try {
          await sendPasswordResetEmail(auth, email);

          msg.style.color = "green";
          msg.classList.add("Smsg");
          msg.textContent =
            "Password reset link sent. Check your spam folder if not in inbox.";
        } catch (error) {
          msg.style.color = "red";
          msg.classList.add("Emsg");
          msg.textContent = error.message;
        }
      });
    }
  }

  // ================= PASSWORD TOGGLE =================
  const toggles = document.querySelectorAll(".togglePassword");

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.previousElementSibling;

      if (input.type === "password") {
        input.type = "text";
        toggle.textContent = "🙈";
      } else {
        input.type = "password";
        toggle.textContent = "👁️";
      }
    });
  });
});
