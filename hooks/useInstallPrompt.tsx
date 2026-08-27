
import { useCallback, useSyncExternalStore } from 'react';
import { isIOS, isInAppBrowser, isStandalone } from '../utils/platform';

/** Sự kiện riêng của Chromium, chưa có trong lib DOM chuẩn. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallStatus =
  /** Đang chạy như app rồi, không cần nhắc. */
  | 'installed'
  /** Trình duyệt có hộp thoại cài sẵn (Chrome/Edge trên Android, desktop). */
  | 'promptable'
  /** iOS Safari: phải hướng dẫn thủ công vì không có hộp thoại. */
  | 'manual-ios'
  /** Không cài được ở đây (trình duyệt trong app khác, hoặc chưa đủ điều kiện). */
  | 'unavailable';

const DISMISS_KEY = 'outfit_log_install_dismissed_at';
// Người dùng bỏ qua thì im một tháng, đừng hỏi lại mỗi lần mở app.
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

const readDismissed = (): boolean => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
};

/**
 * Trạng thái dùng chung ở mức module, không phải state riêng của từng component.
 *
 * `beforeinstallprompt` chỉ bắn một lần cho cả trang và Chrome chỉ cho gọi
 * prompt() đúng một lần trên sự kiện đó. Nếu mỗi component giữ một bản sao thì
 * cài xong ở chỗ này, chỗ kia vẫn còn nút cài và bấm vào sẽ lỗi.
 */
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let dismissed = false;
let started = false;

const listeners = new Set<() => void>();

const currentStatus = (): InstallStatus => {
  if (installed) return 'installed';
  if (deferred) return 'promptable';
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  if (isInAppBrowser(ua)) return 'unavailable';
  const touchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints;
  return isIOS(ua, touchPoints) ? 'manual-ios' : 'unavailable';
};

// useSyncExternalStore đòi getSnapshot trả về cùng một tham chiếu khi chưa đổi,
// nếu không React sẽ render vô hạn.
let snapshot: { status: InstallStatus; dismissed: boolean } = {
  status: 'unavailable',
  dismissed: false,
};

const refresh = () => {
  const status = currentStatus();
  if (snapshot.status === status && snapshot.dismissed === dismissed) return;
  snapshot = { status, dismissed };
  listeners.forEach(notify => notify());
};

const start = () => {
  if (started || typeof window === 'undefined') return;
  started = true;

  dismissed = readDismissed();
  installed = isStandalone(
    window.matchMedia('(display-mode: standalone)').matches,
    (navigator as Navigator & { standalone?: boolean }).standalone
  );

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Chặn thanh nhắc mặc định của trình duyệt để tự chọn thời điểm hiển thị.
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    refresh();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    refresh();
  });

  refresh();
};

const subscribe = (notify: () => void) => {
  start();
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};

export const useInstallPrompt = () => {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferred) return false;
    const event = deferred;
    // Xoá trước khi chờ: người dùng bấm nhanh hai lần sẽ không gọi prompt() hai lượt.
    deferred = null;
    refresh();
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome === 'accepted';
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Chế độ riêng tư chặn localStorage: vẫn ẩn trong phiên này.
    }
    dismissed = true;
    refresh();
  }, []);

  return { status: state.status, dismissed: state.dismissed, promptInstall, dismiss };
};
