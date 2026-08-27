import { describe, it, expect } from 'vitest';
import { isIOS, isInAppBrowser, isStandalone } from '../utils/platform';

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
  // iPadOS 13+ khai y hệt macOS
  ipadOS: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  windowsChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  facebook: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0.0.0]',
  zalo: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36 Zalo',
};

describe('isIOS', () => {
  it('nhận ra iPhone', () => {
    expect(isIOS(UA.iphone, 5)).toBe(true);
  });

  // Đây là cái bẫy: cùng một chuỗi UA, chỉ khác số điểm chạm
  it('phân biệt iPad với máy Mac qua số điểm chạm', () => {
    expect(isIOS(UA.ipadOS, 5)).toBe(true);
    expect(isIOS(UA.macSafari, 0)).toBe(false);
  });

  it('không nhầm Android hay Windows', () => {
    expect(isIOS(UA.androidChrome, 5)).toBe(false);
    expect(isIOS(UA.windowsChrome, 0)).toBe(false);
  });

  it('không phân biệt hoa thường', () => {
    expect(isIOS(UA.iphone.toUpperCase(), 5)).toBe(true);
  });
});

describe('isInAppBrowser', () => {
  it('nhận ra trình duyệt trong Facebook và Zalo', () => {
    expect(isInAppBrowser(UA.facebook)).toBe(true);
    expect(isInAppBrowser(UA.zalo)).toBe(true);
  });

  it('không chặn nhầm trình duyệt thật', () => {
    expect(isInAppBrowser(UA.iphone)).toBe(false);
    expect(isInAppBrowser(UA.androidChrome)).toBe(false);
    expect(isInAppBrowser(UA.windowsChrome)).toBe(false);
  });
});

describe('isStandalone', () => {
  it('đúng khi media query báo standalone (Android, desktop)', () => {
    expect(isStandalone(true, undefined)).toBe(true);
  });

  it('đúng khi navigator.standalone báo true (iOS Safari)', () => {
    expect(isStandalone(false, true)).toBe(true);
  });

  it('sai khi đang chạy trong tab trình duyệt', () => {
    expect(isStandalone(false, false)).toBe(false);
    expect(isStandalone(false, undefined)).toBe(false);
  });
});
