
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import { AuthProvider } from './hooks/useAuth';
import { CollectionProvider } from './hooks/useCollections';
import { MixProvider } from './hooks/useMixes';

function App() {
  const location = useLocation();
  const showNav = location.pathname !== '/auth';

  return (
    <AuthProvider>
      <CollectionProvider>
        <OutfitProvider>
          <MixProvider>
            <div className="max-w-lg mx-auto bg-slate-50 min-h-screen font-sans shadow-2xl">
              <main className={showNav ? "pb-20" : ""}>
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
                  <Route path="/auth" element={<AuthScreen />} />
                </Routes>
              </main>
              {showNav && <BottomNav />}
            </div>
          </MixProvider>
        </OutfitProvider>
      </CollectionProvider>
    </AuthProvider>
  );
}

export default App;
