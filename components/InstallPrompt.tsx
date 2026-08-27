
import React, { useState } from 'react';
import { Icon } from './Icon';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useToast } from '../hooks/useToast';

/** Hướng dẫn thủ công cho iOS Safari, nơi không có hộp thoại cài sẵn. */
const IosSteps: React.FC = () => (
  <ol className="space-y-2 mt-3">
    {[
      <>Bấm <Icon name="share" className="w-3.5 h-3.5 inline-block align-[-2px] mx-0.5 text-brand-600" /> Chia sẻ ở thanh dưới Safari</>,
      <>Chọn <span className="font-black text-slate-700">Thêm vào MH chính</span></>,
      <>Bấm <span className="font-black text-slate-700">Thêm</span> ở góc trên bên phải</>,
    ].map((step, i) => (
      <li key={i} className="flex gap-2.5 items-start">
        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-black flex items-center justify-center mt-px">
          {i + 1}
        </span>
        <span className="text-[11px] text-slate-500 font-medium leading-relaxed">{step}</span>
      </li>
    ))}
  </ol>
);

/**
 * Mục cài app trong tab Cài đặt.
 *
 * App chỉ dùng trên điện thoại, mà chạy trong tab trình duyệt thì không có biểu
 * tượng ngoài màn hình chính và thanh địa chỉ ăn mất một phần màn hình. Đặt ở
 * đây thay vì nhắc trên trang chủ để không chen vào việc chính là ghi nhật ký.
 */
export const InstallSection: React.FC = () => {
  const { status, promptInstall } = useInstallPrompt();
  const { showSuccess } = useToast();
  const [showSteps, setShowSteps] = useState(false);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) showSuccess('Đã thêm Outfit Log vào màn hình chính.');
  };

  const canInstall = status === 'promptable' || status === 'manual-ios';

  return (
    <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon name="install" className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
            Cài lên máy
          </p>
        </div>

        {canInstall && (
          <button
            type="button"
            onClick={status === 'promptable' ? handleInstall : () => setShowSteps(v => !v)}
            aria-expanded={status === 'manual-ios' ? showSteps : undefined}
            className="flex-shrink-0 bg-brand-600 text-white font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            {status === 'promptable' ? 'Cài đặt' : showSteps ? 'Đã hiểu' : 'Cách làm'}
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2">
        {status === 'installed'
          ? 'Đang chạy như ứng dụng trên máy bạn.'
          : status === 'unavailable'
            ? 'Mở app bằng Safari (iPhone) hoặc Chrome (Android) để cài được.'
            : 'Thêm vào màn hình chính để mở nhanh như một ứng dụng.'}
      </p>

      {status === 'manual-ios' && showSteps && <IosSteps />}
    </div>
  );
};
