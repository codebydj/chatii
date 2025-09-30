// index.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  deleteDoc,
  getDoc,
  where,
  getDocs,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBQZ7HIH2-rVTOZEVUo6t0R7jlxTXdHp3c",
  authDomain: "chatii-84391.firebaseapp.com",
  projectId: "chatii-84391",
  storageBucket: "chatii-84391.firebasestorage.app",
  messagingSenderId: "531705979021",
  appId: "1:531705979021:web:f9934aeff2eef22a3c82c4",
  measurementId: "G-S4XKD6KQ3G",
};

// ✅ Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 DOM elements
const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");
const mainApp = document.getElementById("main-app-content");
const authSections = document.getElementById("auth-sections");
const logoutBtn = document.getElementById("logout-button");
const userDisplay = document.getElementById("user-display");
const userInfoSection = document.getElementById("user-info-section");

// Toggle Register/Login
document.getElementById("show-register").addEventListener("click", (e) => {
  e.preventDefault();
  loginSection.classList.add("hidden");
  registerSection.classList.remove("hidden");
});
document.getElementById("show-login").addEventListener("click", (e) => {
  e.preventDefault();
  registerSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
});

// ✅ Register new user
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email-input").value;
    const username = document.getElementById("register-username-input").value;
    const password = document.getElementById("register-password-input").value;

    if (!username) {
      showMessage("Please choose a username.", true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Store user data in Firestore
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        username: username,
        email: email,
        createdAt: serverTimestamp(),
      });

      // Update profile with username and a default avatar
      await updateProfile(user, {
        displayName: username,
        photoURL: `https://api.dicebear.com/8.x/initials/svg?seed=${username}`,
      });

      showMessage("Account created! Please login now.");
      registerSection.classList.add("hidden");
      loginSection.classList.remove("hidden");
    } catch (error) {
      showMessage(error.message, true);
    }
  });

// ✅ Login user
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading("Logging in...");

  const loginInput = document
    .getElementById("login-username-input")
    .value.trim();
  const password = document.getElementById("login-password-input").value;

  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", loginInput)
    );
    const querySnapshot = await getDocs(q);

    let email = loginInput;
    if (!loginInput.includes("@") && querySnapshot.size > 0) {
      email = querySnapshot.docs[0].data().email;
    }

    await signInWithEmailAndPassword(auth, email, password);
    showMessage("Login successful!");
  } catch (error) {
    console.error("Login error:", error);
    showMessage(error.message, true);
  } finally {
    hideLoading();
  }
});

// ✅ Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// ✅ Auth state
onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user ? "logged in" : "logged out");
  if (user) {
    authSections.classList.add("hidden");
    mainApp.classList.remove("hidden");
    userInfoSection.classList.remove("hidden");
    // Show original username/email
    userDisplay.textContent = `${user.displayName} (${user.email})`;
    loadPosts();
  } else {
    authSections.classList.remove("hidden");
    mainApp.classList.add("hidden");
    userInfoSection.classList.add("hidden");
  }
});

// ✅ Posting
const postForm = document.getElementById("post-form");
const postContent = document.getElementById("post-content");
const postsContainer = document.getElementById("posts-container");
const charCount = document.getElementById("char-count");

postContent.addEventListener("input", () => {
  charCount.textContent = `${postContent.value.length} / 280`;
});

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = postContent.value.trim();
  if (!content) return;

  const user = auth.currentUser;
  if (!user) {
    showMessage("Please login to post", true);
    return;
  }

  showLoading("Creating post...");
  try {
    await addDoc(collection(db, "posts"), {
      text: content,
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL:
        user.photoURL ||
        `https://api.dicebear.com/8.x/initials/svg?seed=${user.displayName}`,
      createdAt: serverTimestamp(),
      likes: [],
      commentCount: 0,
    });

    postContent.value = "";
    charCount.textContent = "0 / 280";
    showMessage("Post created successfully!");
  } catch (error) {
    console.error("Error adding post:", error);
    showMessage("Error creating post: " + error.message, true);
  } finally {
    hideLoading();
  }
});

// ✅ Load Posts
async function loadPosts() {
  showLoading("Loading posts...");
  console.log("Loading posts...");
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    console.log("Got posts snapshot:", snapshot.size, "posts");
    postsContainer.innerHTML = "";
    hideLoading();

    if (snapshot.empty) {
      console.log("No posts found");
      postsContainer.innerHTML = `<div class="text-gray-500 text-center py-10">No posts yet. Be the first to chatii!</div>`;
      return;
    }

    snapshot.forEach((postDoc) => {
      console.log("Processing post:", postDoc.id);
      const post = postDoc.data();
      const postDate = post.createdAt?.toDate();
      const formattedDate = postDate ? postDate.toLocaleString() : "Just now";
      const currentUserLiked = post.likes?.includes(auth.currentUser.uid);
      const isOwner = post.uid === auth.currentUser.uid;

      const div = document.createElement("div");
      div.className = "bg-white p-5 rounded-2xl shadow-md mb-4";
      div.innerHTML = `
    <div class="flex items-start space-x-4">
        <img src="${post.photoURL}" alt="${
        post.displayName
      }" class="w-12 h-12 rounded-full avatar">
        <div class="flex-1">
            <div class="flex items-center justify-between">
                <div class="flex items-baseline space-x-2">
                    <span class="font-bold text-gray-900">${
                      post.uid === auth.currentUser.uid
                        ? "you"
                        : post.displayName
                    }</span>
                </div>
                <span class="text-xs text-gray-500">${formattedDate}</span>
            </div>
            
            <div class="post-content-wrapper mt-1">
                <p class="text-gray-800 post-content text-left">${post.text}</p>
                <div class="edit-form hidden">
                    <textarea class="w-full p-2 border rounded-lg mb-2 edit-textarea">${
                      post.text
                    }</textarea>
                    <div class="flex justify-end space-x-2">
                        <button class="cancel-edit-btn px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                        <button class="save-edit-btn bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Save</button>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                <button class="like-button flex items-center space-x-1 transition-colors ${
                  currentUserLiked ? "text-red-500" : "hover:text-red-500"
                } transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                    </svg>
                    <span class="like-count">${post.likes?.length || 0}</span>
                </button>
                <button class="comment-button flex items-center space-x-1 hover:text-indigo-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd" />
                    </svg>
                    <span class="comment-count">${post.commentCount || 0}</span>
                </button>
                ${
                  isOwner
                    ? `
                    <button class="edit-post-btn flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                    <button class="delete-post-btn flex items-center space-x-1 text-red-600 hover:text-red-800">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    </div>
`;

      // Add like functionality
      const likeButton = div.querySelector(".like-button");
      likeButton.addEventListener("click", async () => {
        if (!auth.currentUser) {
          showMessage("Please login to like posts", true);
          return;
        }
        const postRef = doc(db, "posts", postDoc.id);
        try {
          if (currentUserLiked) {
            await updateDoc(postRef, {
              likes: arrayRemove(auth.currentUser.uid),
            });
          } else {
            await updateDoc(postRef, {
              likes: arrayUnion(auth.currentUser.uid),
            });
          }
        } catch (error) {
          console.error("Error updating like:", error);
          showMessage("Error updating like", true);
        }
      });

      // Add comment section to the post HTML template
      div.innerHTML += `
        <div class="comments-section mt-4 border-t pt-4 hidden">
            <form class="comment-form flex space-x-2 mb-4">
                <input type="text" class="comment-input flex-1 p-2 border rounded-lg" placeholder="Write a comment...">
                <button type="submit" class="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Send</button>
            </form>
            <div class="comments-container space-y-2"></div>
        </div>
    `;

      // Add comment button functionality
      const commentButton = div.querySelector(".comment-button");
      const commentsSection = div.querySelector(".comments-section");

      if (commentButton && commentsSection) {
        commentButton.addEventListener("click", () => {
          commentsSection.classList.toggle("hidden");
          if (!commentsSection.classList.contains("hidden")) {
            loadComments(postDoc.id, div.querySelector(".comments-container"));
          }
        });
      }

      // Add comment form submission handler
      const commentForm = div.querySelector(".comment-form");
      if (commentForm) {
        commentForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const input = commentForm.querySelector(".comment-input");
          const commentText = input.value.trim();

          if (commentText) {
            showLoading("Posting comment...");
            try {
              await addDoc(collection(db, `posts/${postDoc.id}/comments`), {
                text: commentText,
                uid: auth.currentUser.uid,
                displayName: auth.currentUser.displayName,
                photoURL:
                  auth.currentUser.photoURL ||
                  `https://api.dicebear.com/8.x/initials/svg?seed=${auth.currentUser.displayName}`,
                createdAt: serverTimestamp(),
                likes: [],
              });

              await updateDoc(postDoc.ref, {
                commentCount: increment(1),
              });

              input.value = "";
              showMessage("Comment added successfully!");
            } catch (error) {
              showMessage("Error adding comment", true);
            } finally {
              hideLoading();
            }
          }
        });
      }

      // Add edit functionality
      if (isOwner) {
        const editBtn = div.querySelector(".edit-post-btn");
        const deleteBtn = div.querySelector(".delete-post-btn");
        const contentWrapper = div.querySelector(".post-content-wrapper");
        const contentElement = div.querySelector(".post-content");
        const editForm = div.querySelector(".edit-form");
        const editTextarea = div.querySelector(".edit-textarea");
        const cancelEditBtn = div.querySelector(".cancel-edit-btn");
        const saveEditBtn = div.querySelector(".save-edit-btn");

        editBtn?.addEventListener("click", () => {
          contentElement.classList.add("hidden");
          editForm.classList.remove("hidden");
          editTextarea.focus();
        });

        cancelEditBtn?.addEventListener("click", () => {
          contentElement.classList.remove("hidden");
          editForm.classList.add("hidden");
          editTextarea.value = post.text;
        });

        saveEditBtn?.addEventListener("click", async () => {
          const newText = editTextarea.value.trim();
          if (newText && newText !== post.text) {
            try {
              await updateDoc(postDoc.ref, { text: newText });
              contentElement.textContent = newText;
              showMessage("Post updated successfully!");
            } catch (error) {
              showMessage("Error updating post", true);
            }
          }
          contentElement.classList.remove("hidden");
          editForm.classList.add("hidden");
        });
      }

      // Update or add the delete button handler in the loadPosts function
      // Inside the forEach loop where you process posts:

      if (isOwner) {
        const deleteBtn = div.querySelector(".delete-post-btn");
        deleteBtn?.addEventListener("click", async () => {
          if (confirm("Are you sure you want to delete this post?")) {
            showLoading("Deleting post...");
            try {
              // Get references
              const postDocRef = doc(db, "posts", postDoc.id);
              const commentsCollectionRef = collection(postDocRef, "comments");

              // Get all comments
              const commentsSnapshot = await getDocs(commentsCollectionRef);

              // Create a batch
              const batch = writeBatch(db);

              // Add comment deletions to batch
              commentsSnapshot.forEach((commentDoc) => {
                batch.delete(commentDoc.ref);
              });

              // Add post deletion to batch
              batch.delete(postDocRef);

              // Execute the batch
              await batch.commit();

              // Remove post from DOM
              div.remove();

              showMessage("Post deleted successfully!");
            } catch (error) {
              console.error("Error deleting post:", error);
              showMessage("Error deleting post: " + error.message, true);
            } finally {
              hideLoading();
            }
          }
        });
      }

      postsContainer.appendChild(div);
    });
  });
}

// Add this new function to load comments
async function loadComments(postId, container) {
  if (!postId || !container) return;

  const commentsQuery = query(
    collection(db, `posts/${postId}/comments`),
    orderBy("createdAt", "desc")
  );

  container.innerHTML = "";

  onSnapshot(commentsQuery, (snapshot) => {
    if (!container) return; // Check if container still exists

    snapshot.forEach((commentDoc) => {
      const comment = commentDoc.data();
      const commentDate = comment.createdAt?.toDate();
      const formattedDate = commentDate // Using toLocaleString for better readability
        ? commentDate.toLocaleString()
        : "Just now";
      const isCommentOwner = comment.uid === auth.currentUser.uid;
      const currentUserLiked = comment.likes?.includes(auth.currentUser.uid);

      const commentEl = document.createElement("div");
      commentEl.className = "bg-gray-50 p-3 rounded-lg ml-auto max-w-[80%]";
      commentEl.innerHTML = ` 
    <div class="flex items-start space-x-3">
        <img src="${
          comment.photoURL ||
          `https://api.dicebear.com/8.x/initials/svg?seed=${comment.displayName}`
        }" 
             alt="${comment.displayName}" 
             class="w-8 h-8 rounded-full">
        <div class="flex-1">
            <div class="flex items-center justify-between">
                <span class="font-semibold">${
                  comment.uid === auth.currentUser.uid
                    ? "you"
                    : comment.displayName
                }</span>
                <span class="text-xs text-gray-500">${formattedDate}</span>
            </div>
            <div class="comment-content-wrapper mt-1">
                <p class="text-gray-700 comment-content text-left">${
                  comment.text
                }</p>
                <div class="edit-comment-form hidden">
                    <textarea class="w-full p-2 border rounded-lg mb-2 edit-comment-textarea">${
                      comment.text
                    }</textarea>
                    <div class="flex justify-end space-x-2">
                        <button class="cancel-comment-edit-btn px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                        <button class="save-comment-edit-btn bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Save</button>
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-4 mt-2 text-sm">
                <button class="comment-like-btn flex items-center space-x-1 ${
                  currentUserLiked
                    ? "text-red-500"
                    : "text-gray-500 hover:text-red-500"
                }">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    <span class="comment-like-count">${
                      comment.likes?.length || 0
                    }</span>
                </button>
                ${
                  isCommentOwner
                    ? `
                    <button class="edit-comment-btn flex items-center space-x-1 text-blue-500 hover:text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                    <button class="delete-comment-btn flex items-center space-x-1 text-red-500 hover:text-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    </div>
`;

      // Add like functionality for comments
      const likeBtn = commentEl.querySelector(".comment-like-btn");
      if (likeBtn) {
        likeBtn.addEventListener("click", async () => {
          if (!auth.currentUser) {
            showMessage("Please login to like comments", true);
            return;
          }
          try {
            const commentRef = doc(
              db,
              `posts/${postId}/comments/${commentDoc.id}`
            );
            if (currentUserLiked) {
              await updateDoc(commentRef, {
                likes: arrayRemove(auth.currentUser.uid),
              });
            } else {
              await updateDoc(commentRef, {
                likes: arrayUnion(auth.currentUser.uid),
              });
            }
          } catch (error) {
            console.error("Error updating comment like:", error);
            showMessage("Error updating comment like", true);
          }
        });
      }

      // Add edit functionality for comments
      if (isCommentOwner) {
        const editBtn = commentEl.querySelector(".edit-comment-btn");
        const contentElement = commentEl.querySelector(".comment-content");
        const editForm = commentEl.querySelector(".edit-comment-form");
        const editTextarea = commentEl.querySelector(".edit-comment-textarea");
        const cancelEditBtn = commentEl.querySelector(
          ".cancel-comment-edit-btn"
        );
        const saveEditBtn = commentEl.querySelector(".save-comment-edit-btn");

        editBtn?.addEventListener("click", () => {
          contentElement.classList.add("hidden");
          editForm.classList.remove("hidden");
          editTextarea.focus();
        });

        cancelEditBtn?.addEventListener("click", () => {
          contentElement.classList.remove("hidden");
          editForm.classList.add("hidden");
          editTextarea.value = comment.text;
        });

        saveEditBtn?.addEventListener("click", async () => {
          const newText = editTextarea.value.trim();
          if (newText && newText !== comment.text) {
            try {
              await updateDoc(commentDoc.ref, {
                text: newText,
                edited: true,
              });
              showMessage("Comment updated successfully!");
            } catch (error) {
              showMessage("Error updating comment", true);
            }
          }
          contentElement.classList.remove("hidden");
          editForm.classList.add("hidden");
        });
      }
      // Add delete functionality for comments
      if (isCommentOwner) {
        const deleteBtn = commentEl.querySelector(".delete-comment-btn");
        deleteBtn?.addEventListener("click", async () => {
          if (confirm("Are you sure you want to delete this comment?")) {
            showLoading("Deleting comment...");
            try {
              // Reference to the comment to be deleted
              const commentRef = doc(
                db,
                `posts/${postId}/comments/${commentDoc.id}`
              );
              await deleteDoc(commentRef);

              // Decrement the comment count on the post
              const postRef = doc(db, "posts", postId);
              await updateDoc(postRef, { commentCount: increment(-1) });

              showMessage("Comment deleted successfully!");
            } catch (error) {
              console.error("Error deleting comment:", error);
              showMessage("Error deleting comment: " + error.message, true);
            } finally {
              hideLoading();
            }
          }
        });
      }

      container.appendChild(commentEl);
    });
  });
}

// Remove the old localStorage related code since we're using Firebase

// ✅ Message box
function showMessage(msg, isError = false) {
  const box = document.getElementById("message-box");
  box.textContent = msg;
  box.style.backgroundColor = isError ? "#dc2626" : "#4a90e2";
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 3000);
}

// Loading state management
function showLoading(message = "Loading...") {
  const overlay = document.getElementById("loading-overlay");
  const loadingText = document.getElementById("loading-text");
  loadingText.textContent = message;
  overlay.classList.remove("hidden");
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  overlay.classList.add("hidden");
}
