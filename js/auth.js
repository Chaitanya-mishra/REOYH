//auth
document.addEventListener("DOMContentLoaded", () => {

// SIGNUP LOGIC
  if (window.location.pathname.includes("signup.html")) {
    const form = document.getElementById("signup-form");
    const msg = document.getElementById("signupMsg");

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
          document.getElementById("confirm-password").value;
        const role = document.getElementById("role").value;

        msg.style.color = "red";
        msg.classList = "Emsg";
        msg.textContent = "";

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

        let users = JSON.parse(localStorage.getItem("users")) || [];

        const exists = users.find((user) => user.email === email);
        if (exists) {
          msg.textContent = "User already exists. Please login.";
          return;
        }

        const newUser = { name, email, phone, password, role };

        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        msg.style.color = "green";
        msg.classList.add("Smsg");
        msg.textContent = "Signup successful! Redirecting...";

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      });
    }
  }

  // LOGIN LOGIC
  if (window.location.pathname.includes("login.html")) {
    const form = document.getElementById("login-form");
    const msg = document.getElementById("loginMsg");

    if (form && !form.dataset.listenerAdded) {
      form.dataset.listenerAdded = "true"; //  guard

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("password");

        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        msg.style.color = "red";
        msg.classList.add("Emsg");
        msg.textContent = "";

        if (!email || !password) {
          msg.textContent = "Please fill all fields.";
          return;
        }

        let users = JSON.parse(localStorage.getItem("users")) || [];

        const existingUser = users.find((u) => u.email === email);

        if (!existingUser) {
          msg.textContent = "User not registered. Please sign up.";
          return;
        }

        if (existingUser.password !== password) {
          msg.textContent = "Incorrect password.";
          return;
        }

        localStorage.setItem("currentUser", JSON.stringify(existingUser));

        msg.style.color = "green";
        msg.classList.add("Smsg");
        msg.textContent = "Login successful! Redirecting...";

        setTimeout(() => {
          window.location.href =
            existingUser.role === "Student"
              ? "student-dashboard.html"
              : "tutor-dashboard.html";
        }, 1200);
      });
    }
  }

    //show password
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