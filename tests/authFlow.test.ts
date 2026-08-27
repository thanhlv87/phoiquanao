import { describe, it, expect } from 'vitest';
import { pickGoogleSignInFlow, getFriendlyErrorMessage, getFirebaseErrorCode } from '../utils/authFlow';

const UA = {
  windowsChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
  facebook: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0.0.0]',
  zalo: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36 Zalo',
};

describe('pickGoogleSignInFlow', () => {
  it('dùng popup trên trình duyệt thường', () => {
    expect(pickGoogleSignInFlow(UA.windowsChrome, false)).toBe('popup');
    expect(pickGoogleSignInFlow(UA.androidChrome, false)).toBe('popup');
    expect(pickGoogleSignInFlow(UA.iosSafari, false)).toBe('popup');
  });

  it('chuyển sang redirect khi app chạy dạng đứng riêng', () => {
    expect(pickGoogleSignInFlow(UA.iosSafari, true)).toBe('redirect');
    expect(pickGoogleSignInFlow(UA.androidChrome, true)).toBe('redirect');
  });

  it('chặn hẳn trong webview của app khác — Google từ chối OAuth ở đó', () => {
    expect(pickGoogleSignInFlow(UA.facebook, false)).toBe('blocked');
    expect(pickGoogleSignInFlow(UA.zalo, false)).toBe('blocked');
    // webview thắng cả khi đang ở chế độ đứng riêng
    expect(pickGoogleSignInFlow(UA.facebook, true)).toBe('blocked');
  });
});

describe('getFriendlyErrorMessage', () => {
  it('nói rõ khi popup bị chặn', () => {
    expect(getFriendlyErrorMessage('auth/popup-blocked')).toContain('pop-up');
  });

  it('chỉ đúng chỗ cần sửa khi tên miền chưa được cho phép', () => {
    expect(getFriendlyErrorMessage('auth/unauthorized-domain')).toContain('Authorized domains');
  });

  it('bảo người dùng mở bằng trình duyệt thật khi ở trong webview', () => {
    expect(getFriendlyErrorMessage('auth/in-app-browser')).toContain('Chrome');
  });

  it('có câu mặc định cho mã lạ', () => {
    expect(getFriendlyErrorMessage('auth/chua-tung-gap')).toBe('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
  });
});

describe('getFirebaseErrorCode', () => {
  it('đọc được mã lỗi mà không cần instanceof', () => {
    // Bản sao class khác instance: instanceof sẽ trượt, đọc .code thì không.
    class FakeFirebaseError extends Error { constructor(public code: string) { super(code); } }
    expect(getFirebaseErrorCode(new FakeFirebaseError('auth/popup-blocked'))).toBe('auth/popup-blocked');
    expect(getFirebaseErrorCode({ code: 'auth/unauthorized-domain' })).toBe('auth/unauthorized-domain');
  });

  it('bỏ qua thứ không phải lỗi auth', () => {
    expect(getFirebaseErrorCode(new Error('hỏng mạng'))).toBeNull();
    expect(getFirebaseErrorCode({ code: 'storage/unauthorized' })).toBeNull();
    expect(getFirebaseErrorCode(null)).toBeNull();
    expect(getFirebaseErrorCode('auth/popup-blocked')).toBeNull();
  });
});
