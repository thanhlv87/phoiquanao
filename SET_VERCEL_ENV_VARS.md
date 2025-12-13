# ⚡ Set Environment Variables trên Vercel

## 📋 Danh sách các biến cần thêm

### 1. GEMINI_API_KEY
```
Name: GEMINI_API_KEY
Value: [your_gemini_api_key]
```

### 2. VITE_FIREBASE_API_KEY
```
Name: VITE_FIREBASE_API_KEY
Value: AIzaSyD4Qpa7UV_4DB-C-SVbG8Ulze5Xpxvg-pg
```

### 3. VITE_FIREBASE_AUTH_DOMAIN
```
Name: VITE_FIREBASE_AUTH_DOMAIN
Value: phoiquanao.firebaseapp.com
```

### 4. VITE_FIREBASE_PROJECT_ID
```
Name: VITE_FIREBASE_PROJECT_ID
Value: phoiquanao
```

### 5. VITE_FIREBASE_STORAGE_BUCKET
```
Name: VITE_FIREBASE_STORAGE_BUCKET
Value: phoiquanao.firebasestorage.app
```

### 6. VITE_FIREBASE_MESSAGING_SENDER_ID
```
Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 745091328901
```

### 7. VITE_FIREBASE_APP_ID
```
Name: VITE_FIREBASE_APP_ID
Value: 1:745091328901:web:557b8bb09aa74ec17b72ec
```

---

## ☁️ Cloudflare Image Upload Variables

### 8. CLOUDFLARE_ACCOUNT_ID
```
Name: CLOUDFLARE_ACCOUNT_ID
Value: [your_cloudflare_account_id]
```

### 9. CLOUDFLARE_API_TOKEN
```
Name: CLOUDFLARE_API_TOKEN
Value: [your_cloudflare_api_token]
```

### 10. VITE_API_BASE_URL
```
Name: VITE_API_BASE_URL
Value: https://your-project-name.vercel.app
```
**Lưu ý:** Thay `https://your-project-name.vercel.app` bằng URL triển khai Vercel thực tế của bạn.

---

## 🔧 Cách thêm trên Vercel

### Bước 1: Vào Settings
1. Vào https://vercel.com/dashboard
2. Chọn project **phoiquanao**
3. Click tab **Settings**
4. Sidebar bên trái → **Environment Variables**

### Bước 2: Add từng biến
Với mỗi biến trên:
1. Click **Add New**
2. **Name**: Copy name từ danh sách trên
3. **Value**: Copy value tương ứng
4. **Environment**: ✅ Chọn cả 3:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### Bước 3: Redeploy
Sau khi add xong tất cả các biến:
1. Vào tab **Deployments**
2. Click **Redeploy** ở deployment mới nhất
3. **Turn OFF** "Use existing Build Cache"
4. Click **Redeploy**

---

## ✅ Checklist

- [ ] GEMINI_API_KEY
- [ ] VITE_FIREBASE_API_KEY
- [ ] VITE_FIREBASE_AUTH_DOMAIN
- [ ] VITE_FIREBASE_PROJECT_ID
- [ ] VITE_FIREBASE_STORAGE_BUCKET
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
- [ ] VITE_FIREBASE_APP_ID
- [ ] CLOUDFLARE_ACCOUNT_ID
- [ ] CLOUDFLARE_API_TOKEN
- [ ] VITE_API_BASE_URL
- [ ] All environments selected (3/3)
- [ ] Redeploy triggered

---

## 🎯 Verify

Sau khi deploy xong:
1. Mở site: `https://your-app.vercel.app`
2. Check trang load OK (không còn trắng)
3. F12 Console → Không có errors
4. Test login/signup
5. Test add outfit

---

## 📸 Screenshot Hướng Dẫn

### Add Environment Variable
```
┌─────────────────────────────────────────┐
│ Name:  GEMINI_API_KEY                   │
│ Value: [your_api_key_here]              │
│                                         │
│ Environment:                            │
│ ☑ Production                            │
│ ☑ Preview                               │
│ ☑ Development                           │
│                                         │
│ [Cancel]              [Save]            │
└─────────────────────────────────────────┘
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Environment Selection
**PHẢI chọn cả 3 environments** cho mỗi biến:
- Production: Site chính
- Preview: Preview deployments
- Development: Development builds

### Values Chính Xác
Copy **CHÍNH XÁC** values từ danh sách trên.
Không thêm/bớt dấu cách, quotes, hoặc ký tự đặc biệt.

### GEMINI_API_KEY
Đây là biến **DUY NHẤT** bạn cần điền key của mình.
Các biến Firebase khác đã có values sẵn ở trên.

---

## 🚨 Nếu Có Lỗi

### Lỗi: "Missing environment variable"
→ Check lại tên biến có đúng không (phân biệt hoa/thường)

### Lỗi: "Firebase: Error (auth/invalid-api-key)"
→ Check value VITE_FIREBASE_API_KEY có đúng không

### Site vẫn trắng
→ Check Build Logs xem có errors gì
→ Verify tất cả 7 biến đã add

---

## 🎉 Hoàn Thành!

Sau khi set đủ 7 biến và redeploy, site sẽ:
- ✅ Load bình thường (không còn trắng)
- ✅ Login/signup hoạt động
- ✅ Add outfit hoạt động
- ✅ All features work
- ✅ PWA có thể install

---

**Good luck! 🚀**
