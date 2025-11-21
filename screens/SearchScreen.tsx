
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';

export const SearchScreen: React.FC = () => {
    const navigate = useNavigate();
    const { state } = useOutfits();
    const { allOutfits, loading } = state;
    const [query, setQuery] = useState('');

    const outfitsArray = useMemo(() => Object.values(allOutfits), [allOutfits]);

    const filteredOutfits = useMemo(() => {
        if (!query.trim()) {
            return [];
        }
        const lowerCaseQuery = query.toLowerCase().trim();
        return outfitsArray.filter(outfit => {
            const allTags = [...outfit.tops, ...outfit.bottoms, ...outfit.tags];
            return allTags.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
        });
    }, [query, outfitsArray]);

    const handleOutfitClick = (outfitId: string) => {
        navigate(`/outfit/${outfitId}`);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (!query.trim()) {
            return (
                <div className="text-center text-gray-500 pt-16">
                    <Icon name="search" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="font-semibold">Tìm kiếm trang phục của bạn</p>
                    <p className="text-sm">Nhập từ khóa như "áo phông" hoặc "công sở".</p>
                </div>
            );
        }

        if (filteredOutfits.length === 0) {
            return (
                <div className="text-center text-gray-500 pt-16">
                     <p>Không tìm thấy trang phục nào cho "{query}"</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredOutfits.map(outfit => (
                    <div 
                        key={outfit.id} 
                        onClick={() => handleOutfitClick(outfit.id)}
                        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group"
                    >
                        <div className="aspect-square w-full overflow-hidden">
                            <img 
                                src={outfit.imageUrls[0]} 
                                alt="Outfit" 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 pb-20 min-h-screen">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Tìm kiếm</h1>
                <p className="text-gray-500">Tìm lại bộ trang phục hoàn hảo.</p>
            </header>
            
            <div className="relative mb-6">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo thẻ..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <main>
                {renderContent()}
            </main>
        </div>
    );
};
