
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';
import { formatDate, parseDateString, formatTime } from '../utils/dateUtils';

const monthNames = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];
const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const OutfitDetailModal: React.FC<{ outfit: Outfit; onClose: () => void; onUpdate: (id: string) => void }> = ({ outfit, onClose, onUpdate }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleScroll = () => {
        if (scrollRef.current) {
            const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
            setCurrentSlide(index);
        }
    };

    const scrollTo = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const newIndex = direction === 'left' ? currentSlide - 1 : currentSlide + 1;
            if (newIndex >= 0 && newIndex < outfit.imageUrls.length) {
                scrollRef.current.scrollTo({
                    left: newIndex * scrollRef.current.clientWidth,
                    behavior: 'smooth'
                });
                setCurrentSlide(newIndex);
            }
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0 relative group">
                     {outfit.imageUrls.length > 0 ? (
                        <>
                            <div 
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                            >
                                {outfit.imageUrls.map((url, index) => (
                                    <img 
                                        key={index} 
                                        src={url} 
                                        alt={`Outfit ${index + 1}`} 
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full aspect-square object-cover flex-shrink-0 snap-center" 
                                    />
                                ))}
                            </div>
                            
                            {/* Navigation Arrows (Only show if multiple images) */}
                            {outfit.imageUrls.length > 1 && (
                                <>
                                    {currentSlide > 0 && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); scrollTo('left'); }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/50 transition-all"
                                        >
                                            <Icon name="chevron-left" className="w-5 h-5" />
                                        </button>
                                    )}
                                    {currentSlide < outfit.imageUrls.length - 1 && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); scrollTo('right'); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/50 transition-all"
                                        >
                                            <Icon name="chevron-right" className="w-5 h-5" />
                                        </button>
                                    )}
                                    
                                    {/* Pagination Dots */}
                                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                        {outfit.imageUrls.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/50'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="w-full aspect-square bg-slate-100 flex items-center justify-center text-slate-400">
                             Không có ảnh
                        </div>
                    )}

                    <button onClick={onClose} className="absolute top-4 right-4 bg-white/90 text-slate-900 rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-lg z-20">&times;</button>
                    
                    <div className="absolute bottom-4 left-4 flex gap-2 z-10">
                        <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl text-[10px] font-black shadow-lg">
                            🕒 {formatTime(outfit.date)}
                        </div>
                        {outfit.temperature !== undefined && (
                            <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl text-[10px] font-black shadow-lg">
                                🌡️ {outfit.temperature}°C
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Chi tiết trang phục</h3>
                        {outfit.weatherCondition && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{outfit.weatherCondition}</span>}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-black uppercase text-indigo-600 mb-1 tracking-widest">Áo</p>
                            <div className="flex flex-wrap gap-2">
                                {outfit.tops.length > 0 ? outfit.tops.map(tag => <span key={tag} className="bg-indigo-50 text-indigo-700 text-xs font-bold px-4 py-1.5 rounded-full">{tag}</span>) : <span className="text-xs text-slate-400 italic">Chưa cập nhật</span>}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-emerald-600 mb-1 tracking-widest">Quần/Váy</p>
                            <div className="flex flex-wrap gap-2">
                                {outfit.bottoms.length > 0 ? outfit.bottoms.map(tag => <span key={tag} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full">{tag}</span>) : <span className="text-xs text-slate-400 italic">Chưa cập nhật</span>}
                            </div>
                        </div>
                        {outfit.tags.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Khác</p>
                                <div className="flex flex-wrap gap-2">
                                    {outfit.tags.map(tag => <span key={tag} className="bg-slate-50 text-slate-500 text-xs font-bold px-4 py-1.5 rounded-full">{tag}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex-shrink-0 flex items-center gap-4">
                    <button onClick={() => onUpdate(outfit.id)} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">SỬA PHỐI ĐỒ</button>
                </div>
            </div>
        </div>
    );
};

const OutfitPreview: React.FC<{
    dateId: string | null;
    outfits: Outfit[];
    onSelectOutfit: (outfit: Outfit) => void;
    onAddOutfit: (dateId: string) => void;
}> = ({ dateId, outfits, onSelectOutfit, onAddOutfit }) => {
    if (!dateId) return null;
    
    const date = parseDateString(dateId);

    return (
        <div className="p-6 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{formatDate(date)}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase">{outfits.length} BỘ TRANG PHỤC</p>
                </div>
                <button onClick={() => onAddOutfit(dateId)} className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 active:scale-90 transition-all">
                    <Icon name="plus" className="w-6 h-6" />
                </button>
            </div>
            
            {outfits.length === 0 ? (
                <div className="py-12 flex flex-col items-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">Ngày này chưa có kỷ niệm</p>
                    <button onClick={() => onAddOutfit(dateId)} className="text-indigo-600 font-bold text-sm underline underline-offset-4">Ghi lại ngay</button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {outfits.map(outfit => (
                        <div key={outfit.id} onClick={() => onSelectOutfit(outfit)} className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-50 cursor-pointer hover:shadow-xl transition-all active:scale-95">
                            <div className="aspect-square bg-slate-100 rounded-[1.5rem] overflow-hidden mb-2 relative group">
                                {outfit.imageUrls.length > 1 ? (
                                    <div className="w-full h-full grid grid-cols-2 gap-0.5">
                                        <img 
                                            src={outfit.imageUrls[0]} 
                                            alt="Preview 1" 
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover" 
                                        />
                                        <div className="relative w-full h-full overflow-hidden">
                                            <img 
                                                src={outfit.imageUrls[1]} 
                                                alt="Preview 2" 
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover" 
                                            />
                                            {outfit.imageUrls.length > 2 && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="text-white font-black text-[10px]">+{outfit.imageUrls.length - 2}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <img 
                                        src={outfit.imageUrls[0]} 
                                        alt="Preview" 
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover" 
                                    />
                                )}
                                
                                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                                    {outfit.temperature !== undefined && (
                                        <div className="bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-lg text-[8px] font-black">
                                            {outfit.temperature}°C
                                        </div>
                                    )}
                                    <div className="bg-indigo-600/80 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-lg text-[8px] font-black">
                                        {formatTime(outfit.date)}
                                    </div>
                                </div>
                            </div>
                            <div className="px-2 pb-1">
                                <p className="text-[10px] font-black uppercase text-indigo-600 truncate">{outfit.tops[0] || 'Phối đồ'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CalendarScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useOutfits();
  const { outfitsByDate, loading } = state;

  const today = new Date();
  const todayId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateId, setSelectedDateId] = useState<string>(todayId);
  const [selectedOutfitForModal, setSelectedOutfitForModal] = useState<Outfit | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  
  const handleDayClick = useCallback((dateId: string) => {
    setSelectedDateId(dateId);
  }, []);

  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const grid: React.ReactNode[] = Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateId = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const outfitsForDay = outfitsByDate[dateId] || [];
      const hasOutfit = outfitsForDay.length > 0;
      const isSelected = dateId === selectedDateId;

      grid.push(
        <div key={dateId} onClick={() => handleDayClick(dateId)} className="relative aspect-square cursor-pointer">
          <div className={`w-full h-full rounded-2xl flex items-center justify-center transition-all duration-300 ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50 shadow-md scale-105 z-10' : ''}`}>
            {hasOutfit ? (
              <div className="w-full h-full rounded-2xl overflow-hidden relative">
                <img 
                    src={outfitsForDay[0].imageUrls[0]} 
                    alt="Outfit" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover opacity-80" 
                />
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-black text-sm drop-shadow-md">{day}</span>
                </div>
                {outfitsForDay.length > 1 && (
                    <div className="absolute top-1 right-1 bg-indigo-600 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white">
                        {outfitsForDay.length}
                    </div>
                )}
              </div>
            ) : (
              <div className={`w-full h-full rounded-2xl flex items-center justify-center hover:bg-slate-100 ${day === today.getDate() && currentMonth === today.getMonth() ? 'border-2 border-indigo-200' : ''}`}>
                <span className={`text-sm font-bold ${day === today.getDate() && currentMonth === today.getMonth() ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return grid;
  }, [currentYear, currentMonth, outfitsByDate, handleDayClick, selectedDateId]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {selectedOutfitForModal && (
        <OutfitDetailModal
            outfit={selectedOutfitForModal}
            onClose={() => setSelectedOutfitForModal(null)}
            onUpdate={(id) => navigate(`/outfit/${id}`)}
        />
      )}
      
      <header className="p-6 bg-white rounded-b-[40px] shadow-sm pt-14">
        <div className="flex justify-between items-center px-2 mb-2">
          <button onClick={handlePrevMonth} className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <Icon name="chevron-left" className="w-5 h-5 text-slate-600" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
              {monthNames[currentMonth]}
            </h2>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{currentYear}</p>
          </div>
          <button onClick={handleNextMonth} className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <Icon name="chevron-right" className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mt-6 text-center">
          {dayNames.map(day => (
            <div key={day} className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{day}</div>
          ))}
        </div>
        
        {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 mt-4">
              {calendarGrid.map((dayContent, index) => <div key={index}>{dayContent || <div className="aspect-square"></div>}</div>)}
            </div>
          )}
      </header>
      
      <div className="flex-1 overflow-y-auto pb-24">
        <OutfitPreview
            dateId={selectedDateId}
            outfits={outfitsByDate[selectedDateId] || []}
            onSelectOutfit={setSelectedOutfitForModal}
            onAddOutfit={(dateId) => navigate(`/add-outfit/${dateId}`)}
        />
      </div>
    </div>
  );
};
