
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Outfit } from '../types';
import { getOutfits, addOrUpdateOutfit as addOrUpdateOutfitService, deleteOutfit as deleteOutfitService, generateOutfitId } from '../services/firebaseService';
import { useAuth } from './useAuth';

interface OutfitState {
  outfitsByDate: Record<string, Outfit[]>;
  allOutfits: Record<string, Outfit>;
  loading: boolean;
  error: Error | null;
}

const OutfitContext = createContext<{
  state: OutfitState;
  addOrUpdateOutfit: (outfitData: Omit<Outfit, 'imageUrls'> & { newImageFiles: string[], existingImageUrls: string[] }) => Promise<void>;
  deleteOutfit: (outfit: Outfit) => Promise<void>;
} | undefined>(undefined);

export const OutfitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<OutfitState>({
    outfitsByDate: {},
    allOutfits: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchOutfits = async () => {
      if (!user) {
        if (isMounted) setState({ outfitsByDate: {}, allOutfits: {}, loading: false, error: null });
        return;
      }

      // Giữ lại state cũ nếu có (để không hiện màn hình trống khi reload)
      try {
        const outfitsData = await getOutfits(user.uid);
        if (!isMounted) return;

        const outfitsByDate: Record<string, Outfit[]> = {};
        const allOutfits: Record<string, Outfit> = {};

        outfitsData.forEach(outfit => {
            allOutfits[outfit.id] = outfit;
            if (!outfitsByDate[outfit.dateId]) {
                outfitsByDate[outfit.dateId] = [];
            }
            outfitsByDate[outfit.dateId].push(outfit);
        });

        for (const dateId in outfitsByDate) {
            outfitsByDate[dateId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        setState({ outfitsByDate, allOutfits, loading: false, error: null });
      } catch (e) {
        console.error("Failed to fetch outfits:", e);
        if (isMounted) setState(prev => ({ ...prev, loading: false, error: e as Error }));
      }
    };

    fetchOutfits();
    return () => { isMounted = false; };
  }, [user]);

  const addOrUpdateOutfit = useCallback(async (outfitData: Omit<Outfit, 'imageUrls'> & { newImageFiles: string[], existingImageUrls: string[] }) => {
    if (!user) throw new Error("Cannot add/update outfit: User not authenticated");
    
    // 1. GENERATE ID & TEMP DATA (Optimistic UI)
    const finalId = outfitData.id || generateOutfitId(user.uid);
    // Kết hợp ảnh cũ (url) và ảnh mới (base64 string) để hiển thị ngay lập tức
    const optimisticImageUrls = [...outfitData.existingImageUrls, ...outfitData.newImageFiles];
    
    const optimisticOutfit: Outfit = {
        ...outfitData,
        id: finalId,
        imageUrls: optimisticImageUrls
    };

    // 2. UPDATE STATE IMMEDIATELY
    setState(prevState => {
        const newAllOutfits = { ...prevState.allOutfits, [finalId]: optimisticOutfit };
        const newOutfitsByDate = { ...prevState.outfitsByDate };
        const dateId = optimisticOutfit.dateId;
        const outfitsForDay = newOutfitsByDate[dateId] ? [...newOutfitsByDate[dateId]] : [];
        
        const existingIndex = outfitsForDay.findIndex(o => o.id === finalId);
        if (existingIndex > -1) {
            outfitsForDay[existingIndex] = optimisticOutfit;
        } else {
            outfitsForDay.unshift(optimisticOutfit); // Add to top
        }
        
        // Sort lại cho chắc chắn
        outfitsForDay.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        newOutfitsByDate[dateId] = outfitsForDay;
        
        return { ...prevState, allOutfits: newAllOutfits, outfitsByDate: newOutfitsByDate, error: null };
    });

    // 3. SYNC TO SERVER IN BACKGROUND
    // Lưu ý: Chúng ta không 'await' ở đây để chặn UI, nhưng function này vẫn trả về Promise
    // để component có thể biết khi nào *thực sự* xong nếu cần (nhưng UI đã chuyển trang rồi).
    
    try {
        const savedOutfit = await addOrUpdateOutfitService(user.uid, { ...outfitData, id: finalId });
        
        // 4. UPDATE STATE WITH REAL SERVER DATA (Optional but good for consistency)
        // Khi upload xong, ảnh base64 sẽ được thay thế bằng URL thật từ server (nếu logic upload nằm trong service)
        // Tuy nhiên ở app này chúng ta đang lưu base64 trực tiếp vào firestore (theo code cũ),
        // nên data local và server là giống nhau. Bước này giúp đồng bộ ID hoặc các field server-side khác.
        setState(prevState => {
             const newAllOutfits = { ...prevState.allOutfits, [savedOutfit.id]: savedOutfit };
             // Cập nhật lại list nếu cần thiết, nhưng thường Optimistic data đã đủ tốt.
             return { ...prevState, allOutfits: newAllOutfits };
        });

    } catch (error) {
        console.error("Failed to save outfit in background:", error);
        // Rollback state if needed, or show error toast
        // Trong app đơn giản, ta có thể chấp nhận rủi ro nhỏ hoặc hiện thông báo lỗi sau.
        setState(prev => ({ ...prev, error: error as Error }));
        throw error;
    }
  }, [user]);

  const deleteOutfit = useCallback(async (outfit: Outfit) => {
    if (!user) throw new Error("Cannot delete outfit: User not authenticated");
    const { id, dateId } = outfit;
    
    const previousState = state;

    // Optimistic Delete
    setState(prevState => {
        const newAllOutfits = { ...prevState.allOutfits };
        delete newAllOutfits[id];
        const newOutfitsByDate = { ...prevState.outfitsByDate };
        if (newOutfitsByDate[dateId]) {
            newOutfitsByDate[dateId] = newOutfitsByDate[dateId].filter(o => o.id !== id);
            if(newOutfitsByDate[dateId].length === 0) delete newOutfitsByDate[dateId];
        }
        return { ...prevState, allOutfits: newAllOutfits, outfitsByDate: newOutfitsByDate, error: null };
    });

    try {
      await deleteOutfitService(user.uid, id);
    } catch (error) {
      // Revert if failed
      setState(previousState);
      throw error;
    }
  }, [user, state]);

  return (
    <OutfitContext.Provider value={{ state, addOrUpdateOutfit, deleteOutfit }}>
      {children}
    </OutfitContext.Provider>
  );
};

export const useOutfits = () => {
  const context = useContext(OutfitContext);
  if (context === undefined) throw new Error('useOutfits must be used within an OutfitProvider');
  return context;
};
