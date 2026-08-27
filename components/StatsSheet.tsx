
import React, { useMemo, useState } from 'react';
import { Outfit } from '../types';
import { BottomSheet } from './BottomSheet';
import { parseDateString, relativeDayLabel } from '../utils/dateUtils';
import { tagStats, pickTops, pickBottoms, pickTags, TagStat } from '../utils/tagStats';

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const COLLAPSED_ROWS = 5;

/**
 * Tần suất từng món: số lần mặc kèm lần gần nhất.
 *
 * Riêng số lần thì chưa dùng được lúc đang chọn đồ — "áo sơ mi 42 lần" không nói
 * lên điều gì, nhưng "42 lần, gần nhất hôm qua" thì có.
 */
const FrequencyList: React.FC<{
  title: string;
  data: TagStat[];
  empty: string;
  onPick?: (tag: string) => void;
}> = ({ title, data, empty, onPick }) => {
  const [expanded, setExpanded] = useState(false);
  const max = Math.max(...data.map(d => d.count), 1);
  const shown = expanded ? data : data.slice(0, COLLAPSED_ROWS);

  return (
    <section className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
        {data.length > 0 && (
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            {data.length} món
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-slate-400 font-medium">{empty}</p>
      ) : (
        <>
          <ul className="space-y-3.5">
            {shown.map(item => (
              <li key={item.tag}>
                <button
                  type="button"
                  onClick={onPick ? () => onPick(item.tag) : undefined}
                  disabled={!onPick}
                  className="w-full text-left disabled:cursor-default"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-xs font-bold text-slate-700 truncate">{item.tag}</span>
                    <span className="text-[10px] font-black text-slate-400 flex-shrink-0 tabular-nums">
                      {item.count} lần · {relativeDayLabel(item.daysAgo).toLowerCase()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all"
                      style={{ width: `${(item.count / max) * 100}%` }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {data.length > COLLAPSED_ROWS && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              className="mt-4 w-full text-[10px] font-black text-brand-600 uppercase tracking-widest py-2 active:scale-95 transition-all"
            >
              {expanded ? 'Thu gọn' : `Xem tất cả ${data.length} món`}
            </button>
          )}
        </>
      )}
    </section>
  );
};

export const StatsSheet: React.FC<{
  open: boolean;
  outfits: Outfit[];
  onClose: () => void;
  onPickTag?: (tag: string) => void;
}> = ({ open, outfits, onClose, onPickTag }) => {
  const stats = useMemo(() => {
    // Thống kê bám theo dateId (ngày mặc), không theo thời điểm tạo bản ghi:
    // ghi bù cho hôm qua vẫn phải tính vào hôm qua.
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const days = new Set<string>();
    outfits.forEach(outfit => {
      dayCounts[parseDateString(outfit.dateId).getDay()]++;
      days.add(outfit.dateId);
    });

    const busiestDay = dayCounts.some(c => c > 0)
      ? DAY_NAMES[dayCounts.indexOf(Math.max(...dayCounts))]
      : '—';

    const today = new Date();

    return {
      total: outfits.length,
      daysLogged: days.size,
      busiestDay,
      dayCounts,
      tops: tagStats(outfits, pickTops, today),
      bottoms: tagStats(outfits, pickBottoms, today),
      tags: tagStats(outfits, pickTags, today),
    };
  }, [outfits]);

  const maxDay = Math.max(...stats.dayCounts, 1);

  return (
    <BottomSheet open={open} title="Thống kê" onClose={onClose}>
      {outfits.length === 0 ? (
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-10">
          Chưa có dữ liệu. Hãy ghi lại trang phục đầu tiên.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Bộ đồ', value: stats.total },
              { label: 'Ngày ghi', value: stats.daysLogged },
              { label: 'Hay ghi nhất', value: stats.busiestDay },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm text-center">
                <p className="text-lg font-black text-slate-900 leading-tight truncate">{card.value}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <section className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Theo thứ trong tuần</h3>
            <div className="flex items-end justify-between gap-2 h-24">
              {stats.dayCounts.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-brand-600 rounded-t-md min-h-[2px] transition-all"
                      style={{ height: `${(count / maxDay) * 100}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-black text-slate-400">{DAY_NAMES[i].replace('Thứ ', 'T').replace('Chủ nhật', 'CN')}</span>
                </div>
              ))}
            </div>
          </section>

          <FrequencyList title="Áo" data={stats.tops} empty="Chưa gắn thẻ áo nào." onPick={onPickTag} />
          <FrequencyList title="Quần / Váy" data={stats.bottoms} empty="Chưa gắn thẻ quần nào." onPick={onPickTag} />
          <FrequencyList title="Phong cách" data={stats.tags} empty="Chưa gắn thẻ phong cách nào." onPick={onPickTag} />
        </>
      )}
    </BottomSheet>
  );
};
