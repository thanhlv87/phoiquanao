
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastKind = 'error' | 'success';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<{
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
} | undefined>(undefined);

const AUTO_DISMISS_MS = 4000;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, kind, message }]);
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  const showError = useCallback((message: string) => push('error', message), [push]);
  const showSuccess = useCallback((message: string) => push('success', message), [push]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      <div
        // aria-live: người dùng screen reader vẫn nghe được thông báo dù không có focus.
        aria-live="polite"
        aria-atomic="false"
        className="fixed left-0 right-0 bottom-24 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none"
      >
        {toasts.map(toast => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className={`pointer-events-auto w-full max-w-sm text-left px-5 py-4 rounded-2xl shadow-2xl text-xs font-bold animate-slide-up ${
              toast.kind === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
