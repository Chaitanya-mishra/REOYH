document.addEventListener("DOMContentLoaded", () => {
  // NAVBAR TOGGLE
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

//login - signup and logout btn
const navAuth = document.getElementById("nav-auth");
const user = JSON.parse(localStorage.getItem("currentUser"));

if (navAuth) {
  if (user) {
    navAuth.innerHTML = `
      <a href="student-dashboard.html" class="login-btn">Profile</a>
      <button id="logoutBtn" class="cta-btn">Logout</button>
    `;

    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    });

  } else {
    navAuth.innerHTML = `
      <a href="login.html" class="login-btn">Login</a>
      <a href="signup.html" class="cta-btn">Get Started</a>
    `;
  }
}

  // HOME PAGE LOGIC
  if (
    window.location.pathname.includes("index.html") ||
    window.location.pathname === "/"
  ) {
    const searchBtn = document.getElementById("search-btn");
    const viewAllBtn = document.getElementById("view-all-btn");

    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        const city = document.getElementById("city")?.value || "";
        const area = document.getElementById("area")?.value || "";
        const subject = document.getElementById("subject")?.value || "";
        const className = document.getElementById("class")?.value || "";
        const board = document.getElementById("board")?.value || "";
        const mode = document.getElementById("mode")?.value || "";

        const searchData = {
          city,
          area,
          subject,
          className,
          board,
          mode,
        };

        localStorage.setItem("searchData", JSON.stringify(searchData));
        window.location.href = "pages/tutor-profile.html";
      });
    }

    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", () => {
        localStorage.removeItem("searchData"); // show all tutors
        window.location.href = "pages/findTutor.html";
      });
    }
  }

  //find tutors
  if (window.location.pathname.includes("findTutor.html")) {
    import("./tutors.js").then(({ tutors }) => {
      const container = document.getElementById("tutor-container");
      if (!container) return;

      const searchData = JSON.parse(localStorage.getItem("searchData"));

      const localTutors = JSON.parse(localStorage.getItem("tutors")) || [];

      // Normalize local tutors to match structure
      const normalizedLocalTutors = localTutors.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        qualification: t.qualification || t.subject + " Tutor",
        location: t.location || t.city,
        city: t.city,
        mode: t.mode || "Online",
        price: t.price || 500,
        experience: t.experience || "N/A",
      }));

      //MERGED DATA
      const allTutors = [...tutors, ...normalizedLocalTutors];

      let filteredTutors = allTutors;

      // FILTERING

      if (searchData) {
        filteredTutors = allTutors.filter((t) => {
          const subjectMatch = searchData.subject
            ? t.subject.toLowerCase().includes(searchData.subject.toLowerCase())
            : true;

          const cityMatch = searchData.city
            ? t.city.toLowerCase().includes(searchData.city.toLowerCase())
            : true;

          const modeMatch = searchData.mode
            ? t.mode.toLowerCase() === searchData.mode.toLowerCase()
            : true;

          return subjectMatch && cityMatch && modeMatch;
        });
      }

      // SORTING (AI-like)

      if (searchData) {
        filteredTutors.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          if (searchData.subject && a.subject === searchData.subject) scoreA++;
          if (searchData.city && a.city === searchData.city) scoreA++;

          if (searchData.subject && b.subject === searchData.subject) scoreB++;
          if (searchData.city && b.city === searchData.city) scoreB++;

          return scoreB - scoreA;
        });
      }

      // RENDER

      function renderTutors(data) {
        container.innerHTML = "";

        if (data.length === 0) {
          container.innerHTML = "<p>No tutors found</p>";
          return;
        }

        data.forEach((tutor) => {
          const card = document.createElement("div");
          card.className = "tutor-card";

          card.innerHTML = `
  <img src="../assets/placeholder.jpg">

  <h3>${tutor.name || "Tutor"}</h3>

  <p class="subject">${tutor.subject || "Not specified"}</p>

  <p class="meta">
    ${tutor.location || tutor.city || "Location"} • ${tutor.mode || "Online"}
  </p>

  <p class="price">₹${tutor.price || 500}/hour</p>

  <button class="view-btn">View Profile</button>
`;

          card.querySelector(".view-btn").addEventListener("click", () => {
            window.location.href = `tutor-profile.html?id=${tutor.id}`;
          });

          container.appendChild(card);
        });
      }

      renderTutors(filteredTutors);
    });
  }

  // TUTOR PROFILE LOGIC
  if (window.location.pathname.includes("tutor-profile.html")) {
    import("./tutors.js").then(({ tutors }) => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");

      // get local tutors
      const localTutors = JSON.parse(localStorage.getItem("tutors")) || [];

      // merge both
      const allTutors = [...tutors, ...localTutors];

      // find tutor (fix id mismatch)
      const tutor = allTutors.find((t) => String(t.id) === String(id));

      if (!tutor) return;

      // basic info
      document.querySelector("h1").textContent = tutor.name;

      document.querySelector(".price").textContent =
        `₹${tutor.price || 500}/hour`;

      document.querySelector(".degree").textContent =
        tutor.qualification || tutor.subject || "Tutor";

      document.querySelector(".location").textContent =
        tutor.location || tutor.city || "Location";

      document.querySelector(".about-text").textContent =
        tutor.description || "No description available";

      // rating (fallback for local tutors)
      const ratingEl = document.querySelector(".rating");
      if (ratingEl) {
        ratingEl.textContent = tutor.rating ? `${tutor.rating}/5` : "New";
      }

      // subjects
      const subjectsContainer = document.querySelector(".subjects-container");
      subjectsContainer.innerHTML = "";

      if (tutor.subjects) {
        tutor.subjects.forEach((sub) => {
          const span = document.createElement("span");
          span.className = "subject-pill";
          span.textContent = sub;
          subjectsContainer.appendChild(span);
        });
      } else if (tutor.subject) {
        const span = document.createElement("span");
        span.className = "subject-pill";
        span.textContent = tutor.subject;
        subjectsContainer.appendChild(span);
      }

      // reviews (only if exist)
      const reviewsContainer = document.querySelector(".reviews-container");
      reviewsContainer.innerHTML = "";

      function getStars(rating) {
        let stars = "";
        for (let i = 0; i < 5; i++) {
          stars += `<i class="fa-regular fa-star"></i>`;
        }
        return stars;
      }

      if (tutor.reviews) {
        tutor.reviews.forEach((review) => {
          const div = document.createElement("div");
          div.className = "review-card";

          div.innerHTML = `
      <div class="stars">${getStars(review.rating)}</div>
      <p>"${review.text}"</p>
      <span>— ${review.author}</span>
    `;

          reviewsContainer.appendChild(div);
        });
      } else {
        reviewsContainer.innerHTML = `<p>No reviews yet</p>`;
      }

      // booking button (outside loop - FIXED)
      const bookBtn = document.getElementById("book-btn");

      if (bookBtn) {
        bookBtn.addEventListener("click", () => {
          localStorage.setItem("bookingData", JSON.stringify(tutor));
          window.location.href = "booksession.html";
        });
      }
    });
  }

  // BOOKING PAGE LOGIC

  if (window.location.pathname.toLowerCase().includes("booksession")) {
    const data = JSON.parse(localStorage.getItem("bookingData"));
    const summary = document.getElementById("booking-summary");

    if (data && summary) {
      summary.innerHTML = `
      <p style="color:#ff7a00;">You are booking</p>
      <h2>${data.name}</h2>
      <p>${data.subject}</p>
      <p><b>₹${data.price}/hour</b></p>
    `;
    }

    // TIME SELECTION
    const timeButtons = document.querySelectorAll(".time-btn");
    let selectedTime = "";

    timeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        timeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedTime = btn.innerText;
      });
    });

    // CONFIRM BOOKING
    const confirmBtn = document.getElementById("confirm-booking");
    const msg = document.getElementById("bookingMsg");

    confirmBtn.addEventListener("click", () => {
      const date = document.getElementById("sessionDate").value;

      if (!date || !selectedTime) {
        msg.innerText = "Please select date & time";
        msg.style.color = "red";
        return;
      }

      msg.innerText = `Session booked on ${date} at ${selectedTime}`;
      msg.style.color = "green";
    });
  }

  //DASHBOARD (STUDENT) LOGIC
  // STUDENT DASHBOARD LOGIC
  if (window.location.pathname.includes("student-dashboard.html")) {
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!user) {
      window.location.href = "login.html";
    }

    // Fill user data
    document.getElementById("username").textContent = user.name;
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;

    // Booking display
    const booking = JSON.parse(localStorage.getItem("bookingData"));
    const bookingList = document.getElementById("bookingList");

    if (booking) {
      bookingList.innerHTML = `
      <div class="booking-item">
        <p><strong>${booking.name}</strong></p>
        <p class="muted">${booking.subject} • ₹${booking.price}/hr</p>
      </div>
    `;
    }

    //find cta
    const findBtn = document.getElementById("findTutorBtn");

    if (findBtn) {
      findBtn.addEventListener("click", () => {
        localStorage.removeItem("searchData"); // clear filters
      });
    }
    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    });
  }

  //tutor dashboard
  // TUTOR DASHBOARD LOGIC
  if (window.location.pathname.includes("tutor-dashboard.html")) {
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!user) {
      window.location.href = "login.html";
    }

    document.getElementById("username").textContent = user.name;

    // profile basic
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;

    // get tutor profile from localstorage
    const tutors = JSON.parse(localStorage.getItem("tutors")) || [];
    const tutorProfile = tutors.find((t) => t.email === user.email);

    if (tutorProfile) {
      document.getElementById("profileDetails").innerHTML =
        `       <p>subject: ${tutorProfile.subject}</p>       <p>city: ${tutorProfile.city}</p>       <p>mode: ${tutorProfile.mode}</p>       <p>experience: ${tutorProfile.experience || "n/a"}</p>       <p>price: ₹${tutorProfile.price || 500}/hour</p>
    `;
    } else {
      document.getElementById("profileDetails").innerHTML =
        `       <p style="color:red;">profile not completed yet</p>
    `;
    }

    // booking requests (keep your existing logic)
    const requestList = document.getElementById("requestList");
    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    if (bookings.length > 0) {
      requestList.innerHTML = "";

      bookings.forEach((b, index) => {
        const div = document.createElement("div");
        div.className = "request-item";

        div.innerHTML = `
    <p><strong>${b.name}</strong></p>
    <p class="muted">${b.subject} • ₹${b.price}/hr</p>

    <div class="request-actions">
      <button class="accept-btn">accept</button>
      <button class="reject-btn">reject</button>
    </div>
  `;

        div.querySelector(".accept-btn").addEventListener("click", () => {
          alert("session accepted");
        });

        div.querySelector(".reject-btn").addEventListener("click", () => {
          bookings.splice(index, 1);
          localStorage.setItem("bookings", JSON.stringify(bookings));
          location.reload();
        });

        requestList.appendChild(div);
      });
    }

    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    });
  }

  // =============================
  // BECOME TUTOR / PROFILE LOGIC
  // =============================

  if (window.location.pathname.includes("become-tutor.html")) {
    const form = document.getElementById("tutorForm");
    const msg = document.getElementById("tutorMsg");

    // Scroll to form
    const startBtn = document.getElementById("startProfileBtn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        document
          .getElementById("tutor-form")
          .scrollIntoView({ behavior: "smooth" });
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const profile = {
          id: Date.now(),
          name: document.getElementById("name").value.trim(),
          email: document.getElementById("email").value.trim(),
          phone: document.getElementById("phone").value.trim(),
          city: document.getElementById("city").value.trim(),
          subject: document.getElementById("subject").value.trim(),
          mode: document.getElementById("mode").value,
          experience: document.getElementById("experience").value.trim(),
          price: document.getElementById("price").value.trim(),
          description: document.getElementById("description").value.trim(),
        };

        
        // VALIDATION

        if (
          !profile.name ||
          !profile.email ||
          !profile.phone ||
          !profile.city ||
          !profile.subject ||
          !profile.mode
        ) {
          showMessage("Please fill all required fields.", "error");
          return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(profile.phone)) {
          showMessage("Enter valid 10-digit phone number.", "error");
          return;
        }

        // =============================
        // SAVE TO LOCALSTORAGE
        // =============================

        let tutors = JSON.parse(localStorage.getItem("tutors")) || [];

        // Check if tutor already exists (by email)
        const existingIndex = tutors.findIndex(
          (t) => t.email === profile.email,
        );

        if (existingIndex !== -1) {
          tutors[existingIndex] = profile; // update
        } else {
          tutors.push(profile); // new
        }

        localStorage.setItem("tutors", JSON.stringify(tutors));

        showMessage("Profile saved successfully!", "success");

        // Redirect after 1.5s
        setTimeout(() => {
          window.location.href = "tutor-dashboard.html";
        }, 1500);

        form.reset();
      });
    }

    // =============================
    // MESSAGE HANDLER
    // =============================

    function showMessage(text, type) {
      msg.textContent = text;

      if (type === "success") {
        msg.classList.add("Smsg");
        msg.style.color = "green";
      } else {
        msg.style.color = "red";
        msg.classList.add("Emsg");
      }

      setTimeout(() => {
        msg.textContent = "";
      }, 3000);
    }
  }

// contact page logic
if (window.location.pathname.includes("contact.html")) {

  const form = document.getElementById("contactForm");
  const msg = document.getElementById("contactMsg");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const subject = document.getElementById("contactSubject").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    if (!name || !email || !message) {
      if (msg) {
        msg.textContent = "please fill all required fields";
        msg.style.color = "red";
      }
      return;
    }

    let contacts = JSON.parse(localStorage.getItem("contacts")) || [];

    contacts.push({
      name,
      email,
      subject,
      message,
      date: new Date().toISOString()
    });

    localStorage.setItem("contacts", JSON.stringify(contacts));

    if (msg) {
      msg.textContent = "message sent successfully";
      msg.style.color = "green";
    }

    form.reset();
  });

}


});
