
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Outfit } from '../types';
import { getOutfits, addOrUpdateOutfit as addOrUpdateOutfitService, deleteOutfit as deleteOutfitService } from '../services/firebaseService';
import { useAuth } from './useAuth';

interface OutfitState {
  outfitsByDate: Record<string, Outfit[]>; // Key is dateId 'YYYY-MM-DD'
  allOutfits: Record<string, Outfit>; // Key is unique outfit ID
  loading: boolean;
  error: Error | null;
}

const OutfitContext = createContext<{
  state: OutfitState;
  addOrUpdateOutfit: (outfitData: Omit<Outfit, 'imageUrls'> & { newImageBase64s: string[], existingImageUrls: string[] }) => Promise<void>;
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
    const fetchOutfits = async () => {
      if (!user) {
        setState({ outfitsByDate: {}, allOutfits: {}, loading: false, error: null }); // Clear data on logout
        return;
      }

      setState(prevState => ({ ...prevState, loading: true }));
      try {
        const outfitsData = await getOutfits(user.uid);
        const outfitsByDate: Record<string, Outfit[]> = {};
        const allOutfits: Record<string, Outfit> = {};

        outfitsData.forEach(outfit => {
            allOutfits[outfit.id] = outfit;
            if (!outfitsByDate[outfit.dateId]) {
                outfitsByDate[outfit.dateId] = [];
            }
            outfitsByDate[outfit.dateId].push(outfit);
        });

        // Sort outfits within each day by date (newest first)
        for (const dateId in outfitsByDate) {
            outfitsByDate[dateId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        setState({ outfitsByDate, allOutfits, loading: false, error: null });
      } catch (e) {
        console.error("Failed to fetch outfits:", e);
        setState({ outfitsByDate: {}, allOutfits: {}, loading: false, error: e as Error });
      }
    };

    fetchOutfits();
  }, [user]);

  const addOrUpdateOutfit = useCallback(async (outfitData: Omit<Outfit, 'imageUrls'> & { newImageBase64s: string[], existingImageUrls: string[] }) => {
    if (!user) throw new Error("Cannot add/update outfit: User not authenticated");

    try {
      const savedOutfit = await addOrUpdateOutfitService(user.uid, outfitData);
      
      setState(prevState => {
        const newAllOutfits = { ...prevState.allOutfits, [savedOutfit.id]: savedOutfit };
        
        const newOutfitsByDate = { ...prevState.outfitsByDate };
        const dateId = savedOutfit.dateId;
        
        const outfitsForDay = newOutfitsByDate[dateId] ? [...newOutfitsByDate[dateId]] : [];
        const existingIndex = outfitsForDay.findIndex(o => o.id === savedOutfit.id);

        if (existingIndex > -1) {
            outfitsForDay[existingIndex] = savedOutfit; // Update
        } else {
            outfitsForDay.push(savedOutfit); // Add
        }
        
        outfitsForDay.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        newOutfitsByDate[dateId] = outfitsForDay;
        
        return {
          ...prevState,
          error: null,
          allOutfits: newAllOutfits,
          outfitsByDate: newOutfitsByDate,
        };
      });
    } catch (error) {
      console.error("Failed to save outfit in hook:", error);
      setState(prevState => ({ ...prevState, error: error as Error }));
      throw error;
    }
  }, [user]);

  const deleteOutfit = useCallback(async (outfit: Outfit) => {
    if (!user) throw new Error("Cannot delete outfit: User not authenticated");

    const { id, dateId } = outfit;
    const previousState = state;

    // Optimistic UI update
    setState(prevState => {
        const newAllOutfits = { ...prevState.allOutfits };
        delete newAllOutfits[id];
        
        const newOutfitsByDate = { ...prevState.outfitsByDate };
        if (newOutfitsByDate[dateId]) {
            newOutfitsByDate[dateId] = newOutfitsByDate[dateId].filter(o => o.id !== id);
            if(newOutfitsByDate[dateId].length === 0) {
                delete newOutfitsByDate[dateId];
            }
        }
        return { ...prevState, allOutfits: newAllOutfits, outfitsByDate: newOutfitsByDate, error: null };
    });

    try {
      await deleteOutfitService(user.uid, id);
    } catch (error) {
      console.error("Failed to delete outfit in hook:", error);
      setState(previousState); // Revert on failure
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
  if (context === undefined) {
    throw new Error('useOutfits must be used within an OutfitProvider');
  }
  return context;
};
