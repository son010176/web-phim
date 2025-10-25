// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDi3fyD0-fhl2sFzsa20KRuJQP0tdhQIXU",
  authDomain: "phim-ngan-api-prod.firebaseapp.com",
  projectId: "phim-ngan-api-prod",
  storageBucket: "phim-ngan-api-prod.firebasestorage.app",
  messagingSenderId: "700940804869",
  appId: "1:700940804869:web:50b3adbb45197d8b608d6c",
  measurementId: "G-EKGWC7TR2Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

