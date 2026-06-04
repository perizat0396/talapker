import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDw7hWYvtUhNgMy5dUHbKCudKcAw8qbd44",
  authDomain: "talapker-43b91.firebaseapp.com",
  projectId: "talapker-43b91",
  storageBucket: "talapker-43b91.firebasestorage.app",
  messagingSenderId: "85928681389",
  appId: "1:85928681389:web:f8aa81d09e2502c3af0b24",
  measurementId: "G-XBVGNHMR9F"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
