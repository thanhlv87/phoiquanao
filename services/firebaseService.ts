// Mặt tiền mỏng: mọi thứ đụng tới Firestore/Storage đều đi qua dynamic import, nên
// hai SDK đó chỉ được tải khi thực sự cần (tức là sau khi người dùng đăng nhập).
import { Outfit } from '../types';
import type { OutfitInput, StoredImage } from './dataLayer';

export type { OutfitInput, StoredImage };

const dataLayer = () => import('./dataLayer');

export const subscribeOutfits = async (
    userId: string,
    onData: (outfits: Outfit[]) => void,
    onError: (error: Error) => void
): Promise<() => void> => {
    const layer = await dataLayer();
    return layer.subscribeOutfits(userId, onData, onError);
};

export const addOrUpdateOutfit = async (userId: string, input: OutfitInput): Promise<Outfit> =>
    (await dataLayer()).addOrUpdateOutfit(userId, input);

export const deleteOutfit = async (userId: string, outfit: Outfit): Promise<void> =>
    (await dataLayer()).deleteOutfit(userId, outfit);

export const listOutfitsOnce = async (userId: string): Promise<Outfit[]> =>
    (await dataLayer()).listOutfitsOnce(userId);

export const deleteAllUserData = async (userId: string): Promise<void> =>
    (await dataLayer()).deleteAllUserData(userId);
