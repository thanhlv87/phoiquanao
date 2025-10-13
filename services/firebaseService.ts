import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from './firebaseConfig';
import { Outfit } from '../types';

// Gets outfits for a specific user
export const getOutfits = async (userId: string): Promise<Record<string, Outfit>> => {
  try {
    const outfitsCollectionRef = collection(db, 'users', userId, 'outfits');
    const querySnapshot = await getDocs(outfitsCollectionRef);
    const outfits: Record<string, Outfit> = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Correctly reconstruct the Outfit object by combining the document ID
      // with the data stored inside it.
      outfits[doc.id] = {
        id: doc.id,
        date: data.date,
        imageUrl: data.imageUrl,
        tops: data.tops,
        bottoms: data.bottoms,
        tags: data.tags,
      } as Outfit;
    });
    return outfits;
  } catch (error) {
    console.error("Error fetching outfits from Firestore: ", error);
    throw error;
  }
};

const uploadOutfitImage = async (userId: string, outfitId: string, imageBase64: string): Promise<string> => {
  const storageRef = ref(storage, `users/${userId}/images/${outfitId}.jpg`);
  await uploadString(storageRef, imageBase64, 'data_url');
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// Adds or updates an outfit for a specific user
export const addOrUpdateOutfit = async (userId: string, outfitData: Omit<Outfit, 'imageUrl'> & { imageBase64: string }): Promise<Outfit> => {
  let finalImageUrl: string;
  try {
    // SCENARIO: A new image was uploaded (it's a Base64 data URL string)
    // or an existing outfit is being edited without changing the image (it's an https URL string).
    if (outfitData.imageBase64 && outfitData.imageBase64.startsWith('data:image')) {
      // It's a new image, so we upload it to get a new URL.
      finalImageUrl = await uploadOutfitImage(userId, outfitData.id, outfitData.imageBase64);
    } else {
      // It's an existing image. We use the URL that was already there.
      // The `imageBase64` field is holding the old `imageUrl` in this case.
      finalImageUrl = outfitData.imageBase64;
    }
  } catch (error) {
      console.error("Error uploading image to Firebase Storage: ", error);
      throw error;
  }


  try {
    const outfitForFirestore = {
      date: outfitData.date,
      imageUrl: finalImageUrl, // Use the determined URL
      tops: outfitData.tops,
      bottoms: outfitData.bottoms,
      tags: outfitData.tags
    };

    const outfitDocRef = doc(db, 'users', userId, 'outfits', outfitData.id);
    await setDoc(outfitDocRef, outfitForFirestore);

    const savedOutfit: Outfit = {
      id: outfitData.id,
      ...outfitForFirestore
    };
    
    return savedOutfit;
  } catch (error) {
    console.error("Error saving outfit to Firestore: ", error);
    throw error;
  }
};

// Deletes an outfit and its image for a specific user
export const deleteOutfit = async (userId: string, outfitId: string): Promise<void> => {
    try {
        const outfitDocRef = doc(db, 'users', userId, 'outfits', outfitId);
        await deleteDoc(outfitDocRef);

        const imageRef = ref(storage, `users/${userId}/images/${outfitId}.jpg`);
        await deleteObject(imageRef);
    } catch (error) {
        if ((error as any).code === 'storage/object-not-found') {
            console.warn(`Image for outfit ${outfitId} not found in Storage, but Firestore doc deleted.`);
        } else {
            console.error("Error deleting outfit: ", error);
            throw error;
        }
    }
};