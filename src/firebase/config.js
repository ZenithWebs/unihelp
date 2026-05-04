import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDEMRFDhpvIU9--ZJ8SDXsFV0R6KkKKrLY",
  authDomain: "campusflow-c415d.firebaseapp.com",
  projectId: "campusflow-c415d",
  storageBucket: "campusflow-c415d.firebasestorage.app",
  messagingSenderId: "304872852414",
  appId: "1:304872852414:web:8d9736ead9d011003507ef",
  measurementId: "G-EGC0NCXY5W"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);