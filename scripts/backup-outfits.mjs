#!/usr/bin/env node
/**
 * Sao lưu toàn bộ users/{uid}/outfits ra một file JSON trên máy.
 *
 * Chỉ đọc, không ghi gì lên Firestore. Chạy trước optimize-images.mjs --apply,
 * vì bước đó thay base64 trong document bằng URL — làm xong thì bản gốc trong
 * Firestore không còn nữa.
 *
 * Cần cùng bộ biến môi trường như các script khác, xem scripts/README.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from './connect.mjs';

const { db } = await connect();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'backups');
fs.mkdirSync(dir, { recursive: true });

const out = {};
let docCount = 0;

const users = await db.collection('users').listDocuments();
for (const userRef of users) {
  const snap = await userRef.collection('outfits').get();
  out[userRef.id] = {};
  for (const doc of snap.docs) {
    out[userRef.id][doc.id] = doc.data();
    docCount++;
  }
  console.log(`  ${userRef.id}: ${snap.size} document`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const file = path.join(dir, `outfits-${stamp}.json`);
fs.writeFileSync(file, JSON.stringify(out));

console.log('');
console.log(`Đã lưu ${docCount} document của ${users.length} tài khoản`);
console.log(`File:       ${file}`);
console.log(`Dung lượng: ${(fs.statSync(file).size / 1048576).toFixed(2)} MB`);
