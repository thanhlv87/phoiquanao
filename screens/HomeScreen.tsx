
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { useAuth } from '../hooks/useAuth';
import { getTodayDateString, formatTime } from '../utils/dateUtils';
import { fetchLocalWeather, WeatherData } from '../services/weatherService';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';

const WeatherWidget: React.FC<{ weather: WeatherData | null; loading: boolean }> = ({ weather, loading }) => {
  if (loading && !weather) {
    return (
      <div className="bg-white rounded-[2rem] p-6 mb-8 h-28 border border-gray-100 animate-pulse"></div>
    );
  }
  if (!weather) return null;
  return (
    <div className="bg-white rounded-[2rem] p-6 mb-8 flex items-center justify-between border border-gray-100/50 shadow-sm animate-fade-in group hover:shadow-md transition-shadow">
      <div className="flex items-center gap-5 min-w-0">
        <div className="w-14 h-14 bg-sage-50 rounded-full flex items-center justify-center text-2xl shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
          {weather.isRaining ? '🌧️' : weather.temp > 28 ? '☀️' : '☁️'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon name="search" className="w-3 h-3 text-sage-500" strokeWidth="2.5" />
            <p className="text-[10px] font-bold uppercase text-sage-600 tracking-widest truncate">{weather.city}</p>
          </div>
          <p className="text-lg font-serif italic text-charcoal leading-none truncate">{weather.condition}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <p className="text-4xl font-serif text-charcoal leading-none mb-1">{weather.temp}°</p>
      </div>
    </div>
  );
};

const OutfitCarousel: React.FC<{ outfits: Outfit[], onNavigate: (id: string) => void }> = ({ outfits, onNavigate }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
        if(scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if(scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };
    
    if (outfits.length === 0) return null;

    return (
        <div className="relative group/carousel">
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex space-x-4 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 scrollbar-hide px-1">
                {outfits.map((outfit) => (
                    <div key={outfit.id} onClick={() => onNavigate(outfit.id)} className="snap-start flex-shrink-0 w-[85%] bg-white rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer p-3 border border-gray-50">
                        <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden relative">
                          <img 
                              src={outfit.imageUrls[0]} 
                              alt="Outfit" 
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover" 
                          />
                          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                              {outfit.temperature !== undefined && (
                                  <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                                      <p className="text-[10px] font-bold text-charcoal leading-none">{outfit.temperature}°C</p>
                                  </div>
                              )}
                          </div>
                          <div className="absolute bottom-3 left-3">
                               <div className="bg-charcoal/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                                  <p className="text-[10px] font-bold text-white leading-none tracking-wider">{formatTime(outfit.date)}</p>
                              </div>
                          </div>
                        </div>
                        <div className="p-3 pt-4">
                            <div className="flex flex-wrap gap-2">
                                {[...outfit.tops, ...outfit.bottoms].slice(0, 3).map(tag => (
                                    <span key={tag} className="bg-sage-50 text-sage-700 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Arrows */}
            {showLeftArrow && (
                <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-10 hover:bg-white text-charcoal opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                    <Icon name="chevron-left" className="w-5 h-5" />
                </button>
            )}
            {showRightArrow && outfits.length > 1 && (
                <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-10 hover:bg-white text-charcoal opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                    <Icon name="chevron-right" className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

const AddOutfitPrompt: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="bg-white rounded-[2.5rem] p-8 text-center flex flex-col items-center justify-center min-h-[300px] border border-gray-100 shadow-sm relative overflow-hidden group">
    {/* Decoration */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-sage-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-sage-100 transition-colors duration-700"></div>
    
    <div className="w-20 h-20 rounded-full bg-cream-50 flex items-center justify-center mb-6 border border-sage-100 relative z-10">
      <Icon name="plus" className="w-8 h-8 text-sage-400" />
    </div>
    <h3 className="font-serif text-2xl text-charcoal mb-2">Nhật ký hôm nay</h3>
    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-8">Hãy lưu lại phong cách của bạn</p>
    <button
      onClick={onAdd}
      className="bg-sage-600 text-white font-bold py-4 px-10 rounded-full shadow-xl shadow-sage-200 active:scale-95 transition-all uppercase text-[10px] tracking-widest hover:bg-sage-700 relative z-10"
    >
      Ghi lại ngay
    </button>
  </div>
);

const FlashbackSection: React.FC<{
  title: string;
  outfits: Outfit[];
  fallbackMessage: string;
  onNavigate: (id: string) => void;
}> = ({ title, outfits, fallbackMessage, onNavigate }) => {
  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-5 px-2">
        <h2 className="font-serif text-xl text-charcoal italic">{title}</h2>
        <div className="h-[1px] flex-1 bg-gray-200 ml-4"></div>
      </div>
      {outfits.length > 0 ? (
        <OutfitCarousel outfits={outfits} onNavigate={onNavigate} />
      ) : (
        <div className="bg-white/40 rounded-[2rem] p-8 text-center border border-dashed border-gray-300">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{fallbackMessage}</p>
        </div>
      )}
    </div>
  );
};

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useOutfits();
  const { user, logout } = useAuth();
  const { outfitsByDate, loading: outfitsLoading } = state;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    setWeatherLoading(true);
    fetchLocalWeather().then(data => {
      setWeather(data);
      setWeatherLoading(false);
    });
  }, []);

  const todayId = getTodayDateString();
  const todaysOutfits = outfitsByDate[todayId] || [];

  const outfitsFromLastWeek = useMemo(() => {
    if (!outfitsByDate) return [];
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const dateId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return outfitsByDate[dateId] || [];
  }, [outfitsByDate]);

  const outfitsFromLastMonth = useMemo(() => {
    if (!outfitsByDate) return [];
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const dateId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return outfitsByDate[dateId] || [];
  }, [outfitsByDate]);

  const timeGreeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Chào buổi sáng";
    if (hr < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  const greetingName = user && !user.isAnonymous ? (user.displayName?.split(' ')[0] || user.email?.split('@')[0]) : 'Bạn';

  if (outfitsLoading && Object.keys(outfitsByDate).length === 0) {
      return (
          <div className="p-4 md:p-6 pb-24 min-h-screen bg-cream-50 pt-12">
              <div className="h-12 w-48 bg-gray-200 rounded mb-8 animate-pulse"></div>
              <div className="h-28 w-full bg-gray-200 rounded-[2.2rem] mb-8 animate-pulse"></div>
              <div className="h-[400px] w-full bg-gray-200 rounded-[2.2rem] animate-pulse"></div>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-6 pb-32 min-h-screen bg-cream-50 pt-12">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex-shrink-0 animate-scale-up border-2 border-white rounded-full shadow-md overflow-hidden bg-white">
            <img 
              src="https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/fashion.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-charcoal leading-none mb-1">{timeGreeting},</h1>
            <p className="text-sage-600 font-bold text-sm tracking-wide">{greetingName} ✨</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user && !user.isAnonymous && (
            <button onClick={logout} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500 active:scale-90 transition-all border border-gray-100">
              <Icon name="logout" className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <WeatherWidget weather={weather} loading={weatherLoading} />

      <main className="animate-fade-in">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sage-600"></div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">OUTFIT HÔM NAY</h2>
        </div>
        
        {todaysOutfits.length > 0 ? (
          <OutfitCarousel outfits={todaysOutfits} onNavigate={(id) => navigate(`/outfit/${id}`)} />
        ) : (
          <AddOutfitPrompt onAdd={() => navigate(`/add-outfit/${todayId}`)} />
        )}
        
        <FlashbackSection
          title="Tuần trước"
          outfits={outfitsFromLastWeek}
          fallbackMessage="Không có dữ liệu tuần trước"
          onNavigate={(id) => navigate(`/outfit/${id}`)}
        />
        <FlashbackSection
          title="Tháng trước"
          outfits={outfitsFromLastMonth}
          fallbackMessage="Không có dữ liệu tháng trước"
          onNavigate={(id) => navigate(`/outfit/${id}`)}
        />
      </main>
    </div>
  );
};
