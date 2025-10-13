import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { useAuth } from '../hooks/useAuth';
import { getTodayDateString } from '../utils/dateUtils';
import { getMostFrequentTags } from '../utils/outfitUtils';
import { generateOutfitSuggestion } from '../services/geminiService';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';

const OutfitDisplay: React.FC<{ outfit: Outfit }> = ({ outfit }) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
    <img src={outfit.imageUrl} alt="Today's outfit" className="w-full h-64 object-cover" />
    <div className="p-4">
      <div className="flex flex-wrap gap-2">
        {[...outfit.tops, ...outfit.bottoms, ...outfit.tags].map(tag => (
          <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>
    </div>
  </div>
);

const AddOutfitPrompt: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="bg-white rounded-xl shadow-md p-6 text-center flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      <Icon name="plus" className="w-8 h-8 text-gray-400" />
    </div>
    <p className="text-gray-500 mb-4">Bạn chưa ghi lại trang phục cho hôm nay.</p>
    <button
      onClick={onAdd}
      className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300"
    >
      Thêm trang phục hôm nay
    </button>
  </div>
);

const SignUpPrompt: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="bg-white rounded-xl shadow-md p-6 text-center mt-8 border-2 border-dashed border-blue-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Lưu lại phong cách của bạn</h3>
            <p className="text-gray-600 mb-4">Tạo tài khoản để lưu các bộ trang phục và truy cập chúng từ bất kỳ thiết bị nào.</p>
            <button
                onClick={() => navigate('/auth')}
                className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300"
            >
                Đăng ký hoặc Đăng nhập
            </button>
        </div>
    );
};


const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const OutfitFlashback: React.FC<{ outfit: Outfit }> = ({ outfit }) => {
    const navigate = useNavigate();
    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Tuần trước vào ngày này...</h2>
            <div 
                onClick={() => navigate(`/add-outfit/${outfit.id}`)}
                className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer"
            >
                <img src={outfit.imageUrl} alt="Outfit from last week" className="w-full h-56 object-cover" />
                <div className="p-4">
                     <div className="flex flex-wrap gap-2">
                        {[...outfit.tops, ...outfit.bottoms].slice(0, 3).map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{tag}</span>
                        ))}
                        {([...outfit.tops, ...outfit.bottoms].length > 3) && <span className="text-gray-500 text-xs font-semibold">...</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-3">Bạn đã mặc bộ đồ này. Nhấn để xem chi tiết.</p>
                </div>
            </div>
        </div>
    );
};

const StyleSuggestion: React.FC = () => {
  const { state } = useOutfits();
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hasEnoughOutfits = useMemo(() => Object.keys(state.outfits).length >= 3, [state.outfits]);

  const handleGetSuggestion = async () => {
    setIsLoading(true);
    setError('');
    setSuggestion('');
    try {
      const frequentTags = getMostFrequentTags(state.outfits, 10);
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
        <div className="bg-white/70 rounded-xl shadow-md p-4 text-center text-sm text-gray-500 mt-8 border border-dashed">
            Ghi lại ít nhất 3 bộ trang phục để mở khóa gợi ý phong cách cá nhân từ AI!
        </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-3">Cần thêm cảm hứng?</h2>
      <div className="bg-white rounded-xl shadow-md p-6 border-2 border-dashed border-transparent">
        {suggestion && !isLoading && (
          <p className="text-gray-700 text-center italic">"{suggestion}"</p>
        )}
        {isLoading && (
          <div className="flex justify-center items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        <div className="text-center mt-4">
            <button
              onClick={handleGetSuggestion}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center gap-2 mx-auto"
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
  const { outfits, loading, error } = state;

  const todayId = getTodayDateString();
  const todaysOutfit = outfits[todayId];

  const outfitFromLastWeek = useMemo(() => {
    if (loading || !outfits) return null;
    
    const today = new Date();
    const lastWeekDate = new Date();
    lastWeekDate.setDate(today.getDate() - 7);
    
    const year = lastWeekDate.getFullYear();
    const month = String(lastWeekDate.getMonth() + 1).padStart(2, '0');
    const day = String(lastWeekDate.getDate()).padStart(2, '0');
    
    const lastWeekId = `${year}-${month}-${day}`;
    
    return outfits[lastWeekId] || null;
  }, [outfits, loading]);

  const handleAddOutfit = () => {
    navigate(`/add-outfit/${todayId}`);
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
            todaysOutfit ? (
              <OutfitDisplay outfit={todaysOutfit} />
            ) : (
              <AddOutfitPrompt onAdd={handleAddOutfit} />
            )
        )}
        
        {!loading && !error && outfitFromLastWeek && (
          <OutfitFlashback outfit={outfitFromLastWeek} />
        )}
        
        {(!user || user.isAnonymous) && !loading && <SignUpPrompt />}
        {!loading && !error && <StyleSuggestion />}
      </main>
    </div>
  );
};