import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'outfit_logger_custom_tags';

const initialSuggestions = {
    tops: ['Áo phông', 'Sơ mi', 'Áo hoodie', 'Áo khoác', 'Áo len'],
    bottoms: ['Quần jeans', 'Quần tây', 'Quần short', 'Chân váy'],
    tags: ['Thường ngày', 'Trang trọng', 'Công sở', 'Tiệc tùng'],
};

type TagCategory = keyof typeof initialSuggestions;

interface StoredSuggestions {
    tops: string[];
    bottoms: string[];
    tags: string[];
}

const getStoredSuggestions = (): StoredSuggestions => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Basic validation
            if (Array.isArray(parsed.tops) && Array.isArray(parsed.bottoms) && Array.isArray(parsed.tags)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to load custom tags from localStorage", error);
    }
    return { tops: [], bottoms: [], tags: [] };
};

export const useTagSuggestions = () => {
    const [suggestions, setSuggestions] = useState<StoredSuggestions>(initialSuggestions);

    useEffect(() => {
        const customTags = getStoredSuggestions();
        setSuggestions({
            tops: [...new Set([...initialSuggestions.tops, ...customTags.tops])],
            bottoms: [...new Set([...initialSuggestions.bottoms, ...customTags.bottoms])],
            tags: [...new Set([...initialSuggestions.tags, ...customTags.tags])],
        });
    }, []);

    const addSuggestion = useCallback((category: TagCategory, newTag: string) => {
        const trimmedTag = newTag.trim();
        if (!trimmedTag) return;

        // Update state immediately for responsive UI
        setSuggestions(prev => {
            const currentCategoryTags = prev[category];
            if (currentCategoryTags.find(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
                return prev; // Already exists
            }
            const newSuggestionsForCategory = [...currentCategoryTags, trimmedTag];
            return { ...prev, [category]: newSuggestionsForCategory };
        });

        // Persist to localStorage
        const customTags = getStoredSuggestions();
        const currentCustomCategoryTags = customTags[category];
         if (!currentCustomCategoryTags.find(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
            const updatedCustomTags = {
                ...customTags,
                [category]: [...currentCustomCategoryTags, trimmedTag],
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomTags));
        }
    }, []);

    return { suggestions, addSuggestion };
};
