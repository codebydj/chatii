// posts.js
import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const postBtn = document.getElementById("postBtn");
const postInput = document.getElementById("postInput");
const postsList = document.getElementById("postsList");

postBtn.addEventListener("click", async () => {
  const text = postInput.value.trim();
  if (!text) return;
  try {
    await addDoc(collection(db, "posts"), {
      text,
      uid: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });
    postInput.value = "";
  } catch (error) {
    alert(error.message);
  }
});

export function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    postsList.innerHTML = "";
    snapshot.forEach((doc) => {
      const post = doc.data();
      const div = document.createElement("div");
      div.className = "bg-white p-4 rounded-xl shadow";
      div.textContent = post.text;
      postsList.appendChild(div);
    });
  });
}
