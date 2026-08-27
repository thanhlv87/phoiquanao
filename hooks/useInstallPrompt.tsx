
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

/**
 * Trạng thái dùng chung ở mức module, không phải state riêng của từng component.
 *
 * `beforeinstallprompt` chỉ bắn một lần cho cả trang và Chrome chỉ cho gọi
 * prompt() đúng một lần trên sự kiện đó, nên mọi nơi hiển thị phải nhìn chung
 * một nguồn sự thật.
 */
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let started = false;
let status: InstallStatus = 'unavailable';

const listeners = new Set<() => void>();

const computeStatus = (): InstallStatus => {
  if (installed) return 'installed';
  if (deferred) return 'promptable';
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  if (isInAppBrowser(ua)) return 'unavailable';
  const touchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints;
  return isIOS(ua, touchPoints) ? 'manual-ios' : 'unavailable';
};

const refresh = () => {
  const next = computeStatus();
  if (next === status) return;
  status = next;
  listeners.forEach(notify => notify());
};

const start = () => {
  if (started || typeof window === 'undefined') return;
  started = true;

  installed = isStandalone(
    window.matchMedia('(display-mode: standalone)').matches,
    (navigator as Navigator & { standalone?: boolean }).standalone
  );

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Chặn thanh nhắc mặc định của trình duyệt để tự chọn chỗ hiển thị.
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
  const current = useSyncExternalStore(subscribe, () => status, () => status);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferred) return false;
    const event = deferred;
    // Xoá trước khi chờ: bấm nhanh hai lần sẽ không gọi prompt() hai lượt.
    deferred = null;
    refresh();
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome === 'accepted';
  }, []);

  return { status: current, promptInstall };
};
