
import React, { useMemo, useState } from 'react';
import { useOutfits } from '../hooks/useOutfits';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';

interface TagCount {
    tag: string;
    count: number;
    percentage: number;
}

// --- Components cho Tổng quan (Overview) ---
const StatCard: React.FC<{ title: string; value: string | number; icon?: string }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            {title === "Tổng trang phục" && <Icon name="collections" className="w-5 h-5 text-blue-500" />}
            {title === "Ngày ghi nhiều nhất" && <Icon name="calendar" className="w-5 h-5 text-purple-500" />}
        </div>
    </div>
);

const BarChart: React.FC<{ data: TagCount[]; color: string; label: string }> = ({ data, color, label }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4">
            <h3 className="text-lg font-bold text-gray-700 mb-4">{label}</h3>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center">
                        <span className="w-24 text-sm text-gray-600 truncate mr-2">{item.tag}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${color}`} 
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                            ></div>
                        </div>
                        <span className="ml-3 text-sm font-semibold text-gray-700 w-6 text-right">{item.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WeekdayChart: React.FC<{ dayCounts: number[] }> = ({ dayCounts }) => {
    const maxCount = Math.max(...dayCounts, 1);
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Tần suất theo ngày trong tuần</h3>
            <div className="space-y-3">
                 {days.map((day, index) => (
                    <div key={day} className="flex items-center">
                         <span className="w-8 text-sm text-gray-600">{day}</span>
                         <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                             <div 
                                 className="h-full bg-purple-600 rounded-full" 
                                 style={{ width: `${(dayCounts[index] / maxCount) * 100}%` }}
                             ></div>
                         </div>
                         <span className="ml-3 text-sm font-semibold text-gray-700 w-6 text-right">{dayCounts[index]}</span>
                    </div>
                 ))}
            </div>
        </div>
    );
};

const StyleDistribution: React.FC<{ styles: TagCount[] }> = ({ styles }) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Phân bố phong cách</h3>
            <div className="space-y-3">
                {styles.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{item.tag}</span>
                        <span className="font-semibold text-gray-800">{item.percentage.toFixed(0)}%</span>
                    </div>
                ))}
                {styles.length > 5 && (
                     <div className="text-right text-xs text-gray-400 mt-2">
                        + {styles.length - 5} phong cách khác
                     </div>
                )}
            </div>
        </div>
    );
};

// --- Components cho Tổng kết năm (Year in Review) ---
const YearHighlightCard: React.FC<{ label: string; value: string; subtext?: string }> = ({ label, value, subtext }) => (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-white mb-4">
        <p className="text-purple-200 text-sm font-medium mb-1 uppercase tracking-wider">{label}</p>
        <h3 className="text-3xl font-extrabold mb-1">{value}</h3>
        {subtext && <p className="text-white/80 text-sm">{subtext}</p>}
    </div>
);

const MonthlyTrendChart: React.FC<{ monthCounts: number[] }> = ({ monthCounts }) => {
    const max = Math.max(...monthCounts, 1);
    
    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-white mb-4">
            <h3 className="text-lg font-bold mb-4">Biểu đồ năng suất năm nay</h3>
            <div className="flex items-end justify-between h-32 gap-1">
                {monthCounts.map((count, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 group">
                         <div className="w-full bg-white/30 rounded-t-sm relative transition-all duration-500 hover:bg-white/60" style={{ height: `${(count / max) * 100}%` }}>
                            {count > 0 && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100">{count}</span>}
                         </div>
                         <span className="text-[10px] mt-1 text-white/60">{index + 1}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const StatisticsScreen: React.FC = () => {
    const { state } = useOutfits();
    const { allOutfits, loading } = state;
    const [activeTab, setActiveTab] = useState<'overview' | 'year'>('overview');
    const currentYear = new Date().getFullYear();

    const stats = useMemo(() => {
        let outfits = Object.values(allOutfits) as Outfit[];
        
        // Filter for Year View only
        if (activeTab === 'year') {
            outfits = outfits.filter(o => new Date(o.date).getFullYear() === currentYear);
        }

        const totalOutfits = outfits.length;

        if (totalOutfits === 0) return null;

        const topCounts: Record<string, number> = {};
        const bottomCounts: Record<string, number> = {};
        const styleCounts: Record<string, number> = {};
        const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // 0 = Sunday
        const monthCounts = Array(12).fill(0); // 0 = Jan

        outfits.forEach(outfit => {
            outfit.tops.forEach(t => topCounts[t] = (topCounts[t] || 0) + 1);
            outfit.bottoms.forEach(t => bottomCounts[t] = (bottomCounts[t] || 0) + 1);
            outfit.tags.forEach(t => styleCounts[t] = (styleCounts[t] || 0) + 1);
            
            const date = new Date(outfit.date);
            dayCounts[date.getDay()]++;
            
            // Only count months for the current active view logic
            if (activeTab === 'year' || true) {
                 monthCounts[date.getMonth()]++;
            }
        });

        const processCounts = (counts: Record<string, number>): TagCount[] => {
            return Object.entries(counts)
                .map(([tag, count]) => ({ tag, count, percentage: (count / totalOutfits) * 100 }))
                .sort((a, b) => b.count - a.count);
        };

        const topTops = processCounts(topCounts).slice(0, 5);
        const topBottoms = processCounts(bottomCounts).slice(0, 5);
        const styles = processCounts(styleCounts);

        // Find most active day
        const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
        const maxDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
        const mostActiveDay = totalOutfits > 0 ? days[maxDayIndex] : "Chưa có";
        
        // Find most active month
        const maxMonthIndex = monthCounts.indexOf(Math.max(...monthCounts));
        const busiestMonth = totalOutfits > 0 ? `Tháng ${maxMonthIndex + 1}` : "Chưa có";

        // Smart Suggestion Logic
        let suggestion = "Hãy ghi lại thêm trang phục để nhận gợi ý!";
        if (topTops.length > 0) {
            const mostWornItem = topTops[0];
            if (mostWornItem.percentage > 30) {
                suggestion = `Bạn đang mặc "${mostWornItem.tag}" rất thường xuyên! Thử thay đổi phong cách nhé?`;
            } else {
                 suggestion = "Phong cách của bạn khá đa dạng. Tiếp tục phát huy nhé!";
            }
        }
        
        // Determine "Signature Look" for Year Review
        const signatureTop = topTops[0]?.tag || "Áo?";
        const signatureBottom = topBottoms[0]?.tag || "Quần?";
        const signatureStyle = styles[0]?.tag || "Chưa xác định";

        return {
            totalOutfits,
            mostActiveDay,
            busiestMonth,
            topTops,
            topBottoms,
            styles,
            dayCounts,
            monthCounts,
            suggestion,
            signatureLook: `${signatureTop} & ${signatureBottom}`,
            signatureStyle
        };

    }, [allOutfits, activeTab, currentYear]);

    return (
        <div className={`p-4 md:p-6 pb-20 min-h-screen transition-colors duration-500 ${activeTab === 'year' ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className={`text-3xl font-bold transition-colors ${activeTab === 'year' ? 'text-white' : 'text-gray-800'}`}>Thống kê</h1>
                    <p className={`transition-colors ${activeTab === 'year' ? 'text-purple-200' : 'text-gray-500'}`}>Khám phá phong cách của bạn</p>
                </div>
            </header>

            {/* Tab Switcher */}
            <div className={`flex p-1 rounded-lg mb-6 w-fit transition-colors ${activeTab === 'year' ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'overview' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    style={activeTab === 'overview' ? {} : {}}
                >
                    Tổng quan
                </button>
                <button 
                    onClick={() => setActiveTab('year')}
                    className={`flex items-center gap-1 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'year' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <Icon name="sparkles" className={`w-4 h-4 ${activeTab === 'year' ? 'text-white' : 'text-yellow-500'}`} />
                    Tổng kết năm
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : !stats ? (
                 <div className={`p-6 text-center rounded-xl shadow-sm border border-dashed ${activeTab === 'year' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${activeTab === 'year' ? 'bg-slate-700' : 'bg-gray-100'}`}>
                        <Icon name={activeTab === 'year' ? 'calendar' : 'collections'} className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${activeTab === 'year' ? 'text-white' : 'text-gray-800'}`}>
                        {activeTab === 'year' ? `Chưa có dữ liệu năm ${currentYear}` : "Chưa có dữ liệu"}
                    </h2>
                    <p className={activeTab === 'year' ? 'text-gray-400' : 'text-gray-500'}>
                        {activeTab === 'year' 
                            ? "Bạn chưa ghi lại trang phục nào trong năm nay. Hãy bắt đầu ghi lại để xem tổng kết nhé!" 
                            : "Hãy thêm trang phục để xem thống kê về phong cách của bạn."}
                    </p>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {activeTab === 'overview' ? (
                        // --- OVERVIEW UI ---
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <StatCard title="Tổng trang phục" value={stats.totalOutfits} />
                                <StatCard title="Ngày ghi nhiều nhất" value={stats.mostActiveDay} />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl mb-6">
                                <h4 className="text-yellow-800 font-bold text-sm mb-1">Gợi ý thông minh</h4>
                                <p className="text-yellow-700 text-sm">{stats.suggestion}</p>
                            </div>

                            <BarChart label="Top Áo" data={stats.topTops} color="bg-blue-600" />
                            <BarChart label="Top Quần" data={stats.topBottoms} color="bg-green-600" />
                            <WeekdayChart dayCounts={stats.dayCounts} />
                            <StyleDistribution styles={stats.styles} />
                        </>
                    ) : (
                        // --- YEAR IN REVIEW UI (WRAPPED STYLE) ---
                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-5 shadow-2xl border border-white/10 relative overflow-hidden">
                            {/* Decorative Blobs */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                            
                            <div className="relative z-10">
                                <div className="text-center mb-8 pt-4">
                                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white mb-2 tracking-widest">FLASHBACK</span>
                                    <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{currentYear}</h2>
                                    <p className="text-purple-100">Một năm đầy phong cách của bạn</p>
                                </div>

                                <YearHighlightCard 
                                    label="Tổng số bộ đồ" 
                                    value={stats.totalOutfits.toString()} 
                                    subtext={stats.totalOutfits > 20 ? "Wow! Bạn là một tín đồ thời trang thực thụ." : "Một khởi đầu tuyệt vời!"}
                                />

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white">
                                        <p className="text-purple-200 text-xs font-bold uppercase mb-1">Combo hủy diệt</p>
                                        <p className="font-bold text-lg leading-tight">{stats.signatureLook}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white">
                                        <p className="text-purple-200 text-xs font-bold uppercase mb-1">Cá tính</p>
                                        <p className="font-bold text-lg leading-tight">{stats.signatureStyle}</p>
                                    </div>
                                </div>
                                
                                <MonthlyTrendChart monthCounts={stats.monthCounts} />

                                <div className="bg-white/90 rounded-xl p-4 mt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-white">
                                            <Icon name="sparkles" className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs font-bold uppercase">Lời nhắn từ AI</p>
                                            <p className="text-gray-800 text-sm font-medium italic">"{stats.suggestion}"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
