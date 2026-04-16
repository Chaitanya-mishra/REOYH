import {
	addDoc,
	collection,
	getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, auth } from "./firebase.js";

console.log("tutors.js loaded");

// ================= BECOME TUTOR =================
if (window.location.pathname.includes("become-tutor.html")) {
	console.log("Become Tutor page");

	const form = document.getElementById("tutorForm");

	if (!form) {
		console.log("Form not found ❌");
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

	async function loadTutors() {
		try {
			const snapshot = await getDocs(collection(db, "tutors"));

			console.log("Tutors:", snapshot.size);

			container.innerHTML = "";

			snapshot.forEach((doc) => {
				const t = doc.data();

				const div = document.createElement("div");
				div.innerHTML = `
          <div class="tutor-card">
            <h3>${t.name}</h3>
            <p>${t.subject}</p>
            <p>${t.city}</p>
            <p>${t.mode}</p>
            <p>₹${t.price}</p>

            <button class="view-btn">View Profile</button>
            <button class="book-btn">Book Now</button>
          </div>
        `;

				container.appendChild(div);

				// VIEW
				div.querySelector(".view-btn").addEventListener("click", () => {
					window.location.href = `tutor-profile.html?id=${doc.id}`;
				});

				// BOOK
				const bookBtn = div.querySelector(".book-btn");

				bookBtn.addEventListener("click", () => {
					console.log("BOOK CLICKED"); // debug

					const bookingData = {
						name: t.name,
						subject: t.subject,
						price: t.price,
						id: doc.id
					};

					console.log("Saving bookingData:", bookingData); // debug

					localStorage.setItem("bookingData", JSON.stringify(bookingData));

					window.location.href = "booksession.html";
				});
			});

		} catch (err) {
			console.error(err);
		}
	}

	loadTutors();
}