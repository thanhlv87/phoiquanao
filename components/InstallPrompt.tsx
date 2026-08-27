
import React from 'react';
import { Icon } from './Icon';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useToast } from '../hooks/useToast';

/** Hướng dẫn thủ công cho iOS Safari, nơi không có hộp thoại cài sẵn. */
const IosSteps: React.FC = () => (
  <ol className="space-y-2.5 mt-3">
    {[
      <>Bấm nút <Icon name="share" className="w-3.5 h-3.5 inline-block align-[-2px] mx-0.5 text-brand-600" /> Chia sẻ ở thanh dưới Safari</>,
      <>Kéo xuống, chọn <span className="font-black text-slate-700">Thêm vào MH chính</span></>,
      <>Bấm <span className="font-black text-slate-700">Thêm</span> ở góc trên bên phải</>,
    ].map((step, i) => (
      <li key={i} className="flex gap-2.5 items-start">
        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-black flex items-center justify-center mt-0.5">
          {i + 1}
        </span>
        <span className="text-[11px] text-slate-500 font-medium leading-relaxed">{step}</span>
      </li>
    ))}
  </ol>
);

/**
 * Dải nhắc cài app, đặt trên trang chủ.
 *
 * App này chỉ dùng trên điện thoại, mà chạy trong tab trình duyệt thì khác hẳn
 * chạy như app thật: không có biểu tượng ngoài màn hình chính, mỗi lần mở phải
 * qua trình duyệt, và thanh địa chỉ ăn mất một phần màn hình.
 */
export const InstallBanner: React.FC = () => {
  const { status, dismissed, promptInstall, dismiss } = useInstallPrompt();
  const { showSuccess } = useToast();
  const [showSteps, setShowSteps] = React.useState(false);

  if (dismissed || status === 'installed' || status === 'unavailable') return null;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) showSuccess('Đã thêm Outfit Log vào màn hình chính.');
  };

  return (
    <div className="bg-white rounded-[2rem] p-4 border border-brand-100 shadow-sm mb-5 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <Icon name="install" className="w-4 h-4 text-brand-600" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-slate-800 leading-tight">
            Thêm vào màn hình chính
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
            Mở nhanh như một ứng dụng, không còn thanh địa chỉ.
          </p>

          {status === 'manual-ios' && showSteps && <IosSteps />}

          <div className="flex gap-2 mt-3">
            {status === 'promptable' ? (
              <button
                type="button"
                onClick={handleInstall}
                className="bg-brand-600 text-white font-black py-2.5 px-5 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
              >
                Cài đặt
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSteps(v => !v)}
                aria-expanded={showSteps}
                className="bg-brand-600 text-white font-black py-2.5 px-5 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
              >
                {showSteps ? 'Đã hiểu' : 'Cách làm'}
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="text-slate-400 font-black py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Cùng nội dung nhưng nằm trong tab Cài đặt, không tự ẩn khi bấm "Để sau". */
export const InstallSection: React.FC = () => {
  const { status, promptInstall } = useInstallPrompt();
  const { showSuccess } = useToast();
  const [showSteps, setShowSteps] = React.useState(false);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) showSuccess('Đã thêm Outfit Log vào màn hình chính.');
  };

  return (
    <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="install" className="w-3.5 h-3.5 text-brand-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cài lên máy</p>
      </div>

      {status === 'installed' ? (
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Đang chạy như ứng dụng trên máy bạn. Không cần làm gì thêm.
        </p>
      ) : status === 'unavailable' ? (
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Trình duyệt hiện tại chưa cài được. Hãy mở app bằng Safari (iPhone)
          hoặc Chrome (Android) rồi thử lại.
        </p>
      ) : (
        <>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Thêm Outfit Log vào màn hình chính để mở nhanh như một ứng dụng.
          </p>
          {status === 'manual-ios' && showSteps && <IosSteps />}
          <button
            type="button"
            onClick={status === 'promptable' ? handleInstall : () => setShowSteps(v => !v)}
            aria-expanded={status === 'manual-ios' ? showSteps : undefined}
            className="mt-4 w-full bg-brand-600 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            {status === 'promptable' ? 'Cài đặt' : showSteps ? 'Đã hiểu' : 'Xem cách làm'}
          </button>
        </>
      )}
    </div>
  );
};
