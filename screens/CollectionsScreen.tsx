
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '../hooks/useCollections';
import { useOutfits } from '../hooks/useOutfits';
import { Icon } from '../components/Icon';
import { Outfit } from '../types';

const AddCollectionModal: React.FC<{
    onClose: () => void;
    onAdd: (name: string, description: string) => Promise<void>;
}> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await onAdd(name, description);
            onClose();
        } catch (error) {
            console.error("Failed to add collection", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Tạo bộ sưu tập mới</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Tên bộ sưu tập (ví dụ: 'Đồ đi làm')"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <textarea
                                placeholder="Mô tả (tùy chọn)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Hủy</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                            {isSaving ? 'Đang tạo...' : 'Tạo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const CollectionsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { state: collectionState, addCollection } = useCollections();
    const { state: outfitState } = useOutfits();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const collections = useMemo(() => Object.values(collectionState.collections), [collectionState.collections]);
    
    const outfitsByCollectionId = useMemo(() => {
        const map = new Map<string, number>();
        // Fix: Explicitly type 'outfit' as 'Outfit' to resolve 'unknown' type error.
        (Object.values(outfitState.allOutfits) as Outfit[]).forEach((outfit: Outfit) => {
            (outfit.collectionIds || []).forEach(collectionId => {
                map.set(collectionId, (map.get(collectionId) || 0) + 1);
            });
        });
        return map;
    }, [outfitState.allOutfits]);
    
    const handleCollectionClick = (id: string) => {
        navigate(`/collection/${id}`);
    };

    if (collectionState.loading || outfitState.loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-6 pb-20">
            {isModalOpen && <AddCollectionModal onClose={() => setIsModalOpen(false)} onAdd={addCollection} />}

            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Bộ sưu tập</h1>
                    <p className="text-gray-500">Tổ chức các trang phục của bạn.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    <Icon name="plus" className="w-5 h-5"/>
                    <span>Tạo mới</span>
                </button>
            </header>

            <main>
                {collections.length === 0 ? (
                    <div className="text-center text-gray-500 pt-16">
                        <Icon name="collections" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="font-semibold">Bắt đầu tạo bộ sưu tập đầu tiên của bạn</p>
                        <p className="text-sm">Nhóm các trang phục theo phong cách, sự kiện, hoặc mùa.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {collections.map(collection => {
                             const outfitCount = outfitsByCollectionId.get(collection.id) || 0;
                             // Fix: Explicitly type 'o' as 'Outfit' to resolve 'unknown' type error.
                             const firstOutfit = (Object.values(outfitState.allOutfits) as Outfit[]).find((o: Outfit) => o.collectionIds?.includes(collection.id));
                             const coverImage = firstOutfit ? firstOutfit.imageUrls[0] : "https://placehold.co/400x400/e2e8f0/a0aec0?text=...";

                            return (
                                <div 
                                    key={collection.id} 
                                    onClick={() => handleCollectionClick(collection.id)}
                                    className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer group"
                                >
                                    <div className="aspect-square w-full bg-gray-100 overflow-hidden relative">
                                        <img 
                                            src={coverImage}
                                            alt={collection.name} 
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-2 left-3 text-white">
                                            <h3 className="font-bold text-lg leading-tight drop-shadow-md">{collection.name}</h3>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white">
                                         <p className="text-sm text-gray-600">{outfitCount} trang phục</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};
