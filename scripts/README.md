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

## `backup-outfits.mjs`

Sao lưu toàn bộ `users/{uid}/outfits` ra một file JSON dưới `backups/`.
**Chỉ đọc, không ghi gì lên Firestore.** Chạy trước `optimize-images.mjs --apply`:
bước đó thay base64 trong document bằng URL, xong rồi thì bản gốc không còn nữa.

```bash
node scripts/backup-outfits.mjs
```

Thư mục `backups/` đã nằm trong `.gitignore` — file này chứa ảnh của người dùng.

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

`optimize-images.mjs` **đã chạy trên dữ liệu thật ngày 27/08/2026**: 139/144 document
xử lý xong, dữ liệu Firestore giảm từ 23,64 MB xuống 0,11 MB. 5 document còn lại lỗi
403 vì ảnh đã biến mất khỏi Storage — xem cuối file. `find-orphan-files.mjs` thì
**vẫn chưa chạy trên dữ liệu thật**. Phần quyết định đã có test
(`tests/resize.test.ts`, `tests/scriptLib.test.ts`) và bộ thu nhỏ ảnh đã chạy thử
với ảnh 3024x4032 thật, nhưng vòng lặp đọc/ghi Firestore thì chưa.

Hãy chạy chế độ liệt kê trước, đọc kỹ kết quả, và backup Firestore
(`gcloud firestore export`) trước khi dùng `--apply`.

`optimize-images.mjs` ghi ảnh mới rồi mới cập nhật document, và không xoá gì cả —
nên nếu hỏng giữa chừng thì chỉ dư file, không mất dữ liệu. Chạy
`find-orphan-files.mjs` sau đó để dọn.

## Dữ liệu hỏng đã biết

Năm document dưới đây trỏ tới ảnh **không còn tồn tại trên Storage** (tải về báo
403). Không phải do migration gây ra — ảnh đã mất từ trước, và không khôi phục
được vì bản sao lưu cũng chỉ có URL chết. Trên app chúng hiện ra là ảnh vỡ.

```
ZnjduLs1MkdPBNLwDZw5kEAuxTk1/1YpH6DQVuVgmRF67R9Vw   1 ảnh
ZnjduLs1MkdPBNLwDZw5kEAuxTk1/NcbZhkwewEmgrnOUsJFo   3 ảnh
ZnjduLs1MkdPBNLwDZw5kEAuxTk1/P1jJg2VMDe4j3EUnh36h   1 ảnh
ZnjduLs1MkdPBNLwDZw5kEAuxTk1/oi1Fp4JXFa3dEwUnZxtJ   3 ảnh
fWaQe3wURHZxbn4L7Fqb6Nn1mrG3/FRkTAJayTL4YuDlkmXyE   1 ảnh
```

Chạy lại `optimize-images.mjs` sẽ luôn báo 5 document này cần xử lý và luôn lỗi.
