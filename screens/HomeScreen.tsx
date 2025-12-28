
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { useAuth } from '../hooks/useAuth';
import { getTodayDateString } from '../utils/dateUtils';
import { fetchLocalWeather, WeatherData } from '../services/weatherService';
import { suggestWeatherOutfit } from '../services/geminiService';
import { getWardrobe } from '../services/firebaseService';
import { Icon } from '../components/Icon';
import { Outfit, WardrobeItem } from '../types';

const WeatherWidget: React.FC<{ weather: WeatherData | null; loading: boolean }> = ({ weather, loading }) => {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-[2.2rem] p-5 mb-8 flex items-center justify-between shadow-sm border border-white/50 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-slate-100 rounded-2xl"></div>
          <div className="space-y-2">
            <div className="w-20 h-2 bg-slate-100 rounded"></div>
            <div className="w-32 h-3 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[2.2rem] p-5 mb-8 flex items-center justify-between shadow-sm border border-white/50 animate-fade-in">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl shadow-inner flex-shrink-0">
          {weather.isRaining ? '🌧️' : weather.temp > 28 ? '☀️' : '☁️'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon name="search" className="w-3 h-3 text-indigo-500" strokeWidth="2.5" />
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider truncate">{weather.city}</p>
          </div>
          <p className="text-sm font-bold text-slate-800 leading-tight truncate">{weather.condition}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <p className="text-2xl font-black text-slate-900 leading-none mb-1">{weather.temp}°</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Hiện tại</p>
      </div>
    </div>
  );
};

const WeatherSuggestionCard: React.FC<{ 
  weather: WeatherData | null; 
}> = ({ weather }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState<{ top: WardrobeItem; bottom: WardrobeItem; reason: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [emptyWardrobe, setEmptyWardrobe] = useState(false);

  const getRecommendation = async () => {
    if (!user || !weather) return;
    setLoading(true);
    setEmptyWardrobe(false);
    try {
      const wardrobe = await getWardrobe(user.uid);
      
      const hasTops = wardrobe.some(i => i.category === 'top');
      const hasBottoms = wardrobe.some(i => ['bottom', 'skirt', 'dress'].includes(i.category));
      
      if (!hasTops || !hasBottoms) {
        setEmptyWardrobe(true);
        setLoading(false);
        return;
      }
      
      const res = await suggestWeatherOutfit(wardrobe, weather);
      const top = wardrobe.find(w => w.id === res.topId);
      const bottom = wardrobe.find(w => w.id === res.bottomId);
      
      if (top && bottom) {
        setSuggestion({ top, bottom, reason: res.reason });
      } else {
        // Fallback: pick first of each if AI fails to return valid IDs
        const firstTop = wardrobe.find(i => i.category === 'top');
        const firstBottom = wardrobe.find(i => ['bottom', 'skirt', 'dress'].includes(i.category));
        if (firstTop && firstBottom) {
          setSuggestion({ top: firstTop, bottom: firstBottom, reason: "Hôm nay thời tiết thế này, mặc combo này là chuẩn nhất!" });
        }
      }
    } catch (e) {
      console.error("AI Suggestion error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weather) getRecommendation();
  }, [weather, user]);

  if (!weather) return null;

  return (
    <div className="mt-8 mb-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Icon name="sparkles" className="text-indigo-600 w-3.5 h-3.5" />
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Gợi ý phối đồ</h2>
      </div>
      
      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-indigo-100/50 border border-indigo-50 relative overflow-hidden min-h-[160px] flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Đang xem tủ đồ của bạn...</p>
          </div>
        ) : emptyWardrobe ? (
          <div className="text-center py-4">
            <p className="text-slate-500 font-bold text-sm mb-4">Tủ đồ còn trống, AI chưa thể gợi ý được.</p>
            <button 
              onClick={() => navigate('/closet')}
              className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3 px-8 rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Thêm đồ vào tủ
            </button>
          </div>
        ) : suggestion ? (
          <>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden p-2 flex items-center justify-center border border-slate-100">
                <img src={suggestion.top.imageUrl} className="w-full h-full object-contain" alt="top" />
              </div>
              <div className="flex-1 aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden p-2 flex items-center justify-center border border-slate-100">
                <img src={suggestion.bottom.imageUrl} className="w-full h-full object-contain" alt="bottom" />
              </div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <p className="text-[11px] font-medium text-indigo-900 leading-relaxed italic">"{suggestion.reason}"</p>
            </div>
          </>
        ) : (
          <div className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Thời tiết này bạn có thể mặc gì cũng đẹp!
          </div>
        )}
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
        <div className="relative">
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex space-x-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide px-1">
                {outfits.map((outfit) => (
                    <div key={outfit.id} onClick={() => onNavigate(outfit.id)} className="snap-start flex-shrink-0 w-[85%] bg-white rounded-[2.2rem] shadow-lg overflow-hidden transition-all hover:scale-[1.01] cursor-pointer p-2 border border-slate-100">
                        <div className="aspect-square rounded-[1.8rem] overflow-hidden">
                          <img src={outfit.imageUrls[0]} alt="Outfit" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4">
                            <div className="flex flex-wrap gap-1.5">
                                {[...outfit.tops, ...outfit.bottoms].slice(0, 3).map(tag => (
                                    <span key={tag} className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase px-3 py-1 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {showLeftArrow && (
                <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10 hover:bg-white text-slate-600">
                    <Icon name="chevron-left" className="w-4 h-4" />
                </button>
            )}
            {showRightArrow && outfits.length > 1 && (
                <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10 hover:bg-white text-slate-600">
                    <Icon name="chevron-right" className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

const AddOutfitPrompt: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="bg-white rounded-[2.5rem] shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-slate-200">
    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
      <Icon name="plus" className="w-8 h-8 text-slate-300" />
    </div>
    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-6">Chưa có nhật ký hôm nay</p>
    <button
      onClick={onAdd}
      className="bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase text-[10px] tracking-widest"
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
      <div className="flex items-center gap-2 mb-4 px-2">
        <Icon name="calendar" className="text-slate-400 w-3.5 h-3.5" />
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h2>
      </div>
      {outfits.length > 0 ? (
        <OutfitCarousel outfits={outfits} onNavigate={onNavigate} />
      ) : (
        <div className="bg-white/50 rounded-[2rem] p-6 text-center text-[10px] font-bold text-slate-400 border border-dashed border-slate-200 uppercase tracking-tighter">
          {fallbackMessage}
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
    if (outfitsLoading || !outfitsByDate) return [];
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const dateId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return outfitsByDate[dateId] || [];
  }, [outfitsByDate, outfitsLoading]);

  const outfitsFromLastMonth = useMemo(() => {
    if (outfitsLoading || !outfitsByDate) return [];
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const dateId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return outfitsByDate[dateId] || [];
  }, [outfitsByDate, outfitsLoading]);

  const timeGreeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Chào buổi sáng";
    if (hr < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  const greetingName = user && !user.isAnonymous ? (user.displayName?.split(' ')[0] || user.email?.split('@')[0]) : 'Bạn';

  return (
    <div className="p-4 md:p-6 pb-24 min-h-screen bg-slate-50">
      <header className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex-shrink-0 animate-scale-up">
            <img 
              src="https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/fashion.png" 
              alt="Logo" 
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-0.5">{timeGreeting},</h1>
            <p className="text-slate-500 font-bold text-base">{greetingName} ✨</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/search')} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-600 active:scale-90 transition-all border border-slate-100">
            <Icon name="search" className="w-4 h-4" />
          </button>
          {user && !user.isAnonymous && (
            <button onClick={logout} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-red-500 active:scale-90 transition-all border border-slate-100">
              <Icon name="logout" className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <WeatherWidget weather={weather} loading={weatherLoading} />

      <main className="animate-fade-in">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Icon name="home" className="text-indigo-600 w-3.5 h-3.5" />
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trang phục hôm nay</h2>
        </div>
        
        {outfitsLoading ? (
          <div className="flex justify-center items-center py-20 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          todaysOutfits.length > 0 ? (
            <OutfitCarousel outfits={todaysOutfits} onNavigate={(id) => navigate(`/outfit/${id}`)} />
          ) : (
            <AddOutfitPrompt onAdd={() => navigate(`/add-outfit/${todayId}`)} />
          )
        )}

        <WeatherSuggestionCard weather={weather} />
        
        {!outfitsLoading && (
          <>
            <FlashbackSection
              title="Tuần trước vào ngày này"
              outfits={outfitsFromLastWeek}
              fallbackMessage="Chưa có dữ liệu tuần trước"
              onNavigate={(id) => navigate(`/outfit/${id}`)}
            />
            <FlashbackSection
              title="Tháng trước vào ngày này"
              outfits={outfitsFromLastMonth}
              fallbackMessage="Chưa có dữ liệu tháng trước"
              onNavigate={(id) => navigate(`/outfit/${id}`)}
            />
          </>
        )}
      </main>
    </div>
  );
};
