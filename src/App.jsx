import React, { useState, useEffect, lazy, Suspense } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import SimpleHeader from './components/SimpleHeader';
import SimpleFooter from './components/SimpleFooter';
import AppEntryModal from './components/AppEntryModal';

// Code-splitting with React.lazy to make the initial page load ultra-fast and lightweight
const HomePage = lazy(() => import('./pages/HomePage'));
const TrainersPage = lazy(() => import('./pages/TrainersPage'));
const PlayersPage = lazy(() => import('./pages/PlayersPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));
const TournamentsPage = lazy(() => import('./pages/TournamentsPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function PageFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] text-center">
      <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-3" />
      <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide animate-pulse">
        Laden... / Loading...
      </p>
    </div>
  );
}

// One-time client-side cache purge to ensure stale laptop caches never show deleted mock players/trainers
if (typeof window !== 'undefined') {
  const CACHE_VERSION = 'tuc_empty_roster_2026_v1';
  if (localStorage.getItem('tuc_version') !== CACHE_VERSION) {
    localStorage.removeItem('tuc_custom_players');
    localStorage.removeItem('tuc_custom_trainers');
    localStorage.removeItem('tuc_deleted_player_ids');
    localStorage.removeItem('tuc_deleted_trainer_ids');
    localStorage.setItem('tuc_version', CACHE_VERSION);
  }
}

function AppContent() {
  // Read initial page from URL hash if present
  const getPageFromHash = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (['sessions', 'trainers', 'players', 'services', 'tournaments', 'gallery', 'register', 'admin'].includes(hash)) {
      return hash;
    }
    return 'home';
  };

  const [activePage, setActivePage] = useState(getPageFromHash);
  const { isEntryModalOpen, closeEntryModal } = useAuth();

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      setActivePage(getPageFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page) => {
    setActivePage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* 1. Header Navigation */}
      <SimpleHeader 
        activePage={activePage} 
        onNavigate={navigateTo} 
      />

      {/* 2. Main Page Content with Suspense Lazy Loading */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 sm:pt-10">
        <Suspense fallback={<PageFallback />}>
          {activePage === 'home' && (
            <HomePage onNavigate={navigateTo} />
          )}

          {activePage === 'trainers' && (
            <TrainersPage onNavigate={navigateTo} />
          )}

          {activePage === 'players' && (
            <PlayersPage onNavigate={navigateTo} />
          )}

          {activePage === 'services' && (
            <ServicesPage onNavigate={navigateTo} />
          )}

          {activePage === 'sessions' && (
            <SessionsPage onNavigate={navigateTo} />
          )}

          {activePage === 'tournaments' && (
            <TournamentsPage />
          )}

          {activePage === 'gallery' && (
            <GalleryPage />
          )}

          {activePage === 'register' && (
            <RegistrationPage onNavigate={navigateTo} />
          )}

          {activePage === 'admin' && (
            <AdminPage />
          )}
        </Suspense>
      </main>

      {/* 3. Footer */}
      <SimpleFooter 
        onNavigate={navigateTo} 
      />

      {/* 4. One-Time Student App Entry Modal */}
      <AppEntryModal
        isOpen={isEntryModalOpen}
        onClose={closeEntryModal}
      />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
