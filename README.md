# Outfit Log

Nhật ký thời trang tối giản dạng PWA: chụp lại trang phục mỗi ngày, gắn thẻ áo/quần/phong cách, xem lại theo lịch.

## Tính năng

- **Nhật ký theo ngày** — nhiều bộ trang phục cho mỗi ngày, kèm nhiều ảnh (tự nén trước khi tải lên).
- **Lịch** — xem cả tháng dưới dạng ảnh thu nhỏ, bấm vào ngày để xem chi tiết.

Điều hướng gọn trong hai tab: Home và Lịch.
- **Thẻ gợi ý** — gợi ý thẻ dựng sẵn, tự học thêm thẻ bạn hay dùng (lưu ở localStorage).
- **Offline** — Firestore bật persistent cache, service worker cache vỏ ứng dụng.

## Công nghệ

React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · React Router 6 · Firebase (Auth, Firestore, Storage)

## Chạy tại máy

```bash
npm install
npm run dev
```

Build production và xem thử:

```bash
npm run build
npm run preview
```

Ứng dụng không cần biến môi trường nào. Cấu hình Firebase nằm trực tiếp trong
[`services/firebaseConfig.ts`](services/firebaseConfig.ts) — đây là cấu hình client
công khai theo thiết kế của Firebase, việc bảo vệ dữ liệu do security rules đảm nhiệm.

## Cấu hình Firebase

Dự án cần một Firebase project có bật:

- **Authentication** — phương thức Email/Password và Anonymous.
- **Cloud Firestore**
- **Cloud Storage**

Đổi `firebaseConfig` sang project của bạn, rồi triển khai security rules:

```bash
firebase deploy --only firestore:rules,storage
```

Rules nằm ở [`firestore.rules`](firestore.rules) và [`storage.rules`](storage.rules):
mọi dữ liệu nằm dưới `users/{uid}` và chỉ chính chủ mới đọc/ghi được.

## Cấu trúc dữ liệu

```
users/{uid}/outfits/{outfitId}      # bản ghi trang phục, imageUrls trỏ tới Storage
```

Ảnh được nén ở client rồi tải lên `users/{uid}/images/{outfitId}/` trên Cloud
Storage; Firestore chỉ lưu URL.

Bộ nén ([`utils/imageCompression.ts`](utils/imageCompression.ts)) thu ảnh về tối đa
1080px rồi mã hoá **cả WebP lẫn JPEG, giữ bản nhẹ hơn** — WebP nhỏ hơn ~37% với ảnh
chụp thường nhưng lại to hơn với ảnh nhiễu hạt, nên không ép cứng một định dạng.
Mỗi ảnh có ngân sách 250 KB: vượt thì hạ chất lượng dần (tối thiểu 0.4), vẫn vượt
thì thu nhỏ kích thước (tối thiểu 640px). Dung lượng được đo trên blob mã hoá thật
chứ không ước lượng. EXIF orientation được xử lý qua `createImageBitmap` nên ảnh
chụp dọc không bị xoay ngang.

> **Dữ liệu cũ có hai dạng.** Các bản ghi đời đầu đã trỏ tới Cloud Storage. Sau đó
> dự án có một giai đoạn nhúng thẳng base64 vào document Firestore (đã hoàn tác).
> Vì vậy `imageUrls` có thể chứa cả URL `https://firebasestorage...` lẫn data URL
> `data:image/jpeg;base64,...`. Cả hai đều hiển thị bình thường; khi xóa, chỉ URL
> `http` mới có object trên Storage để dọn.

## Bố cục mã nguồn

```
screens/     màn hình theo route
components/  thành phần dùng chung (Icon, BottomNav)
hooks/       context provider: auth, outfits, gợi ý thẻ
services/    Firebase
utils/       xử lý ngày tháng, nén ảnh
public/      service worker và web app manifest
```
