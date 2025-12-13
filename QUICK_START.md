# ⚡ Quick Start - Outfit Logger v2.0

## 🚀 5 phút để chạy được app

### Bước 1: Clone & Install
```bash
cd /d/phoiquanao
npm install
```

### Bước 2: Setup API Key
Tạo file `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get API key: https://ai.google.dev/

### Bước 3: Run
```bash
npm run dev
```

Mở http://localhost:3000

✅ Done! App đang chạy.

---

## 📱 Hướng dẫn sử dụng nhanh

### 1. Đăng nhập/Đăng ký
- Dùng email hoặc chế độ khách

### 2. Thêm outfit đầu tiên
- Trang chủ → "Thêm trang phục hôm nay"
- Chọn ảnh → "Tạo thẻ bằng AI"
- Lưu

### 3. Xem analytics
- Bottom nav → Tab "Thống kê" (✨)
- Xem top items, trends, suggestions

### 4. Test offline
- DevTools → Network → Offline
- Reload → Vẫn hoạt động!

### 5. Install PWA
- Chrome menu → "Install Outfit Logger"
- Launch từ desktop

---

## 🎯 Main Features Quick Guide

### AI Tagging
```
1. Add outfit
2. Upload image
3. Click "Tạo thẻ bằng AI"
4. Auto-generated tags!
```

### Collections
```
1. Bottom nav → Bộ sưu tập
2. Click "Tạo mới"
3. Name it (e.g., "Đồ đi làm")
4. Add outfits to collection
```

### Search
```
1. Bottom nav → Tìm kiếm
2. Type tag (e.g., "áo phông")
3. See matching outfits
```

### Calendar
```
1. Bottom nav → Lịch
2. Browse by month
3. Click day → See outfits
4. Click outfit → Edit/view details
```

---

## 🔥 New in v2.0

### Cache-First Loading
- Data loads instantly from cache
- No waiting for network!

### Offline Support
- Works 100% offline
- Auto-syncs when back online

### Smart Insights
- See what you wear most
- Get style suggestions
- Track patterns

---

## 💡 Tips & Tricks

### Tăng tốc upload
- Ảnh tự động nén xuống 1080px
- Chọn nhiều ảnh cùng lúc

### Tổ chức tốt hơn
- Dùng collections cho từng occasion
- Tag cụ thể cho dễ search

### Tận dụng AI
- AI tag thường chính xác 80-90%
- Có thể edit/add thêm tags

### Sử dụng offline
- Open app khi có mạng để cache
- Sau đó dùng offline bất cứ lúc nào

---

## 🐛 Troubleshooting

### "AI features disabled"
→ Check `.env.local` có `GEMINI_API_KEY`

### Service Worker error
→ Chỉ hoạt động trên HTTPS hoặc localhost

### Data không load
→ Clear cache: DevTools → Application → Clear storage

### Images không hiện
→ Check Firebase Storage permissions

---

## 📚 Docs

- [Full Upgrade Guide](PERFORMANCE_UPGRADE.md)
- [Changes Summary](CHANGES_SUMMARY.md)
- [README](README.md)

---

**Enjoy! 🎉**


## Hướng dẫn kết nối Cloudflare Images

Để sử dụng tính năng tải ảnh lên Cloudflare, bạn cần thiết lập một điểm cuối (endpoint) backend nhỏ để tạo URL tải lên an toàn.

### 1. Biến môi trường Backend

Backend của bạn sẽ cần các biến môi trường sau từ trang tổng quan Cloudflare của bạn:

```
CLOUDFLARE_ACCOUNT_ID="ID tài khoản của bạn"
CLOUDFLARE_API_TOKEN="Mã thông báo API của bạn với quyền chỉnh sửa Hình ảnh"
```

### 2. Backend Function (Vercel Serverless Function)

Bạn cần tạo tệp này trong dự án của mình để Vercel có thể xử lý yêu cầu.

1.  Tạo thư mục `api` ở cấp độ gốc của dự án (cùng cấp với `src`, `public`, v.v.).
2.  Tạo tệp `generate-upload-url.js` bên trong thư mục `api`.
3.  Sao chép nội dung sau vào tệp đó:

```javascript
// api/generate-upload-url.js

export default async function handler(req, res) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return res.status(500).json({ error: 'Cloudflare credentials are not configured.' });
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error: ${errorText}`);
    }

    const { result } = await response.json();
    res.status(20).json({ uploadURL: result.uploadURL });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate upload URL.' });
 }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};
```

Sau khi thêm tệp này, hãy đảm bảo rằng bạn đã triển khai lại ứng dụng của mình lên Vercel.

### 3. Biến môi trường Frontend

Trong tệp `.env` của bạn, hãy đảm bảo bạn đã đặt biến trỏ đến điểm cuối API của mình:

```
VITE_UPLOAD_URL_GENERATOR_ENDPOINT="/api/generate-upload-url"
VITE_API_BASE_URL="https://your-vercel-project-url.vercel.app"
```

**Quan trọng:** Thay thế `https://your-vercel-project-url.vercel.app` bằng URL triển khai Vercel thực tế của bạn.

Sau khi thiết lập, tùy chọn "Cloudflare" trong ứng dụng sẽ hoạt động bằng cách gọi hàm không máy chủ này để tải ảnh lên một cách an toàn.


### 4. Đặt biến môi trường trên Vercel

Để hàm không máy chủ của bạn hoạt động khi được triển khai, bạn cần đặt các biến môi trường Cloudflare trong cài đặt dự án Vercel của mình:

1.  Truy cập trang tổng quan dự án của bạn trên Vercel.
2.  Đi tới tab **Settings**.
3.  Chọn **Environment Variables** trong menu bên trái.
4.  Thêm ba biến sau:
    *   **Name:** `CLOUDFLARE_ACCOUNT_ID`, **Value:** `ID tài khoản Cloudflare của bạn`
    *   **Name:** `CLOUDFLARE_API_TOKEN`, **Value:** `Mã thông báo API Cloudflare của bạn`
    *   **Name:** `VITE_API_BASE_URL`, **Value:** `URL triển khai Vercel của bạn (ví dụ: https://your-project.vercel.app)`
5.  Lưu các thay đổi. Vercel sẽ tự động áp dụng các biến này cho môi trường sản xuất, xem trước và phát triển của bạn.
