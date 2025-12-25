import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { fileToBase64 } from '../utils/imageUtils';
import { compressImage } from '../utils/imageCompression';
import { generateCoordinatedImage } from '../services/geminiService';
import { saveModelCoordinate, getModelCoordinates, uploadBase64Image } from '../services/firebaseService';
import { ModelCoordinate } from '../types';

export const ModelCoordinationScreen: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [modelImage, setModelImage] = useState<File | null>(null);
    const [topImage, setTopImage] = useState<File | null>(null);
    const [bottomImage, setBottomImage] = useState<File | null>(null);

    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [topPreview, setTopPreview] = useState<string | null>(null);
    const [bottomPreview, setBottomPreview] = useState<string | null>(null);

    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<ModelCoordinate[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const modelInputRef = useRef<HTMLInputElement>(null);
    const topInputRef = useRef<HTMLInputElement>(null);
    const bottomInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        if (!user) return;
        try {
            const data = await getModelCoordinates(user.uid);
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'model' | 'top' | 'bottom') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const compressed = await compressImage(file, { maxWidth: 1080, quality: 0.8 });
                const preview = URL.createObjectURL(compressed);

                if (type === 'model') {
                    setModelImage(compressed);
                    setModelPreview(preview);
                } else if (type === 'top') {
                    setTopImage(compressed);
                    setTopPreview(preview);
                } else {
                    setBottomImage(compressed);
                    setBottomPreview(preview);
                }
            } catch (err) {
                setError("Không thể xử lý hình ảnh.");
            }
        }
    };

    const handleGenerate = async () => {
        if (!modelImage || !topImage || !bottomImage) {
            setError("Vui lòng chọn đầy đủ 3 hình ảnh.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResultImage(null);

        try {
            const modelBase64 = await fileToBase64(modelImage);
            const topBase64 = await fileToBase64(topImage);
            const bottomBase64 = await fileToBase64(bottomImage);

            const result = await generateCoordinatedImage(modelBase64, topBase64, bottomBase64);
            setResultImage(result);
        } catch (err) {
            console.error("Coordination failed:", err);
            setError("Không thể phối đồ bằng AI. Vui lòng thử lại.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!user || !resultImage || !modelImage || !topImage || !bottomImage) return;

        setIsSaving(true);
        try {
            // 1. Upload all images to Storage to get permanent URLs
            const modelUrl = await uploadBase64Image(user.uid, 'models', await fileToBase64(modelImage));
            const topUrl = await uploadBase64Image(user.uid, 'tops', await fileToBase64(topImage));
            const bottomUrl = await uploadBase64Image(user.uid, 'bottoms', await fileToBase64(bottomImage));
            const resultUrl = await uploadBase64Image(user.uid, 'results', resultImage);

            // 2. Save metadata to Firestore
            const newCoord: Omit<ModelCoordinate, 'id'> = {
                userId: user.uid,
                modelImageUrl: modelUrl,
                topImageUrl: topUrl,
                bottomImageUrl: bottomUrl,
                resultImageUrl: resultUrl,
                createdAt: new Date().toISOString(),
            };

            const saved = await saveModelCoordinate(user.uid, newCoord);
            setHistory([saved, ...history]);
            setResultImage(null);
            setModelPreview(null);
            setTopPreview(null);
            setBottomPreview(null);
            setModelImage(null);
            setTopImage(null);
            setBottomImage(null);
            alert("Đã lưu thành công!");
        } catch (err) {
            console.error("Save failed:", err);
            setError("Không thể lưu kết quả.");
        } finally {
            setIsSaving(false);
        }
    };

    const ImageSelector = ({ label, preview, onClick, type }: { label: string, preview: string | null, onClick: () => void, type: 'model' | 'top' | 'bottom' }) => (
        <div className="flex flex-col items-center gap-2">
            <div
                onClick={onClick}
                className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${preview ? 'border-purple-500 bg-white' : 'border-gray-300 bg-gray-50 hover:bg-purple-50 hover:border-purple-300'}`}
            >
                {preview ? (
                    <img src={preview} alt={label} className="w-full h-full object-cover" />
                ) : (
                    <>
                        <Icon name={type === 'model' ? 'person' : 'plus'} className="w-8 h-8 text-gray-400 mb-1" />
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            <header className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
                    <Icon name="back" className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Phối đồ bằng AI</h1>
            </header>

            <main className="max-w-lg mx-auto">
                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/20 mb-8">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <input type="file" hidden ref={modelInputRef} onChange={(e) => handleImageChange(e, 'model')} accept="image/*" />
                        <input type="file" hidden ref={topInputRef} onChange={(e) => handleImageChange(e, 'top')} accept="image/*" />
                        <input type="file" hidden ref={bottomInputRef} onChange={(e) => handleImageChange(e, 'bottom')} accept="image/*" />

                        <ImageSelector label="Người mẫu" preview={modelPreview} onClick={() => modelInputRef.current?.click()} type="model" />
                        <ImageSelector label="Áo" preview={topPreview} onClick={() => topInputRef.current?.click()} type="top" />
                        <ImageSelector label="Quần" preview={bottomPreview} onClick={() => bottomInputRef.current?.click()} type="bottom" />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !modelImage || !topImage || !bottomImage}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-4 transform hover:scale-[1.02]"
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Đang xử lý...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Icon name="sparkles" className="w-5 h-5" />
                                Phối đồ bằng AI
                            </span>
                        )}
                    </button>

                    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                    {resultImage && (
                        <div className="mt-6 animate-in fade-in zoom-in duration-500">
                            <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">Kết quả dự kiến</h3>
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white mb-4">
                                <img src={resultImage} alt="Result" className="w-full aspect-[3/4] object-cover" />
                                {isGenerating && (
                                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <div className="animate-pulse text-purple-600 font-bold">Đang cập nhật...</div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                            >
                                {isSaving ? 'Đang lưu...' : 'Lưu kết quả & Hình ảnh'}
                            </button>
                        </div>
                    )}
                </div>

                <section className="mb-20">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Icon name="calendar" className="w-5 h-5 text-purple-500" />
                        Lịch sử phối đồ
                    </h2>
                    {isLoadingHistory ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                            <Icon name="person" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">Chưa có dữ liệu phối đồ.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {history.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 group hover:shadow-xl transition-all duration-300">
                                    <div className="aspect-[3/4] relative">
                                        <img src={item.resultImageUrl} alt="Coordinated" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                            <span className="text-white text-[10px] font-medium">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};
