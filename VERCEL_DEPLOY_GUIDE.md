# 🚀 Hướng dẫn Deploy lên Vercel - Fix Trang Trắng

## 🔧 Vấn đề và Giải pháp

### Lỗi trang trắng thường do:
1. ❌ Thiếu file `vercel.json`
2. ❌ Routing không đúng cho SPA
3. ❌ Environment variables chưa set
4. ❌ Build command sai
5. ❌ Output directory sai

### ✅ Đã fix:
- ✅ Tạo `vercel.json` với routing SPA
- ✅ Cập nhật `vite.config.ts`
- ✅ Thêm `.vercelignore`

---

## 📋 Bước 1: Cấu hình Vercel Dashboard

### Truy cập Project Settings
1. Vào https://vercel.com/dashboard
2. Chọn project của bạn
3. Vào **Settings**

### Build & Development Settings
Đảm bảo các setting này:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Environment Variables
Vào tab **Environment Variables** và thêm:

```
Name: GEMINI_API_KEY
Value: [your_gemini_api_key_here]
Environment: Production, Preview, Development
```

**LƯU Ý QUAN TRỌNG:**
- Key phải là `GEMINI_API_KEY` (không phải `API_KEY`)
- Chọn tất cả 3 environments
- Click **Save**

---

## 📋 Bước 2: Check Files Đã Tạo

### 1. vercel.json ✅
File này đã được tạo tự động với nội dung:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. .vercelignore ✅
```
node_modules
.env.local
dist
```

### 3. vite.config.ts ✅
Đã update với:
- `base: '/'`
- `outDir: 'dist'`
- `sourcemap: false`
- Fallback cho env vars

---

## 📋 Bước 3: Redeploy

### Option A: Từ Vercel Dashboard
1. Vào project trên Vercel
2. Tab **Deployments**
3. Click nút **"Redeploy"** ở deployment mới nhất
4. Chọn **"Use existing Build Cache"**: OFF
5. Click **Deploy**

### Option B: Push lại code
```bash
git add .
git commit -m "fix: Add Vercel configuration for SPA routing"
git push
```

Vercel sẽ tự động deploy lại.

---

## 🔍 Debug Deployment

### Check Build Logs
1. Vào **Deployments** tab
2. Click vào deployment đang build
3. Xem logs để tìm lỗi

### Các lỗi thường gặp:

#### Lỗi: "Build failed"
```bash
# Check logs có thông báo gì
# Thường do:
- Missing dependencies
- TypeScript errors
- Environment variables
```

**Giải pháp:**
```bash
# Test build local trước
npm install
npm run build

# Nếu build local thành công nhưng Vercel fail:
# → Check Node version trên Vercel
# → Vercel Settings → General → Node.js Version: 18.x
```

#### Lỗi: "Page not found (404)"
**Giải pháp:**
- Đảm bảo `vercel.json` có rewrites
- Check Output Directory = `dist`

#### Lỗi: "Blank white page"
**Nguyên nhân:**
1. Console errors (F12 để check)
2. Environment variables chưa set
3. Firebase config sai

**Giải pháp:**
```bash
# Check browser console (F12)
# Nếu thấy "API_KEY not defined":
# → Add GEMINI_API_KEY vào Vercel env vars

# Nếu thấy "Firebase: ..."
# → Check services/firebaseConfig.ts
```

---

## 🎯 Checklist Deploy Thành Công

### Pre-Deploy
- [x] File `vercel.json` tồn tại
- [x] File `.vercelignore` tồn tại
- [x] `vite.config.ts` đã update
- [ ] Environment variables đã set trên Vercel
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

### Post-Deploy
- [ ] Site load được (không còn trang trắng)
- [ ] Console không có errors (F12)
- [ ] Routing hoạt động (click vào các tabs)
- [ ] Service Worker đăng ký thành công
- [ ] PWA manifest load được

---

## 🔥 Quick Fix Commands

### Local Test
```bash
# Build local để test
npm run build

# Preview production build
npm run preview

# Nếu preview OK → Vercel cũng sẽ OK
```

### Force Redeploy
```bash
# Commit một thay đổi nhỏ
git commit --allow-empty -m "chore: trigger redeploy"
git push

# Hoặc từ Vercel Dashboard → Redeploy
```

### Clear Vercel Cache
1. Vercel Dashboard → Deployments
2. Click **Redeploy**
3. **TURN OFF** "Use existing Build Cache"
4. Deploy

---

## 📊 Verify Deployment

### 1. Check Homepage
```
https://your-app.vercel.app/
```
✅ Nên thấy trang Home với "Chào buổi sáng"

### 2. Check Routes
```
https://your-app.vercel.app/#/calendar
https://your-app.vercel.app/#/insights
https://your-app.vercel.app/#/search
```
✅ Tất cả routes nên load được

### 3. Check Console (F12)
```
# Không nên có errors màu đỏ
# Service Worker nên register thành công
```

### 4. Check Network Tab
```
# index.html: 200 OK
# Assets: 200 OK
# service-worker.js: 200 OK
```

---

## ⚠️ Common Issues

### Issue 1: "Cannot read properties of undefined"
**Lỗi trong console:**
```
Cannot read properties of undefined (reading 'API_KEY')
```

**Fix:**
1. Vào Vercel → Settings → Environment Variables
2. Add `GEMINI_API_KEY`
3. Redeploy

### Issue 2: Firebase Errors
**Lỗi:**
```
Firebase: Error (auth/invalid-api-key)
```

**Fix:**
1. Check `services/firebaseConfig.ts`
2. Verify Firebase config đúng
3. Check Firebase console có enable Auth/Firestore chưa

### Issue 3: 404 on Refresh
**Lỗi:** F5 refresh page → 404

**Fix:**
- Đảm bảo `vercel.json` có rewrites
- Hoặc dùng HashRouter (đã có)

---

## 🎉 Deploy Thành Công!

Sau khi fix, bạn sẽ thấy:
- ✅ Trang chủ load đầy đủ
- ✅ Bottom nav hoạt động
- ✅ Có thể thêm outfit
- ✅ Service Worker active
- ✅ PWA có thể install

---

## 📞 Still Having Issues?

### Check These:
1. **Vercel Build Logs** - Có errors gì?
2. **Browser Console** - F12 xem errors
3. **Network Tab** - Files nào fail?
4. **Environment Variables** - Đã set chưa?

### Get URL for Debugging
```bash
# Share URL với ai đó để test
https://your-app.vercel.app

# Hoặc deployment URL cụ thể
https://your-app-abc123.vercel.app
```

---

## 🚀 Next Steps

Sau khi deploy thành công:

1. **Custom Domain** (optional)
   - Vercel Settings → Domains
   - Add your domain

2. **Analytics** (optional)
   - Vercel Analytics
   - Or Google Analytics

3. **Monitor**
   - Check Vercel Dashboard
   - Monitor errors
   - Check performance

---

**Good luck! 🎉**

Nếu vẫn gặp vấn đề, gửi cho tôi:
1. Build logs từ Vercel
2. Console errors (F12)
3. Screenshot lỗi
