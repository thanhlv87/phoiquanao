
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { useTagSuggestions } from '../hooks/useTagSuggestions';
import { generateTagsFromImage } from '../services/geminiService';
import { fetchLocalWeather } from '../services/weatherService';
import { parseDateString, formatDate, getTodayDateString } from '../utils/dateUtils';
import { Icon } from '../components/Icon';
import { AiTags, Outfit } from '../types';
import { compressImage } from '../utils/imageCompression';

// --- Modal Component ---
const DeleteConfirmModal: React.FC<{ 
    onClose: () => void; 
    onConfirm: () => void;
}> = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-xs p-8 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon name="trash" className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-serif text-charcoal text-center mb-2">Xóa nhật ký này?</h3>
                <p className="text-gray-500 text-sm text-center mb-8 font-medium">Bản ghi trang phục ngày này sẽ bị xóa vĩnh viễn.</p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onConfirm}
                        className="w-full bg-red-500 text-white font-bold py-4 rounded-full shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        XÓA NGAY
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-full active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        BỎ QUA
                    </button>
                </div>
            </div>
        </div>
    );
};

const TagInputSection: React.FC<{
  title: string;
  tags: string[];
  suggestions: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onSuggestionClick: (tag: string) => void;
}> = ({ title, tags, suggestions, onAddTag, onRemoveTag, onSuggestionClick }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !tags.find(t => t.toLowerCase() === inputValue.trim().toLowerCase())) {
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const filteredSuggestions = suggestions.filter(s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">{title}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map(tag => (
          <div key={tag} className="flex items-center bg-sage-50 text-sage-800 text-sm font-medium pl-3 pr-2 py-1.5 rounded-full border border-sage-100">
            <span>{tag}</span>
            <button onClick={() => onRemoveTag(tag)} className="ml-2 text-sage-400 hover:text-sage-600">
              &times;
            </button>
          </div>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Thêm thẻ ${title.toLowerCase()}...`}
          className="w-full pl-4 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500 transition-all font-medium text-charcoal"
        />
        <button onClick={handleAdd} className="absolute right-2 top-1/2 -translate-y-1/2 bg-sage-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-sage-700">Thêm</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {filteredSuggestions.slice(0, 5).map(suggestion => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="bg-white border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            + {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export const AddOutfitScreen: React.FC = () => {
  const navigate = useNavigate();
  const { date: dateParam, outfitId } = useParams<{ date?: string; outfitId?: string }>();
  const { state, addOrUpdateOutfit, deleteOutfit } = useOutfits();
  const { suggestions, addSuggestion } = useTagSuggestions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [id, setId] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<string[]>([]);
  const [tops, setTops] = useState<string[]>([]);
  const [bottoms, setBottoms] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  
  const [workingDate, setWorkingDate] = useState<Date>(new Date());
  const [temp, setTemp] = useState<number | undefined>(undefined);
  const [condition, setCondition] = useState<string | undefined>(undefined);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isEditMode = !!outfitId;
  const existingOutfit = useMemo(() => {
    return isEditMode ? state.allOutfits[outfitId] : undefined;
  }, [state.allOutfits, outfitId, isEditMode]);

  useEffect(() => {
    if (isEditMode && existingOutfit) {
      setId(existingOutfit.id);
      setImages(existingOutfit.imageUrls);
      setTops(existingOutfit.tops);
      setBottoms(existingOutfit.bottoms);
      setTags(existingOutfit.tags);
      setTemp(existingOutfit.temperature);
      setCondition(existingOutfit.weatherCondition);
      setWorkingDate(new Date(existingOutfit.date));
    } else if (dateParam) {
      const initialDate = parseDateString(dateParam);
      initialDate.setHours(12, 0, 0, 0);
      setWorkingDate(initialDate);
      
      const todayStr = getTodayDateString();
      if (dateParam === todayStr) {
        fetchLocalWeather().then(weather => {
          if (weather) {
            setTemp(weather.temp);
            setCondition(weather.condition);
          }
        });
      }
    }
  }, [existingOutfit, isEditMode, dateParam]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      setError(null);
      
      const firstFile = files[0];
      if (firstFile.lastModified && !isEditMode) {
          const captureTime = new Date(firstFile.lastModified);
          setWorkingDate(captureTime);
      }

      try {
        const compressedFiles = await Promise.all(
          files.map((file: File) => compressImage(file, { maxWidth: 1080, quality: 0.7 }))
        );
        setNewImageFiles(prev => [...prev, ...compressedFiles]);
      } catch (err) {
        console.error("Failed to compress images:", err);
        setError("Không thể xử lý hình ảnh.");
      }
    }
  };

  const removeImage = (index: number, type: 'existing' | 'new') => {
    if (type === 'existing') {
        setImages(prev => prev.filter((_, i) => i !== index));
    } else {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleGenerateTags = async () => {
    const firstImage = images[0] || newImageFiles[0] || null;
    if (!firstImage) {
      setError("Vui lòng chọn hình ảnh trước.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const aiTags: AiTags = await generateTagsFromImage(firstImage);
      setTops(prev => [...new Set([...prev, ...aiTags.tops])]);
      setBottoms(prev => [...new Set([...prev, ...aiTags.bottoms])]);
      setTags(prev => [...new Set([...prev, ...aiTags.general])]);
      
      aiTags.tops.forEach(t => addSuggestion('tops', t));
      aiTags.bottoms.forEach(t => addSuggestion('bottoms', t));
      aiTags.general.forEach(t => addSuggestion('tags', t));

    } catch (error) {
      console.error("Error generating tags:", error);
      setError("AI đang bận. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    const dateId = `${workingDate.getFullYear()}-${String(workingDate.getMonth() + 1).padStart(2, '0')}-${String(workingDate.getDate()).padStart(2, '0')}`;
    
    if (images.length === 0 && newImageFiles.length === 0) {
      setError("Vui lòng thêm hình ảnh.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const outfitData = {
      id,
      date: workingDate.toISOString(), 
      dateId,
      newImageFiles,
      existingImageUrls: images,
      tops,
      bottoms,
      tags,
      temperature: temp,
      weatherCondition: condition
    };

    addOrUpdateOutfit(outfitData).catch(err => {
        console.error("Background save failed:", err);
    });

    [...tops].forEach(t => addSuggestion('tops', t));
    [...bottoms].forEach(t => addSuggestion('bottoms', t));
    [...tags].forEach(t => addSuggestion('tags', t));

    navigate('/');
  };
  
  const handleDeleteClick = () => {
    if (!isEditMode || !existingOutfit) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!isEditMode || !existingOutfit) return;
    setIsDeleting(true);
    setError(null);
    try {
        await deleteOutfit(existingOutfit);
        navigate('/');
    } catch (error) {
        console.error("Error deleting outfit:", error);
        setError("Lỗi khi xóa.");
        setIsDeleting(false);
        setShowDeleteModal(false);
    }
  };

  const addTagCallback = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, tag: string) => {
    setter(prev => [...new Set([...prev, tag.trim()])]);
  }, []);

  const removeTagCallback = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, tagToRemove: string) => {
    setter(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const allImages = useMemo(() => [
    ...images.map(url => ({ type: 'existing', src: url })),
    ...newImageFiles.map(fileStr => ({ type: 'new', src: fileStr }))
  ], [images, newImageFiles]);

  return (
    <div className="p-4 md:p-6 pb-20 bg-cream-50 min-h-screen">
      {showDeleteModal && (
          <DeleteConfirmModal 
              onClose={() => setShowDeleteModal(false)} 
              onConfirm={confirmDelete} 
          />
      )}

      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-full bg-white shadow-sm hover:shadow-md transition-all">
          <Icon name="back" className="w-5 h-5 text-charcoal" />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-serif text-charcoal">{formatDate(workingDate)}</h1>
            <p className="text-[10px] font-bold text-sage-600 uppercase tracking-widest mt-1">
                {workingDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                {temp !== undefined ? ` • ${temp}°C` : ''}
                {condition ? ` • ${condition}` : ''}
            </p>
        </div>
        <div className="w-10"></div>
      </header>

      <main>
        <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageChange} className="hidden" />

        <div className="grid grid-cols-3 gap-3 mb-8">
            {allImages.map(({ type, src }, index) => (
                <div key={index} className="relative group aspect-[4/5] overflow-hidden rounded-2xl shadow-sm border border-white">
                    <img src={src} alt="Outfit" className="w-full h-full object-cover" />
                    <button
                        onClick={() => removeImage(type === 'existing' ? images.findIndex(s => s === src) : newImageFiles.findIndex(f => f === src), type as 'existing' | 'new')}
                        className="absolute top-1 right-1 bg-charcoal text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg opacity-80 hover:opacity-100"
                    >
                        &times;
                    </button>
                </div>
            ))}
             <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/5] bg-white rounded-2xl border border-dashed border-sage-300 flex flex-col items-center justify-center cursor-pointer hover:bg-sage-50 transition-colors group"
            >
                <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Icon name="plus" className="w-5 h-5 text-sage-500" />
                </div>
                <span className="text-[9px] font-bold text-sage-400 uppercase tracking-widest">Thêm ảnh</span>
            </div>
        </div>

        <button
          onClick={handleGenerateTags}
          disabled={allImages.length === 0 || isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-white border border-sage-200 text-sage-600 font-bold py-4 px-5 rounded-full shadow-sm hover:shadow-md hover:bg-sage-50 transition-all disabled:opacity-50 mb-8"
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sage-600"></div>
          ) : (
            <><Icon name="sparkles" className="w-5 h-5" /><span>DÙNG AI PHÂN TÍCH</span></>
          )}
        </button>
        
        {error && <p className="bg-red-50 text-red-500 text-center p-3 rounded-xl mb-6 text-xs font-bold uppercase tracking-wide border border-red-100">{error}</p>}
        
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100/50 mb-8">
            <TagInputSection title="Áo" tags={tops} suggestions={suggestions.tops} onAddTag={(tag) => addTagCallback(setTops, tag)} onRemoveTag={(tag) => removeTagCallback(setTops, tag)} onSuggestionClick={(tag) => addTagCallback(setTops, tag)} />
            <TagInputSection title="Quần/Váy" tags={bottoms} suggestions={suggestions.bottoms} onAddTag={(tag) => addTagCallback(setBottoms, tag)} onRemoveTag={(tag) => removeTagCallback(setBottoms, tag)} onSuggestionClick={(tag) => addTagCallback(setBottoms, tag)} />
            <TagInputSection title="Phong cách" tags={tags} suggestions={suggestions.tags} onAddTag={(tag) => addTagCallback(setTags, tag)} onRemoveTag={(tag) => removeTagCallback(setTags, tag)} onSuggestionClick={(tag) => addTagCallback(setTags, tag)} />
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={isSaving || isDeleting} className="flex-1 bg-charcoal text-white font-bold py-5 rounded-full shadow-xl hover:bg-black active:scale-95 transition-all uppercase text-xs tracking-[0.2em]">
            {isSaving ? 'ĐANG LƯU...' : 'LƯU LẠI'}
          </button>
          {isEditMode && (
            <button onClick={handleDeleteClick} disabled={isSaving || isDeleting} className="w-14 h-14 bg-white text-red-500 rounded-full flex items-center justify-center shadow-md border border-gray-100 active:scale-95 transition-all">
              <Icon name="trash" className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
