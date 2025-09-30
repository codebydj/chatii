// auth.js
import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import { loadPosts } from "./posts.js";

const loginSection = document.getElementById("loginSection");
const feedSection = document.getElementById("feedSection");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.classList.add("hidden");
    feedSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loadPosts();
  } else {
    loginSection.classList.remove("hidden");
    feedSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
  }
});
