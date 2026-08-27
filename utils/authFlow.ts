/**
 * Hai quyết định của luồng đăng nhập, tách thành hàm thuần để test được.
 *
 * 1. Chọn kiểu đăng nhập Google theo môi trường đang chạy.
 * 2. Dịch mã lỗi Firebase sang câu tiếng Việt cho người dùng đọc.
 */

import { isInAppBrowser } from './platform';

export type GoogleSignInFlow = 'popup' | 'redirect' | 'blocked';

/**
 * Google chặn thẳng OAuth trong webview của app khác (Facebook, Zalo,
 * Instagram...) bằng lỗi `disallowed_useragent`, cả popup lẫn redirect đều
 * không cứu được. Ở đó phải nhận ra sớm để bảo người dùng mở bằng trình duyệt
 * thật, thay vì để họ bấm rồi gặp màn hình lỗi của Google.
 *
 * Khi app chạy dạng đứng riêng (đã cài lên màn hình chính), `window.open` mở ra
 * một ngữ cảnh duyệt web khác nên popup hay mất đường trả kết quả về; redirect
 * chắc ăn hơn.
 */
export const pickGoogleSignInFlow = (
  userAgent: string,
  standalone: boolean
): GoogleSignInFlow => {
  if (isInAppBrowser(userAgent)) return 'blocked';
  if (standalone) return 'redirect';
  return 'popup';
};

/**
 * Lấy mã lỗi Firebase mà KHÔNG dùng `instanceof FirebaseError`.
 *
 * Lúc chạy dev, Vite gói sẵn @firebase/app và @firebase/auth thành hai bó riêng,
 * mỗi bó mang một bản class FirebaseError khác nhau, nên `instanceof` luôn cho
 * false và mọi lỗi bị nuốt im lặng — bấm sai mật khẩu mà màn hình không báo gì.
 * Đọc thẳng thuộc tính `code` thì đúng ở cả dev lẫn bản build.
 */
export const getFirebaseErrorCode = (err: unknown): string | null => {
  if (typeof err !== 'object' || err === null) return null;
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' && code.startsWith('auth/') ? code : null;
};

export const getFriendlyErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
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
    case 'auth/user-cancelled':
      return 'Cửa sổ đăng nhập đã bị đóng. Vui lòng thử lại.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép pop-up cho trang này rồi thử lại.';
    case 'auth/admin-restricted-operation':
      return 'Tính năng đăng nhập khách chưa được kích hoạt trên hệ thống.';
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập này chưa được kích hoạt.';
    case 'auth/unauthorized-domain':
      return 'Tên miền này chưa được cho phép trong Firebase Authentication (Settings → Authorized domains).';
    case 'auth/network-request-failed':
      return 'Mất kết nối mạng. Kiểm tra lại đường truyền rồi thử lại.';
    case 'auth/too-many-requests':
      return 'Thử quá nhiều lần. Đợi một lát rồi thử lại.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị vô hiệu hoá.';
    case 'auth/in-app-browser':
      return 'Trình duyệt trong ứng dụng (Facebook, Zalo...) không đăng nhập Google được. Hãy mở trang này bằng Chrome hoặc Safari.';
    default:
      return 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
  }
};
