import React, { useState, useMemo } from 'react';
import { Outfit } from '../types';
import { Icon } from './Icon';
import { generateYearInReviewSummary } from '../services/geminiService';

interface YearInReviewProps {
  outfits: Outfit[];
  year: number;
}

interface YearStats {
  totalOutfits: number;
  mostProductiveMonth: string;
  mostWornOutfit: { tops: string[], bottoms: string[], count: number } | null;
  favoriteItems: { item: string, count: number }[];
  repeatedOutfits: Array<{ outfit: { tops: string[], bottoms: string[] }, count: number, dates: string[] }>;
  uniqueOutfits: number;
  totalDaysRecorded: number;
  recordingStreak: number;
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const calculateYearStats = (outfits: Outfit[], year: number): YearStats => {
  const yearOutfits = outfits.filter(o => {
    const outfitYear = new Date(o.date).getFullYear();
    return outfitYear === year;
  });

  if (yearOutfits.length === 0) {
    return {
      totalOutfits: 0,
      mostProductiveMonth: 'N/A',
      mostWornOutfit: null,
      favoriteItems: [],
      repeatedOutfits: [],
      uniqueOutfits: 0,
      totalDaysRecorded: 0,
      recordingStreak: 0,
    };
  }

  // Count outfits per month
  const monthCounts: Record<number, number> = {};
  yearOutfits.forEach(o => {
    const month = new Date(o.date).getMonth();
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  const mostProductiveMonthIndex = Object.entries(monthCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const mostProductiveMonth = mostProductiveMonthIndex !== undefined
    ? MONTH_NAMES[parseInt(mostProductiveMonthIndex)]
    : 'N/A';

  // Find repeated outfits (same tops + bottoms combination)
  const outfitSignatures = new Map<string, { outfit: { tops: string[], bottoms: string[] }, dates: string[] }>();

  yearOutfits.forEach(o => {
    const signature = [...o.tops].sort().join('|') + '||' + [...o.bottoms].sort().join('|');
    if (!outfitSignatures.has(signature)) {
      outfitSignatures.set(signature, {
        outfit: { tops: o.tops, bottoms: o.bottoms },
        dates: [o.dateId]
      });
    } else {
      outfitSignatures.get(signature)!.dates.push(o.dateId);
    }
  });

  const repeatedOutfits = Array.from(outfitSignatures.values())
    .filter(item => item.dates.length > 1)
    .map(item => ({
      outfit: item.outfit,
      count: item.dates.length,
      dates: item.dates
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const mostWornOutfit = repeatedOutfits[0] || null;

  // Count all items
  const itemCounts: Record<string, number> = {};
  yearOutfits.forEach(o => {
    [...o.tops, ...o.bottoms].forEach(item => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
  });

  const favoriteItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([item, count]) => ({ item, count }));

  // Count unique days
  const uniqueDays = new Set(yearOutfits.map(o => o.dateId)).size;

  // Calculate longest recording streak
  const sortedDates = Array.from(new Set(yearOutfits.map(o => o.dateId))).sort();
  let maxStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, currentStreak);

  return {
    totalOutfits: yearOutfits.length,
    mostProductiveMonth,
    mostWornOutfit: mostWornOutfit ? {
      tops: mostWornOutfit.outfit.tops,
      bottoms: mostWornOutfit.outfit.bottoms,
      count: mostWornOutfit.count
    } : null,
    favoriteItems,
    repeatedOutfits,
    uniqueOutfits: outfitSignatures.size,
    totalDaysRecorded: uniqueDays,
    recordingStreak: maxStreak,
  };
};

export const YearInReview: React.FC<YearInReviewProps> = ({ outfits, year }) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);

  const stats = useMemo(() => calculateYearStats(outfits, year), [outfits, year]);

  const handleGenerateAISummary = async () => {
    if (stats.totalOutfits === 0) return;

    setIsLoadingAI(true);
    setShowAISummary(true);
    try {
      const summary = await generateYearInReviewSummary(outfits, year, stats);
      setAiSummary(summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummary('Không thể tạo tổng kết AI. Vui lòng thử lại.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (stats.totalOutfits === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-md p-6 text-center border border-dashed border-purple-200">
        <Icon name="calendar" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600 font-semibold">Chưa có dữ liệu cho năm {year}</p>
        <p className="text-sm text-gray-500 mt-2">Hãy ghi lại trang phục để xem tổng kết cuối năm!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Icon name="sparkles" className="w-8 h-8" />
          <h2 className="text-3xl font-bold">Năm {year} của bạn</h2>
        </div>
        <p className="text-purple-100">Cùng nhìn lại hành trình thời trang của bạn!</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Tổng trang phục</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalOutfits}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-pink-500">
          <p className="text-sm text-gray-600 mb-1">Ngày ghi chép</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalDaysRecorded}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Tháng năng suất</p>
          <p className="text-xl font-bold text-gray-800">{stats.mostProductiveMonth}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Chuỗi dài nhất</p>
          <p className="text-3xl font-bold text-gray-800">{stats.recordingStreak}</p>
          <p className="text-xs text-gray-500">ngày liên tiếp</p>
        </div>
      </div>

      {/* Most Worn Outfit */}
      {stats.mostWornOutfit && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon name="heart" className="w-6 h-6 text-red-500" />
            Outfit yêu thích nhất
          </h3>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">Bạn đã mặc bộ này <span className="font-bold text-purple-600">{stats.mostWornOutfit.count} lần</span>!</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 font-semibold">Áo:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {stats.mostWornOutfit.tops.map((top, idx) => (
                    <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 shadow-sm">
                      {top}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Quần:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {stats.mostWornOutfit.bottoms.map((bottom, idx) => (
                    <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 shadow-sm">
                      {bottom}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Favorite Items */}
      {stats.favoriteItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon name="star" className="w-6 h-6 text-yellow-500" />
            Top 5 món đồ được mặc nhiều nhất
          </h3>
          <div className="space-y-3">
            {stats.favoriteItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">{item.item}</span>
                    <span className="text-sm font-semibold text-purple-600">{item.count} lần</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(item.count / stats.favoriteItems[0].count) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repeated Outfits */}
      {stats.repeatedOutfits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon name="refresh" className="w-6 h-6 text-blue-500" />
            Outfit mặc lại nhiều lần
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Bạn có <span className="font-bold text-blue-600">{stats.repeatedOutfits.length}</span> bộ đồ được mặc lại nhiều lần trong năm
          </p>
          <div className="space-y-4">
            {stats.repeatedOutfits.slice(0, 3).map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Outfit #{idx + 1}</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    {item.count} lần
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{item.outfit.tops.join(', ')}</span>
                  {' + '}
                  <span className="font-medium">{item.outfit.bottoms.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Icon name="sparkles" className="w-6 h-6 text-purple-600" />
          Tổng kết AI - Phong cách {year}
        </h3>

        {!showAISummary ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Để AI phân tích phong cách cá nhân của bạn trong năm {year} và đưa ra những nhận xét thú vị!
            </p>
            <button
              onClick={handleGenerateAISummary}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-glow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <Icon name="sparkles" className="w-5 h-5" />
              <span>Tạo tổng kết AI</span>
            </button>
          </div>
        ) : (
          <div>
            {isLoadingAI ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-gray-600">AI đang phân tích phong cách của bạn...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-5 shadow-md">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{aiSummary}</p>
                <button
                  onClick={handleGenerateAISummary}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-1"
                >
                  <Icon name="refresh" className="w-4 h-4" />
                  Tạo lại phân tích
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fun Facts */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Icon name="lightbulb" className="w-6 h-6 text-yellow-500" />
          Thống kê thú vị
        </h3>
        <div className="space-y-2 text-gray-700">
          <p>• Bạn đã ghi lại trang phục trong <span className="font-bold text-blue-600">{stats.totalDaysRecorded}/{year === new Date().getFullYear() ? new Date().getDate() + new Date().getMonth() * 30 : 365} ngày</span></p>
          <p>• Bạn có <span className="font-bold text-purple-600">{stats.uniqueOutfits} outfit độc đáo</span> khác nhau</p>
          {stats.recordingStreak > 1 && (
            <p>• Chuỗi ghi chép dài nhất: <span className="font-bold text-green-600">{stats.recordingStreak} ngày liên tiếp</span>!</p>
          )}
          <p>• Trung bình mỗi ngày bạn ghi: <span className="font-bold text-pink-600">{(stats.totalOutfits / stats.totalDaysRecorded).toFixed(1)} outfit</span></p>
        </div>
      </div>
    </div>
  );
};
