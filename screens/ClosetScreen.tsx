
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../components/Icon';
import { getWardrobe, addToWardrobe, deleteFromWardrobe } from '../services/firebaseService';
import { analyzeWardrobeItem, isolateClothingItem } from '../services/geminiService';
import { WardrobeItem } from '../types';
import { compressImage } from '../utils/imageCompression';

// --- Types & Components cho Batch Upload ---
interface QueueItem {
    id: string;
    file: File;
    previewUrl: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    step?: string; // Ví dụ: "Đang phân tích...", "Đang tách nền..."
}

const BatchProcessingModal: React.FC<{
    queue: QueueItem[];
    onClose: () => void;
    isProcessing: boolean;
}> = ({ queue, onClose, isProcessing }) => {
    if (queue.length === 0) return null;

    const completedCount = queue.filter(q => q.status === 'completed').length;
    const errorCount = queue.filter(q => q.status === 'error').length;
    const progress = Math.round(((completedCount + errorCount) / queue.length) * 100);

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Icon name="sparkles" className="text-indigo-600 w-6 h-6" />
                        AI Đang Xử Lý ({completedCount}/{queue.length})
                    </h3>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-indigo-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {queue.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-white border border-slate-100 p-2 rounded-xl shadow-sm transition-all">
                            {/* Image Preview */}
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative">
                                <img src={item.previewUrl} className="w-full h-full object-cover" alt="preview" />
                                {item.status === 'completed' && (
                                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                                        <Icon name="check" className="text-white w-6 h-6" /> 
                                        {/* Lưu ý: Icon check chưa có trong bộ icon, dùng tạm text hoặc thêm sau */}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                                {item.status === 'error' && (
                                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                                         <span className="text-white font-bold text-xs">LỖI</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-700 truncate">{item.file.name}</p>
                                <p className={`text-[10px] font-semibold truncate ${
                                    item.status === 'processing' ? 'text-indigo-600 animate-pulse' : 
                                    item.status === 'completed' ? 'text-green-600' :
                                    item.status === 'error' ? 'text-red-500' : 'text-slate-400'
                                }`}>
                                    {item.status === 'pending' && 'Đang chờ...'}
                                    {item.status === 'processing' && (item.step || 'Đang xử lý...')}
                                    {item.status === 'completed' && 'Hoàn tất'}
                                    {item.status === 'error' && 'Thất bại'}
                                </p>
                            </div>

                            {/* Status Indicator */}
                            <div className="w-6 flex-shrink-0 flex justify-end">
                                {item.status === 'processing' && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                            isProcessing 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-indigo-600 text-white shadow-lg active:scale-95'
                        }`}
                    >
                        {isProcessing ? 'Vui lòng chờ...' : 'Đóng'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CategoryCard: React.FC<{ label: string; count: number; active: boolean; onClick: () => void; icon: string }> = ({ label, count, active, onClick, icon }) => (
    <button 
        onClick={onClick}
        className={`flex-shrink-0 w-24 p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${active ? 'border-indigo-600 bg-indigo-50 shadow-md scale-105' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
    >
        <span className="text-2xl">{icon}</span>
        <div className="text-center">
            <p className={`text-[10px] font-black uppercase tracking-tight ${active ? 'text-indigo-700' : 'text-slate-500'}`}>{label}</p>
            <p className="text-[9px] text-slate-400 font-bold">{count} MÓN</p>
        </div>
    </button>
);

const DeleteConfirmModal: React.FC<{ 
    item: WardrobeItem | null; 
    onClose: () => void; 
    onConfirm: (item: WardrobeItem) => void 
}> = ({ item, onClose, onConfirm }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-xs p-8 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon name="trash" className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 text-center mb-2 uppercase tracking-tight">Xác nhận xóa?</h3>
                <p className="text-slate-500 text-sm text-center mb-8 font-medium">Món đồ này sẽ bị xóa vĩnh viễn khỏi tủ đồ.</p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => onConfirm(item)}
                        className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
                    >
                        XÓA NGAY
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-2xl active:scale-95 transition-all"
                    >
                        BỎ QUA
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ClosetScreen: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<WardrobeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'top' | 'bottom' | 'skirt' | 'dress'>('all');
    
    // Batch Processing State
    const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    
    const [itemToDelete, setItemToDelete] = useState<WardrobeItem | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) loadWardrobe();
    }, [user]);

    const loadWardrobe = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getWardrobe(user.uid);
            setItems(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) { 
            console.error("Load closet error:", e);
        } finally { 
            setLoading(false); 
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files) as File[];
            
            // Tạo queue items
            const newQueue: QueueItem[] = files.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                previewUrl: URL.createObjectURL(file),
                status: 'pending'
            }));

            setUploadQueue(newQueue);
            processQueue(newQueue);
            
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const processQueue = async (initialQueue: QueueItem[]) => {
        if (!user) return;
        setIsProcessingBatch(true);

        // Copy queue để xử lý (tránh stale state)
        let currentQueue = [...initialQueue];

        for (let i = 0; i < currentQueue.length; i++) {
            const item = currentQueue[i];
            
            // Cập nhật trạng thái: Đang xử lý
            setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing', step: 'Đang nén ảnh...' } : q));

            try {
                // 1. Nén ảnh gốc
                const compressedInput = await compressImage(item.file, { maxWidth: 800, quality: 0.7 });

                // 2. Phân tích
                setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, step: 'AI đang phân loại...' } : q));
                const analysis = await analyzeWardrobeItem(compressedInput);
                const category = analysis.category || 'top';

                // 3. Tách nền
                setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, step: 'AI đang tách nền...' } : q));
                let finalImage = compressedInput;
                try {
                    finalImage = await isolateClothingItem(compressedInput, category);
                } catch (aiErr) {
                    console.warn("AI tách nền thất bại, dùng ảnh gốc.", aiErr);
                }

                // 4. Lưu
                setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, step: 'Đang lưu vào tủ đồ...' } : q));
                const base64ToStore = await compressImage(finalImage, { maxWidth: 600, quality: 0.6 });

                const newItem = await addToWardrobe(user.uid, {
                    category: category as any,
                    imageUrl: base64ToStore,
                    tags: analysis.tags || [],
                    color: analysis.color || 'Đang cập nhật',
                    material: analysis.material || 'Vải',
                    createdAt: new Date().toISOString()
                });

                // Cập nhật list chính
                setItems(prev => [newItem, ...prev]);
                
                // Cập nhật trạng thái: Hoàn tất
                setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'completed' } : q));

            } catch (error) {
                console.error(`Lỗi xử lý file ${item.file.name}:`, error);
                setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' } : q));
            }
        }

        setIsProcessingBatch(false);
        setActiveTab('all');
    };

    const confirmDelete = async (item: WardrobeItem) => {
        if (!user) return;
        try {
            await deleteFromWardrobe(user.uid, item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
            setItemToDelete(null);
        } catch (e) { 
            console.error(e);
            alert("Lỗi xóa món đồ.");
        }
    };

    const counts = {
        top: items.filter(i => i.category === 'top').length,
        bottom: items.filter(i => i.category === 'bottom').length,
        skirt: items.filter(i => i.category === 'skirt').length,
        dress: items.filter(i => i.category === 'dress').length,
    };

    const filteredItems = activeTab === 'all' ? items : items.filter(i => i.category === activeTab);

    return (
        <div className="p-4 md:p-6 min-h-screen bg-slate-50 flex flex-col">
            <DeleteConfirmModal 
                item={itemToDelete} 
                onClose={() => setItemToDelete(null)} 
                onConfirm={confirmDelete} 
            />

            {/* Batch Processing Modal */}
            {(uploadQueue.length > 0) && (
                <BatchProcessingModal 
                    queue={uploadQueue} 
                    isProcessing={isProcessingBatch}
                    onClose={() => setUploadQueue([])}
                />
            )}

            <header className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tủ Đồ</h1>
                    <p className="text-slate-500 font-medium text-sm">Quản lý trang phục cá nhân</p>
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingBatch}
                    className="w-14 h-14 flex items-center justify-center bg-indigo-600 text-white rounded-2xl shadow-xl active:scale-95 transition-all disabled:bg-slate-300"
                >
                    <Icon name="plus" className="w-7 h-7" />
                </button>
                {/* Thêm 'multiple' attribute để chọn nhiều ảnh */}
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />
            </header>

            <div className="flex gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                <CategoryCard label="Tất cả" count={items.length} icon="🏠" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                <CategoryCard label="Áo" count={counts.top} icon="👕" active={activeTab === 'top'} onClick={() => setActiveTab('top')} />
                <CategoryCard label="Quần" count={counts.bottom} icon="👖" active={activeTab === 'bottom'} onClick={() => setActiveTab('bottom')} />
                <CategoryCard label="Váy" count={counts.skirt} icon="👗" active={activeTab === 'skirt'} onClick={() => setActiveTab('skirt')} />
                <CategoryCard label="Đầm" count={counts.dress} icon="💃" active={activeTab === 'dress'} onClick={() => setActiveTab('dress')} />
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-50">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200 mx-2">
                    <Icon name="closet" className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-400 font-black uppercase text-[10px] text-center px-10">Tủ đồ trống. Hãy thêm món đồ đầu tiên!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-5 animate-fade-in pb-24">
                    {filteredItems.map(item => (
                        <div key={item.id} className="group relative bg-white p-2.5 rounded-[2.2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                            <div className="aspect-[3/4] rounded-[1.8rem] overflow-hidden bg-slate-50 relative flex items-center justify-center p-3">
                                <img src={item.imageUrl} className="w-full h-full object-contain" alt="Cloth" />
                                <button 
                                    onClick={() => setItemToDelete(item)} 
                                    className="absolute top-3 right-3 p-2.5 bg-white/90 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                >
                                    <Icon name="trash" className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-4 px-3 pb-2 truncate">
                                <p className="text-[9px] font-black uppercase text-indigo-600 mb-0.5">{item.color}</p>
                                <p className="text-[12px] font-bold text-slate-700 truncate">{item.tags[0] || 'Phổ thông'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
