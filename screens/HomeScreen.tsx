
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { useAuth } from '../hooks/useAuth';
import { getTodayDateString } from '../utils/dateUtils';
import { getMostFrequentTags } from '../utils/outfitUtils';
import { generateOutfitSuggestion } from '../services/geminiService';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';

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
    
    if (outfits.length === 1) {
      const outfit = outfits[0];
       return (
        <div onClick={() => onNavigate(outfit.id)} className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-glow-lg cursor-pointer">
          <img src={outfit.imageUrls[0]} alt="Outfit" className="w-full aspect-square object-cover" />
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {[...outfit.tops, ...outfit.bottoms, ...outfit.tags].slice(0, 4).map(tag => (
                <span key={tag} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
        <div className="relative">
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex space-x-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
                {outfits.map((outfit) => (
                    <div key={outfit.id} onClick={() => onNavigate(outfit.id)} className="snap-start flex-shrink-0 w-[80%] md:w-[45%] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-glow-lg cursor-pointer">
                        <img src={outfit.imageUrls[0]} alt="Outfit" className="w-full aspect-square object-cover" />
                        <div className="p-3">
                            <div className="flex flex-wrap gap-1">
                                {[...outfit.tops, ...outfit.bottoms].slice(0, 3).map(tag => (
                                    <span key={tag} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {showLeftArrow && (
                <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-xl rounded-full p-2 shadow-lg z-10 hover:bg-white transition-all duration-300 hover:scale-110">
                    <Icon name="chevron-left" className="w-6 h-6 text-purple-600" />
                </button>
            )}
            {showRightArrow && (
                <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-xl rounded-full p-2 shadow-lg z-10 hover:bg-white transition-all duration-300 hover:scale-110">
                    <Icon name="chevron-right" className="w-6 h-6 text-purple-600" />
                </button>
            )}
        </div>
    );
};

const AddOutfitPrompt: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-center flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-purple-200">
    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mb-4">
      <Icon name="plus" className="w-8 h-8 text-purple-500" />
    </div>
    <p className="text-gray-600 mb-4">Bạn chưa ghi lại trang phục cho hôm nay.</p>
    <button
      onClick={onAdd}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-glow-lg transition-all duration-300 transform hover:scale-105"
    >
      Thêm trang phục hôm nay
    </button>
  </div>
);

const SignUpPrompt: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-center mt-8 border-2 border-dashed border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Lưu lại phong cách của bạn</h3>
            <p className="text-gray-600 mb-4">Tạo tài khoản để lưu các bộ trang phục và truy cập chúng từ bất kỳ thiết bị nào.</p>
            <button
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-glow-lg transition-all duration-300 transform hover:scale-105"
            >
                Đăng ký hoặc Đăng nhập
            </button>
        </div>
    );
};


const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
      <h2 className="text-xl font-semibold text-gray-700 mb-3">{title}</h2>
      {outfits.length > 0 ? (
        <OutfitCarousel outfits={outfits} onNavigate={onNavigate} />
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-md p-4 text-center text-sm text-gray-500 border border-dashed border-purple-200">
          <p>{fallbackMessage}</p>
        </div>
      )}
    </div>
  );
};

const StyleSuggestion: React.FC = () => {
  const { state } = useOutfits();
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hasEnoughOutfits = useMemo(() => Object.keys(state.allOutfits).length >= 3, [state.allOutfits]);

  const handleGetSuggestion = async () => {
    setIsLoading(true);
    setError('');
    setSuggestion('');
    try {
      const frequentTags = getMostFrequentTags(Object.values(state.allOutfits), 10);
      if(frequentTags.length === 0) {
        frequentTags.push('casual', 'comfortable');
      }
      const result = await generateOutfitSuggestion(frequentTags);
      setSuggestion(result);
    } catch (e) {
      setError('Không thể nhận được gợi ý. Vui lòng thử lại.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasEnoughOutfits) {
    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-md p-4 text-center text-sm text-gray-500 mt-8 border border-dashed border-purple-200">
            Ghi lại ít nhất 3 bộ trang phục để mở khóa gợi ý phong cách cá nhân từ AI!
        </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-3">Cần thêm cảm hứng?</h2>
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border-2 border-dashed border-transparent">
        {suggestion && !isLoading && (
          <p className="text-gray-700 text-center italic">"{suggestion}"</p>
        )}
        {isLoading && (
          <div className="flex justify-center items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        )}
        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="text-center mt-4">
            <button
              onClick={handleGetSuggestion}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2 mx-auto transform hover:scale-105"
            >
              <Icon name="sparkles" className="w-5 h-5" />
              <span>{suggestion ? 'Nhận ý tưởng khác' : 'Nhận gợi ý phong cách'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};


export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useOutfits();
  const { user, logout } = useAuth();
  const { outfitsByDate, loading, error } = state;

  const todayId = getTodayDateString();
  const todaysOutfits = outfitsByDate[todayId] || [];

  const outfitsFromLastWeek = useMemo(() => {
    if (loading || !outfitsByDate) return [];
    
    const today = new Date();
    const lastWeekDate = new Date();
    lastWeekDate.setDate(today.getDate() - 7);
    
    const year = lastWeekDate.getFullYear();
    const month = String(lastWeekDate.getMonth() + 1).padStart(2, '0');
    const day = String(lastWeekDate.getDate()).padStart(2, '0');
    
    const lastWeekId = `${year}-${month}-${day}`;
    
    return outfitsByDate[lastWeekId] || [];
  }, [outfitsByDate, loading]);

  const outfitsFromLastMonth = useMemo(() => {
    if (loading || !outfitsByDate) return [];
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    
    const year = lastMonthDate.getFullYear();
    const month = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
    const day = String(lastMonthDate.getDate()).padStart(2, '0');
    
    const lastMonthId = `${year}-${month}-${day}`;
    return outfitsByDate[lastMonthId] || [];
  }, [outfitsByDate, loading]);

  const outfitsFromLastYear = useMemo(() => {
    if (loading || !outfitsByDate) return [];
    const lastYearDate = new Date();
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);

    const year = lastYearDate.getFullYear();
    const month = String(lastYearDate.getMonth() + 1).padStart(2, '0');
    const day = String(lastYearDate.getDate()).padStart(2, '0');
    
    const lastYearId = `${year}-${month}-${day}`;
    return outfitsByDate[lastYearId] || [];
  }, [outfitsByDate, loading]);

  const handleAddOutfit = () => {
    navigate(`/add-outfit/${todayId}`);
  };
  
  const handleEditOutfit = (outfitId: string) => {
    navigate(`/outfit/${outfitId}`);
  };

  const greetingName = user && !user.isAnonymous ? (user.displayName?.split(' ')[0] || user.email) : '';

  return (
    <div className="p-4 md:p-6 pb-20">
      <header className="mb-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Chào buổi sáng{greetingName ? `, ${greetingName}` : ''}</h1>
                <p className="text-gray-500">Hôm nay bạn mặc gì?</p>
            </div>
            {user && !user.isAnonymous && (
                 <button
                    onClick={logout}
                    className="flex items-center gap-2 text-gray-600 font-semibold p-2 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Đăng xuất"
                 >
                    <Icon name="logout" className="w-6 h-6" />
                </button>
            )}
        </div>
      </header>
      <main>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Trang phục hôm nay</h2>
        {loading && <LoadingSpinner />}
        {error && <p className="text-red-500 text-center">Không thể tải trang phục. Vui lòng thử lại sau.</p>}
        {!loading && !error && (
            todaysOutfits.length > 0 ? (
              <OutfitCarousel outfits={todaysOutfits} onNavigate={handleEditOutfit} />
            ) : (
              <AddOutfitPrompt onAdd={handleAddOutfit} />
            )
        )}
        
        {!loading && !error && (
          <>
            <FlashbackSection
                title="Tuần trước vào ngày này..."
                outfits={outfitsFromLastWeek}
                fallbackMessage="Chưa có dữ liệu cho tuần trước. Hãy tiếp tục ghi lại để xem lại nhé!"
                onNavigate={handleEditOutfit}
            />
            <FlashbackSection
                title="Tháng trước vào ngày này..."
                outfits={outfitsFromLastMonth}
                fallbackMessage="Tháng trước bạn chưa ghi lại gì vào ngày này. Cùng tạo ký ức cho tháng sau nhé!"
                onNavigate={handleEditOutfit}
            />
            <FlashbackSection
                title="Năm trước vào ngày này..."
                outfits={outfitsFromLastYear}
                fallbackMessage="Một năm trôi qua nhanh thật! Hãy bắt đầu lưu lại những khoảnh khắc thời trang của bạn từ hôm nay."
                onNavigate={handleEditOutfit}
            />
          </>
        )}
        
        {(!user || user.isAnonymous) && !loading && <SignUpPrompt />}
        {!loading && !error && <StyleSuggestion />}
      </main>
    </div>
  );
};
