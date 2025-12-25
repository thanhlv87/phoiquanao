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
