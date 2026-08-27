
import React, { useMemo } from 'react';
import { Outfit } from '../types';
import { BottomSheet } from './BottomSheet';
import { parseDateString } from '../utils/dateUtils';

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

interface TagCount { tag: string; count: number; }

const topCounts = (values: string[][], limit: number): TagCount[] => {
  const counts = new Map<string, number>();
  values.forEach(list => {
    // Mỗi thẻ chỉ tính một lần cho mỗi bộ đồ.
    new Set(list.map(t => t.trim()).filter(Boolean)).forEach(tag => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
};

const Bars: React.FC<{ title: string; data: TagCount[]; empty: string }> = ({ title, data, empty }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <section className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm mb-4">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-xs text-slate-400 font-medium">{empty}</p>
      ) : (
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.tag} className="flex items-center gap-3">
              <span className="w-24 text-xs font-bold text-slate-600 truncate">{item.tag}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-black text-slate-700">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export const StatsSheet: React.FC<{
  open: boolean;
  outfits: Outfit[];
  onClose: () => void;
}> = ({ open, outfits, onClose }) => {
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

    return {
      total: outfits.length,
      daysLogged: days.size,
      busiestDay,
      dayCounts,
      tops: topCounts(outfits.map(o => o.tops), 5),
      bottoms: topCounts(outfits.map(o => o.bottoms), 5),
      tags: topCounts(outfits.map(o => o.tags), 5),
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

          <Bars title="Áo mặc nhiều nhất" data={stats.tops} empty="Chưa gắn thẻ áo nào." />
          <Bars title="Quần/váy mặc nhiều nhất" data={stats.bottoms} empty="Chưa gắn thẻ quần nào." />
          <Bars title="Phong cách hay dùng" data={stats.tags} empty="Chưa gắn thẻ phong cách nào." />
        </>
      )}
    </BottomSheet>
  );
};
