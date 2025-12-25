
import { collection, getDocs, setDoc, doc, deleteDoc, addDoc, Timestamp, writeBatch, orderBy, query, getDoc } from "@firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, uploadString } from "@firebase/storage";
import { db, storage } from './firebaseConfig';
import { Outfit, Collection, MixResult } from '../types';
import { fileToBase64 } from '../utils/imageUtils';

// Helper: Upload ảnh lên Firebase Storage từ File object
const uploadOutfitImages = async (userId: string, outfitId: string, files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file, index) => {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `users/${userId}/images/${outfitId}/${Date.now()}-${index}.${ext}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    });

    return Promise.all(uploadPromises);
};

// Helper: Upload Base64 lên Firebase Storage
const uploadBase64ToStorage = async (userId: string, folderName: string, base64Data: string): Promise<string> => {
    // Đảm bảo chuỗi base64 hợp lệ (data:image/png;base64,...)
    if (!base64Data.startsWith('data:')) {
        throw new Error('Invalid base64 string format');
    }

    const fileName = `users/${userId}/${folderName}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const storageRef = ref(storage, fileName);

    // uploadString tự động xử lý data_url
    await uploadString(storageRef, base64Data, 'data_url');
    return await getDownloadURL(storageRef);
}


// --- Outfits ---

export const getOutfits = async (userId: string): Promise<Outfit[]> => {
  try {
    const outfitsCollectionRef = collection(db, 'users', userId, 'outfits');
    const querySnapshot = await getDocs(outfitsCollectionRef);
    const outfits: Outfit[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      outfits.push({
        id: doc.id,
        date: data.date,
        dateId: data.dateId,
        imageUrls: data.imageUrls || [],
        tops: data.tops || [],
        bottoms: data.bottoms || [],
        tags: data.tags || [],
        collectionIds: data.collectionIds || [],
      } as Outfit);
    });
    return outfits;
  } catch (error) {
    console.error("Error fetching outfits from Firestore: ", error);
    throw error;
  }
};

export const addOrUpdateOutfit = async (
  userId: string,
  outfitData: Omit<Outfit, 'imageUrls'> & { newImageFiles: File[], existingImageUrls: string[] }
): Promise<Outfit> => {
  try {
    const isUpdating = !!outfitData.id;
    const outfitDocRef = isUpdating
      ? doc(db, 'users', userId, 'outfits', outfitData.id)
      : doc(collection(db, 'users', userId, 'outfits'));

    const outfitId = outfitDocRef.id;

    // Upload ảnh mới lên Firebase Storage
    let newImageUrls: string[] = [];
    if (outfitData.newImageFiles.length > 0) {
         newImageUrls = await uploadOutfitImages(userId, outfitId, outfitData.newImageFiles);
    }
    
    const finalImageUrls = [...outfitData.existingImageUrls, ...newImageUrls];

    const outfitForFirestore: Outfit = {
      id: outfitId,
      date: outfitData.date,
      dateId: outfitData.dateId,
      imageUrls: finalImageUrls,
      tops: outfitData.tops,
      bottoms: outfitData.bottoms,
      tags: outfitData.tags,
      collectionIds: outfitData.collectionIds || [],
    };

    await setDoc(outfitDocRef, outfitForFirestore);
    
    return outfitForFirestore;
  } catch (error) {
    console.error("Error saving outfit: ", error);
    throw error;
  }
};

export const deleteOutfit = async (userId: string, outfitId: string): Promise<void> => {
    try {
        const outfitDocRef = doc(db, 'users', userId, 'outfits', outfitId);
        await deleteDoc(outfitDocRef);

        // Xóa ảnh trong Firebase Storage
        // Firebase Storage không hỗ trợ xóa thư mục trực tiếp, phải list tất cả file và xóa từng cái.
        const folderRef = ref(storage, `users/${userId}/images/${outfitId}`);
        try {
            const listResult = await listAll(folderRef);
            const deletePromises = listResult.items.map(item => deleteObject(item));
            await Promise.all(deletePromises);
        } catch (storageError) {
             console.error("Failed to delete images from Storage (might be empty or permission issue):", storageError);
        }

    } catch (error) {
        console.error("Error deleting outfit: ", error);
        throw error;
    }
};

// --- Collections ---

export const getCollections = async (userId: string): Promise<Collection[]> => {
    try {
        const collectionsRef = collection(db, 'users', userId, 'collections');
        const snapshot = await getDocs(collectionsRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
    } catch (error) {
        console.error("Error fetching collections:", error);
        throw error;
    }
};

export const addCollection = async (userId: string, collectionData: Omit<Collection, 'id'>): Promise<Collection> => {
    try {
        const collectionsRef = collection(db, 'users', userId, 'collections');
        const newDocRef = await addDoc(collectionsRef, collectionData);
        return { id: newDocRef.id, ...collectionData };
    } catch (error) {
        console.error("Error adding collection:", error);
        throw error;
    }
};

export const deleteCollection = async (userId: string, collectionId: string): Promise<void> => {
    try {
        const collectionDocRef = doc(db, 'users', userId, 'collections', collectionId);
        await deleteDoc(collectionDocRef);
    } catch (error) {
        console.error("Error deleting collection:", error);
        throw error;
    }
};

// --- Mix Results ---

export const saveMixResult = async (userId: string, modelBase64: string, topBase64: string, bottomBase64: string, resultBase64: string): Promise<MixResult> => {
    try {
        // Upload images to Firebase Storage
        const modelUrl = await uploadBase64ToStorage(userId, 'mix_inputs', modelBase64);
        const topUrl = await uploadBase64ToStorage(userId, 'mix_inputs', topBase64);
        const bottomUrl = await uploadBase64ToStorage(userId, 'mix_inputs', bottomBase64);
        const resultUrl = await uploadBase64ToStorage(userId, 'mix_results', resultBase64);

        const mixData = {
            createdAt: new Date().toISOString(),
            modelImageUrl: modelUrl,
            topImageUrl: topUrl,
            bottomImageUrl: bottomUrl,
            resultImageUrl: resultUrl
        };

        const mixCollectionRef = collection(db, 'users', userId, 'mix_results');
        const newDocRef = await addDoc(mixCollectionRef, mixData);

        return { id: newDocRef.id, ...mixData };
    } catch (error) {
        console.error("Error saving mix result:", error);
        throw error;
    }
}

export const getMixResults = async (userId: string): Promise<MixResult[]> => {
    try {
        const mixCollectionRef = collection(db, 'users', userId, 'mix_results');
        // Order by created time desc
        const q = query(mixCollectionRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MixResult));
    } catch (error) {
        console.error("Error fetching mix results:", error);
        throw error;
    }
}

export const deleteMixResult = async (userId: string, mixId: string, resultImageUrl: string): Promise<void> => {
    try {
        const mixDocRef = doc(db, 'users', userId, 'mix_results', mixId);
        await deleteDoc(mixDocRef);

        // Try to delete the result image from storage to keep things clean.
        // We construct a ref from the download URL.
        try {
             const imageRef = ref(storage, resultImageUrl);
             await deleteObject(imageRef);
        } catch (imgError) {
            console.warn("Could not delete associated image from storage (it might already be gone):", imgError);
        }

    } catch (error) {
        console.error("Error deleting mix result:", error);
        throw error;
    }
}

// --- User Preferences (Model Default) ---

export const saveDefaultModel = async (userId: string, imageUrl: string): Promise<void> => {
    try {
        const userDocRef = doc(db, 'users', userId);
        // setDoc với merge: true sẽ tạo document nếu chưa có, hoặc cập nhật trường cụ thể nếu đã có
        await setDoc(userDocRef, { defaultModelUrl: imageUrl }, { merge: true });
    } catch (error) {
        console.error("Error saving default model:", error);
        // Không throw error để tránh làm gián đoạn luồng chính, vì đây là tính năng phụ
    }
}

export const getDefaultModel = async (userId: string): Promise<string | null> => {
    try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return docSnap.data().defaultModelUrl || null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching default model:", error);
        return null;
    }
}
