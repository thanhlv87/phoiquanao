# 🚨 CẢNH BÁO BẢO MẬT - PHẢI FIX NGAY!

## ⚠️ VẤN ĐỀ NGHIÊM TRỌNG

Firebase API keys của bạn **ĐÃ BỊ LỘ** trên GitHub!

### 🔴 API Keys bị exposed:
- ✅ **ĐÃ FIX trong code** - Chuyển sang dùng environment variables
- ❌ **VẪN CÒN trên GitHub history** - Cần xóa khỏi lịch sử Git

---

## 🔥 HÀNH ĐỘNG NGAY (QUAN TRỌNG!)

### Bước 1: Regenerate Firebase Keys (BẮT BUỘC!)

1. Vào Firebase Console: https://console.firebase.google.com
2. Chọn project **phoiquanao**
3. Settings (⚙️) → Project Settings
4. Tab **General** → Scroll xuống **Your apps**
5. Click vào Web app của bạn
6. **Xóa app cũ và tạo app mới** (để có API key mới)
7. **LƯU LẠI** credentials mới

### Bước 2: Set Environment Variables

#### Local Development (.env.local)
Tạo file `.env.local`:
```env
# Gemini AI
GEMINI_API_KEY=your_new_gemini_key

# Firebase (NEW KEYS - sau khi regenerate)
VITE_FIREBASE_API_KEY=your_new_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=phoiquanao.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=phoiquanao
VITE_FIREBASE_STORAGE_BUCKET=phoiquanao.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_new_messaging_sender_id
VITE_FIREBASE_APP_ID=your_new_app_id
```

#### Vercel Environment Variables
1. Vào https://vercel.com/dashboard
2. Project → Settings → Environment Variables
3. Add các biến sau (dùng keys MỚI sau khi regenerate):

```
GEMINI_API_KEY = your_new_gemini_key
VITE_FIREBASE_API_KEY = your_new_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN = phoiquanao.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = phoiquanao
VITE_FIREBASE_STORAGE_BUCKET = phoiquanao.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = your_new_messaging_sender_id
VITE_FIREBASE_APP_ID = your_new_app_id
```

**Environment:** Chọn tất cả 3: Production, Preview, Development

### Bước 3: Update .gitignore

Đảm bảo file `.gitignore` có:
```
.env
.env.local
.env*.local
```

### Bước 4: Clean Git History (Optional - Nâng cao)

⚠️ **CẢNH BÁO:** Thao tác này sẽ rewrite Git history!

```bash
# Backup trước
git branch backup-before-clean

# Remove sensitive file from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch services/firebaseConfig.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (CẨN THẬN!)
git push origin --force --all
```

**Hoặc dùng BFG Repo-Cleaner (dễ hơn):**
```bash
# Download BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Clean
bfg --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

## 🛡️ Firebase Security Rules

### Firestore Rules
Cập nhật Firestore Rules để bảo vệ data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write only their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }

    // Prevent anonymous access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Storage Rules
Cập nhật Storage Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Only allow users to access their own files
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null
                  && request.auth.uid == userId;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024; // Max 10MB
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## ✅ Checklist Bảo Mật

### Ngay lập tức:
- [ ] Regenerate Firebase API keys
- [ ] Set environment variables trên Vercel
- [ ] Tạo `.env.local` cho local dev
- [ ] Update Firebase Security Rules
- [ ] Test app với keys mới

### Trong 24h:
- [ ] Review tất cả commits có chứa sensitive data
- [ ] Consider clean Git history
- [ ] Enable 2FA cho Firebase account
- [ ] Enable 2FA cho GitHub account
- [ ] Review Firebase Console logs

### Best Practices:
- [ ] Never commit `.env.local`
- [ ] Always use environment variables
- [ ] Regular security audit
- [ ] Monitor Firebase usage

---

## 🔍 Kiểm Tra Keys Đã Bị Lộ

### GitHub
```bash
# Search in GitHub
# Go to: https://github.com/your-username/your-repo/search
# Search: "AIzaSyD4Qpa7UV_4DB-C-SVbG8Ulze5Xpxvg-pg"
```

### Google Search
```
site:github.com "AIzaSyD4Qpa7UV_4DB-C-SVbG8Ulze5Xpxvg-pg"
```

Nếu tìm thấy → Keys đã public → **PHẢI regenerate ngay!**

---

## 📚 Tài Liệu Tham Khảo

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Git Remove Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

## 🆘 Nếu Keys Đã Bị Sử Dụng Sai

### Dấu hiệu:
- Firebase bill tăng đột ngột
- Lượng requests bất thường
- Data bị thay đổi không rõ nguồn gốc

### Hành động:
1. **Ngay lập tức:** Disable app cũ trong Firebase Console
2. Tạo app mới với keys mới
3. Review Firebase logs
4. Check billing alerts
5. Contact Firebase Support nếu cần

---

## ✅ Sau Khi Fix

### Test Local
```bash
npm install
npm run dev
# App should work with new keys
```

### Test Vercel
```bash
git add .
git commit -m "security: Move Firebase config to environment variables"
git push
# Vercel auto-deploy với env vars mới
```

---

## 🎯 Tóm Tắt

**Đã làm:**
- ✅ Update code để dùng env vars
- ✅ Tạo TypeScript definitions
- ✅ Fallback cho keys cũ (tạm thời)

**Cần làm NGAY:**
1. ⚠️ Regenerate Firebase keys
2. ⚠️ Set env vars trên Vercel
3. ⚠️ Tạo `.env.local` cho local
4. ⚠️ Update Firebase Security Rules
5. ⚠️ Test với keys mới

**Lâu dài:**
- Consider clean Git history
- Enable 2FA
- Regular security audits
- Monitor usage

---

**Priority: 🔴 CRITICAL - Fix trong vòng 24h!**

Nếu cần hỗ trợ, liên hệ ngay!
