// Service Worker Registration utility

export const register = (): void => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, prompt user to reload
                if (confirm('Phiên bản mới có sẵn! Tải lại trang để cập nhật?')) {
                  newWorker.postMessage({ action: 'skipWaiting' });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    });
  }
};

export const unregister = (): void => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] Error unregistering service worker:', error);
      });
  }
};

// Check if app is running in standalone mode (installed as PWA)
export const isStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

// Prompt user to install PWA
export const promptInstall = (): void => {
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install button or banner
    console.log('[PWA] Install prompt available');
  });

  // Expose method to trigger install
  (window as any).installApp = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);
    deferredPrompt = null;
  };
};
