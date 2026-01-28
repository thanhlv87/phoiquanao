
import { collection, getDocs, setDoc, doc, deleteDoc, addDoc, query, orderBy, getDoc } from "@firebase/firestore";
import { db } from './firebaseConfig';
import { Outfit, Collection, WardrobeItem, MixResult } from '../types';

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

// Hàm Helper để tạo ID mới (cho Optimistic UI)
export const generateOutfitId = (userId: string): string => {
    return doc(collection(db, 'users', userId, 'outfits')).id;
};

export const addOrUpdateOutfit = async (userId: string, outfitData: any): Promise<Outfit> => {
    let updatedImageUrls = [...(outfitData.existingImageUrls || [])];

    if (outfitData.newImageFiles && outfitData.newImageFiles.length > 0) {
        updatedImageUrls = [...updatedImageUrls, ...outfitData.newImageFiles];
    }

    const dataToSave = {
        ...outfitData,
        imageUrls: updatedImageUrls,
    };
    delete dataToSave.newImageFiles;
    delete dataToSave.existingImageUrls;

    // Sử dụng ID đã có hoặc tạo mới nếu chưa có
    const docRef = doc(db, 'users', userId, 'outfits', outfitData.id || generateOutfitId(userId));
    
    // Đảm bảo ID trong data khớp với ID document
    const outfit = { ...dataToSave, id: docRef.id };
    
    await setDoc(docRef, outfit, { merge: true });
    return outfit;
};

export const deleteOutfit = async (userId: string, outfitId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'outfits', outfitId));
};

// --- Collections ---
export const getCollections = async (userId: string): Promise<Collection[]> => {
    const ref = collection(db, 'users', userId, 'collections');
    const snap = await getDocs(ref);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
};

export const addCollection = async (userId: string, collectionData: Omit<Collection, 'id'>): Promise<Collection> => {
    const ref = collection(db, 'users', userId, 'collections');
    const docRef = await addDoc(ref, collectionData);
    return { id: docRef.id, ...collectionData };
};

export const deleteCollection = async (userId: string, collectionId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'collections', collectionId));
};

// --- Wardrobe (TỦ ĐỒ) ---
// Thêm các hàm quản lý tủ đồ người dùng
export const getWardrobe = async (userId: string): Promise<WardrobeItem[]> => {
    try {
        const ref = collection(db, 'users', userId, 'wardrobe');
        const snap = await getDocs(ref);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WardrobeItem));
    } catch (e) {
        console.error("Error fetching wardrobe:", e);
        return [];
    }
};

export const addToWardrobe = async (userId: string, itemData: Omit<WardrobeItem, 'id'>): Promise<WardrobeItem> => {
    const ref = collection(db, 'users', userId, 'wardrobe');
    const docRef = await addDoc(ref, itemData);
    return { id: docRef.id, ...itemData } as WardrobeItem;
};

export const deleteFromWardrobe = async (userId: string, itemId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'wardrobe', itemId));
};

// --- Mixes (PHỐI ĐỒ) ---
// Thêm các hàm quản lý kết quả phối đồ AI
export const saveMixResult = async (userId: string, modelBase64: string, topBase64: string, bottomBase64: string, resultImageUrl: string): Promise<MixResult> => {
    const ref = collection(db, 'users', userId, 'mixes');
    const mixData = {
        createdAt: new Date().toISOString(),
        modelImageUrl: modelBase64,
        topImageUrl: topBase64,
        bottomImageUrl: bottomBase64,
        resultImageUrl
    };
    const docRef = await addDoc(ref, mixData);
    return { id: docRef.id, ...mixData } as MixResult;
};

export const getMixResults = async (userId: string): Promise<MixResult[]> => {
    try {
        const ref = collection(db, 'users', userId, 'mixes');
        const q = query(ref, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MixResult));
    } catch (e) {
        console.error("Error fetching mixes:", e);
        return [];
    }
};

export const deleteMixResult = async (userId: string, mixId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'mixes', mixId));
};

// --- Settings (MẪU MẶC ĐỊNH) ---
// Thêm các hàm lưu/lấy ảnh mẫu người mẫu mặc định
export const getDefaultModel = async (userId: string): Promise<string | null> => {
    const docRef = doc(db, 'users', userId, 'settings', 'model');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().url : null;
};

export const saveDefaultModel = async (userId: string, url: string): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'settings', 'model');
    await setDoc(docRef, { url });
};
