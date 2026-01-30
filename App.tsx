
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { AddOutfitScreen } from './screens/AddOutfitScreen';
import { AuthScreen } from './screens/AuthScreen';
import { CollectionsScreen } from './screens/CollectionsScreen';
import { CollectionDetailScreen } from './screens/CollectionDetailScreen';
import { BottomNav } from './components/BottomNav';
import { OutfitProvider } from './hooks/useOutfits';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CollectionProvider } from './hooks/useCollections';

const HomeSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 min-h-screen bg-slate-50 animate-pulse">
    <div className="flex justify-between items-center mb-8 pt-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
        <div className="space-y-2">
          <div className="w-24 h-4 bg-slate-200 rounded"></div>
          <div className="w-16 h-3 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-10 h-10 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
    <div className="w-full h-24 bg-slate-200 rounded-[2.2rem] mb-8"></div>
    <div className="w-32 h-3 bg-slate-200 rounded mb-4"></div>
    <div className="w-full aspect-[4/5] bg-slate-200 rounded-[2.2rem]"></div>
  </div>
);

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
      CHẾ ĐỘ NGOẠI TUYẾN
    </div>
  );
};

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <HomeSkeleton />;
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
                  <Route path="/collections" element={<CollectionsScreen />} />
                  <Route path="/collection/:collectionId" element={<CollectionDetailScreen />} />
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
          <AppContent />
        </OutfitProvider>
      </CollectionProvider>
    </AuthProvider>
  );
}

export default App;
