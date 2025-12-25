

// Fix: Updated Firebase imports to use scoped packages to resolve module export errors.
import { collection, getDocs, setDoc, doc, deleteDoc, addDoc, Timestamp, writeBatch } from "@firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject, listAll } from "@firebase/storage";
import { db, storage } from './firebaseConfig';
import { Outfit, Collection, ModelCoordinate } from '../types';

// Helper to upload multiple images and get their URLs
const uploadOutfitImages = async (userId: string, outfitId: string, imagesBase64: string[]): Promise<string[]> => {
  const uploadPromises = imagesBase64.map((base64, index) => {
    const imageRef = ref(storage, `users/${userId}/images/${outfitId}/${Date.now()}-${index}.jpg`);
    return uploadString(imageRef, base64, 'data_url').then(() => getDownloadURL(imageRef));
  });
  return Promise.all(uploadPromises);
};

// Helper for general base64 upload
export const uploadBase64Image = async (userId: string, path: string, base64: string): Promise<string> => {
  const imageRef = ref(storage, `users/${userId}/${path}/${Date.now()}.jpg`);
  await uploadString(imageRef, base64, 'data_url');
  return getDownloadURL(imageRef);
};

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
  outfitData: Omit<Outfit, 'imageUrls'> & { newImageBase64s: string[], existingImageUrls: string[] }
): Promise<Outfit> => {
  try {
    const isUpdating = !!outfitData.id;
    const outfitDocRef = isUpdating
      ? doc(db, 'users', userId, 'outfits', outfitData.id)
      : doc(collection(db, 'users', userId, 'outfits'));

    const outfitId = outfitDocRef.id;

    // Upload new base64 images to Firebase Storage
    const uploadedImageUrls = await uploadOutfitImages(userId, outfitId, outfitData.newImageBase64s);

    // Combine existing URLs and new Firebase URLs
    const finalImageUrls = [
      ...outfitData.existingImageUrls,
      ...uploadedImageUrls
    ];

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
    console.error("Error saving outfit to Firestore: ", error);
    throw error;
  }
};

export const deleteOutfit = async (userId: string, outfitId: string): Promise<void> => {
  try {
    const outfitDocRef = doc(db, 'users', userId, 'outfits', outfitId);
    await deleteDoc(outfitDocRef);

    const imagesFolderRef = ref(storage, `users/${userId}/images/${outfitId}`);
    const res = await listAll(imagesFolderRef);
    const deletePromises = res.items.map((itemRef) => deleteObject(itemRef));
    await Promise.all(deletePromises);

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
    // Note: This leaves stale `collectionId` references on outfits.
    // A more robust solution would use a batched write or cloud function to clean these up.
    // For this implementation, we'll handle stale IDs on the client.
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }
};

// --- Model Coordination ---

export const getModelCoordinates = async (userId: string): Promise<ModelCoordinate[]> => {
  try {
    const coordinatesRef = collection(db, 'users', userId, 'modelCoordinates');
    const snapshot = await getDocs(coordinatesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModelCoordinate))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching model coordinates:", error);
    throw error;
  }
};

export const saveModelCoordinate = async (userId: string, coordinate: Omit<ModelCoordinate, 'id'>): Promise<ModelCoordinate> => {
  try {
    const coordinatesRef = collection(db, 'users', userId, 'modelCoordinates');
    const newDocRef = await addDoc(coordinatesRef, coordinate);
    return { id: newDocRef.id, ...coordinate };
  } catch (error) {
    console.error("Error saving model coordinate:", error);
    throw error;
  }
};
