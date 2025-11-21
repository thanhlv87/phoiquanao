
// Fix: Updated Firebase imports to use scoped packages to resolve module export errors.
import { initializeApp } from "@firebase/app";
import { getFirestore } from "@firebase/firestore";
import { getAuth } from "@firebase/auth";
import { getStorage } from "@firebase/storage";

// IMPORTANT: Firebase configuration using environment variables
// Set these in Vercel dashboard or .env.local for local development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD4Qpa7UV_4DB-C-SVbG8Ulze5Xpxvg-pg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "phoiquanao.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "phoiquanao",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "phoiquanao.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "745091328901",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:745091328901:web:557b8bb09aa74ec17b72ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };