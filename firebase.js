// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQZ7HIH2-rVTOZEVUo6t0R7jlxTXdHp3c",
  authDomain: "chatii-84391.firebaseapp.com",
  projectId: "chatii-84391",
  storageBucket: "chatii-84391.firebasestorage.app",
  messagingSenderId: "531705979021",
  appId: "1:531705979021:web:f9934aeff2eef22a3c82c4",
  measurementId: "G-S4XKD6KQ3G",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
