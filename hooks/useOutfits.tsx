
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Outfit } from '../types';
import {
  subscribeOutfits,
  addOrUpdateOutfit as addOrUpdateOutfitService,
  deleteOutfit as deleteOutfitService,
  OutfitInput,
} from '../services/firebaseService';
import { useAuth } from './useAuth';

interface OutfitState {
  outfitsByDate: Record<string, Outfit[]>;
  allOutfits: Record<string, Outfit>;
  loading: boolean;
  error: Error | null;
}

const emptyState: OutfitState = { outfitsByDate: {}, allOutfits: {}, loading: false, error: null };

const index = (outfits: Outfit[]): Pick<OutfitState, 'outfitsByDate' | 'allOutfits'> => {
  const outfitsByDate: Record<string, Outfit[]> = {};
  const allOutfits: Record<string, Outfit> = {};

  outfits.forEach(outfit => {
    allOutfits[outfit.id] = outfit;
    (outfitsByDate[outfit.dateId] ||= []).push(outfit);
  });

  for (const dateId in outfitsByDate) {
    outfitsByDate[dateId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return { outfitsByDate, allOutfits };
};

const OutfitContext = createContext<{
  state: OutfitState;
  addOrUpdateOutfit: (outfitData: OutfitInput) => Promise<void>;
  deleteOutfit: (outfit: Outfit) => Promise<void>;
} | undefined>(undefined);

export const OutfitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<OutfitState>({ ...emptyState, loading: true });

  useEffect(() => {
    if (!user) {
      setState(emptyState);
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    // subscribeOutfits phải await dynamic import, nên có thể trả về sau khi effect
    // đã bị dọn (đổi tài khoản, unmount). Cờ này tránh rò subscription.
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    subscribeOutfits(
      user.uid,
      outfits => {
        if (!cancelled) setState({ ...index(outfits), loading: false, error: null });
      },
      error => {
        if (!cancelled) setState(prev => ({ ...prev, loading: false, error }));
      }
    ).then(fn => {
      if (cancelled) fn();
      else unsubscribe = fn;
    }).catch(error => {
      if (!cancelled) setState(prev => ({ ...prev, loading: false, error: error as Error }));
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);

  // onSnapshot tự phát lại sau mỗi lần ghi, nên không cần cập nhật state thủ công.
  // Firestore còn phát ngay từ cache trước khi server xác nhận, tức là đã có sẵn
  // hiệu ứng optimistic mà không phải tự dựng.
  const addOrUpdateOutfit = useCallback(async (outfitData: OutfitInput) => {
    if (!user) throw new Error("Cannot add/update outfit: User not authenticated");
    await addOrUpdateOutfitService(user.uid, outfitData);
  }, [user]);

  const deleteOutfit = useCallback(async (outfit: Outfit) => {
    if (!user) throw new Error("Cannot delete outfit: User not authenticated");
    await deleteOutfitService(user.uid, outfit);
  }, [user]);

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
