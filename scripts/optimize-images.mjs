#!/usr/bin/env node
/**
 * Đưa ảnh cũ về đúng chuẩn hiện tại: nằm trên Cloud Storage và có sẵn thumbnail.
 *
 * Xử lý hai dạng dữ liệu tồn đọng:
 *   1. Ảnh base64 nhét thẳng trong document Firestore (giai đoạn giữa)
 *   2. Ảnh đã ở trên Storage nhưng chưa có thumbUrls (giai đoạn đầu)
 *
 * Không có thumbnail thì lưới lịch phải tải ảnh 1080px cho ô 40px, một tháng có
 * thể kéo về 31 tấm như vậy.
 *
 * Mặc định chỉ liệt kê. Thêm --apply để thực sự ghi.
 * Xem scripts/README.md để biết cách chuẩn bị credentials.
 */
import { isDataUrl, parseDataUrl } from './lib.mjs';
import { connect } from './connect.mjs';
import { resizeToBudget, extensionForContentType, FULL, THUMB } from './resize.mjs';

const APPLY = process.argv.includes('--apply');
const { db, bucket } = await connect();

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Chưa cài sharp. Chạy: npm install --no-save sharp');
  process.exit(1);
}

const fetchBytes = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tải ảnh thất bại (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
};

/** Lấy dữ liệu nhị phân của một ảnh dù nó là data URL hay URL Storage. */
const readImage = async (url) =>
  isDataUrl(url)
    ? Buffer.from(parseDataUrl(url).base64, 'base64')
    : fetchBytes(url);

const upload = async (userId, outfitId, buffer, contentType, suffix) => {
  const ext = extensionForContentType(contentType);
  const name = `users/${userId}/images/${outfitId}/opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${suffix}.${ext}`;
  const token = crypto.randomUUID();
  await bucket.file(name).save(buffer, {
    contentType,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
};

const main = async () => {
  console.log(APPLY ? '>> CHẾ ĐỘ GHI THẬT' : '>> Chỉ liệt kê (thêm --apply để ghi)');
  console.log('');

  const users = await db.collection('users').listDocuments();
  const stats = { docs: 0, base64: 0, thieuThumb: 0, byteTruoc: 0, byteSau: 0, loi: 0 };

  for (const userRef of users) {
    const outfits = await userRef.collection('outfits').get();

    for (const doc of outfits.docs) {
      const imageUrls = doc.get('imageUrls');
      const thumbUrls = doc.get('thumbUrls');
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) continue;

      const coBase64 = imageUrls.some(isDataUrl);
      const thieuThumb = !Array.isArray(thumbUrls) || thumbUrls.length !== imageUrls.length;
      if (!coBase64 && !thieuThumb) continue;

      stats.docs++;
      if (coBase64) stats.base64 += imageUrls.filter(isDataUrl).length;
      if (thieuThumb) stats.thieuThumb++;

      const nhan = `${userRef.id}/${doc.id}`;
      console.log(`  ${nhan}: ${imageUrls.length} ảnh` +
        `${coBase64 ? ', có base64' : ''}${thieuThumb ? ', thiếu thumb' : ''}`);

      if (!APPLY) continue;

      try {
        const newFull = [];
        const newThumb = [];

        for (const [i, url] of imageUrls.entries()) {
          const source = await readImage(url);
          stats.byteTruoc += source.length;

          // Ảnh đã ở trên Storage và đúng chuẩn thì giữ nguyên, chỉ bù thumb.
          if (isDataUrl(url)) {
            const full = await resizeToBudget(source, FULL, sharp);
            newFull.push(await upload(userRef.id, doc.id, full.buffer, full.contentType, ''));
            stats.byteSau += full.buffer.length;
          } else {
            newFull.push(url);
            stats.byteSau += source.length;
          }

          const existingThumb = Array.isArray(thumbUrls) ? thumbUrls[i] : undefined;
          if (existingThumb) {
            newThumb.push(existingThumb);
          } else {
            const thumb = await resizeToBudget(source, THUMB, sharp);
            newThumb.push(await upload(userRef.id, doc.id, thumb.buffer, thumb.contentType, '_thumb'));
            stats.byteSau += thumb.buffer.length;
          }
        }

        await doc.ref.update({ imageUrls: newFull, thumbUrls: newThumb });
        console.log('    -> xong');
      } catch (e) {
        stats.loi++;
        console.error(`    -> LỖI: ${e.message}`);
      }
    }
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
  console.log('');
  console.log(`Document cần xử lý:      ${stats.docs}`);
  console.log(`  ảnh base64:            ${stats.base64}`);
  console.log(`  document thiếu thumb:  ${stats.thieuThumb}`);
  if (APPLY) {
    console.log(`Dữ liệu đọc vào:         ${mb(stats.byteTruoc)}`);
    console.log(`Dữ liệu ghi ra:          ${mb(stats.byteSau)}`);
    if (stats.loi) console.log(`Document lỗi:            ${stats.loi}`);
  } else if (stats.docs > 0) {
    console.log('\nChạy lại với --apply để thực hiện.');
  }
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
