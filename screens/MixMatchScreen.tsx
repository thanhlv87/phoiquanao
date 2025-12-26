
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { generateMixImage, suggestComboFromWardrobe } from '../services/geminiService';
import { useMixes } from '../hooks/useMixes';
import { useAuth } from '../hooks/useAuth';
import { MixResult, WardrobeItem } from '../types';
import { getDefaultModel, saveDefaultModel, getWardrobe } from '../services/firebaseService';
import { compressImage } from '../utils/imageCompression';

const DeleteConfirmModal: React.FC<{ 
    onClose: () => void; 
    onConfirm: () => void;
}> = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-xs p-8 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon name="trash" className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 text-center mb-2 uppercase tracking-tight">Xóa ảnh này?</h3>
                <p className="text-slate-500 text-sm text-center mb-8 font-medium">Ảnh phối đồ sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onConfirm}
                        className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
                    >
                        XÓA NGAY
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                    >
                        BỎ QUA
                    </button>
                </div>
            </div>
        </div>
    );
};

const ClosetPicker: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    items: WardrobeItem[]; 
    onSelect: (item: WardrobeItem) => void;
    category: string;
}> = ({ isOpen, onClose, items, onSelect, category }) => {
    if (!isOpen) return null;
    
    // Lọc đồ theo loại: Áo (top), Quần/Váy/Đầm (bottom/skirt/dress), hoặc Giày/Phụ kiện
    const filteredItems = items.filter(i => {
        if (category === 'top') return i.category === 'top';
        if (category === 'bottom') return ['bottom', 'skirt', 'dress'].includes(i.category);
        return i.category === category;
    });

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full rounded-t-[40px] max-h-[80vh] overflow-y-auto p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Icon name="closet" className="text-indigo-600" />
                    {category === 'top' ? 'Chọn Áo' : 'Chọn Quần/Váy'}
                </h3>
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 font-black uppercase text-[10px] tracking-widest leading-loose">
                        Tủ đồ chưa có món này.<br/>Hãy thêm vào mục Tủ Đồ.
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {filteredItems.map(item => (
                            <div key={item.id} onClick={() => { onSelect(item); onClose(); }} className="aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all cursor-pointer relative p-2 flex items-center justify-center">
                                <img src={item.imageUrl} className="w-full h-full object-contain" alt="item" />
                            </div>
                        ))}
                    </div>
                )}
                <button onClick={onClose} className="w-full mt-8 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest">Đóng</button>
            </div>
        </div>
    );
};

export const MixMatchScreen: React.FC = () => {
    const { state: mixState, addMix, deleteMix } = useMixes();
    const { user } = useAuth();
    
    const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
    const [modelImage, setModelImage] = useState<string | null>(null);
    const [topImage, setTopImage] = useState<string | null>(null);
    const [bottomImage, setBottomImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [stylistReason, setStylistReason] = useState<string | null>(null);
    const [pickerConfig, setPickerConfig] = useState<{ isOpen: boolean, category: 'top' | 'bottom' }>({ isOpen: false, category: 'top' });
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mixToDelete, setMixToDelete] = useState<MixResult | null>(null);

    const modelInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            getWardrobe(user.uid).then(setWardrobe);
            getDefaultModel(user.uid).then(url => url && setModelImage(url));
        }
    }, [user]);

    const handleModelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        
        setIsGenerating(true);
        setErrorMsg(null);
        try {
            const compressedBase64 = await compressImage(file, { maxWidth: 800, quality: 0.7 });
            setModelImage(compressedBase64);
            await saveDefaultModel(user.uid, compressedBase64);
        } catch (error) {
            console.error("Model image error:", error);
            setErrorMsg("Lỗi khi xử lý ảnh người mẫu.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerate = async () => {
        if (!modelImage || !topImage || !bottomImage) return;

        setIsGenerating(true);
        setErrorMsg(null);
        try {
            const res = await generateMixImage(modelImage, topImage, bottomImage);
            setResultImage(res);
            if (user) {
                await addMix(modelImage, topImage, bottomImage, res);
            }
        } catch (e: any) { 
            console.error(e);
            setErrorMsg(e.message || "Không thể tạo ảnh phối đồ."); 
        } finally { 
            setIsGenerating(false); 
        }
    };

    const handleSmartSuggest = async (type: string) => {
        if (!user || wardrobe.length < 2) {
            alert("Cần ít nhất 1 áo và 1 quần trong tủ đồ!");
            return;
        }
        setIsGenerating(true);
        setErrorMsg(null);
        try {
            const suggestion = await suggestComboFromWardrobe(wardrobe, type);
            const top = wardrobe.find(w => w.id === suggestion.topId);
            const bottom = wardrobe.find(w => w.id === suggestion.bottomId);
            if (top && bottom) {
                setTopImage(top.imageUrl);
                setBottomImage(bottom.imageUrl);
                setStylistReason(suggestion.reason);
            }
        } catch (e) { console.error(e); }
        finally { setIsGenerating(false); }
    };

    const executeDeleteMix = async () => {
        if (!mixToDelete) return;
        try {
            await deleteMix(mixToDelete.id, mixToDelete.resultImageUrl);
            setMixToDelete(null);
        } catch (e) {
            console.error(e);
            setErrorMsg("Không thể xóa ảnh. Vui lòng thử lại.");
        }
    };

    const handleHistoryClick = (mix: MixResult) => {
        setModelImage(mix.modelImageUrl);
        setTopImage(mix.topImageUrl);
        setBottomImage(mix.bottomImageUrl);
        setResultImage(mix.resultImageUrl);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    return (
        <div className="p-4 md:p-6 pb-24 bg-slate-50 min-h-screen">
            <ClosetPicker 
                isOpen={pickerConfig.isOpen} 
                onClose={() => setPickerConfig({ ...pickerConfig, isOpen: false })} 
                category={pickerConfig.category}
                items={wardrobe}
                onSelect={(item) => pickerConfig.category === 'top' ? setTopImage(item.imageUrl) : setBottomImage(item.imageUrl)}
            />

            {mixToDelete && (
                <DeleteConfirmModal 
                    onClose={() => setMixToDelete(null)} 
                    onConfirm={executeDeleteMix} 
                />
            )}
            
            <input type="file" ref={modelInputRef} onChange={handleModelChange} className="hidden" accept="image/*" />

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase italic">AI Stylist</h1>
                <p className="text-slate-500 font-semibold text-xs uppercase">Mặc thử trang phục Vision</p>
            </header>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => handleSmartSuggest("Đi chơi cuối tuần")} className="whitespace-nowrap bg-white border border-slate-200 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-700 shadow-sm">🎲 Ngẫu hứng</button>
                <button onClick={() => handleSmartSuggest("Phong cách thanh lịch đi làm")} className="whitespace-nowrap bg-white border border-slate-200 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-700 shadow-sm">💼 Công sở</button>
            </div>

            {stylistReason && (
                <div className="bg-indigo-600 p-5 rounded-[2rem] mb-10 shadow-xl animate-scale-up">
                    <p className="text-white text-[11px] font-medium italic leading-relaxed">"{stylistReason}"</p>
                </div>
            )}
            
            {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6 flex items-start gap-3">
                    <Icon name="trash" className="text-red-500 w-5 h-5 flex-shrink-0" />
                    <p className="text-red-600 text-xs font-bold">{errorMsg}</p>
                </div>
            )}

            <div className="grid grid-cols-3 gap-5 mb-10">
                <div className="flex flex-col gap-3">
                    <div onClick={() => modelInputRef.current?.click()} className="w-full aspect-[3/4] rounded-[2rem] border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden relative shadow-inner">
                        {modelImage ? (
                            <img src={modelImage} className="w-full h-full object-cover" alt="model" />
                        ) : (
                            <Icon name="camera" className="text-slate-300 w-8 h-8" />
                        )}
                    </div>
                    <span className="text-[9px] font-black uppercase text-center text-slate-400">Người mẫu</span>
                </div>

                <div className="flex flex-col gap-3">
                    <div onClick={() => setPickerConfig({ isOpen: true, category: 'top' })} className="w-full aspect-[3/4] rounded-[2rem] border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden shadow-inner p-2">
                        {topImage ? <img src={topImage} className="w-full h-full object-contain" alt="top" /> : <Icon name="plus" className="text-slate-300 w-8 h-8" />}
                    </div>
                    <span className="text-[9px] font-black uppercase text-center text-slate-400">Áo</span>
                </div>

                <div className="flex flex-col gap-3">
                    <div onClick={() => setPickerConfig({ isOpen: true, category: 'bottom' })} className="w-full aspect-[3/4] rounded-[2rem] border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden shadow-inner p-2">
                        {bottomImage ? <img src={bottomImage} className="w-full h-full object-contain" alt="bottom" /> : <Icon name="plus" className="text-slate-300 w-8 h-8" />}
                    </div>
                    <span className="text-[9px] font-black uppercase text-center text-slate-400">Quần/Váy</span>
                </div>
            </div>

            <button 
                onClick={handleGenerate} 
                disabled={isGenerating || !modelImage || !topImage || !bottomImage} 
                className={`w-full font-bold py-6 rounded-[2.5rem] shadow-2xl transition-all uppercase tracking-widest text-xs ${isGenerating ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white active:scale-95'}`}
            >
                {isGenerating ? "AI ĐANG THỬ ĐỒ..." : "BẮT ĐẦU PHỐI ĐỒ"}
            </button>

            {resultImage && (
                <div className="mt-16 bg-white p-6 rounded-[3rem] shadow-2xl border border-slate-100 animate-fade-in mb-10">
                    <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] text-center">Kết quả phối đồ</h3>
                    <div className="rounded-[2.5rem] overflow-hidden bg-slate-50 border-8 border-white shadow-inner">
                        <img src={resultImage} className="w-full h-auto" alt="Mix result" />
                    </div>
                </div>
            )}

            {mixState.mixes.length > 0 && (
                <div className="mt-12">
                     <div className="flex items-center gap-2 mb-6 px-2">
                        <Icon name="mix" className="text-slate-400 w-4 h-4" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lịch sử phối đồ</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {mixState.mixes.map(mix => (
                            <div key={mix.id} className="group relative bg-white p-2.5 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                                <div onClick={() => handleHistoryClick(mix)} className="aspect-[3/4] bg-slate-50 rounded-[1.5rem] overflow-hidden cursor-pointer">
                                    <img src={mix.resultImageUrl} className="w-full h-full object-cover" alt="History" />
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setMixToDelete(mix); }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <Icon name="trash" className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
