
import { Outfit } from '../types';

/**
 * Analyzes all outfits and returns the most frequently used tags.
 * @param outfits - An array of all user outfits.
 * @param count - The number of top tags to return.
 * @returns An array of the most frequent tag strings.
 */
export const getMostFrequentTags = (outfits: Outfit[], count: number): string[] => {
  const tagCounts: Record<string, number> = {};

  outfits.forEach(outfit => {
    const allTags = [...outfit.tops, ...outfit.bottoms, ...outfit.tags];
    const uniqueTags = [...new Set(allTags)]; // Count each tag only once per outfit
    
    uniqueTags.forEach(tag => {
      const lowerCaseTag = tag.toLowerCase();
      tagCounts[lowerCaseTag] = (tagCounts[lowerCaseTag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([tag]) => tag);
};
