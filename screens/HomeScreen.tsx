
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getTodayDateString } from '../utils/dateUtils';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';
import { SearchSheet } from '../components/SearchSheet';
import { StatsSheet } from '../components/StatsSheet';
import { AccountSheet } from '../components/AccountSheet';
import { RecentlyWorn } from '../components/RecentlyWorn';
import { SettingsSheet } from '../components/SettingsSheet';
import { InstallBanner } from '../components/InstallPrompt';

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
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex space-x-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide px-1">
                {outfits.map((outfit) => (
                    <button type="button" key={outfit.id} onClick={() => onNavigate(outfit.id)} className="snap-start flex-shrink-0 w-[85%] text-left bg-white rounded-[2.2rem] shadow-lg overflow-hidden transition-all hover:scale-[1.01] cursor-pointer p-2 border border-slate-100">
                        <div className="aspect-square rounded-[1.8rem] overflow-hidden relative">
                          <img src={outfit.imageUrls[0]} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                            <div className="flex flex-wrap gap-1.5">
                                {[...outfit.tops, ...outfit.bottoms].slice(0, 3).map(tag => (
                                    <span key={tag} className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase px-3 py-1 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            {showLeftArrow && (
                <button type="button" aria-label="Cuộn sang trái" onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10 hover:bg-white text-slate-600">
                    <Icon name="chevron-left" className="w-4 h-4" />
                </button>
            )}
            {showRightArrow && outfits.length > 1 && (
                <button type="button" aria-label="Cuộn sang phải" onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10 hover:bg-white text-slate-600">
                    <Icon name="chevron-right" className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

const AddOutfitPrompt: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="bg-white rounded-[2.5rem] shadow-sm p-6 text-center flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-200">
    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
      <Icon name="plus" className="w-8 h-8 text-slate-300" />
    </div>
    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4">Chưa có nhật ký hôm nay</p>
    <button
      onClick={onAdd}
      className="bg-brand-600 text-white font-black py-3.5 px-10 rounded-2xl shadow-xl shadow-brand-100 active:scale-95 transition-all uppercase text-[10px] tracking-widest"
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
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3 px-2">
        <Icon name="calendar" className="text-slate-400 w-3.5 h-3.5" />
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h2>
      </div>
      {outfits.length > 0 ? (
        <OutfitCarousel outfits={outfits} onNavigate={onNavigate} />
      ) : (
        <div className="bg-white/50 rounded-[2rem] p-5 text-center text-[10px] font-bold text-slate-400 border border-dashed border-slate-200 uppercase tracking-tighter">
          {fallbackMessage}
        </div>
      )}
    </div>
  );
};

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useOutfits();
  const { user } = useAuth();
  const [sheet, setSheet] = useState<'search' | 'stats' | 'account' | 'settings' | null>(null);
  const [searchSeed, setSearchSeed] = useState('');
  const { showError } = useToast();
  const { outfitsByDate, allOutfits, loading: outfitsLoading, error } = state;
  const outfitList = useMemo(() => Object.values(allOutfits), [allOutfits]);

  useEffect(() => {
    if (error) showError('Không tải được nhật ký. Kiểm tra kết nối mạng.');
  }, [error, showError]);
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
          <div className="p-4 md:p-6 pb-24 min-h-screen bg-slate-50 pt-8">
              <div className="h-12 w-48 bg-slate-200 rounded mb-8 animate-pulse"></div>
              <div className="h-24 w-full bg-slate-200 rounded-[2.2rem] mb-8 animate-pulse"></div>
              <div className="h-[400px] w-full bg-slate-200 rounded-[2.2rem] animate-pulse"></div>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-6 pb-24 min-h-screen bg-slate-50 pt-8">
      {/* Hai hàng: logo + nút ở trên, lời chào ở dưới. Xếp cùng một hàng thì trên
          máy 375px lời chào chỉ còn ~139px và bị cắt bằng dấu ba chấm. */}
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="w-11 h-11 flex-shrink-0 animate-scale-up">
            <img
              src="https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/fashion.png"
              alt="Logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
          <button type="button" aria-label="Tìm kiếm" onClick={() => { setSearchSeed(''); setSheet('search'); }} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-500 active:scale-90 transition-all border border-slate-100">
            <Icon name="search" className="w-4 h-4" />
          </button>
          <button type="button" aria-label="Thống kê" onClick={() => setSheet('stats')} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-500 active:scale-90 transition-all border border-slate-100">
            <Icon name="chart-bar" className="w-4 h-4" />
          </button>
          <button type="button" aria-label="Tài khoản" onClick={() => setSheet('account')} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-500 active:scale-90 transition-all border border-slate-100">
            <Icon name="logout" className="w-4 h-4" />
          </button>
          <button type="button" aria-label="Cài đặt" onClick={() => setSheet('settings')} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-500 active:scale-90 transition-all border border-slate-100">
            <Icon name="settings" className="w-4 h-4" />
          </button>
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1">{timeGreeting},</h1>
        <p className="text-slate-500 font-bold text-base truncate">{greetingName} ✨</p>
      </header>

      <InstallBanner />

      <main className="animate-fade-in">
        <div className="flex items-center gap-2 mb-3 px-2">
          <Icon name="home" className="text-brand-600 w-3.5 h-3.5" />
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trang phục hôm nay</h2>
        </div>
        
        {todaysOutfits.length > 0 ? (
          <OutfitCarousel outfits={todaysOutfits} onNavigate={(id) => navigate(`/outfit/${id}`)} />
        ) : (
          <AddOutfitPrompt onAdd={() => navigate(`/add-outfit/${todayId}`)} />
        )}
        
        <RecentlyWorn
          outfitsByDate={outfitsByDate}
          onNavigate={(id) => navigate(`/outfit/${id}`)}
        />

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
      </main>

      <SearchSheet
        initialQuery={searchSeed}
        open={sheet === 'search'}
        outfits={outfitList}
        onClose={() => setSheet(null)}
        onSelect={(id) => { setSheet(null); navigate(`/outfit/${id}`); }}
      />
      <StatsSheet
        open={sheet === 'stats'}
        outfits={outfitList}
        onClose={() => setSheet(null)}
        onPickTag={(tag) => { setSearchSeed(tag); setSheet('search'); }}
      />
      <AccountSheet open={sheet === 'account'} outfits={outfitList} onClose={() => setSheet(null)} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} />
    </div>
  );
};
