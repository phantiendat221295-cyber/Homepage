import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Cấu hình Firebase chính thức từ dự án của người dùng (homepage-35a0f)
export const firebaseConfig = {
  apiKey: "AIzaSyCy7Hrv3Z0lHCaiZPwt7_JKrjwVXOpSdwc",
  authDomain: "homepage-35a0f.firebaseapp.com",
  projectId: "homepage-35a0f",
  storageBucket: "homepage-35a0f.firebasestorage.app",
  messagingSenderId: "917238298316",
  appId: "1:917238298316:web:d9a9b721f91b076598b469",
  measurementId: "G-HC218NF0L6"
};

// Khởi tạo Firebase App (tránh duplicate nếu hot reload)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Khởi tạo Cloud Firestore Database với tự động phát hiện long polling tránh lỗi offline
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
  });
} catch {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;

// Khởi tạo Firebase Auth
export const auth = getAuth(app);

// Khởi tạo Analytics an toàn
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Bỏ qua nếu môi trường không hỗ trợ analytics
    });
}
