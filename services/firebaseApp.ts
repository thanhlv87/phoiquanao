// Tầng khởi động: chỉ App + Auth. Đây là thứ duy nhất cần có ngay khi mở app để
// khôi phục phiên đăng nhập. Firestore và Storage nặng hơn nhiều nên nằm ở
// ./dataLayer và chỉ được nạp sau khi đăng nhập xong.
import { initializeApp } from "@firebase/app";
import { getAuth } from "@firebase/auth";

// IMPORTANT: Replace this with your app's Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyBZVwlKbEo1to-1yzlhMu-LjPondnFszzQ",
  authDomain: "phoiquanao.firebaseapp.com",
  projectId: "phoiquanao",
  storageBucket: "phoiquanao.firebasestorage.app",
  messagingSenderId: "745091328901",
  appId: "1:745091328901:web:557b8bb09aa74ec17b72ec"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
