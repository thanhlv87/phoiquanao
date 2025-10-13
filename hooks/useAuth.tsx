import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut, GoogleAuthProvider, signInWithPopup, linkWithPopup, User, signInWithEmailAndPassword, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.isAnonymous) {
        await linkWithPopup(currentUser, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error("Google sign-in error", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(currentUser, credential);
    } else {
        // This case should ideally not be hit in the app's flow, but it's a fallback.
        console.error("No anonymous user to link. Standard sign-up is not the primary flow.");
        throw new Error("Please sign up from a fresh session.");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };


  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const value = { user, loading, loginWithGoogle, signUpWithEmail, signInWithEmail, logout };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};