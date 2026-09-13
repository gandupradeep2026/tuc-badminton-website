import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import SimpleHeader from './components/SimpleHeader';
import SimpleFooter from './components/SimpleFooter';
import HomePage from './pages/HomePage';
import TrainersPage from './pages/TrainersPage';
import PlayersPage from './pages/PlayersPage';
import TournamentsPage from './pages/TournamentsPage';
import GalleryPage from './pages/GalleryPage';
import RegistrationPage from './pages/RegistrationPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  // Read initial page from URL hash if present
  const getPageFromHash = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (['trainers', 'players', 'tournaments', 'gallery', 'register', 'admin'].includes(hash)) {
      return hash;
    }
    return 'home';
  };

  const [activePage, setActivePage] = useState(getPageFromHash);

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

      {/* 2. Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 sm:pt-10">
        {activePage === 'home' && (
          <HomePage onNavigate={navigateTo} />
        )}

        {activePage === 'trainers' && (
          <TrainersPage onNavigate={navigateTo} />
        )}

        {activePage === 'players' && (
          <PlayersPage onNavigate={navigateTo} />
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
      </main>

      {/* 3. Footer */}
      <SimpleFooter 
        onNavigate={navigateTo} 
      />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
