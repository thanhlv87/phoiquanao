
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutfits } from '../hooks/useOutfits';
import { useTagSuggestions } from '../hooks/useTagSuggestions';
import { useCollections } from '../hooks/useCollections';
import { parseDateString, formatDate } from '../utils/dateUtils';
import { Icon } from '../components/Icon';
import { compressImage } from '../utils/imageCompression';

// --- Modal Component ---
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
                <h3 className="text-xl font-black text-slate-800 text-center mb-2 uppercase tracking-tight">Xóa nhật ký này?</h3>
                <p className="text-slate-500 text-sm text-center mb-8 font-medium">Bản ghi trang phục ngày này sẽ bị xóa vĩnh viễn.</p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={onConfirm}
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
          <div key={tag} className="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium pl-3 pr-2 py-1 rounded-full">
            <span>{tag}</span>
            <button onClick={() => onRemoveTag(tag)} className="ml-2 text-indigo-500 hover:text-indigo-700">
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
          className="w-full pl-3 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={handleAdd} className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-indigo-700">Thêm</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {filteredSuggestions.slice(0, 5).map(suggestion => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full hover:bg-slate-200"
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
  const { state: collectionState } = useCollections();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [id, setId] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<string[]>([]);
  const [tops, setTops] = useState<string[]>([]);
  const [bottoms, setBottoms] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    // Chưa tải xong danh sách outfit thì chưa có gì để đổ vào form.
    if (!isEditMode || !existingOutfit) return;
    setId(existingOutfit.id);
    setImages(existingOutfit.imageUrls);
    setTops(existingOutfit.tops);
    setBottoms(existingOutfit.bottoms);
    setTags(existingOutfit.tags);
    setCollectionIds(existingOutfit.collectionIds || []);
  }, [existingOutfit, isEditMode]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setError(null);
      try {
        const compressedFiles = await Promise.all(
          files.map((file: File) => compressImage(file, { maxWidth: 1080, quality: 0.7, maxBytes: 250 * 1024 }))
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

  const toggleCollection = (collectionId: string) => {
    setCollectionIds(prev =>
      prev.includes(collectionId)
        ? prev.filter(cid => cid !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleSave = async () => {
    const dateId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (images.length === 0 && newImageFiles.length === 0) {
      setError("Vui lòng thêm hình ảnh.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const outfitData = {
      id,
      // Giữ nguyên thời điểm ghi ban đầu khi sửa, nếu không mỗi lần sửa một bộ
      // đồ cũ sẽ đẩy nó lên hiện tại và làm sai thứ tự lẫn thống kê.
      date: existingOutfit?.date || new Date().toISOString(),
      dateId,
      newImageFiles,
      existingImageUrls: images,
      // Ảnh người dùng đã gỡ khỏi form: xóa khỏi Storage sau khi lưu xong.
      removedImageUrls: (existingOutfit?.imageUrls || []).filter(url => !images.includes(url)),
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
      setError("Không thể lưu. Vui lòng thử lại.");
      setIsSaving(false);
    }
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
    ...images.map((url, index) => ({ type: 'existing' as const, src: url, index })),
    ...newImageFiles.map((fileStr, index) => ({ type: 'new' as const, src: fileStr, index }))
  ], [images, newImageFiles]);

  const allCollections = useMemo(
    () => Object.values(collectionState.collections),
    [collectionState.collections]
  );

  // Mở thẳng /outfit/:id (F5 hoặc deep link) khi danh sách outfit chưa tải xong
  // thì form rỗng và `id` vẫn là chuỗi rỗng -> bấm Lưu sẽ tạo bản ghi MỚI thay vì
  // sửa. Chặn render form cho tới khi biết chắc outfit có tồn tại hay không.
  if (isEditMode && !existingOutfit && !isDeleting) {
    if (state.loading) {
      return (
        <div className="p-4 md:p-6 min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      );
    }
    return (
      <div className="p-4 md:p-6 min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center">
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-6">Không tìm thấy trang phục này</p>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase text-[10px] tracking-widest"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 bg-slate-50 min-h-screen">
      {showDeleteModal && (
          <DeleteConfirmModal 
              onClose={() => setShowDeleteModal(false)} 
              onConfirm={confirmDelete} 
          />
      )}

      <header className="flex items-center justify-between mb-6">
        <button type="button" aria-label="Quay lại" onClick={() => navigate(-1)} className="p-2 rounded-2xl bg-white shadow-sm border border-slate-100 active:scale-90 transition-all">
          <Icon name="back" className="w-5 h-5 text-slate-700" />
        </button>
        <div className="text-center">
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{formatDate(date)}</h1>
        </div>
        <div className="w-10"></div>
      </header>

      <main>
        <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageChange} className="hidden" />

        <div className="grid grid-cols-3 gap-3 mb-6">
            {allImages.map(({ type, src, index }) => (
                <div key={`${type}-${index}`} className="relative group aspect-square">
                    <img src={src} alt="Outfit" className="w-full h-full object-cover rounded-2xl shadow-sm border border-white" />
                    <button
                        type="button"
                        aria-label="Xóa ảnh này"
                        onClick={() => removeImage(index, type)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg"
                    >
                        &times;
                    </button>
                </div>
            ))}
             <button
                type="button"
                aria-label="Thêm ảnh trang phục"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
            >
                <Icon name="plus" className="w-6 h-6 text-slate-400" />
            </button>
        </div>

        {error && <p className="bg-red-50 text-red-500 text-center p-3 rounded-xl mb-6 text-xs font-bold uppercase">{error}</p>}

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <TagInputSection title="Áo" tags={tops} suggestions={suggestions.tops} onAddTag={(tag) => addTagCallback(setTops, tag)} onRemoveTag={(tag) => removeTagCallback(setTops, tag)} onSuggestionClick={(tag) => addTagCallback(setTops, tag)} />
            <TagInputSection title="Quần" tags={bottoms} suggestions={suggestions.bottoms} onAddTag={(tag) => addTagCallback(setBottoms, tag)} onRemoveTag={(tag) => removeTagCallback(setBottoms, tag)} onSuggestionClick={(tag) => addTagCallback(setBottoms, tag)} />
            <TagInputSection title="Tags chung" tags={tags} suggestions={suggestions.tags} onAddTag={(tag) => addTagCallback(setTags, tag)} onRemoveTag={(tag) => removeTagCallback(setTags, tag)} onSuggestionClick={(tag) => addTagCallback(setTags, tag)} />

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Bộ sưu tập</h3>
              {allCollections.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium">
                  Chưa có bộ sưu tập nào. Tạo ở tab Bộ sưu tập rồi quay lại đây để gán.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allCollections.map(collection => {
                    const selected = collectionIds.includes(collection.id);
                    return (
                      <button
                        key={collection.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleCollection(collection.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                          selected
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {collection.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button onClick={handleSave} disabled={isSaving || isDeleting} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all">
            {isSaving ? 'ĐANG LƯU...' : 'LƯU TRANG PHỤC'}
          </button>
          {isEditMode && (
            <button type="button" aria-label="Xóa nhật ký này" onClick={handleDeleteClick} disabled={isSaving || isDeleting} className="bg-slate-100 text-red-500 font-black py-4 px-6 rounded-2xl active:scale-95 transition-all">
              <Icon name="trash" className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
