
import React, { useEffect, useMemo, useState } from 'react';
import { Outfit } from '../types';
import { Icon } from './Icon';
import { BottomSheet } from './BottomSheet';
import { thumbAt } from '../utils/imageUrls';
import { formatDate, parseDateString } from '../utils/dateUtils';

export const SearchSheet: React.FC<{
  open: boolean;
  outfits: Outfit[];
  onClose: () => void;
  onSelect: (outfitId: string) => void;
  /** Từ khoá mồi khi mở từ chỗ khác, ví dụ bấm một món trong Thống kê. */
  initialQuery?: string;
}> = ({ open, outfits, onClose, onSelect, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  // Nạp lại từ khoá mồi mỗi lần mở, để lần mở sau không dính từ khoá lần trước.
  useEffect(() => {
    if (open) setQuery(initialQuery);
  }, [open, initialQuery]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return outfits
      .filter(outfit =>
        [...outfit.tops, ...outfit.bottoms, ...outfit.tags]
          .some(tag => tag.toLowerCase().includes(needle))
      )
      .sort((a, b) => b.dateId.localeCompare(a.dateId));
  }, [query, outfits]);

  return (
    <BottomSheet open={open} title="Tìm kiếm" onClose={onClose}>
      <div className="relative mb-5">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm theo thẻ, ví dụ áo sơ mi..."
          aria-label="Từ khoá tìm kiếm"
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all text-sm font-semibold text-slate-900 placeholder-slate-400"
        />
      </div>

      {!query.trim() ? (
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-10">
          Nhập từ khoá để tìm trong nhật ký
        </p>
      ) : results.length === 0 ? (
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-10">
          Không tìm thấy trang phục nào
        </p>
      ) : (
        <>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            {results.length} kết quả
          </p>
          <div className="grid grid-cols-3 gap-3">
            {results.map(outfit => (
              <button
                type="button"
                key={outfit.id}
                onClick={() => onSelect(outfit.id)}
                className="text-left bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-slate-100 active:scale-95 transition-all"
              >
                <div className="aspect-square rounded-[1.2rem] overflow-hidden bg-slate-100">
                  <img
                    src={thumbAt(outfit)}
                    alt={`Trang phục ngày ${formatDate(parseDateString(outfit.dateId))}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[8px] font-black uppercase text-slate-400 mt-1.5 px-1 truncate">
                  {outfit.dateId}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  );
};
