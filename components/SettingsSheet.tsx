import React from 'react';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { useTheme } from '../hooks/useTheme';
import { InstallSection } from './InstallPrompt';

const APP_VERSION = '1.0.0';
const CREDIT = '@2025-August87';

/**
 * Cài đặt: giới thiệu app + đổi màu nhấn.
 *
 * Đặt cùng chỗ với Tìm/Thống kê/Tài khoản (nút trên đầu trang chủ) thay vì thêm
 * vào thanh dưới, để thanh điều hướng vẫn chỉ hai mục chính.
 */
export const SettingsSheet: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { theme, presets, setTheme } = useTheme();

  return (
    <BottomSheet open={open} title="Cài đặt" onClose={onClose}>
      {/* Giới thiệu app */}
      <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 flex-shrink-0">
            <img
              src="https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/fashion.png"
              alt=""
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <div className="min-w-0">
            <p className="text-base font-black text-slate-900 uppercase tracking-tighter italic leading-none">
              Outfit Log
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
              Phiên bản {APP_VERSION}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Icon name="info" className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Nhật ký thời trang tối giản: chụp lại bộ đồ mỗi ngày, gắn thẻ món đồ,
            xem lại theo lịch và nhìn nhanh những gì đã mặc tuần qua để khỏi mặc lặp.
            Dữ liệu và ảnh lưu trên tài khoản của bạn, đồng bộ giữa các máy.
          </p>
        </div>
      </div>

      <InstallSection />

      {/* Đổi màu app */}
      <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="palette" className="w-3.5 h-3.5 text-brand-600" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Màu app</p>
        </div>
        <p className="text-[11px] text-slate-400 font-medium mb-4">
          Đang dùng: <span className="text-brand-600 font-black">{theme.label}</span>
        </p>

        <div role="radiogroup" aria-label="Màu app" className="grid grid-cols-4 gap-3">
          {presets.map(preset => {
            const selected = preset.id === theme.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={preset.label}
                onClick={() => setTheme(preset.id)}
                className={`flex flex-col items-center gap-2 py-3 rounded-2xl border transition-all active:scale-95 ${
                  selected ? 'border-brand-600 bg-brand-50' : 'border-slate-100 bg-white'
                }`}
              >
                <span
                  className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-white"
                  style={{ backgroundColor: preset.swatch }}
                >
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-widest ${selected ? 'text-brand-700' : 'text-slate-400'}`}>
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Không dùng `uppercase` ở đây để giữ đúng chữ hoa/thường của dòng ký tên. */}
      <p className="text-center text-[9px] font-black text-slate-300 tracking-widest py-2">
        {CREDIT}
      </p>
    </BottomSheet>
  );
};
