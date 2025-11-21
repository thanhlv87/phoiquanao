import React, { useMemo } from 'react';
import { useOutfits } from '../hooks/useOutfits';
import { calculateOutfitStats, generateSmartSuggestions, SmartSuggestion } from '../utils/analyticsUtils';
import { Icon } from '../components/Icon';

const SuggestionCard: React.FC<{ suggestion: SmartSuggestion }> = ({ suggestion }) => {
  const bgColors = {
    high: 'bg-red-50 border-red-200',
    medium: 'bg-yellow-50 border-yellow-200',
    low: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    high: 'text-red-800',
    medium: 'text-yellow-800',
    low: 'text-blue-800',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${bgColors[suggestion.priority]}`}>
      <p className={`text-sm font-medium ${textColors[suggestion.priority]}`}>
        {suggestion.message}
      </p>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon?: string }> = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
      {icon && <Icon name={icon as any} className="w-5 h-5 text-blue-600" />}
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

export const InsightsScreen: React.FC = () => {
  const { state } = useOutfits();
  const { allOutfits, loading } = state;

  const outfitsArray = useMemo(() => Object.values(allOutfits), [allOutfits]);
  const stats = useMemo(() => calculateOutfitStats(outfitsArray), [outfitsArray]);
  const suggestions = useMemo(() => generateSmartSuggestions(outfitsArray), [outfitsArray]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (stats.totalOutfits === 0) {
    return (
      <div className="p-4 md:p-6 pb-20">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Thống kê</h1>
          <p className="text-gray-500">Phân tích phong cách của bạn</p>
        </header>
        <div className="text-center text-gray-500 pt-16">
          <Icon name="sparkles" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="font-semibold">Chưa có dữ liệu để phân tích</p>
          <p className="text-sm">Hãy thêm trang phục để xem thống kê thú vị!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Thống kê</h1>
        <p className="text-gray-500">Khám phá phong cách của bạn</p>
      </header>

      <main className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Tổng trang phục" value={stats.totalOutfits} icon="collections" />
          <StatCard
            title="Ngày ghi nhiều nhất"
            value={Object.entries(stats.outfitsPerWeekday).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
          />
        </div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Gợi ý thông minh</h2>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard key={index} suggestion={suggestion} />
              ))}
            </div>
          </section>
        )}

        {/* Most Used Items */}
        <section className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Top Áo</h2>
          {stats.mostUsedTops.length > 0 ? (
            <div className="space-y-2">
              {stats.mostUsedTops.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{item.tag}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.count / stats.mostUsedTops[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
          )}
        </section>

        <section className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Top Quần</h2>
          {stats.mostUsedBottoms.length > 0 ? (
            <div className="space-y-2">
              {stats.mostUsedBottoms.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{item.tag}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(item.count / stats.mostUsedBottoms[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
          )}
        </section>

        {/* Weekday Distribution */}
        {Object.keys(stats.outfitsPerWeekday).length > 0 && (
          <section className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Tần suất theo ngày trong tuần</h2>
            <div className="space-y-2">
              {Object.entries(stats.outfitsPerWeekday)
                .sort(([, a], [, b]) => b - a)
                .map(([day, count]) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-gray-700">{day}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(stats.outfitsPerWeekday))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Style Distribution */}
        {stats.styleDistribution.length > 0 && (
          <section className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Phân bố phong cách</h2>
            <div className="space-y-2">
              {stats.styleDistribution.map((style, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 capitalize">{style.style}</span>
                  <span className="text-sm font-semibold text-gray-600">{style.percentage}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Favorite Colors */}
        {stats.favoriteColors.length > 0 && (
          <section className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Màu sắc yêu thích</h2>
            <div className="flex flex-wrap gap-2">
              {stats.favoriteColors.map((color, index) => (
                <span key={index} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {color}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
