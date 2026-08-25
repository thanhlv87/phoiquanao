#!/usr/bin/env node
/**
 * Chuyển ảnh base64 còn nằm trong document Firestore lên Cloud Storage.
 *
 * Mặc định chỉ liệt kê. Thêm --apply để thực sự ghi.
 * Xem scripts/README.md để biết cách chuẩn bị credentials.
 */
import { isDataUrl, parseDataUrl, extensionFor } from './lib.mjs';
import { connect } from './connect.mjs';

const APPLY = process.argv.includes('--apply');
const { db, bucket } = await connect();

const upload = async (userId, outfitId, dataUrl, index) => {
  const { contentType, base64 } = parseDataUrl(dataUrl);
  const buffer = Buffer.from(base64, 'base64');
  const name = `users/${userId}/images/${outfitId}/migrated-${Date.now()}-${index}.${extensionFor(contentType)}`;
  const file = bucket.file(name);
  // Token tải về phải tự sinh: Admin SDK không tạo download URL kiểu client.
  const token = crypto.randomUUID();
  await file.save(buffer, {
    contentType,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
};

const main = async () => {
  console.log(APPLY ? '>> CHẾ ĐỘ GHI THẬT' : '>> Chỉ liệt kê (thêm --apply để ghi)');

  const users = await db.collection('users').listDocuments();
  let totalDocs = 0;
  let totalImages = 0;
  let totalBytes = 0;

  for (const userRef of users) {
    const outfits = await userRef.collection('outfits').get();

    for (const doc of outfits.docs) {
      const imageUrls = doc.get('imageUrls');
      if (!Array.isArray(imageUrls)) continue;

      const legacy = imageUrls.filter(isDataUrl);
      if (legacy.length === 0) continue;

      totalDocs++;
      totalImages += legacy.length;
      totalBytes += legacy.reduce((sum, url) => sum + url.length, 0);
      console.log(`  ${userRef.id}/${doc.id}: ${legacy.length} ảnh base64`);

      if (!APPLY) continue;

      const migrated = [];
      for (const [index, url] of imageUrls.entries()) {
        migrated.push(isDataUrl(url) ? await upload(userRef.id, doc.id, url, index) : url);
      }
      await doc.ref.update({ imageUrls: migrated });
      console.log('    -> đã chuyển');
    }
  }

  console.log('');
  console.log(`Document cần chuyển: ${totalDocs}`);
  console.log(`Ảnh base64:          ${totalImages}`);
  console.log(`Dung lượng ước tính: ${(totalBytes / 1024 / 1024).toFixed(1)} MB trong Firestore`);
  if (!APPLY && totalDocs > 0) console.log('\nChạy lại với --apply để thực hiện.');
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
