/**
 * Kết nối Firebase Admin, kèm thông báo lỗi rõ ràng cho hai trường hợp hay gặp:
 * thiếu biến môi trường và chưa cài firebase-admin.
 */
export const connect = async () => {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    console.error('Thiếu FIREBASE_STORAGE_BUCKET. Xem scripts/README.md.');
    process.exit(1);
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Thiếu GOOGLE_APPLICATION_CREDENTIALS. Xem scripts/README.md.');
    process.exit(1);
  }

  let app, firestore, storage;
  try {
    app = await import('firebase-admin/app');
    firestore = await import('firebase-admin/firestore');
    storage = await import('firebase-admin/storage');
  } catch {
    console.error('Chưa cài firebase-admin. Chạy: npm install --no-save firebase-admin');
    process.exit(1);
  }

  app.initializeApp({ credential: app.applicationDefault(), storageBucket: bucketName });
  return { db: firestore.getFirestore(), bucket: storage.getStorage().bucket() };
};
