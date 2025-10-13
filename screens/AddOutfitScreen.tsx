
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { useTagSuggestions } from '../hooks/useTagSuggestions';
import { fileToBase64 } from '../utils/imageUtils';
import { generateTagsFromImage } from '../services/geminiService';
import { parseDateString, formatDate } from '../utils/dateUtils';
import { Icon } from '../components/Icon';
import { AiTags } from '../types';

// A reusable component for handling tag inputs
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
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map(tag => (
          <div key={tag} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium pl-3 pr-2 py-1 rounded-full">
            <span>{tag}</span>
            <button onClick={() => onRemoveTag(tag)} className="ml-2 text-blue-500 hover:text-blue-700">
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
          className="w-full pl-3 pr-16 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleAdd} className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-blue-700">Thêm</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {filteredSuggestions.slice(0, 5).map(suggestion => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-gray-300"
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
  const { date: dateParam } = useParams<{ date: string }>();
  const { state: outfitState, addOutfit, deleteOutfit } = useOutfits();
  const { suggestions, addSuggestion } = useTagSuggestions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [tops, setTops] = useState<string[]>([]);
  const [bottoms, setBottoms] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingOutfit = useMemo(() => {
    return dateParam ? outfitState.outfits[dateParam] : undefined;
  }, [outfitState.outfits, dateParam]);
  
  const date = useMemo(() => {
    return dateParam ? parseDateString(dateParam) : new Date();
  }, [dateParam]);

  useEffect(() => {
    if (existingOutfit) {
      setImageBase64(existingOutfit.imageUrl);
      setTops(existingOutfit.tops);
      setBottoms(existingOutfit.bottoms);
      setTags(existingOutfit.tags);
    }
  }, [existingOutfit]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setImageBase64(base64);
      } catch (error) {
        console.error("Error converting file to base64:", error);
        setError("Không thể tải ảnh lên. Vui lòng thử lại.");
      }
    }
  };

  const handleGenerateTags = async () => {
    if (!imageBase64) {
      setError("Vui lòng chọn một hình ảnh trước.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const aiTags: AiTags = await generateTagsFromImage(imageBase64);
      setTops(prev => [...new Set([...prev, ...aiTags.tops])]);
      setBottoms(prev => [...new Set([...prev, ...aiTags.bottoms])]);
      setTags(prev => [...new Set([...prev, ...aiTags.general])]);
      
      // Also add them to persistent suggestions
      aiTags.tops.forEach(t => addSuggestion('tops', t));
      aiTags.bottoms.forEach(t => addSuggestion('bottoms', t));
      aiTags.general.forEach(t => addSuggestion('tags', t));

    } catch (error) {
      console.error("Error generating tags:", error);
      setError("Không thể tạo thẻ AI. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!imageBase64 || !dateParam) {
      setError("Vui lòng thêm một hình ảnh.");
      return;
    }
    if (tops.length === 0 && bottoms.length === 0) {
        setError("Vui lòng thêm ít nhất một thẻ cho áo hoặc quần.");
        return;
    }

    setIsSaving(true);
    setError(null);

    const outfitData = {
      id: dateParam,
      date: date.toISOString(),
      imageBase64: imageBase64, // This will be either the new base64 or the old imageUrl
      tops,
      bottoms,
      tags
    };

    try {
      await addOutfit(outfitData);
      // Persist any newly added tags
      [...tops].forEach(t => addSuggestion('tops', t));
      [...bottoms].forEach(t => addSuggestion('bottoms', t));
      [...tags].forEach(t => addSuggestion('tags', t));
      navigate('/');
    } catch (error) {
      console.error("Error saving outfit:", error);
      setError("Không thể lưu trang phục. Vui lòng thử lại.");
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!dateParam || !existingOutfit) return;
    
    if (window.confirm("Bạn có chắc chắn muốn xóa trang phục này?")) {
        setIsDeleting(true);
        setError(null);
        try {
            await deleteOutfit(dateParam);
            navigate('/');
        } catch (error) {
            console.error("Error deleting outfit:", error);
            setError("Không thể xóa trang phục. Vui lòng thử lại.");
            setIsDeleting(false);
        }
    }
  };

  // Generic tag handlers
  const addTag = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, tag: string) => {
    setter(prev => [...new Set([...prev, tag.trim()])]);
  }, []);

  const removeTag = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, tagToRemove: string) => {
    setter(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);


  if (!dateParam) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Ngày không hợp lệ.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600">Trở về Trang chủ</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 bg-slate-50 min-h-screen">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
          <Icon name="back" className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{formatDate(date)}</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {imageBase64 ? (
          <div className="relative mb-4 group">
            <img src={imageBase64} alt="Outfit preview" className="w-full rounded-xl shadow-lg object-cover aspect-[3/4]" />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl"
            >
              <Icon name="camera" className="w-10 h-10 text-white mb-2" />
              <span className="text-white font-semibold">Thay đổi ảnh</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mb-4 w-full aspect-[3/4] bg-gray-200 rounded-xl border-2 border-dashed border-gray-400 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
          >
            <Icon name="camera" className="w-12 h-12 text-gray-500 mb-2" />
            <p className="text-gray-600 font-semibold">Thêm ảnh trang phục</p>
            <p className="text-xs text-gray-500">Nhấn để chọn ảnh</p>
          </div>
        )}

        <button
          onClick={handleGenerateTags}
          disabled={!imageBase64 || isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-5 rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Đang phân tích...</span>
            </>
          ) : (
            <>
              <Icon name="sparkles" className="w-5 h-5" />
              <span>Tạo thẻ bằng AI</span>
            </>
          )}
        </button>
        
        {error && <p className="bg-red-100 text-red-700 text-center p-3 rounded-lg mb-4 text-sm">{error}</p>}
        
        <div className="bg-white p-4 rounded-lg shadow-md">
            <TagInputSection
                title="Áo"
                tags={tops}
                suggestions={suggestions.tops}
                onAddTag={(tag) => addTag(setTops, tag)}
                onRemoveTag={(tag) => removeTag(setTops, tag)}
                onSuggestionClick={(tag) => addTag(setTops, tag)}
            />
            <TagInputSection
                title="Quần"
                tags={bottoms}
                suggestions={suggestions.bottoms}
                onAddTag={(tag) => addTag(setBottoms, tag)}
                onRemoveTag={(tag) => removeTag(setBottoms, tag)}
                onSuggestionClick={(tag) => addTag(setBottoms, tag)}
            />
            <TagInputSection
                title="Thẻ chung"
                tags={tags}
                suggestions={suggestions.tags}
                onAddTag={(tag) => addTag(setTags, tag)}
                onRemoveTag={(tag) => removeTag(setTags, tag)}
                onSuggestionClick={(tag) => addTag(setTags, tag)}
            />
        </div>
        
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu trang phục'}
          </button>
          {existingOutfit && (
            <button
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              className="bg-red-100 text-red-600 font-bold py-3 px-5 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
