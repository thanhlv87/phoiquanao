
import { collection, getDocs, setDoc, doc, deleteDoc, addDoc, query, orderBy, getDoc } from "@firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject } from "@firebase/storage";
import { db, storage } from './firebaseConfig';
import { Outfit, Collection, MixResult, WardrobeItem } from '../types';

// Helper: Convert File to Base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// --- Wardrobe (TỦ ĐỒ) ---
// YÊU CẦU: Lưu ảnh trực tiếp vào Firestore (Base64) để tránh lỗi CORS khi Mix
export const getWardrobe = async (userId: string): Promise<WardrobeItem[]> => {
    try {
        const ref = collection(db, 'users', userId, 'wardrobe');
        const snap = await getDocs(ref);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as WardrobeItem));
    } catch (e) {
        console.error("Error fetching wardrobe:", e);
        return [];
    }
};

export const addToWardrobe = async (userId: string, item: Omit<WardrobeItem, 'id'>): Promise<WardrobeItem> => {
    // 1. Lưu Base64 trực tiếp vào Firestore document
    const wardrobeRef = collection(db, 'users', userId, 'wardrobe');
    const docRef = await addDoc(wardrobeRef, item);
    return { id: docRef.id, ...item };
};

export const deleteFromWardrobe = async (userId: string, itemId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'wardrobe', itemId));
};

// --- Outfits (NHẬT KÝ) ---
// Tương tự Tủ đồ, lưu Base64 vào Firestore để đồng bộ
export const getOutfits = async (userId: string): Promise<Outfit[]> => {
    const ref = collection(db, 'users', userId, 'outfits');
    const snap = await getDocs(ref);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Outfit));
};

export const addOrUpdateOutfit = async (userId: string, outfitData: any): Promise<Outfit> => {
    let updatedImageUrls = [...(outfitData.existingImageUrls || [])];

    // newImageFiles bây giờ được mong đợi là mảng chuỗi Base64 (string[])
    if (outfitData.newImageFiles && outfitData.newImageFiles.length > 0) {
        // Chúng ta giả định rằng client đã nén và chuyển thành base64
        const newBase64s = outfitData.newImageFiles;
        updatedImageUrls = [...updatedImageUrls, ...newBase64s];
    }

    const dataToSave = {
        ...outfitData,
        imageUrls: updatedImageUrls,
    };
    delete dataToSave.newImageFiles;
    delete dataToSave.existingImageUrls;

    const docRef = outfitData.id ? doc(db, 'users', userId, 'outfits', outfitData.id) : doc(collection(db, 'users', userId, 'outfits'));
    const outfit = { ...dataToSave, id: docRef.id };
    await setDoc(docRef, outfit, { merge: true });
    return outfit;
};

export const deleteOutfit = async (userId: string, outfitId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, 'outfits', outfitId));
};

// --- Mix Results (KẾT QUẢ MIX) ---
// YÊU CẦU: Ảnh kết quả lưu vào Firebase Storage, Ảnh input lưu Base64 vào Firestore
export const saveMixResult = async (userId: string, model: string, top: string, bottom: string, result: string): Promise<MixResult> => {
    
    // 1. Upload ảnh kết quả (result) lên Firebase Storage
    // Tạo tên file duy nhất dựa trên timestamp
    const fileName = `mix_${Date.now()}.jpg`;
    const storageRef = ref(storage, `users/${userId}/mix_results/${fileName}`);
    
    // Upload chuỗi Base64 (dạng data_url) lên Storage
    await uploadString(storageRef, result, 'data_url');
    
    // Lấy URL công khai (Download URL)
    const resultUrl = await getDownloadURL(storageRef);

    // 2. Lưu metadata vào Firestore
    // - modelImageUrl, topImageUrl, bottomImageUrl: Lưu Base64 (để có thể tái sử dụng làm input nếu cần)
    // - resultImageUrl: Lưu URL từ Storage (để hiển thị nhẹ nhàng)
    const data = { 
        createdAt: new Date().toISOString(), 
        modelImageUrl: model,  // Base64
        topImageUrl: top,      // Base64
        bottomImageUrl: bottom,// Base64
        resultImageUrl: resultUrl // Storage URL
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'mix_results'), data);
    return { id: docRef.id, ...data };
};

export const getMixResults = async (userId: string): Promise<MixResult[]> => {
    const q = query(collection(db, 'users', userId, 'mix_results'), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MixResult));
};

export const deleteMixResult = async (userId: string, id: string): Promise<void> => {
    // 1. Lấy thông tin doc để xóa file trong Storage trước
    try {
        const docRef = doc(db, 'users', userId, 'mix_results', id);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.resultImageUrl && data.resultImageUrl.includes('firebasestorage')) {
                // Tạo ref từ URL để xóa
                const fileRef = ref(storage, data.resultImageUrl);
                await deleteObject(fileRef).catch(err => console.warn("Lỗi xóa file storage (có thể file không tồn tại):", err));
            }
        }
        
        // 2. Xóa doc trong Firestore
        await deleteDoc(docRef);
    } catch (e) {
        console.error("Lỗi xóa mix result:", e);
        throw e;
    }
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

// --- Default Model ---
export const saveDefaultModel = async (userId: string, url: string) => {
    // Lưu Base64 vào Firestore
    await setDoc(doc(db, 'users', userId), { defaultModelUrl: url }, { merge: true });
};

export const getDefaultModel = async (userId: string) => {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? snap.data().defaultModelUrl : null;
};
