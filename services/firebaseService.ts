
import { collection, getDocs, setDoc, doc, deleteDoc } from "@firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject } from "@firebase/storage";
import { db, storage } from './firebaseConfig';
import { Outfit } from '../types';

// --- Ảnh ---
// Ảnh đi lên Cloud Storage, Firestore chỉ giữ URL. Trước đây data URL base64 được
// nhét thẳng vào document nên chỉ 2-3 ảnh là chạm trần 1 MB/document của Firestore,
// và mỗi lần mở app phải tải lại toàn bộ ảnh của mọi outfit.
// Giữ đúng đường dẫn users/{uid}/images/{outfitId}/ mà các phiên bản trước đã dùng,
// để ảnh cũ và ảnh mới nằm chung một cây thư mục trong bucket.
const extensionFor = (dataUrl: string): string => {
    const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
    return mime === 'image/webp' ? 'webp' : 'jpg';
};

const uploadOutfitImage = async (userId: string, outfitId: string, dataUrl: string): Promise<string> => {
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(dataUrl)}`;
    const objectRef = ref(storage, `users/${userId}/images/${outfitId}/${fileName}`);
    await uploadString(objectRef, dataUrl, 'data_url');
    return getDownloadURL(objectRef);
};

const deleteStoredImages = async (urls: string[]): Promise<void> => {
    await Promise.all(urls.map(async (url) => {
        // Outfit cũ lưu ảnh base64 ngay trong document, không có object nào để xóa.
        if (!url.startsWith('http')) return;
        try {
            await deleteObject(ref(storage, url));
        } catch (e) {
            console.warn("Không xóa được ảnh trên Storage:", e);
        }
    }));
};

// --- Outfits (NHẬT KÝ) ---
export const getOutfits = async (userId: string): Promise<Outfit[]> => {
    try {
        const ref = collection(db, 'users', userId, 'outfits');
        const snap = await getDocs(ref);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Outfit));
    } catch (e) {
        console.error("Error fetching outfits:", e);
        return [];
    }
};

export interface OutfitInput extends Omit<Outfit, 'imageUrls'> {
    newImageFiles: string[];
    existingImageUrls: string[];
    removedImageUrls?: string[];
}

export const addOrUpdateOutfit = async (userId: string, outfitData: OutfitInput): Promise<Outfit> => {
    const docRef = outfitData.id
        ? doc(db, 'users', userId, 'outfits', outfitData.id)
        : doc(collection(db, 'users', userId, 'outfits'));

    const { newImageFiles, existingImageUrls, removedImageUrls, ...rest } = outfitData;

    const uploadedUrls = await Promise.all(
        (newImageFiles || []).map(dataUrl => uploadOutfitImage(userId, docRef.id, dataUrl))
    );

    const outfit: Outfit = {
        ...rest,
        id: docRef.id,
        imageUrls: [...(existingImageUrls || []), ...uploadedUrls],
    };

    // setDoc ném lỗi nếu gặp bất kỳ giá trị undefined nào, nên lọc trước khi ghi.
    const payload = Object.fromEntries(
        Object.entries(outfit).filter(([, value]) => value !== undefined)
    );

    await setDoc(docRef, payload, { merge: true });

    // Chỉ dọn ảnh người dùng đã gỡ sau khi document lưu thành công.
    if (removedImageUrls && removedImageUrls.length > 0) {
        await deleteStoredImages(removedImageUrls);
    }

    return outfit;
};

export const deleteOutfit = async (userId: string, outfitId: string, imageUrls: string[] = []): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'outfits', outfitId));
    await deleteStoredImages(imageUrls);
};
