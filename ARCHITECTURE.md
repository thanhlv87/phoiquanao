# 🏗️ Architecture - Outfit Logger v2.0

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  ┌────────┬──────────┬──────────┬────────┬──────────┐  │
│  │  Home  │Collections│ Insights │ Search │ Calendar │  │
│  └────────┴──────────┴──────────┴────────┴──────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    State Management                      │
│  ┌──────────────┬────────────────┬──────────────────┐  │
│  │ useOutfits() │useCollections()│   useAuth()      │  │
│  │   Context    │    Context     │   Context        │  │
│  └──────────────┴────────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Caching Layer (NEW)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │         IndexedDB Cache Service                  │   │
│  │  - Outfits Store                                 │   │
│  │  - Collections Store                             │   │
│  │  - Images Store                                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
       ↓                    ↓                    ↓
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│   Service    │  │  Service Worker  │  │   Firebase   │
│   Worker     │  │  (Offline Cache) │  │   Services   │
│              │  │                  │  │              │
│  - Static    │  │  - Runtime Cache │  │  - Firestore │
│    Assets    │  │  - Image Cache   │  │  - Storage   │
│  - App Shell │  │  - API Cache     │  │  - Auth      │
└──────────────┘  └──────────────────┘  └──────────────┘
                                                ↓
                                       ┌──────────────┐
                                       │   Gemini AI  │
                                       │   (Tagging)  │
                                       └──────────────┘
```

---

## Data Flow

### 1. Initial Load (Cache-First)

```
User Opens App
      ↓
Check IndexedDB Cache
      ↓
   Has Cache? ────YES──→ Display Cached Data (Instant)
      │                          ↓
      NO                   Fetch Fresh from Firebase
      ↓                          ↓
Fetch from Firebase          Update Cache & UI
      ↓
Store in Cache
      ↓
Display Data
```

### 2. Add/Edit Outfit

```
User Uploads Image
      ↓
Compress Image (1080p, 70% quality)
      ↓
[Optional] AI Tagging (Gemini)
      ↓
User Reviews/Edits Tags
      ↓
Save to Firebase
      ↓  ↓  ↓
Firestore  Storage  Update State
      ↓      ↓         ↓
  Update IndexedDB Cache
      ↓
Display Updated UI
```

### 3. Offline Mode

```
User Opens App (Offline)
      ↓
Service Worker Intercepts Requests
      ↓
Check Cache Storage
      ↓
   Has Cache? ────YES──→ Return Cached Data
      │                          ↓
      NO                   Return Offline Page
      ↓
Queue Changes (if any)
      ↓
When Online: Sync Queue
```

---

## Component Architecture

### Screen Components

```
screens/
├── HomeScreen.tsx
│   ├── OutfitCarousel
│   ├── FlashbackSection
│   ├── StyleSuggestion
│   └── SignUpPrompt
│
├── InsightsScreen.tsx ⭐ NEW
│   ├── StatCard
│   ├── SuggestionCard
│   └── Charts/Bars
│
├── CalendarScreen.tsx
│   ├── Calendar Grid
│   ├── OutfitPreview
│   └── OutfitDetailModal
│
├── AddOutfitScreen.tsx
│   ├── ImageUpload
│   ├── TagInputSection
│   └── CollectionsSection
│
├── SearchScreen.tsx
│   └── Results Grid
│
└── CollectionsScreen.tsx
    └── Collection Cards
```

### Shared Components

```
components/
├── BottomNav.tsx
│   └── NavItem (5 tabs)
│
├── Icon.tsx
│   └── SVG Icons (10+ types)
│
└── LazyImage.tsx ⭐ NEW
    ├── IntersectionObserver
    └── Cache Integration
```

---

## Service Layer

### 1. Firebase Service

```typescript
firebaseService.ts
├── getOutfits()           - Fetch user outfits
├── addOrUpdateOutfit()    - Save outfit with images
├── deleteOutfit()         - Remove outfit + images
├── getCollections()       - Fetch collections
├── addCollection()        - Create collection
└── deleteCollection()     - Remove collection
```

### 2. Cache Service ⭐ NEW

```typescript
cacheService.ts
├── initDB()              - Initialize IndexedDB
├── cacheOutfits()        - Store outfits locally
├── getCachedOutfits()    - Retrieve from cache
├── cacheCollections()    - Store collections
├── getCachedCollections()- Retrieve collections
├── cacheImage()          - Store image blob
├── getCachedImage()      - Get cached image
└── clearCache()          - Clear all caches
```

### 3. Gemini Service

```typescript
geminiService.ts
├── generateTagsFromImage()    - AI tagging
│   └── Returns: { tops, bottoms, general }
│
└── generateOutfitSuggestion() - Style advice
    └── Returns: string recommendation
```

### 4. Analytics Utils ⭐ NEW

```typescript
analyticsUtils.ts
├── calculateOutfitStats()     - Compute statistics
│   └── Returns: OutfitStats object
│
├── generateSmartSuggestions() - AI recommendations
│   └── Returns: SmartSuggestion[]
│
└── getOutfitRecommendations() - Context-aware tips
    └── Returns: string[]
```

---

## State Management

### Context Providers

```
App Root
  └── AuthProvider
      └── CollectionProvider
          └── OutfitProvider
              └── Router
                  └── Screens
```

### State Flow

```
useOutfits() Context
├── state
│   ├── outfitsByDate: Record<dateId, Outfit[]>
│   ├── allOutfits: Record<id, Outfit>
│   ├── loading: boolean
│   └── error: Error | null
│
├── addOrUpdateOutfit()
│   ├── 1. Save to Firebase
│   ├── 2. Update local state
│   └── 3. Update IndexedDB cache
│
└── deleteOutfit()
    ├── 1. Optimistic UI update
    ├── 2. Delete from Firebase
    └── 3. Update cache (on success)
```

---

## Caching Strategy

### Cache Hierarchy

```
1. Memory (React State)
   ↓ [miss]
2. IndexedDB (Persistent)
   ↓ [miss]
3. Service Worker Cache (Network assets)
   ↓ [miss]
4. Firebase (Source of truth)
```

### Cache Policies

| Resource Type | Strategy | Cache Duration |
|--------------|----------|----------------|
| Outfits data | Cache-first | Until updated |
| Collections | Cache-first | Until updated |
| Images (Firebase) | Cache-first | Permanent |
| Static assets | Cache-first | Version-based |
| API calls | Network-first | 5 minutes |

---

## Offline Architecture

### Service Worker Scopes

```
Static Assets (App Shell)
├── index.html
├── JavaScript bundles
├── CSS
└── Icons

Runtime Cache
├── Firebase Storage Images
├── API Responses
└── Dynamic content

No Cache
├── Firebase Auth
├── Firestore writes
└── Analytics
```

### Sync Strategy

```
Online:
  ↓
Normal operation
  ↓
Write to Firebase
  ↓
Update caches

Offline:
  ↓
Read from caches
  ↓
Queue writes
  ↓
[When online]
  ↓
Flush write queue
```

---

## Performance Optimizations

### 1. Code Splitting

```
Vendor Chunks:
├── react-vendor.js (200KB)
│   ├── react
│   ├── react-dom
│   └── react-router-dom
│
└── firebase-vendor.js (180KB)
    ├── firebase/app
    ├── firebase/auth
    ├── firebase/firestore
    └── firebase/storage

App Chunks:
├── main.js (220KB)
└── Dynamic imports (routes)
```

### 2. Image Optimization

```
Upload Flow:
Raw Image
  ↓
Compress (maxWidth: 1080, quality: 0.7)
  ↓
Convert to Base64
  ↓
Upload to Firebase Storage
  ↓
Cache in IndexedDB
  ↓
Lazy Load in UI
```

### 3. Lazy Loading

```
IntersectionObserver
  ↓
Image enters viewport - 50px
  ↓
Check IndexedDB cache
  ↓
Cache hit? ──YES──→ Display
     │
     NO
     ↓
Fetch from Firebase
     ↓
Store in cache
     ↓
Display
```

---

## Security & Privacy

### Data Flow Security

```
User Data
  ↓
[Encrypted] Firebase Auth
  ↓
Firebase Rules (User-specific)
  ↓
[Encrypted] Firestore
  ↓
[Encrypted] Local Cache
```

### Storage Locations

1. **Firebase** (Cloud)
   - Encrypted at rest
   - User-specific rules
   - Backup enabled

2. **IndexedDB** (Local)
   - Isolated per origin
   - Cleared on logout
   - Not shared between users

3. **Service Worker Cache** (Local)
   - HTTPS only
   - Version-controlled
   - Public resources only

---

## Deployment Architecture

```
Development:
  Vite Dev Server (localhost:3000)
  ↓
Build:
  npm run build
  ↓
Output:
  dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js
  │   └── vendor-[hash].js
  ├── service-worker.js
  └── manifest.json
  ↓
Deploy:
  Firebase Hosting / Vercel / Netlify
  ↓
Production:
  HTTPS Required (Service Worker)
```

---

## Analytics Flow ⭐ NEW

```
User Actions
  ↓
Track in Outfits Data
  ↓
Calculate Statistics
  ├── Frequency Analysis
  ├── Pattern Detection
  └── Trend Analysis
  ↓
Generate Insights
  ├── Top Items
  ├── Usage Patterns
  └── Smart Suggestions
  ↓
Display in Insights Screen
```

---

## Technology Stack Summary

```
Frontend:
├── React 19
├── TypeScript 5.8
├── React Router 7
└── Tailwind CSS

Backend:
├── Firebase Auth
├── Firestore
├── Firebase Storage
└── Google Gemini AI

Build & Dev:
├── Vite 6
├── TypeScript Compiler
└── PostCSS

Performance:
├── Service Worker
├── IndexedDB
├── Intersection Observer
└── Code Splitting

PWA:
├── Web App Manifest
├── Service Worker
└── Install Prompt
```

---

**Architecture designed for:**
- ⚡ Performance
- 📴 Offline-first
- 🔒 Security
- 📈 Scalability
- 🎨 Maintainability

---

Made with ❤️ for Outfit Logger v2.0
