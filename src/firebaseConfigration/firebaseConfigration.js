// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRbnjKuno6232hPDNS7iCr4uvFnhfVz-U",
  authDomain: "auth-71dbe.firebaseapp.com",
  projectId: "auth-71dbe",
  storageBucket: "auth-71dbe.firebasestorage.app",
  messagingSenderId: "627962720807",
  appId: "1:627962720807:web:f2b73d1a3685b18f3b9402",
  measurementId: "G-75JW6JTK3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)