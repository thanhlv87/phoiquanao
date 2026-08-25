# Script bảo trì dữ liệu

Hai script dọn dẹp cho dữ liệu tồn từ các phiên bản trước. Cả hai **mặc định chỉ
liệt kê, không sửa gì** — phải thêm `--apply` mới thực sự ghi/xoá.

## Chuẩn bị

Cần một service account key của Firebase project:

1. Firebase Console → Project settings → Service accounts → Generate new private key
2. Lưu file JSON, ví dụ `serviceAccount.json` (đã nằm trong `.gitignore`)

```bash
npm install --no-save firebase-admin sharp
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
export FIREBASE_STORAGE_BUCKET=phoiquanao.firebasestorage.app
```

## `optimize-images.mjs`

Đưa ảnh cũ về đúng chuẩn hiện tại: nằm trên Storage và có sẵn thumbnail. Xử lý
hai dạng tồn đọng cùng lúc:

1. **Ảnh base64 trong document Firestore** (giai đoạn giữa) — nén lại còn 1080px
   rồi đẩy lên Storage, `imageUrls` thay bằng URL.
2. **Ảnh đã ở Storage nhưng thiếu `thumbUrls`** (giai đoạn đầu) — tải về, dựng
   bản 480px, ghi vào `thumbUrls`. Ảnh đầy đủ giữ nguyên, không nén lại.

Đây là bước làm cho thư viện ảnh cũ được hưởng thumbnail. Không chạy thì lưới
lịch vẫn phải tải ảnh 1080px cho những ô rộng 40px.

```bash
# Xem có bao nhiêu document cần xử lý
node scripts/optimize-images.mjs

# Thực sự xử lý
node scripts/optimize-images.mjs --apply
```

Dùng cùng bộ tham số với bản chạy trên trình duyệt (1080px/250 KB và 480px/60 KB,
chọn định dạng nào nhẹ hơn giữa WebP và JPEG) — xem `scripts/resize.mjs`.

## `find-orphan-files.mjs`

Trong giai đoạn base64, thao tác xoá outfit chỉ xoá document mà không dọn Storage.
Ngoài ra tính năng thử đồ AI (`mix_results/`) đã bị gỡ nhưng file vẫn còn.

```bash
# Liệt kê file không được document nào tham chiếu
node scripts/find-orphan-files.mjs

# Xoá chúng
node scripts/find-orphan-files.mjs --apply
```

> **Chạy `optimize-images.mjs` trước.** Nếu chạy ngược lại, ảnh vừa tạo có thể bị
> coi là mồ côi tuỳ thời điểm đọc.

## Lưu ý

Cả hai script **chưa được chạy trên dữ liệu thật**. Phần quyết định đã có test
(`tests/resize.test.ts`, `tests/scriptLib.test.ts`) và bộ thu nhỏ ảnh đã chạy thử
với ảnh 3024x4032 thật, nhưng vòng lặp đọc/ghi Firestore thì chưa.

Hãy chạy chế độ liệt kê trước, đọc kỹ kết quả, và backup Firestore
(`gcloud firestore export`) trước khi dùng `--apply`.

`optimize-images.mjs` ghi ảnh mới rồi mới cập nhật document, và không xoá gì cả —
nên nếu hỏng giữa chừng thì chỉ dư file, không mất dữ liệu. Chạy
`find-orphan-files.mjs` sau đó để dọn.
