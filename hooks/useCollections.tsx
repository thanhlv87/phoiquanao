import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Collection } from '../types';
import {
    getCollections as getCollectionsService,
    addCollection as addCollectionService,
    deleteCollection as deleteCollectionService
} from '../services/firebaseService';
import { cacheCollections, getCachedCollections } from '../services/cacheService';
import { useAuth } from './useAuth';

interface CollectionState {
  collections: Record<string, Collection>; // Key is collection ID
  loading: boolean;
  error: Error | null;
}

const CollectionContext = createContext<{
  state: CollectionState;
  addCollection: (name: string, description: string) => Promise<void>;
  deleteCollection: (collectionId: string) => Promise<void>;
} | undefined>(undefined);

export const CollectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<CollectionState>({
    collections: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchCollections = async () => {
      if (!user) {
        setState({ collections: {}, loading: false, error: null });
        return;
      }

      setState(prevState => ({ ...prevState, loading: true }));
      try {
        // Load from cache first
        const cachedCollections = await getCachedCollections(user.uid);
        if (cachedCollections.length > 0) {
          const collections: Record<string, Collection> = {};
          cachedCollections.forEach(c => {
            collections[c.id] = c;
          });
          setState({ collections, loading: false, error: null });
        }

        // Fetch fresh data
        const collectionsData = await getCollectionsService(user.uid);
        const collections: Record<string, Collection> = {};
        collectionsData.forEach(c => {
          collections[c.id] = c;
        });
        setState({ collections, loading: false, error: null });

        // Update cache
        await cacheCollections(user.uid, collectionsData);
      } catch (e) {
        console.error("Failed to fetch collections:", e);
        setState(prevState => ({ ...prevState, loading: false, error: e as Error }));
      }
    };

    fetchCollections();
  }, [user]);

  const addCollection = useCallback(async (name: string, description: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const newCollection = await addCollectionService(user.uid, { name, description });
      setState(prevState => ({
        ...prevState,
        collections: {
          ...prevState.collections,
          [newCollection.id]: newCollection,
        },
      }));
    } catch (error) {
      console.error("Failed to add collection in hook:", error);
      throw error;
    }
  }, [user]);

  const deleteCollection = useCallback(async (collectionId: string) => {
    if (!user) throw new Error("User not authenticated");

    const previousCollections = state.collections;

    // Optimistic update
    setState(prevState => {
        const newCollections = { ...prevState.collections };
        delete newCollections[collectionId];
        return { ...prevState, collections: newCollections };
    });

    try {
      await deleteCollectionService(user.uid, collectionId);
    } catch (error) {
      console.error("Failed to delete collection in hook:", error);
      setState(prevState => ({ ...prevState, collections: previousCollections })); // Revert on fail
      throw error;
    }
  }, [user, state.collections]);


  return (
    <CollectionContext.Provider value={{ state, addCollection, deleteCollection }}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollections = () => {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollections must be used within an CollectionProvider');
  }
  return context;
};
