
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { AddOutfitScreen } from './screens/AddOutfitScreen';
import { AuthScreen } from './screens/AuthScreen';
import { SearchScreen } from './screens/SearchScreen';
import { CollectionsScreen } from './screens/CollectionsScreen';
import { CollectionDetailScreen } from './screens/CollectionDetailScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { ModelCoordinationScreen } from './screens/ModelCoordinationScreen';
import { BottomNav } from './components/BottomNav';
import { OutfitProvider } from './hooks/useOutfits';
import { AuthProvider } from './hooks/useAuth';
import { CollectionProvider } from './hooks/useCollections';

function App() {
  const location = useLocation();
  const showNav = location.pathname !== '/auth';

  return (
    <AuthProvider>
      <CollectionProvider>
        <OutfitProvider>
          <div className="max-w-lg mx-auto bg-slate-50 min-h-screen font-sans">
            <main className={showNav ? "pb-20" : ""}>
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/calendar" element={<CalendarScreen />} />
                <Route path="/search" element={<SearchScreen />} />
                <Route path="/collections" element={<CollectionsScreen />} />
                <Route path="/collection/:collectionId" element={<CollectionDetailScreen />} />
                <Route path="/insights" element={<InsightsScreen />} />
                <Route path="/model-coordination" element={<ModelCoordinationScreen />} />
                <Route path="/add-outfit/:date" element={<AddOutfitScreen />} />
                <Route path="/outfit/:outfitId" element={<AddOutfitScreen />} />
                <Route path="/auth" element={<AuthScreen />} />
              </Routes>
            </main>
            {showNav && <BottomNav />}
          </div>
        </OutfitProvider>
      </CollectionProvider>
    </AuthProvider>
  );
}

export default App;
