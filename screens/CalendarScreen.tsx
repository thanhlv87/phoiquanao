import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const OutfitGrid: React.FC<{ outfits: Outfit[] }> = ({ outfits }) => {
  const navigate = useNavigate();
  if (outfits.length === 0) {
    return <p className="text-center text-gray-500 mt-8">Không tìm thấy trang phục phù hợp.</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
      {outfits.map(outfit => (
        <div key={outfit.id} className="relative aspect-square rounded-lg overflow-hidden shadow-md cursor-pointer group" onClick={() => navigate(`/add-outfit/${outfit.id}`)}>
          <img src={outfit.imageUrl} alt={`Outfit from ${outfit.id}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <p className="absolute bottom-2 left-2 text-white text-xs font-bold">{new Date(outfit.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}</p>
        </div>
      ))}
    </div>
  );
};


export const CalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { state } = useOutfits();
  const { outfits, loading, error } = state;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Avoid month skipping issues
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const { year, month, daysInMonth, startDayOfMonth } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfMonth = new Date(year, month, 1).getDay();
    return { year, month, daysInMonth, startDayOfMonth };
  }, [currentDate]);
  
  const monthYearString = useMemo(() => {
    return `Tháng ${month + 1} năm ${year}`;
  }, [year, month]);

  const allOutfitsSorted = useMemo(() => {
    return Object.values(outfits).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [outfits]);

  const filteredOutfits = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (!lowercasedQuery) return [];
    
    return allOutfitsSorted.filter(outfit => 
        outfit.tops.some(t => t.toLowerCase().includes(lowercasedQuery)) ||
        outfit.bottoms.some(b => b.toLowerCase().includes(lowercasedQuery)) ||
        outfit.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))
    );
  }, [searchQuery, allOutfitsSorted]);

  const handleDayClick = (day: number) => {
    const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    navigate(`/add-outfit/${dateId}`);
  };

  const today = new Date();
  const isCurrentMonthAndYear = today.getFullYear() === year && today.getMonth() === month;

  if (loading) {
      return (
        <div className="p-4 md:p-6 pb-20">
            <div className="relative mb-6">
                <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input type="text" placeholder="Tìm trang phục theo thẻ..." className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-full" disabled/>
            </div>
            <LoadingSpinner />
        </div>
      );
  }

  if (error) return <p className="text-red-500 text-center p-4">Không thể tải trang phục.</p>;

  return (
    <div className="p-4 md:p-6 pb-20">
      <div className="relative mb-6">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
            type="text"
            placeholder="Tìm trang phục theo thẻ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
      </div>

      {searchQuery.trim().length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {filteredOutfits.length > 0 ? `Tìm thấy ${filteredOutfits.length} trang phục` : 'Kết quả tìm kiếm'}
          </h2>
          <OutfitGrid outfits={filteredOutfits} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {monthYearString}
            </h2>
            <div className="flex items-center space-x-1">
              <button 
                onClick={goToToday} 
                className="text-sm font-semibold text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"
              >
                Hôm nay
              </button>
              <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                <Icon name="chevron-left" className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                <Icon name="chevron-right" className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-7 gap-y-2 text-center mb-4">
              {WEEKDAYS.map((day, i) => (
                <div key={i} className="font-semibold text-gray-400 text-xs">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: startDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`}></div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const outfit = outfits[dateId];
                const isToday = isCurrentMonthAndYear && day === today.getDate();
                const baseClasses = "w-10 h-10 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 relative overflow-hidden font-medium";
                let dayClasses = [baseClasses];
                let dayStyles: React.CSSProperties = {};
                let textClasses = "";

                if (outfit) {
                  dayStyles = {
                    backgroundImage: `url(${outfit.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  };
                  textClasses = "text-white";
                } else {
                  textClasses = "text-gray-700";
                  dayClasses.push("hover:bg-slate-100");
                }

                if (isToday) {
                  dayClasses.push("border-2 border-blue-600 shadow");
                  if (!outfit) {
                    dayClasses.push("bg-blue-600");
                    textClasses = "text-white font-bold";
                  }
                }
                
                return (
                  <div 
                    key={dateId} 
                    onClick={() => handleDayClick(day)} 
                    className={dayClasses.join(' ')}
                    style={dayStyles}
                  >
                    {outfit && <div className="absolute inset-0 bg-black bg-opacity-40"></div>}
                    <span className={`relative z-10 ${textClasses}`}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};