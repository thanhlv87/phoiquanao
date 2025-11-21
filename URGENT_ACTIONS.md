# 🚨 HÀNH ĐỘNG NGAY - BẢO MẬT

## ⚠️ PHÁT HIỆN VẤN ĐỀ

Firebase API keys **ĐÃ BỊ LỘ CÔNG KHAI** trên GitHub!

---

## ✅ ĐÃ FIX (Tự động)

1. ✅ Code đã được cập nhật để dùng environment variables
2. ✅ TypeScript definitions đã được tạo
3. ✅ Template `.env.example` đã tạo
4. ✅ `.gitignore` đã đúng (bảo vệ `.env.local`)

---

## 🔥 BẠN CẦN LÀM NGAY (3 BƯỚC)

### Bước 1: Regenerate Firebase Keys (5 phút)

1. Vào: https://console.firebase.google.com
2. Chọn project: **phoiquanao**
3. Settings ⚙️ → Project Settings
4. Tab **General** → **Your apps**
5. **XÓA app web cũ** (để vô hiệu hóa keys cũ)
6. **TẠO app web mới**
7. **COPY** toàn bộ config mới

### Bước 2: Set Environment Variables (3 phút)

#### A. Local Development
```bash
# Copy template
cp .env.example .env.local

# Edit .env.local và điền keys MỚI (từ Bước 1)
```

Nội dung `.env.local`:
```env
GEMINI_API_KEY=your_gemini_key

VITE_FIREBASE_API_KEY=NEW_KEY_FROM_STEP_1
VITE_FIREBASE_AUTH_DOMAIN=phoiquanao.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=phoiquanao
VITE_FIREBASE_STORAGE_BUCKET=phoiquanao.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=NEW_SENDER_ID
VITE_FIREBASE_APP_ID=NEW_APP_ID
```

#### B. Vercel
1. https://vercel.com/dashboard → Your project
2. Settings → Environment Variables
3. Add 7 biến (dùng keys MỚI):

```
GEMINI_API_KEY
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Environment: Chọn cả 3 (Production, Preview, Development)

### Bước 3: Deploy (2 phút)

```bash
# Test local
npm run dev
# Mở http://localhost:3000 → Check hoạt động OK

# Commit changes
git add .
git commit -m "security: Move Firebase config to environment variables"
git push

# Vercel sẽ auto-deploy
```

---

## ⏱️ TẠM THỜI VẪN HOẠT ĐỘNG

Code có **fallback** nên app vẫn chạy với keys cũ nếu chưa set env vars.

**NHƯNG:** Keys cũ đã public → CẦN thay ngay!

---

## 📋 Checklist

- [ ] Regenerated Firebase keys (XÓA app cũ, TẠO mới)
- [ ] Tạo `.env.local` với keys mới
- [ ] Set env vars trên Vercel
- [ ] Test local (`npm run dev`)
- [ ] Commit & push code
- [ ] Verify Vercel deployment hoạt động
- [ ] XÓA keys cũ khỏi Firebase Console

---

## 🔍 Verify

### Test Local
```bash
npm run dev
# Login → Add outfit → Should work!
```

### Test Vercel
```
https://your-app.vercel.app
# Should work after redeploy
```

---

## 📚 Chi Tiết

Xem file: [SECURITY_FIX_URGENT.md](SECURITY_FIX_URGENT.md)

---

## 🎯 Tóm Tắt

**Vấn đề:**
- Firebase keys bị lộ trên GitHub

**Đã fix:**
- ✅ Code dùng env vars
- ✅ Docs đầy đủ
- ✅ Templates ready

**Bạn cần làm:**
1. ⚠️ Regenerate keys (5 phút)
2. ⚠️ Set env vars (3 phút)
3. ⚠️ Deploy (2 phút)

**Total: 10 phút** → App an toàn!

---

**Priority: 🔴 URGENT - Làm NGAY!**
