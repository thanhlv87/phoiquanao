#!/usr/bin/env node
/**
 * Tìm file trên Cloud Storage không được document Firestore nào tham chiếu.
 *
 * Sinh ra từ hai nguồn: giai đoạn base64 xoá outfit mà không dọn Storage, và
 * tính năng thử đồ AI (mix_results/) đã bị gỡ.
 *
 * Mặc định chỉ liệt kê. Thêm --apply để thực sự xoá.
 */
import { pathFromDownloadUrl } from './lib.mjs';
import { connect } from './connect.mjs';

const APPLY = process.argv.includes('--apply');
const { db, bucket } = await connect();

const main = async () => {
  console.log(APPLY ? '>> CHẾ ĐỘ XOÁ THẬT' : '>> Chỉ liệt kê (thêm --apply để xoá)');

  // 1. Gom mọi đường dẫn đang được tham chiếu
  const referenced = new Set();
  const users = await db.collection('users').listDocuments();

  for (const userRef of users) {
    const outfits = await userRef.collection('outfits').get();
    for (const doc of outfits.docs) {
      for (const field of ['imageUrls', 'thumbUrls']) {
        const urls = doc.get(field);
        if (!Array.isArray(urls)) continue;
        for (const url of urls) {
          if (typeof url !== 'string' || !url.startsWith('http')) continue;
          const path = pathFromDownloadUrl(url);
          if (path) referenced.add(path);
        }
      }
    }
  }

  console.log(`Đường dẫn đang được dùng: ${referenced.size}`);

  // 2. Đối chiếu với những gì thực có trong bucket
  const [files] = await bucket.getFiles({ prefix: 'users/' });
  const orphans = files.filter(file => !referenced.has(file.name));

  let bytes = 0;
  const byGroup = new Map();

  for (const file of orphans) {
    bytes += Number(file.metadata.size || 0);
    // gom theo thư mục cấp 3: users/<uid>/<nhóm>/...
    const group = file.name.split('/').slice(0, 3).join('/');
    byGroup.set(group, (byGroup.get(group) || 0) + 1);
  }

  console.log(`File trong bucket:        ${files.length}`);
  console.log(`File mồ côi:              ${orphans.length}`);
  console.log(`Dung lượng thu hồi được:  ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  console.log('');
  for (const [group, count] of [...byGroup].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${group}/ : ${count} file`);
  }

  if (!APPLY) {
    if (orphans.length > 0) console.log('\nChạy lại với --apply để xoá.');
    return;
  }

  for (const file of orphans) {
    await file.delete();
    console.log(`  đã xoá ${file.name}`);
  }
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
