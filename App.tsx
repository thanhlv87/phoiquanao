
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { AddOutfitScreen } from './screens/AddOutfitScreen';
import { AuthScreen } from './screens/AuthScreen';
import { SearchScreen } from './screens/SearchScreen';
import { CollectionsScreen } from './screens/CollectionsScreen';
import { CollectionDetailScreen } from './screens/CollectionDetailScreen';
import { MixMatchScreen } from './screens/MixMatchScreen';
import { StatisticsScreen } from './screens/StatisticsScreen';
import { ClosetScreen } from './screens/ClosetScreen';
import { BottomNav } from './components/BottomNav';
import { OutfitProvider } from './hooks/useOutfits';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CollectionProvider } from './hooks/useCollections';
import { MixProvider } from './hooks/useMixes';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white text-[10px] font-black uppercase py-2 px-4 flex items-center justify-center gap-2 animate-fade-in shadow-lg">
      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      CHẾ ĐỘ NGOẠI TUYẾN - MỘT SỐ TÍNH NĂNG AI SẼ TẠM NGỪNG
    </div>
  );
};

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang kiểm tra bảo mật...</p>
      </div>
    );
  }

  if (!user && location.pathname !== '/auth') {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage = location.pathname === '/auth';
  const showNav = !isAuthPage && user;

  return (
    <div className="max-w-lg mx-auto bg-slate-50 min-h-screen font-sans shadow-2xl relative">
      <OfflineBanner />
      <main className={showNav ? "pb-24" : ""}>
        <Routes>
          <Route path="/auth" element={<AuthScreen />} />
          <Route
            path="/*"
            element={
              <AuthenticatedLayout>
                <Routes>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/calendar" element={<CalendarScreen />} />
                  <Route path="/search" element={<SearchScreen />} />
                  <Route path="/collections" element={<CollectionsScreen />} />
                  <Route path="/collection/:collectionId" element={<CollectionDetailScreen />} />
                  <Route path="/mix" element={<MixMatchScreen />} />
                  <Route path="/stats" element={<StatisticsScreen />} />
                  <Route path="/closet" element={<ClosetScreen />} />
                  <Route path="/add-outfit/:date" element={<AddOutfitScreen />} />
                  <Route path="/outfit/:outfitId" element={<AddOutfitScreen />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AuthenticatedLayout>
            }
          />
        </Routes>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CollectionProvider>
        <OutfitProvider>
          <MixProvider>
            <AppContent />
          </MixProvider>
        </OutfitProvider>
      </CollectionProvider>
    </AuthProvider>
  );
}

export default App;
