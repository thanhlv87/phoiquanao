import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { AddOutfitScreen } from './screens/AddOutfitScreen';
import { AuthScreen } from './screens/AuthScreen';
import { BottomNav } from './components/BottomNav';
import { OutfitProvider } from './hooks/useOutfits';
import { AuthProvider } from './hooks/useAuth';

function App() {
  const location = useLocation();
  const showNav = location.pathname !== '/auth';

  return (
    <AuthProvider>
      <OutfitProvider>
        <div className="max-w-lg mx-auto bg-slate-50 min-h-screen font-sans">
          <main className={showNav ? "pb-20" : ""}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/calendar" element={<CalendarScreen />} />
              <Route path="/add-outfit/:date" element={<AddOutfitScreen />} />
              <Route path="/auth" element={<AuthScreen />} />
            </Routes>
          </main>
          {showNav && <BottomNav />}
        </div>
      </OutfitProvider>
    </AuthProvider>
  );
}

export default App;