
import React, { useState } from 'react';
import { Outfit } from '../types';
import { BottomSheet } from './BottomSheet';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { deleteAllUserData } from '../services/firebaseService';

const downloadJson = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const AccountSheet: React.FC<{
  open: boolean;
  outfits: Outfit[];
  onClose: () => void;
}> = ({ open, outfits, onClose }) => {
  const { user, logout, deleteAccount } = useAuth();
  const { showError, showSuccess } = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    downloadJson(`outfit-log-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      outfitCount: outfits.length,
      outfits,
    });
    showSuccess('Đã tải file dữ liệu.');
  };

  const handleDelete = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await deleteAllUserData(user.uid);
      await deleteAccount();
      showSuccess('Đã xóa toàn bộ dữ liệu và tài khoản.');
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/requires-recent-login') {
        // Firebase bắt buộc đăng nhập lại gần đây mới cho xóa tài khoản.
        showError('Dữ liệu đã xóa. Hãy đăng nhập lại rồi xóa tài khoản lần nữa.');
      } else {
        console.error('Xóa tài khoản thất bại:', e);
        showError('Không xóa được. Vui lòng thử lại.');
      }
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <BottomSheet open={open} title="Tài khoản" onClose={onClose}>
      <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đang đăng nhập</p>
        <p className="text-sm font-bold text-slate-800 break-all">
          {user?.isAnonymous ? 'Tài khoản khách (chưa liên kết email)' : user?.email || '—'}
        </p>
        {user?.isAnonymous && (
          <p className="text-[10px] text-amber-600 font-bold mt-2 leading-relaxed">
            Dữ liệu khách sẽ mất nếu bạn đăng xuất hoặc xoá dữ liệu trình duyệt.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleExport}
          className="w-full bg-white border border-slate-200 text-slate-700 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
        >
          Tải dữ liệu về máy ({outfits.length} bộ)
        </button>

        {!user?.isAnonymous && (
          <button
            type="button"
            onClick={logout}
            className="w-full bg-white border border-slate-200 text-slate-700 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Đăng xuất
          </button>
        )}

        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Xóa toàn bộ dữ liệu và tài khoản
          </button>
        ) : (
          <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
            <p className="text-xs font-bold text-red-700 mb-1">Xóa vĩnh viễn?</p>
            <p className="text-[11px] text-red-600/80 font-medium mb-4 leading-relaxed">
              {outfits.length} bộ trang phục cùng toàn bộ ảnh sẽ bị xóa và không khôi phục được.
              Nên tải dữ liệu về máy trước.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                {busy ? 'Đang xóa...' : 'Xóa hết'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 bg-white text-slate-600 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest border border-slate-200"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
