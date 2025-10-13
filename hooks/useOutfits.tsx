import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Outfit } from '../types';
import { getOutfits, addOrUpdateOutfit as addOrUpdateOutfitService, deleteOutfit as deleteOutfitService } from '../services/firebaseService';
import { useAuth } from './useAuth';

interface OutfitState {
  outfits: Record<string, Outfit>;
  loading: boolean;
  error: Error | null;
}

const OutfitContext = createContext<{
  state: OutfitState;
  addOutfit: (outfitData: Omit<Outfit, 'imageUrl'> & { imageBase64: string }) => Promise<void>;
  deleteOutfit: (outfitId: string) => Promise<void>;
} | undefined>(undefined);

export const OutfitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<OutfitState>({
    outfits: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchOutfits = async () => {
      if (!user) {
        setState({ outfits: {}, loading: false, error: null }); // Clear data on logout
        return;
      }

      setState(prevState => ({ ...prevState, loading: true }));
      try {
        const outfitsData = await getOutfits(user.uid);
        setState({ outfits: outfitsData, loading: false, error: null });
      } catch (e) {
        console.error("Failed to fetch outfits:", e);
        setState({ outfits: {}, loading: false, error: e as Error });
      }
    };

    fetchOutfits();
  }, [user]);

  const addOutfit = useCallback(async (outfitData: Omit<Outfit, 'imageUrl'> & { imageBase64: string }) => {
    if (!user) throw new Error("Cannot add outfit: User not authenticated");

    try {
      const savedOutfit = await addOrUpdateOutfitService(user.uid, outfitData);
      setState(prevState => ({
        ...prevState,
        error: null,
        outfits: {
          ...prevState.outfits,
          [savedOutfit.id]: savedOutfit,
        },
      }));
    } catch (error) {
      console.error("Failed to save outfit in hook:", error);
      setState(prevState => ({ ...prevState, error: error as Error }));
      throw error;
    }
  }, [user]);

  const deleteOutfit = useCallback(async (outfitId: string) => {
    if (!user) throw new Error("Cannot delete outfit: User not authenticated");

    const previousOutfits = state.outfits;
    
    const newOutfits = { ...previousOutfits };
    delete newOutfits[outfitId];
    setState(prevState => ({ ...prevState, outfits: newOutfits, error: null }));

    try {
      await deleteOutfitService(user.uid, outfitId);
    } catch (error) {
      console.error("Failed to delete outfit in hook:", error);
      setState(prevState => ({ ...prevState, outfits: previousOutfits, error: error as Error }));
      throw error;
    }
  }, [user, state.outfits]);

  return (
    <OutfitContext.Provider value={{ state, addOutfit, deleteOutfit }}>
      {children}
    </OutfitContext.Provider>
  );
};

export const useOutfits = () => {
  const context = useContext(OutfitContext);
  if (context === undefined) {
    throw new Error('useOutfits must be used within an OutfitProvider');
  }
  return context;
};