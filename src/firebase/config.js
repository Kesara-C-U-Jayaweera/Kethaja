import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDm_LFDqFJHCQZMMJMbkBUj2X0YaJ6rPJ8",
  authDomain: "kethaja-7f187.firebaseapp.com",
  projectId: "kethaja-7f187",
  storageBucket: "kethaja-7f187.firebasestorage.app",
  messagingSenderId: "1015159639335",
  appId: "1:1015159639335:web:2dce52ba4192071eaf6d02",
  measurementId: "G-F46VVWP761"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
