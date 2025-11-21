# ⚡ Fix Trang Trắng Vercel - Quick Guide

## 🔥 Làm NGAY (5 phút)

### Bước 1: Set Environment Variables ⚠️ QUAN TRỌNG
1. Vào https://vercel.com/dashboard
2. Chọn project của bạn
3. Settings → Environment Variables
4. Thêm biến:
   ```
   Name: GEMINI_API_KEY
   Value: [your_api_key]
   Environment: ✅ Production ✅ Preview ✅ Development
   ```
5. Click **Save**

### Bước 2: Check Build Settings
Settings → General → Build & Development Settings:
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node.js Version: 18.x
```

### Bước 3: Redeploy
1. Deployments tab
2. Click **Redeploy** (deployment mới nhất)
3. **Turn OFF** "Use existing Build Cache"
4. Click **Redeploy**

---

## ✅ Files Đã Được Tạo Tự Động

- ✅ `vercel.json` - Routing config
- ✅ `.vercelignore` - Ignore files
- ✅ `vite.config.ts` - Updated build config
- ✅ `VERCEL_DEPLOY_GUIDE.md` - Full guide

---

## 🔍 Kiểm Tra Sau Deploy

### 1. Check Site Load
Mở: `https://your-app.vercel.app`
- ✅ Thấy trang chủ
- ✅ Bottom navigation 5 tabs

### 2. Check Console (F12)
- ✅ Không có errors màu đỏ
- ✅ Service Worker registered

### 3. Test Routes
Click các tabs:
- ✅ Trang chủ
- ✅ Bộ sưu tập
- ✅ Thống kê
- ✅ Tìm kiếm
- ✅ Lịch

---

## 🐛 Vẫn Còn Lỗi?

### Console có lỗi "API_KEY not defined"?
→ Chưa set `GEMINI_API_KEY` trên Vercel
→ Xem Bước 1 ở trên

### Build failed?
→ Check Build Logs trong Deployments tab
→ Thường do missing dependencies

### 404 errors?
→ Check `vercel.json` đã commit chưa
→ Redeploy với cache OFF

---

## 📝 Commit Changes

Nếu chưa push các file mới:

```bash
git add .
git commit -m "fix: Add Vercel configuration and build fixes"
git push
```

Vercel sẽ tự động deploy lại.

---

## 🎯 Quick Checklist

- [ ] Environment variables set trên Vercel
- [ ] Build command = `npm run build`
- [ ] Output directory = `dist`
- [ ] Node version = 18.x
- [ ] Files mới đã commit và push
- [ ] Redeploy với cache OFF
- [ ] Site load được (không trắng)
- [ ] Console không errors

---

## 📚 Chi Tiết Hơn

Đọc file: [VERCEL_DEPLOY_GUIDE.md](VERCEL_DEPLOY_GUIDE.md)

---

**Chúc thành công! 🚀**
