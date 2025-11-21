import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';
import { formatDate, parseDateString } from '../utils/dateUtils';

const monthNames = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];
const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// --- Modal Component ---
const OutfitDetailModal: React.FC<{ outfit: Outfit; onClose: () => void; onUpdate: (id: string) => void }> = ({ outfit, onClose, onUpdate }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0 relative">
                     {outfit.imageUrls.length > 1 ? (
                        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                            {outfit.imageUrls.map((url, index) => (
                                <img key={index} src={url} alt={`Outfit image ${index + 1}`} className="w-full h-auto object-contain flex-shrink-0 snap-center" />
                            ))}
                        </div>
                    ) : (
                        <img src={outfit.imageUrls[0]} alt="Outfit image" className="w-full h-auto object-contain" />
                    )}
                    <button onClick={onClose} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">&times;</button>
                </div>

                <div className="p-4 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Chi tiết trang phục</h3>
                    <div className="space-y-3">
                        <div>
                            <p className="font-semibold text-gray-600">Áo:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {outfit.tops.map(tag => <span key={tag} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{tag}</span>)}
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600">Quần:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {outfit.bottoms.map(tag => <span key={tag} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">{tag}</span>)}
                            </div>
                        </div>
                        {outfit.tags.length > 0 && (
                            <div>
                                <p className="font-semibold text-gray-600">Thẻ chung:</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {outfit.tags.map(tag => <span key={tag} className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">{tag}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex-shrink-0 flex items-center gap-4">
                    <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors">Đóng</button>
                    <button onClick={() => onUpdate(outfit.id)} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors">Cập nhật</button>
                </div>
            </div>
        </div>
    );
};


// --- Preview Pane Component ---
const OutfitPreview: React.FC<{
    dateId: string | null;
    outfits: Outfit[];
    onSelectOutfit: (outfit: Outfit) => void;
    onAddOutfit: (dateId: string) => void;
}> = ({ dateId, outfits, onSelectOutfit, onAddOutfit }) => {
    if (!dateId) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>Chọn một ngày trên lịch để xem trang phục.</p>
            </div>
        );
    }
    
    const date = parseDateString(dateId);

    if (outfits.length === 0) {
        return (
            <div className="p-8 text-center flex flex-col items-center">
                 <h2 className="text-xl font-semibold text-gray-700 mb-2">{formatDate(date)}</h2>
                <p className="text-gray-500 mb-4">Không có trang phục nào cho ngày này.</p>
                <button onClick={() => onAddOutfit(dateId)} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300">
                    <Icon name="plus" className="w-5 h-5" />
                    Thêm trang phục
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">{formatDate(date)}</h2>
                <button onClick={() => onAddOutfit(dateId)} className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow" title="Thêm trang phục cho ngày này">
                    <Icon name="plus" className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-4">
                {outfits.map(outfit => (
                    <div key={outfit.id} onClick={() => onSelectOutfit(outfit)} className="flex items-center bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
                        <div className="w-1/2 aspect-square flex-shrink-0 bg-gray-100">
                            <img src={outfit.imageUrls[0]} alt="Outfit preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3 flex-1 min-w-0">
                            <p className="font-semibold text-gray-500 text-sm mb-2 truncate">Trang phục #{outfit.id.slice(0, 4)}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {[...outfit.tops, ...outfit.bottoms, ...outfit.tags].slice(0, 4).map(tag => (
                                    <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">{tag}</span>
                                ))}
                                {[...outfit.tops, ...outfit.bottoms, ...outfit.tags].length > 4 && (
                                    <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">...</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Main Calendar Screen ---
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
    // Fix: Replaced `(JSX.Element | null)[]` with `React.ReactNode[]` to resolve issue where JSX namespace was not found.
    // `React.ReactNode` is a more general type that includes JSX elements and null values.
    const grid: React.ReactNode[] = Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateId = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const outfitsForDay = outfitsByDate[dateId] || [];
      const hasOutfit = outfitsForDay.length > 0;
      const isSelected = dateId === selectedDateId;

      grid.push(
        <div key={dateId} onClick={() => handleDayClick(dateId)} className="relative aspect-square cursor-pointer">
          <div className={`w-full h-full rounded-lg flex items-center justify-center transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
            {hasOutfit ? (
              <div className="w-full h-full rounded-lg overflow-hidden shadow-sm">
                <img src={outfitsForDay[0].imageUrls[0]} alt={`Outfit for ${dateId}`} className="w-full h-full object-cover"/>
                {outfitsForDay.length > 1 && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                        {outfitsForDay.length}
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-center text-xs py-0.5">
                    <span className="font-bold">{day}</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-slate-100">
                <span className="text-sm text-gray-500">{day}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return grid;
  }, [currentYear, currentMonth, outfitsByDate, handleDayClick, selectedDateId]);

  const outfitsForSelectedDay = outfitsByDate[selectedDateId] || [];

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-gray-100">
      {selectedOutfitForModal && (
        <OutfitDetailModal
            outfit={selectedOutfitForModal}
            onClose={() => setSelectedOutfitForModal(null)}
            onUpdate={(id) => navigate(`/outfit/${id}`)}
        />
      )}
      <div className="p-4 md:p-6 flex-shrink-0">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">
              <Icon name="chevron-left" className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">
              <Icon name="chevron-right" className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-500 mb-2">
            {dayNames.map(day => <div key={day}>{day}</div>)}
          </div>
          {loading ? (
            <div className="flex justify-center items-center p-8 h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((dayContent, index) => <div key={index}>{dayContent || <div className="aspect-square"></div>}</div>)}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-grow bg-white overflow-y-auto border-t">
        <OutfitPreview
            dateId={selectedDateId}
            outfits={outfitsForSelectedDay}
            onSelectOutfit={setSelectedOutfitForModal}
            onAddOutfit={(dateId) => navigate(`/add-outfit/${dateId}`)}
        />
      </div>
    </div>
  );
};