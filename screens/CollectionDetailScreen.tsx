
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCollections } from '../hooks/useCollections';
import { useOutfits } from '../hooks/useOutfits';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';

export const CollectionDetailScreen: React.FC = () => {
    const { collectionId } = useParams<{ collectionId: string }>();
    const navigate = useNavigate();

    const { state: collectionState } = useCollections();
    const { state: outfitState } = useOutfits();

    const collection = useMemo(() => {
        if (!collectionId) return null;
        return collectionState.collections[collectionId];
    }, [collectionId, collectionState.collections]);

    const outfitsInCollection = useMemo(() => {
        if (!collectionId) return [];
        // Fix: Explicitly type parameters in filter and sort to resolve 'unknown' type errors.
        return Object.values(outfitState.allOutfits)
            .filter((outfit: Outfit) => outfit.collectionIds?.includes(collectionId))
            .sort((a: Outfit, b: Outfit) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [collectionId, outfitState.allOutfits]);

    if (collectionState.loading || outfitState.loading) {
         return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    if (!collection) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500">Không tìm thấy bộ sưu tập.</p>
                <button onClick={() => navigate('/collections')} className="mt-4 text-blue-600">Trở về</button>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 pb-20">
             <header className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 mr-2">
                    <Icon name="back" className="w-6 h-6 text-gray-700" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{collection.name}</h1>
                    {collection.description && <p className="text-gray-500">{collection.description}</p>}
                </div>
            </header>

            <main>
                {outfitsInCollection.length === 0 ? (
                    <div className="text-center text-gray-500 pt-16">
                        <p>Bộ sưu tập này chưa có trang phục nào.</p>
                        <p className="text-sm mt-1">Bạn có thể thêm trang phục vào bộ sưu tập từ màn hình chỉnh sửa trang phục.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {outfitsInCollection.map(outfit => (
                             <div 
                                key={outfit.id} 
                                onClick={() => navigate(`/outfit/${outfit.id}`)}
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
                )}
            </main>
        </div>
    )
};