// Tầng dữ liệu: Firestore + Storage. Module này chỉ được nạp qua dynamic import từ
// firebaseService, nên hai SDK nặng ở đây không nằm trong đường tải đầu tiên.
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from "@firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject, getStorage } from "@firebase/storage";
import { app } from './firebaseApp';
import { Outfit } from '../types';

const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

const storage = getStorage(app);

export interface StoredImage {
    full: string;
    thumb: string;
}

export interface OutfitInput {
    id: string;
    date: string;
    dateId: string;
    tops: string[];
    bottoms: string[];
    tags: string[];
    /** Ảnh cũ được giữ lại (đã là URL trên Storage, hoặc base64 của bản đời trước). */
    keptImages: StoredImage[];
    /** Ảnh mới, còn ở dạng data URL, sẽ được tải lên. */
    newImages: StoredImage[];
    /** Ảnh người dùng vừa gỡ, dọn khỏi Storage sau khi lưu thành công. */
    removedImages: StoredImage[];
}

// --- Ảnh ---
// Firestore chỉ giữ URL. Đường dẫn users/{uid}/images/{outfitId}/ giữ nguyên như
// các phiên bản trước để ảnh cũ và mới nằm chung một cây thư mục trong bucket.
const extensionFor = (dataUrl: string): string => {
    const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
    return mime === 'image/webp' ? 'webp' : 'jpg';
};

const uploadImage = async (userId: string, outfitId: string, dataUrl: string, suffix: string): Promise<string> => {
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${suffix}.${extensionFor(dataUrl)}`;
    const objectRef = ref(storage, `users/${userId}/images/${outfitId}/${name}`);
    await uploadString(objectRef, dataUrl, 'data_url');
    return getDownloadURL(objectRef);
};

const deleteStored = async (urls: string[]): Promise<void> => {
    await Promise.all(urls.map(async (url) => {
        // Ảnh base64 của bản đời trước nằm trong document, không có object để xóa.
        if (!url.startsWith('http')) return;
        try {
            await deleteObject(ref(storage, url));
        } catch (e) {
            console.warn("Không xóa được ảnh trên Storage:", e);
        }
    }));
};

// --- Outfits ---
const toOutfit = (id: string, data: Record<string, unknown>): Outfit => ({ id, ...data } as Outfit);

/**
 * Theo dõi realtime thay vì đọc một lần: mở app trên máy khác là thấy ngay, và
 * persistent cache khiến lần mở sau chỉ tải phần thay đổi.
 */
export const subscribeOutfits = (
    userId: string,
    onData: (outfits: Outfit[]) => void,
    onError: (error: Error) => void
): (() => void) =>
    onSnapshot(
        collection(db, 'users', userId, 'outfits'),
        snap => onData(snap.docs.map(d => toOutfit(d.id, d.data()))),
        err => {
            console.error("Lỗi theo dõi outfits:", err);
            onError(err);
        }
    );

export const addOrUpdateOutfit = async (userId: string, input: OutfitInput): Promise<Outfit> => {
    const docRef = input.id
        ? doc(db, 'users', userId, 'outfits', input.id)
        : doc(collection(db, 'users', userId, 'outfits'));

    const uploaded = await Promise.all(
        input.newImages.map(async (image) => ({
            full: await uploadImage(userId, docRef.id, image.full, ''),
            thumb: await uploadImage(userId, docRef.id, image.thumb, '_thumb'),
        }))
    );

    const images = [...input.keptImages, ...uploaded];

    const outfit: Outfit = {
        id: docRef.id,
        date: input.date,
        dateId: input.dateId,
        tops: input.tops,
        bottoms: input.bottoms,
        tags: input.tags,
        imageUrls: images.map(i => i.full),
        thumbUrls: images.map(i => i.thumb),
    };

    await setDoc(docRef, outfit, { merge: true });

    if (input.removedImages.length > 0) {
        await deleteStored(input.removedImages.flatMap(i => [i.full, i.thumb]));
    }

    return outfit;
};

export const deleteOutfit = async (userId: string, outfit: Outfit): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'outfits', outfit.id));
    await deleteStored([...outfit.imageUrls, ...(outfit.thumbUrls || [])]);
};

/** Đọc một lần, phục vụ chức năng xuất dữ liệu và xóa tài khoản. */
export const listOutfitsOnce = (userId: string): Promise<Outfit[]> =>
    new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(
            collection(db, 'users', userId, 'outfits'),
            snap => {
                unsubscribe();
                resolve(snap.docs.map(d => toOutfit(d.id, d.data())));
            },
            err => {
                unsubscribe();
                reject(err);
            }
        );
    });

export const deleteAllUserData = async (userId: string): Promise<void> => {
    const outfits = await listOutfitsOnce(userId);
    for (const outfit of outfits) {
        await deleteOutfit(userId, outfit);
    }
};
