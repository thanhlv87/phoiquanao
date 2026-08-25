# Script bảo trì dữ liệu

Hai script dọn dẹp cho dữ liệu tồn từ các phiên bản trước. Cả hai **mặc định chỉ
liệt kê, không sửa gì** — phải thêm `--apply` mới thực sự ghi/xoá.

## Chuẩn bị

Cần một service account key của Firebase project:

1. Firebase Console → Project settings → Service accounts → Generate new private key
2. Lưu file JSON, ví dụ `serviceAccount.json` (đã nằm trong `.gitignore`)

```bash
npm install --no-save firebase-admin
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
export FIREBASE_STORAGE_BUCKET=phoiquanao.firebasestorage.app
```

## `migrate-base64-images.mjs`

Có một giai đoạn ứng dụng nhúng thẳng ảnh base64 vào document Firestore thay vì
tải lên Storage. Script này tìm những document đó, đẩy ảnh lên Storage rồi thay
`imageUrls` bằng URL tải về.

```bash
# Xem có bao nhiêu ảnh cần chuyển
node scripts/migrate-base64-images.mjs

# Thực sự chuyển
node scripts/migrate-base64-images.mjs --apply
```

Script không sinh thumbnail (việc đó cần canvas của trình duyệt). Ảnh đã chuyển
sẽ không có `thumbUrls`, ứng dụng tự rơi về ảnh đầy đủ như với dữ liệu cũ khác.

## `find-orphan-files.mjs`

Trong giai đoạn base64, thao tác xoá outfit chỉ xoá document mà không dọn Storage.
Ngoài ra tính năng thử đồ AI (`mix_results/`) đã bị gỡ nhưng file vẫn còn.

```bash
# Liệt kê file không được document nào tham chiếu
node scripts/find-orphan-files.mjs

# Xoá chúng
node scripts/find-orphan-files.mjs --apply
```

> **Chạy `migrate-base64-images.mjs` trước.** Nếu chạy ngược lại, những ảnh vừa
> migrate có thể bị coi là mồ côi tuỳ thời điểm đọc.

## Lưu ý

Cả hai script chưa được chạy trên dữ liệu thật. Hãy chạy chế độ liệt kê trước,
đọc kỹ kết quả, và cân nhắc backup Firestore (`gcloud firestore export`) trước
khi dùng `--apply`.
