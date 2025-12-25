
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { fileToBase64 } from '../utils/imageUtils';
import { generateMixImage } from '../services/geminiService';
import { useMixes } from '../hooks/useMixes';
import { useAuth } from '../hooks/useAuth';
import { compressImage } from '../utils/imageCompression';
import { MixResult } from '../types';
import { getDefaultModel, saveDefaultModel } from '../services/firebaseService';

// --- IndexedDB Helper for Local Caching ---
const DB_NAME = 'outfit_logger_db';
const STORE_NAME = 'settings';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveToLocal = async (key: string, value: string) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        return new Promise<void>((resolve, reject) => {
             tx.oncomplete = () => resolve();
             tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("IDB Save Error", e);
    }
};

const getFromLocal = async (key: string): Promise<string | undefined> => {
     try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
         return new Promise((resolve, reject) => {
             req.onsuccess = () => resolve(req.result);
             req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error("IDB Get Error", e);
        return undefined;
    }
};

const ImageUploader: React.FC<{ 
    label: string; 
    imageSrc: string | null; 
    onImageSelect: (file: File) => void;
    onRemove: () => void;
    isLoading?: boolean;
}> = ({ label, imageSrc, onImageSelect, onRemove, isLoading = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div 
                onClick={() => !isLoading && fileInputRef.current?.click()}
                className={`w-full aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden bg-white ${imageSrc ? 'border-transparent' : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'}`}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                        <span className="text-xs">Đang tải...</span>
                    </div>
                ) : imageSrc ? (
                    <>
                        <img src={imageSrc} alt={label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Icon name="camera" className="w-8 h-8 text-white" />
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </>
                ) : (
                    <>
                        <Icon name="plus" className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500 font-medium">{label}</span>
                    </>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <Icon name="trash" className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa kết quả phối đồ?</h3>
                    <p className="text-gray-500 text-sm">Hành động này không thể hoàn tác. Ảnh kết quả sẽ bị xóa vĩnh viễn khỏi lịch sử của bạn.</p>
                </div>
                <div className="flex border-t border-gray-200">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 text-red-600 font-bold hover:bg-red-50 transition-colors border-l border-gray-200"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

const urlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`Fetch failed with status: ${response.status}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn("Could not load image from URL (likely CORS issue).", error);
        return "";
    }
};

type ModelChoice = 'gemini-flash-lite-latest' | 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';

export const MixMatchScreen: React.FC = () => {
    const { state, addMix, deleteMix } = useMixes();
    const { user } = useAuth();
    
    const [selectedModel, setSelectedModel] = useState<ModelChoice>('gemini-2.5-flash-image');
    const [hasProKey, setHasProKey] = useState(false);

    const [modelImage, setModelImage] = useState<string | null>(null);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [topImage, setTopImage] = useState<string | null>(null);
    const [bottomImage, setBottomImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'failed' | 'guest' | null>(null);
    
    const [mixToDelete, setMixToDelete] = useState<MixResult | null>(null);

    useEffect(() => {
        const checkKey = async () => {
            if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasProKey(hasKey);
            }
        };
        checkKey();
    }, [selectedModel]);

    useEffect(() => {
        const loadDefaultModel = async () => {
            if (user) {
                setIsModelLoading(true);
                try {
                    const localBase64 = await getFromLocal(`defaultModel_${user.uid}`);
                    if (localBase64) {
                        setModelImage(localBase64);
                        setIsModelLoading(false);
                        return;
                    }
                } catch (e) {
                    console.warn("Failed to load from local cache", e);
                }

                const defaultUrl = await getDefaultModel(user.uid);
                if (defaultUrl) {
                    const base64 = await urlToBase64(defaultUrl);
                    if (base64) {
                        setModelImage(base64);
                        await saveToLocal(`defaultModel_${user.uid}`, base64);
                    }
                }
                setIsModelLoading(false);
            }
        };
        loadDefaultModel();
    }, [user]);

    const handleFileSelect = async (file: File, setter: (s: string | null) => void) => {
        try {
            const compressed = await compressImage(file, { maxWidth: 800, quality: 0.8 });
            const base64 = await fileToBase64(compressed);
            setter(base64);
        } catch (e) {
            console.error("Error processing image", e);
            setError("Lỗi xử lý ảnh.");
        }
    };

    const handleOpenKeyDialog = async () => {
        if (typeof window.aistudio?.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            setHasProKey(true); // Assume success per guidelines
        }
    };

    const handleGenerate = async () => {
        if (!modelImage || !topImage || !bottomImage) {
            setError("Vui lòng tải lên đủ 3 ảnh: Người mẫu, Áo và Quần/Váy.");
            return;
        }

        if (selectedModel === 'gemini-3-pro-image-preview' && !hasProKey) {
            setError("Vui lòng chọn API Key cá nhân để sử dụng Model Cao Cấp.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResultImage(null);
        setSaveStatus(null);

        let generatedImageBase64 = "";

        try {
            generatedImageBase64 = await generateMixImage(modelImage, topImage, bottomImage, selectedModel);
            setResultImage(generatedImageBase64);
        } catch (err: any) {
            console.error("Generation failed", err);
            if (err.message?.includes("Requested entity was not found")) {
                setError("Lỗi API Key. Vui lòng chọn lại Key cá nhân.");
                setHasProKey(false);
            } else {
                setError("Không thể tạo ảnh phối đồ. Hãy thử lại với Model Tiêu chuẩn.");
            }
            setIsGenerating(false);
            return;
        }

        setIsGenerating(false);

        if (generatedImageBase64) {
            if (user) {
                setSaveStatus('saving');
                try {
                    const savedMix = await addMix(modelImage, topImage, bottomImage, generatedImageBase64);
                    setSaveStatus('saved');
                    if (modelImage) {
                        await saveDefaultModel(user.uid, savedMix.modelImageUrl);
                        await saveToLocal(`defaultModel_${user.uid}`, modelImage);
                    }
                } catch (saveError) {
                    console.error("Auto-save failed", saveError);
                    setSaveStatus('failed');
                }
            } else {
                setSaveStatus('guest');
            }
        }
    };

    const confirmDelete = async () => {
        if (mixToDelete) {
            try {
                await deleteMix(mixToDelete.id, mixToDelete.resultImageUrl);
            } catch (err) {
                console.error("Delete failed", err);
            } finally {
                setMixToDelete(null);
            }
        }
    };

    return (
        <div className="p-4 md:p-6 pb-24 min-h-screen bg-slate-50">
            <DeleteConfirmationModal 
                isOpen={!!mixToDelete} 
                onClose={() => setMixToDelete(null)} 
                onConfirm={confirmDelete} 
            />

            <header className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Phối Đồ AI</h1>
                    <p className="text-gray-500">Thử trang phục ảo ngay lập tức.</p>
                </div>
            </header>

            <main>
                {/* Model Selector */}
                <div className="mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                        <button 
                            onClick={() => setSelectedModel('gemini-flash-lite-latest')}
                            className={`flex-1 min-w-[100px] py-2.5 text-[10px] font-bold rounded-lg transition-all ${selectedModel === 'gemini-flash-lite-latest' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Tiết kiệm (Lite)
                        </button>
                        <button 
                            onClick={() => setSelectedModel('gemini-2.5-flash-image')}
                            className={`flex-1 min-w-[100px] py-2.5 text-[10px] font-bold rounded-lg transition-all ${selectedModel === 'gemini-2.5-flash-image' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Tiêu chuẩn (2.5)
                        </button>
                        <button 
                            onClick={() => setSelectedModel('gemini-3-pro-image-preview')}
                            className={`flex-1 min-w-[100px] py-2.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${selectedModel === 'gemini-3-pro-image-preview' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Icon name="sparkles" className={`w-4 h-4 ${selectedModel === 'gemini-3-pro-image-preview' ? 'text-white' : 'text-yellow-500'}`} />
                            Cao cấp (3 Pro)
                        </button>
                    </div>
                    {selectedModel === 'gemini-3-pro-image-preview' && (
                        <div className="mt-3 px-2 pb-1 animate-fade-in">
                            <p className="text-[11px] text-gray-500 italic mb-2">
                                Model Cao Cấp cho chất lượng ảnh 1K siêu thực. Yêu cầu <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-purple-600 underline">Project trả phí</a>.
                            </p>
                            {!hasProKey ? (
                                <button 
                                    onClick={handleOpenKeyDialog}
                                    className="w-full py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-md border border-purple-200 hover:bg-purple-100 transition-colors"
                                >
                                    Chọn API Key cá nhân
                                </button>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div> API Key đã sẵn sàng
                                    </span>
                                    <button onClick={handleOpenKeyDialog} className="text-[10px] text-gray-400 hover:text-purple-600">Thay đổi</button>
                                </div>
                            )}
                        </div>
                    )}
                    {selectedModel === 'gemini-flash-lite-latest' && (
                        <div className="mt-2 px-2 pb-1 animate-fade-in">
                            <p className="text-[10px] text-gray-500 italic">
                                Model Lite nhẹ hơn, phù hợp để thử nghiệm nhanh và tiết kiệm tài nguyên.
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    <ImageUploader 
                        label="Người mẫu" 
                        imageSrc={modelImage} 
                        onImageSelect={(f) => handleFileSelect(f, setModelImage)} 
                        onRemove={() => setModelImage(null)}
                        isLoading={isModelLoading}
                    />
                    <ImageUploader 
                        label="Áo" 
                        imageSrc={topImage} 
                        onImageSelect={(f) => handleFileSelect(f, setTopImage)} 
                        onRemove={() => setTopImage(null)}
                    />
                    <ImageUploader 
                        label="Quần/Váy" 
                        imageSrc={bottomImage} 
                        onImageSelect={(f) => handleFileSelect(f, setBottomImage)} 
                        onRemove={() => setBottomImage(null)}
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !modelImage || !topImage || !bottomImage || (selectedModel === 'gemini-3-pro-image-preview' && !hasProKey)}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-8 ${selectedModel === 'gemini-3-pro-image-preview' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : selectedModel === 'gemini-flash-lite-latest' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'}`}
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Đang phù phép...</span>
                        </>
                    ) : (
                        <>
                            <Icon name="sparkles" className="w-5 h-5" />
                            <span>Mix Ngay ({selectedModel === 'gemini-3-pro-image-preview' ? 'Pro' : selectedModel === 'gemini-flash-lite-latest' ? 'Lite' : 'Flash'})</span>
                        </>
                    )}
                </button>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 text-center text-sm">{error}</div>}

                {resultImage && (
                    <div className="bg-white p-4 rounded-2xl shadow-xl mb-8 animate-fade-in border border-purple-100">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h2 className="text-lg font-bold text-gray-800">Kết quả</h2>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedModel === 'gemini-3-pro-image-preview' ? 'bg-purple-100 text-purple-700' : selectedModel === 'gemini-flash-lite-latest' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {selectedModel === 'gemini-3-pro-image-preview' ? '3 Pro Image' : selectedModel === 'gemini-flash-lite-latest' ? 'Flash Lite' : '2.5 Flash'}
                            </span>
                        </div>
                        <div className="aspect-[3/4] w-full rounded-xl overflow-hidden shadow-inner bg-gray-100">
                            <img src={resultImage} alt="Mix Result" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center text-xs text-gray-500 mt-2">
                            {saveStatus === 'saving' && <span className="text-blue-500">Đang lưu vào lịch sử...</span>}
                            {saveStatus === 'saved' && <span className="text-green-600">Đã lưu vào lịch sử.</span>}
                            {saveStatus === 'failed' && <span className="text-orange-500">Lưu thất bại (bạn có thể lưu ảnh thủ công).</span>}
                            {saveStatus === 'guest' && <span className="text-gray-500">Đăng nhập để lưu kết quả vào lịch sử.</span>}
                        </div>
                    </div>
                )}

                {user && state.mixes.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Lịch sử phối đồ</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {state.mixes.map(mix => (
                                <div key={mix.id} className="bg-white rounded-xl shadow overflow-hidden relative group">
                                    <img src={mix.resultImageUrl} alt="Historical Mix" className="w-full aspect-[3/4] object-cover" />
                                    <div className="p-2 flex gap-1 justify-center bg-gray-50">
                                        <img src={mix.topImageUrl} className="w-8 h-8 rounded object-cover border border-gray-200" />
                                        <img src={mix.bottomImageUrl} className="w-8 h-8 rounded object-cover border border-gray-200" />
                                    </div>
                                    <button 
                                        onClick={() => setMixToDelete(mix)}
                                        className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100"
                                        title="Xóa"
                                    >
                                        <Icon name="trash" className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
