
import React, { useEffect, useRef } from 'react';

/**
 * Tấm trượt từ đáy màn hình. Dùng cho các chức năng phụ (tìm kiếm, thống kê) để
 * không phải thêm tab mới vào thanh điều hướng vốn chỉ có hai mục.
 */
export const BottomSheet: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Khoá cuộn nền để cuộn trong tấm trượt không kéo theo trang phía sau.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="bg-slate-50 w-full max-w-lg rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] animate-slide-up outline-none"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{title}</h2>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 text-xl active:scale-90 transition-all"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
};
