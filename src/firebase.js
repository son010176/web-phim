// src/firebase.js

// Import các SDK cần thiết
import { initializeApp } from "firebase/app";
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
} from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// =============================
// Cấu hình Firebase (Cloud thật)
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyDi3fyD0-fhl2sFzsa20KRuJQP0tdhQIXU",
  authDomain: "phim-ngan-api-prod.firebaseapp.com",
  projectId: "phim-ngan-api-prod",
  storageBucket: "phim-ngan-api-prod.firebasestorage.app",
  messagingSenderId: "700940804869",
  appId: "1:700940804869:web:50b3adbb45197d8b608d6c",
  measurementId: "G-EKGWC7TR2Q",
};

// =============================
// Khởi tạo Firebase App
// =============================
const app = initializeApp(firebaseConfig);

// Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics (chỉ bật khi trình duyệt hỗ trợ)
isAnalyticsSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});

// =============================
// Kết nối Emulator khi chạy local
// =============================
if (window.location.hostname === "localhost") {
  console.log("🔥 Đang chạy ở môi trường LOCAL");
  console.log("🔗 Kết nối Firestore & Auth Emulator...");

  // Firestore Emulator
  connectFirestoreEmulator(db, "localhost", 8080);

  // Auth Emulator (bắt buộc dùng HTTP, không HTTPS)
  connectAuthEmulator(auth, "http://localhost:9099");

  // Dùng ngôn ngữ thiết bị, tránh cảnh báo insecure login
  auth.useDeviceLanguage();

  console.log("✅ Firestore Emulator: localhost:8080");
  console.log("✅ Auth Emulator: http://localhost:9099");
} else {
  console.log("☁️ Đang chạy ở môi trường PRODUCTION (Firebase Cloud)");
}
