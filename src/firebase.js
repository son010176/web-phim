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
  apiKey: "AIzaSyBNbDd6uwCzqbSfwjGvDOu_HizIKggknic",
  authDomain: "phim-ngan-api-prod.firebaseapp.com",
  projectId: "phim-ngan-api-prod",
  storageBucket: "phim-ngan-api-prod.firebasestorage.app",
  messagingSenderId: "849475659169",
  appId: "1:849475659169:web:d8b1480e9003b26a8e97e0",
  measurementId: "G-3PYLGWNJFP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

