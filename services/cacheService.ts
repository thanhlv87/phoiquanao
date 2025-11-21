// IndexedDB caching service for offline support
import { Outfit, Collection } from '../types';

const DB_NAME = 'OutfitLoggerDB';
const DB_VERSION = 1;
const OUTFITS_STORE = 'outfits';
const COLLECTIONS_STORE = 'collections';
const IMAGES_STORE = 'images';

let db: IDBDatabase | null = null;

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create outfits store
      if (!database.objectStoreNames.contains(OUTFITS_STORE)) {
        const outfitsStore = database.createObjectStore(OUTFITS_STORE, { keyPath: 'id' });
        outfitsStore.createIndex('dateId', 'dateId', { unique: false });
        outfitsStore.createIndex('userId', 'userId', { unique: false });
      }

      // Create collections store
      if (!database.objectStoreNames.contains(COLLECTIONS_STORE)) {
        const collectionsStore = database.createObjectStore(COLLECTIONS_STORE, { keyPath: 'id' });
        collectionsStore.createIndex('userId', 'userId', { unique: false });
      }

      // Create images cache store
      if (!database.objectStoreNames.contains(IMAGES_STORE)) {
        database.createObjectStore(IMAGES_STORE, { keyPath: 'url' });
      }
    };
  });
};

// --- Outfits Cache ---
export const cacheOutfits = async (userId: string, outfits: Outfit[]): Promise<void> => {
  const database = await initDB();
  const transaction = database.transaction([OUTFITS_STORE], 'readwrite');
  const store = transaction.objectStore(OUTFITS_STORE);

  // Clear old outfits for this user
  const userIndex = store.index('userId');
  const oldOutfits = await new Promise<Outfit[]>((resolve) => {
    const results: Outfit[] = [];
    const request = userIndex.openCursor(IDBKeyRange.only(userId));
    request.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
  });

  oldOutfits.forEach(outfit => store.delete(outfit.id));

  // Add new outfits
  outfits.forEach(outfit => {
    store.put({ ...outfit, userId });
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getCachedOutfits = async (userId: string): Promise<Outfit[]> => {
  const database = await initDB();
  const transaction = database.transaction([OUTFITS_STORE], 'readonly');
  const store = transaction.objectStore(OUTFITS_STORE);
  const index = store.index('userId');

  return new Promise((resolve, reject) => {
    const request = index.getAll(userId);
    request.onsuccess = () => {
      const outfits = request.result.map(({ userId, ...outfit }: any) => outfit);
      resolve(outfits);
    };
    request.onerror = () => reject(request.error);
  });
};

// --- Collections Cache ---
export const cacheCollections = async (userId: string, collections: Collection[]): Promise<void> => {
  const database = await initDB();
  const transaction = database.transaction([COLLECTIONS_STORE], 'readwrite');
  const store = transaction.objectStore(COLLECTIONS_STORE);

  // Clear old collections
  const userIndex = store.index('userId');
  const oldCollections = await new Promise<Collection[]>((resolve) => {
    const results: Collection[] = [];
    const request = userIndex.openCursor(IDBKeyRange.only(userId));
    request.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
  });

  oldCollections.forEach(collection => store.delete(collection.id));

  // Add new collections
  collections.forEach(collection => {
    store.put({ ...collection, userId });
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getCachedCollections = async (userId: string): Promise<Collection[]> => {
  const database = await initDB();
  const transaction = database.transaction([COLLECTIONS_STORE], 'readonly');
  const store = transaction.objectStore(COLLECTIONS_STORE);
  const index = store.index('userId');

  return new Promise((resolve, reject) => {
    const request = index.getAll(userId);
    request.onsuccess = () => {
      const collections = request.result.map(({ userId, ...collection }: any) => collection);
      resolve(collections);
    };
    request.onerror = () => reject(request.error);
  });
};

// --- Image Cache ---
export const cacheImage = async (url: string, blob: Blob): Promise<void> => {
  const database = await initDB();
  const transaction = database.transaction([IMAGES_STORE], 'readwrite');
  const store = transaction.objectStore(IMAGES_STORE);

  store.put({ url, blob, cachedAt: Date.now() });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getCachedImage = async (url: string): Promise<string | null> => {
  const database = await initDB();
  const transaction = database.transaction([IMAGES_STORE], 'readonly');
  const store = transaction.objectStore(IMAGES_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(url);
    request.onsuccess = () => {
      if (request.result) {
        const objectURL = URL.createObjectURL(request.result.blob);
        resolve(objectURL);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

// Clear all cache
export const clearCache = async (): Promise<void> => {
  const database = await initDB();
  const transaction = database.transaction([OUTFITS_STORE, COLLECTIONS_STORE, IMAGES_STORE], 'readwrite');

  transaction.objectStore(OUTFITS_STORE).clear();
  transaction.objectStore(COLLECTIONS_STORE).clear();
  transaction.objectStore(IMAGES_STORE).clear();

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
