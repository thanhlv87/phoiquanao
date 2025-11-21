<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 👔 Outfit Logger v2.0

> Ứng dụng ghi lại trang phục hàng ngày với AI tagging, offline support và smart analytics

[![PWA](https://img.shields.io/badge/PWA-Enabled-blue)](https://web.dev/progressive-web-apps/)
[![Offline](https://img.shields.io/badge/Offline-Ready-green)](./PERFORMANCE_UPGRADE.md)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

## ✨ Tính năng

- 📸 **AI-Powered Tagging** - Tự động gắn thẻ từ ảnh với Gemini AI
- 📴 **Offline First** - Hoạt động hoàn toàn offline với IndexedDB + Service Worker
- 📊 **Smart Analytics** - Thống kê phong cách và gợi ý thông minh
- 📅 **Visual Calendar** - Xem trang phục theo ngày với ảnh thumbnail
- 🔍 **Smart Search** - Tìm kiếm theo tags nhanh chóng
- 📦 **Collections** - Tổ chức outfits theo bộ sưu tập
- ⚡ **Lightning Fast** - Cache-first loading, 6x nhanh hơn
- 📱 **PWA** - Cài đặt như native app
- 🎨 **Beautiful UI** - Tailwind CSS responsive design

## 🚀 Nâng cấp v2.0

### Performance
- ⚡ **6x faster load** - Cache-first với IndexedDB
- 🖼️ **Lazy loading** - Images load khi scroll
- 📦 **Code splitting** - Giảm 25% bundle size

### Offline Support
- 📴 **100% offline** - Service Worker + IndexedDB
- 🔄 **Auto-sync** - Background sync khi online
- 💾 **Image cache** - Firebase Storage images cached

### Smart Features
- 📊 **Analytics** - Top items, trends, patterns
- 💡 **Suggestions** - AI-powered recommendations
- 🎯 **Insights** - Usage statistics dashboard

👉 **[Chi tiết nâng cấp](UPGRADE_NOTES.md)**

## 📦 Tech Stack

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Backend:** Firebase (Auth, Firestore, Storage)
- **AI:** Google Gemini 2.5 Flash
- **Build:** Vite 6
- **Offline:** Service Worker + IndexedDB

## 🏃 Run Locally

**Prerequisites:** Node.js >= 18

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
# Create .env.local and add:
# GEMINI_API_KEY=your_gemini_api_key

# 3. Run development server
npm run dev

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

## 📂 Project Structure

```
outfit-logger/
├── components/         # Reusable components
│   ├── LazyImage.tsx   # Lazy loading image component
│   ├── BottomNav.tsx   # Navigation bar
│   └── Icon.tsx        # SVG icons
├── screens/            # Page components
│   ├── HomeScreen.tsx
│   ├── InsightsScreen.tsx  # NEW: Analytics screen
│   └── ...
├── services/           # Backend services
│   ├── cacheService.ts     # NEW: IndexedDB cache
│   ├── firebaseService.ts
│   └── geminiService.ts
├── hooks/              # Custom React hooks
│   ├── useOutfits.tsx
│   └── useCollections.tsx
├── utils/              # Utility functions
│   ├── analyticsUtils.ts   # NEW: Smart analytics
│   └── serviceWorkerRegistration.ts  # NEW
├── public/
│   ├── service-worker.js   # NEW: Offline support
│   └── manifest.json       # NEW: PWA config
└── types.ts            # TypeScript types
```

## 🎯 Key Features Details

### 1. AI Tagging
```typescript
// Auto-tag outfits from images
const tags = await generateTagsFromImage(base64Image);
// Returns: { tops: [], bottoms: [], general: [] }
```

### 2. Offline Support
```typescript
// Works completely offline
- View all cached outfits
- Add/edit (syncs when online)
- View cached images
```

### 3. Smart Analytics
```typescript
// Get insights
const stats = calculateOutfitStats(outfits);
// Returns: top items, trends, suggestions
```

### 4. PWA Installation
```typescript
// Install as native app
window.installApp();
```

## 📱 Screenshots

### Main Screens
- **Home:** Today's outfit + flashback timeline
- **Calendar:** Visual calendar với outfit thumbnails
- **Insights:** Analytics và smart suggestions *(NEW)*
- **Collections:** Organize outfits
- **Search:** Find by tags

## 🔧 Configuration

### Firebase Setup
1. Create Firebase project
2. Enable Auth, Firestore, Storage
3. Add config to `services/firebaseConfig.ts`

### Gemini API
1. Get API key from [AI Studio](https://ai.google.dev/)
2. Add to `.env.local`: `GEMINI_API_KEY=your_key`

## 📊 Performance

| Metric | Before | After v2.0 |
|--------|--------|------------|
| First load | 2-3s | **0.5s** ⚡ |
| Reload | 1-2s | **0.05s** 🚀 |
| Offline | ❌ | **✅** 📴 |
| Bundle size | 800KB | **600KB** 📦 |

## 🧪 Testing

```bash
# Test offline mode
1. npm run dev
2. DevTools → Network → Offline
3. Reload → App works!

# Test PWA
1. npm run build
2. npm run preview
3. Chrome → Install app
```

## 📚 Documentation

- [Performance Upgrade Guide](PERFORMANCE_UPGRADE.md)
- [Changes Summary](CHANGES_SUMMARY.md)
- [Upgrade Notes](UPGRADE_NOTES.md)

## 🤝 Contributing

Contributions welcome! Please check existing issues or create new ones.

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- Google Gemini AI for tagging
- Firebase for backend
- React team for amazing framework

---

**View your app in AI Studio:** https://ai.studio/apps/drive/1O4SFJ8XxlkjYiRGdd_tSXHcob6lX6JBr

Made with ❤️ by Outfit Logger Team
