import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Fix: Updated Firebase imports to use scoped packages to resolve module export errors.
import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  linkWithRedirect,
  getRedirectResult,
  User,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential
} from '@firebase/auth';
// Fix: Import FirebaseError from 'firebase/app' instead of 'firebase/auth' as it is not exported from the latter in Firebase v9.
// Fix: Updated Firebase import to use scoped package to resolve module export error.
import { FirebaseError } from '@firebase/app';
import { auth } from '../services/firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Email hoặc mật khẩu không hợp lệ. Vui lòng thử lại.';
        case 'auth/email-already-in-use':
        case 'auth/account-exists-with-different-credential':
            return 'Email này đã được liên kết với một tài khoản khác. Vui lòng đăng nhập bằng phương thức khác.';
        case 'auth/weak-password':
            return 'Mật khẩu phải có ít nhất 6 ký tự.';
        case 'auth/invalid-email':
            return 'Vui lòng nhập một địa chỉ email hợp lệ.';
        case 'auth/cancelled-popup-request':
        case 'auth/popup-closed-by-user':
            return 'Cửa sổ đăng nhập đã bị đóng. Vui lòng thử lại.';
        default:
            return 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Process redirect results first thing on load
    getRedirectResult(auth)
      .catch((err: FirebaseError) => {
        console.error("Error from getRedirectResult:", err);
        setError(getFriendlyErrorMessage(err.code));
      });

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
    setError(null);
    const provider = new GoogleAuthProvider();
    const currentUser = auth.currentUser;

    try {
        if (currentUser && currentUser.isAnonymous) {
          await linkWithRedirect(currentUser, provider);
        } else {
          await signInWithRedirect(auth, provider);
        }
    } catch (err) {
        console.error("Error initiating Google Sign-In:", err);
        if (err instanceof FirebaseError) {
            setError(getFriendlyErrorMessage(err.code));
        } else {
            setError('Đã xảy ra lỗi không mong muốn khi bắt đầu đăng nhập.');
        }
        throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
            const credential = EmailAuthProvider.credential(email, password);
            await linkWithCredential(currentUser, credential);
        } else {
            const err = new Error("Please sign up from a fresh session.");
            console.error("No anonymous user to link.");
            setError("Không thể tạo tài khoản. Vui lòng làm mới và thử lại.");
            throw err;
        }
    } catch (err) {
        if (err instanceof FirebaseError) {
            setError(getFriendlyErrorMessage(err.code));
        }
        throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        if (err instanceof FirebaseError) {
            setError(getFriendlyErrorMessage(err.code));
        }
        throw err;
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
      // After signing out, sign in anonymously again to maintain a session for logged-out users
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const clearError = () => setError(null);

  const value = { user, loading, loginWithGoogle, signUpWithEmail, signInWithEmail, logout, error, clearError };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};