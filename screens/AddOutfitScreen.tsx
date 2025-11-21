import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { useCollections } from '../hooks/useCollections';
import { useTagSuggestions } from '../hooks/useTagSuggestions';
import { fileToBase64 } from '../utils/imageUtils';
import { generateTagsFromImage } from '../services/geminiService';
import { parseDateString, formatDate } from '../utils/dateUtils';
import { Icon } from '../components/Icon';
import { AiTags, Outfit } from '../types';
import { compressImage } from '../utils/imageCompression';

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

const CollectionsSection: React.FC<{
    selectedIds: string[];
    onToggleId: (id: string) => void;
}> = ({ selectedIds, onToggleId }) => {
    const { state } = useCollections();
    const collections = useMemo(() => Object.values(state.collections), [state.collections]);

    if (state.loading) return <p>Đang tải bộ sưu tập...</p>;
    if (collections.length === 0) {
        return <p className="text-sm text-gray-500 text-center">Bạn chưa có bộ sưu tập nào.</p>
    }

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Bộ sưu tập</h3>
            <div className="flex flex-wrap gap-2">
                {collections.map(collection => {
                    const isSelected = selectedIds.includes(collection.id);
                    return (
                        <button
                            key={collection.id}
                            onClick={() => onToggleId(collection.id)}
                            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                           {collection.name}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}


export const AddOutfitScreen: React.FC = () => {
  const navigate = useNavigate();
  const { date: dateParam, outfitId } = useParams<{ date?: string; outfitId?: string }>();
  const { state, addOrUpdateOutfit, deleteOutfit } = useOutfits();
  const { suggestions, addSuggestion } = useTagSuggestions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [id, setId] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [tops, setTops] = useState<string[]>([]);
  const [bottoms, setBottoms] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!outfitId;
  const existingOutfit = useMemo(() => {
    return isEditMode ? state.allOutfits[outfitId] : undefined;
  }, [state.allOutfits, outfitId, isEditMode]);

  const date = useMemo(() => {
    if (isEditMode && existingOutfit) return parseDateString(existingOutfit.dateId);
    if (dateParam) return parseDateString(dateParam);
    return new Date();
  }, [dateParam, existingOutfit, isEditMode]);

  useEffect(() => {
    if (isEditMode && existingOutfit) {
      setId(existingOutfit.id);
      setImages(existingOutfit.imageUrls);
      setTops(existingOutfit.tops);
      setBottoms(existingOutfit.bottoms);
      setTags(existingOutfit.tags);
      setCollectionIds(existingOutfit.collectionIds || []);
    }
  }, [existingOutfit, isEditMode]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setError(null);
      try {
        const compressedFiles = await Promise.all(
          // Fix: Explicitly type 'file' as 'File' to prevent type inference issues.
          files.map((file: File) => compressImage(file, { maxWidth: 1080, quality: 0.7 }))
        );
        setNewImageFiles(prev => [...prev, ...compressedFiles]);
      } catch (err) {
        console.error("Failed to compress images:", err);
        setError("Không thể xử lý hình ảnh. Vui lòng thử lại.");
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
    const firstImage = images[0] || (newImageFiles[0] ? URL.createObjectURL(newImageFiles[0]) : null);
    if (!firstImage) {
      setError("Vui lòng chọn một hình ảnh trước.");
      return;
    }

    let base64Image = firstImage;
    if (newImageFiles[0]) {
      base64Image = await fileToBase64(newImageFiles[0]);
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      const aiTags: AiTags = await generateTagsFromImage(base64Image);
      setTops(prev => [...new Set([...prev, ...aiTags.tops])]);
      setBottoms(prev => [...new Set([...prev, ...aiTags.bottoms])]);
      setTags(prev => [...new Set([...prev, ...aiTags.general])]);
      
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
    const dateId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (images.length === 0 && newImageFiles.length === 0) {
      setError("Vui lòng thêm ít nhất một hình ảnh.");
      return;
    }
    if (tops.length === 0 && bottoms.length === 0) {
        setError("Vui lòng thêm ít nhất một thẻ cho áo hoặc quần.");
        return;
    }

    setIsSaving(true);
    setError(null);

    const newImageBase64s = await Promise.all(newImageFiles.map(file => fileToBase64(file)));

    const outfitData = {
      id,
      date: new Date().toISOString(),
      dateId,
      newImageBase64s,
      existingImageUrls: images,
      tops,
      bottoms,
      tags,
      collectionIds,
    };

    try {
      await addOrUpdateOutfit(outfitData);
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
    if (!isEditMode || !existingOutfit) return;
    
    if (window.confirm("Bạn có chắc chắn muốn xóa trang phục này?")) {
        setIsDeleting(true);
        setError(null);
        try {
            await deleteOutfit(existingOutfit);
            navigate('/');
        } catch (error) {
            console.error("Error deleting outfit:", error);
            setError("Không thể xóa trang phục. Vui lòng thử lại.");
            setIsDeleting(false);
        }
    }
  };

  const addTagCallback = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, tag: string) => {
    setter(prev => [...new Set([...prev, tag.trim()])]);
  }, []);

  const removeTagCallback = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, tagToRemove: string) => {
    setter(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);
  
  const handleToggleCollectionId = useCallback((idToToggle: string) => {
    setCollectionIds(prev =>
        prev.includes(idToToggle)
            ? prev.filter(id => id !== idToToggle)
            : [...prev, idToToggle]
    );
  }, []);

  const allImages = useMemo(() => [
    ...images.map(url => ({ type: 'existing', src: url })),
    ...newImageFiles.map(file => ({ type: 'new', src: URL.createObjectURL(file) }))
  ], [images, newImageFiles]);


  if ((isEditMode && state.loading) || (!dateParam && !outfitId)) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Ngày hoặc trang phục không hợp lệ.</p>
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
        <div className="w-10"></div>
      </header>

      <main>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="grid grid-cols-3 gap-2 mb-4">
            {allImages.map(({ type, src }, index) => (
                <div key={src} className="relative group aspect-square">
                    <img src={src} alt={`Outfit image ${index + 1}`} className="w-full h-full object-cover rounded-lg shadow" />
                    <button
                        onClick={() => removeImage(type === 'existing' ? images.findIndex(s => s === src) : newImageFiles.findIndex(f => URL.createObjectURL(f) === src), type as 'existing' | 'new')}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        &times;
                    </button>
                </div>
            ))}
             <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-gray-200 rounded-lg border-2 border-dashed border-gray-400 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
            >
                <Icon name="plus" className="w-8 h-8 text-gray-500" />
                <p className="text-xs text-gray-500 mt-1">Thêm ảnh</p>
            </div>
        </div>

        <button
          onClick={handleGenerateTags}
          disabled={allImages.length === 0 || isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-5 rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {isGenerating ? (
            <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Đang phân tích...</span></>
          ) : (
            <><Icon name="sparkles" className="w-5 h-5" /><span>Tạo thẻ bằng AI (từ ảnh đầu tiên)</span></>
          )}
        </button>
        
        {error && <p className="bg-red-100 text-red-700 text-center p-3 rounded-lg mb-4 text-sm">{error}</p>}
        
        <div className="bg-white p-4 rounded-lg shadow-md">
            <TagInputSection title="Áo" tags={tops} suggestions={suggestions.tops} onAddTag={(tag) => addTagCallback(setTops, tag)} onRemoveTag={(tag) => removeTagCallback(setTops, tag)} onSuggestionClick={(tag) => addTagCallback(setTops, tag)} />
            <TagInputSection title="Quần" tags={bottoms} suggestions={suggestions.bottoms} onAddTag={(tag) => addTagCallback(setBottoms, tag)} onRemoveTag={(tag) => removeTagCallback(setBottoms, tag)} onSuggestionClick={(tag) => addTagCallback(setBottoms, tag)} />
            <TagInputSection title="Thẻ chung" tags={tags} suggestions={suggestions.tags} onAddTag={(tag) => addTagCallback(setTags, tag)} onRemoveTag={(tag) => removeTagCallback(setTags, tag)} onSuggestionClick={(tag) => addTagCallback(setTags, tag)} />
            <CollectionsSection selectedIds={collectionIds} onToggleId={handleToggleCollectionId} />
        </div>
        
        <div className="mt-8 flex items-center gap-4">
          <button onClick={handleSave} disabled={isSaving || isDeleting} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-300">
            {isSaving ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Lưu trang phục')}
          </button>
          {isEditMode && (
            <button onClick={handleDelete} disabled={isSaving || isDeleting} className="bg-red-100 text-red-600 font-bold py-3 px-5 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50">
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
