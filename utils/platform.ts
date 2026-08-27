/**
 * Nhận diện nền tảng phục vụ lời nhắc cài app lên màn hình chính.
 *
 * Tách thành hàm thuần để test được: chuỗi user agent là thứ không thể giả lập
 * lúc chạy, mà lại đúng chỗ dễ sai nhất.
 */

/**
 * Safari trên iOS/iPadOS — nơi duy nhất phải hướng dẫn thủ công vì không có
 * sự kiện beforeinstallprompt.
 *
 * iPadOS 13 trở đi khai user agent y hệt macOS, chỉ phân biệt được qua số điểm
 * chạm: máy Mac thật báo 0, iPad báo 5.
 */
export const isIOS = (userAgent: string, maxTouchPoints: number): boolean => {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return true;
  return /macintosh/.test(ua) && maxTouchPoints > 1;
};

/**
 * Trình duyệt trong ứng dụng khác (Facebook, Instagram, Zalo...) không cài được
 * PWA, nên nhắc ở đó chỉ làm phiền.
 */
export const isInAppBrowser = (userAgent: string): boolean =>
  /fban|fbav|fb_iab|instagram|zalo|line\/|micromessenger|twitter/i.test(userAgent);

/** App đang chạy như một ứng dụng độc lập chứ không phải tab trình duyệt. */
export const isStandalone = (
  matchesStandaloneQuery: boolean,
  navigatorStandalone?: boolean
): boolean => matchesStandaloneQuery || navigatorStandalone === true;
