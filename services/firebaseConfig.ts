
// Fix: Updated Firebase imports to use scoped packages to resolve module export errors.
import { initializeApp } from "@firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "@firebase/firestore";
import { getAuth } from "@firebase/auth";
import { getStorage } from "@firebase/storage";

// IMPORTANT: Replace this with your app's Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyD4Qpa7UV_4DB-C-SVbG8Ulze5Xpxvg-pg",
  authDomain: "phoiquanao.firebaseapp.com",
  projectId: "phoiquanao",
  storageBucket: "phoiquanao.firebasestorage.app",
  messagingSenderId: "745091328901",
  appId: "1:745091328901:web:557b8bb09aa74ec17b72ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Offline Persistence enabled
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
