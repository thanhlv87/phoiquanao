
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
// Fix: Updated Firebase imports to use scoped packages to resolve module export errors.
import {
  onAuthStateChanged,
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  linkWithRedirect,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  deleteUser
} from '@firebase/auth';
// Chỉ mượn kiểu, không mượn class: import type bị xoá sạch lúc build nên không
// dính lại chuyện hai bản FirebaseError khác instance.
import type { FirebaseError } from '@firebase/app';
import { auth } from '../services/firebaseApp';
import { getFirebaseErrorCode, getFriendlyErrorMessage, pickGoogleSignInFlow } from '../utils/authFlow';
import { isStandalone } from '../utils/platform';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Tài khoản Google này đã có dữ liệu riêng nên không gộp vào phiên khách được. */
const isAlreadyLinked = (code: string) =>
  code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Nhánh redirect quay về đây: kết quả (và lỗi) của lần đăng nhập Google trước
  // chỉ lấy được qua getRedirectResult, onAuthStateChanged không mang lỗi.
  useEffect(() => {
    getRedirectResult(auth).catch(async (err) => {
      const code = getFirebaseErrorCode(err);
      if (!code) return;
      if (isAlreadyLinked(code)) {
        const credential = GoogleAuthProvider.credentialFromError(err);
        if (credential) {
          try {
            await signInWithCredential(auth, credential);
            return;
          } catch {
            // rơi xuống dưới báo lỗi như thường
          }
        }
      }
      setError(getFriendlyErrorMessage(code));
    });
  }, []);

  const signUpWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
            // Upgrade anonymous account
            const credential = EmailAuthProvider.credential(email, password);
            await linkWithCredential(currentUser, credential);
        } else {
            // Standard sign up
            await createUserWithEmailAndPassword(auth, email, password);
        }
    } catch (err) {
        const code = getFirebaseErrorCode(err);
        if (code) {
            setError(getFriendlyErrorMessage(code));
        }
        throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        const code = getFirebaseErrorCode(err);
        if (code) {
            setError(getFriendlyErrorMessage(code));
        }
        throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);

    const standalone = isStandalone(
      typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
      (window.navigator as Navigator & { standalone?: boolean }).standalone
    );
    const flow = pickGoogleSignInFlow(window.navigator.userAgent, standalone);

    if (flow === 'blocked') {
      setError(getFriendlyErrorMessage('auth/in-app-browser'));
      throw new Error('in-app-browser');
    }

    const provider = new GoogleAuthProvider();
    // Luôn hỏi chọn tài khoản: máy dùng chung mà im lặng vào nhầm account thì
    // người dùng không hiểu vì sao thấy nhật ký của người khác.
    provider.setCustomParameters({ prompt: 'select_account' });

    // Đang là khách thì nâng cấp phiên đó lên để giữ nguyên dữ liệu đã nhập.
    const guest = auth.currentUser?.isAnonymous ? auth.currentUser : null;

    try {
      if (flow === 'redirect') {
        // Trang sẽ rời đi ngay; kết quả được nhặt lại ở getRedirectResult phía trên.
        if (guest) await linkWithRedirect(guest, provider);
        else await signInWithRedirect(auth, provider);
        return;
      }
      if (guest) await linkWithPopup(guest, provider);
      else await signInWithPopup(auth, provider);
    } catch (err) {
      const code = getFirebaseErrorCode(err);
      if (!code) {
        setError('Không thể đăng nhập bằng Google.');
        throw err;
      }

      // Tài khoản Google đã tồn tại sẵn: bỏ phiên khách, vào thẳng tài khoản
      // thật. Dữ liệu của phiên khách nằm lại dưới uid ẩn danh cũ.
      if (guest && isAlreadyLinked(code)) {
        const credential = GoogleAuthProvider.credentialFromError(err as FirebaseError);
        if (credential) {
          await signInWithCredential(auth, credential);
          return;
        }
      }

      // Popup bị chặn hoặc môi trường không mở được popup: quay sang redirect.
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        if (guest) await linkWithRedirect(guest, provider);
        else await signInWithRedirect(auth, provider);
        return;
      }

      setError(getFriendlyErrorMessage(code));
      throw err;
    }
  };

  const loginAnonymously = async () => {
    setError(null);
    try {
        await signInAnonymously(auth);
    } catch (err) {
        console.error("Error signing in anonymously:", err);
        const code = getFirebaseErrorCode(err);
        setError(code ? getFriendlyErrorMessage(code) : 'Không thể đăng nhập khách.');
        throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  // Firebase từ chối xóa tài khoản nếu phiên đăng nhập đã cũ; lỗi
  // auth/requires-recent-login được phía gọi xử lý.
  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    await deleteUser(auth.currentUser);
  };

  // Phải giữ nguyên identity: AuthScreen có useEffect phụ thuộc clearError, hàm
  // mới mỗi lần render sẽ khiến effect chạy lại và xoá thông báo lỗi ngay khi
  // vừa hiện ra.
  const clearError = useCallback(() => setError(null), []);

  const value = { user, loading, deleteAccount, signUpWithEmail, signInWithEmail, signInWithGoogle, loginAnonymously, logout, error, clearError };

  // Vẫn render children khi đang loading để phía dưới tự quyết định hiển thị gì
  // (AppContent dựng skeleton); chặn ở đây thì màn hình chỉ trắng trơn.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
