// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDOhtmc-HWCImkOKzlqPNig3wgq_xUZKKs",
  authDomain: "reoyh-d96e0.firebaseapp.com",
  projectId: "reoyh-d96e0",
  storageBucket: "reoyh-d96e0.firebasestorage.app",
  messagingSenderId: "662779330676",
  appId: "1:662779330676:web:2089944a5696ad7fbd1121"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);