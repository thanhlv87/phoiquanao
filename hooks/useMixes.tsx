
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { MixResult } from '../types';
import { saveMixResult, getMixResults, deleteMixResult } from '../services/firebaseService';
import { useAuth } from './useAuth';

interface MixState {
    mixes: MixResult[];
    loading: boolean;
    error: Error | null;
}

const MixContext = createContext<{
    state: MixState;
    addMix: (modelBase64: string, topBase64: string, bottomBase64: string, resultBase64: string) => Promise<MixResult>;
    deleteMix: (mixId: string, resultImageUrl: string) => Promise<void>;
} | undefined>(undefined);

export const MixProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [state, setState] = useState<MixState>({
        mixes: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        const fetchMixes = async () => {
            if (!user) {
                setState({ mixes: [], loading: false, error: null });
                return;
            }

            setState(prev => ({ ...prev, loading: true }));
            try {
                const results = await getMixResults(user.uid);
                setState({ mixes: results, loading: false, error: null });
            } catch (e) {
                console.error("Failed to fetch mixes:", e);
                setState({ mixes: [], loading: false, error: e as Error });
            }
        };

        fetchMixes();
    }, [user]);

    const addMix = useCallback(async (modelBase64: string, topBase64: string, bottomBase64: string, resultBase64: string) => {
        if (!user) throw new Error("User not authenticated");

        try {
            const newMix = await saveMixResult(user.uid, modelBase64, topBase64, bottomBase64, resultBase64);
            setState(prev => ({
                ...prev,
                mixes: [newMix, ...prev.mixes]
            }));
            return newMix;
        } catch (error) {
            console.error("Failed to save mix in hook:", error);
            throw error;
        }
    }, [user]);

    const deleteMix = useCallback(async (mixId: string, resultImageUrl: string) => {
        if (!user) throw new Error("User not authenticated");

        // Optimistic update
        const previousMixes = state.mixes;
        setState(prev => ({
            ...prev,
            mixes: prev.mixes.filter(mix => mix.id !== mixId)
        }));

        try {
            await deleteMixResult(user.uid, mixId);
        } catch (error) {
            console.error("Failed to delete mix in hook:", error);
            // Revert state if failed
            setState(prev => ({ ...prev, mixes: previousMixes, error: error as Error }));
            throw error;
        }
    }, [user, state.mixes]);

    return (
        <MixContext.Provider value={{ state, addMix, deleteMix }}>
            {children}
        </MixContext.Provider>
    );
};

export const useMixes = () => {
    const context = useContext(MixContext);
    if (context === undefined) {
        throw new Error('useMixes must be used within a MixProvider');
    }
    return context;
};
