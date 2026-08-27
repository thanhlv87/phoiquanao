
import React, { useMemo } from 'react';
import { Outfit } from '../types';
import { Icon } from './Icon';
import { thumbAt } from '../utils/imageUrls';
import { previousDateIds, relativeDayLabel } from '../utils/dateUtils';

const DAYS_BACK = 7;

/**
 * Dải ảnh những gì đã mặc trong tuần vừa rồi.
 *
 * Khác với khối hồi tưởng (nhìn về quá khứ xa), khối này phục vụ đúng lúc đang
 * đứng chọn đồ: nhìn lướt để khỏi mặc lặp. Không tính hôm nay vì hôm nay thường
 * chưa ghi, và đã có khối riêng ở trên.
 */
export const RecentlyWorn: React.FC<{
  outfitsByDate: Record<string, Outfit[]>;
  onNavigate: (outfitId: string) => void;
}> = ({ outfitsByDate, onNavigate }) => {
  const days = useMemo(() => {
    return previousDateIds(new Date(), DAYS_BACK)
      .map((dateId, index) => ({
        dateId,
        daysAgo: index + 1,
        outfits: outfitsByDate[dateId] || [],
      }))
      .filter(day => day.outfits.length > 0);
  }, [outfitsByDate]);

  const totalOutfits = days.reduce((sum, day) => sum + day.outfits.length, 0);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <Icon name="home" className="text-slate-400 w-3.5 h-3.5" />
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã mặc gần đây</h2>
        </div>
        {totalOutfits > 0 && (
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            {totalOutfits} bộ
          </span>
        )}
      </div>

      {days.length === 0 ? (
        <div className="bg-white/50 rounded-[2rem] p-6 text-center text-[10px] font-bold text-slate-400 border border-dashed border-slate-200 uppercase tracking-tighter">
          Chưa ghi bộ nào trong 7 ngày qua
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1">
          {days.flatMap(day =>
            day.outfits.map((outfit, i) => (
              <button
                type="button"
                key={outfit.id}
                onClick={() => onNavigate(outfit.id)}
                className="flex-shrink-0 w-24 text-left bg-white p-1.5 rounded-[1.4rem] shadow-sm border border-slate-100 active:scale-95 transition-all"
              >
                <div className="aspect-[3/4] rounded-[1.1rem] overflow-hidden bg-slate-100">
                  <img
                    src={thumbAt(outfit)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[8px] font-black uppercase text-brand-600 mt-1.5 px-1 truncate">
                  {/* Nhiều bộ trong cùng ngày thì chỉ bộ đầu mang nhãn ngày */}
                  {i === 0 ? relativeDayLabel(day.daysAgo) : ' '}
                </p>
                <p className="text-[9px] font-bold text-slate-500 px-1 pb-0.5 truncate">
                  {outfit.tops[0] || outfit.bottoms[0] || outfit.tags[0] || 'Không thẻ'}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
