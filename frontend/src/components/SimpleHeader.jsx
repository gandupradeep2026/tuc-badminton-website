import React, { useState, useEffect } from 'react';
import { Menu, X, Globe, Lock, ShieldCheck, Heart, User, LogIn, LogOut, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import DonationModal from './DonationModal';

export default function SimpleHeader({ activePage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const isDe = language === 'de';
  const { user, isAuthenticated, openEntryModal, logout } = useAuth();

  const [donationSettings, setDonationSettings] = useState(null);
  const [donationModalOpen, setDonationModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/donation-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.is_active) {
          setDonationSettings(data);
        } else {
          setDonationSettings(null);
        }
      })
      .catch(() => setDonationSettings(null));
  }, []);

  const navItems = [
    { id: 'home', label: t.nav.home, icon: '🏛️' },
    { id: 'trainers', label: t.nav.trainers, icon: '👥' },
    { id: 'players', label: t.nav.players, icon: '🏸' },
    { id: 'sessions', label: isDe ? 'Spielrunden' : 'Host a Game', icon: '🏸' },
    { id: 'services', label: isDe ? 'Besaitung & Ausrüstung' : 'Stringing & Gear', icon: '🔧' },
    { id: 'tournaments', label: t.nav.tournaments, icon: '🏆' },
    { id: 'gallery', label: t.nav.gallery, icon: '📸' },
  ];

  // Close mobile menu on page change or ESC
  const handleSelect = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-colors">
      
      {/* Top University Brand Strip with Admin Gate Link & Live Server Badge */}
      <div className="bg-[#005A36] text-white text-[10px] sm:text-[11px] font-medium px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono truncate">
          <span className="font-bold tracking-wider uppercase text-emerald-300 flex-shrink-0">🏸 Student Community</span>
          <span className="text-white/40">|</span>
          <span className="text-white/90 truncate">{isDe ? 'Hochschulsport & Match-Plattform' : 'University Sports & Match Hub'}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="hidden lg:block text-white/80 font-mono text-xs">
            {isDe ? 'Sporthalle Thüringer Weg 11' : 'Sports Hall Thüringer Weg 11'}
          </div>
          
          {/* Admin link button */}
          <button
            onClick={() => handleSelect('admin')}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold font-mono transition-colors ${
              activePage === 'admin'
                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Admin Dashboard"
          >
            <Lock className="w-3 h-3" />
            <span>{t.nav.admin}</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => handleSelect('home')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#005A36] text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            BSC
          </div>
          <div className="min-w-0">
            <div className="font-black text-sm sm:text-base text-slate-900 tracking-tight leading-tight truncate">
              Badminton <span className="text-[#005A36]">Student Community</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate hidden xs:block">
              {isDe ? 'Campus Badminton & Match Hub' : 'Campus Badminton & Match Hub'}
            </div>
          </div>
        </div>

        {/* Desktop / Tablet Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/80">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`px-3 lg:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#005A36] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Language Switcher & Mobile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          {/* Donate / Sponsor Button - ONLY VISIBLE WHEN ADMIN ACTIVATES IT */}
          {donationSettings && donationSettings.is_active && (
            <button
              onClick={() => setDonationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 shadow-2xs transition-all cursor-pointer"
              title={isDe ? 'Das Team unterstützen / Sponsern' : 'Support the team / Sponsor'}
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
              <span>{isDe ? 'Spenden' : 'Donate'}</span>
            </button>
          )}

          {/* User Auth Status / Login Button */}
          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <button
                type="button"
                onClick={() => handleSelect('register')}
                className="font-bold text-emerald-950 hover:text-emerald-700 truncate max-w-[120px] cursor-pointer text-left"
                title={isDe ? 'Mein Profil verwalten' : 'Manage My Profile'}
              >
                {user?.name || user?.email}
              </button>
              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                {user?.role === 'trainer' ? 'Trainer' : (user?.role === 'service' ? 'Service' : 'Student')}
              </span>
              <button
                type="button"
                onClick={logout}
                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                title={isDe ? 'Abmelden' : 'Log out'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openEntryModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] shadow-2xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isDe ? 'Anmelden' : 'Log In'}</span>
            </button>
          )}

          {/* Language Toggle Switch (Always visible on all screens) */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setLanguage('de')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                language === 'de'
                  ? 'bg-[#005A36] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Auf Deutsch umschalten"
              aria-label="Deutsch"
            >
              <span>DE</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                language === 'en'
                  ? 'bg-[#005A36] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Switch to English"
              aria-label="English"
            >
              <span>EN</span>
            </button>
          </div>

          {/* Mobile Menu Button (Accessible touch target >= 44px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label="Menü umschalten"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Overlay & Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[calc(4rem+27px)] bottom-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border-b border-slate-200 px-4 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto">
            
            {/* Mobile Auth Button */}
            <div className="pb-2 mb-2 border-b border-slate-100">
              {isAuthenticated ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="font-bold text-xs text-emerald-950 truncate">{user?.name || user?.email}</span>
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 flex-shrink-0">
                        {user?.role === 'trainer' ? 'Trainer' : (user?.role === 'service' ? 'Service' : 'Student')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded-lg border border-red-200 cursor-pointer"
                    >
                      {isDe ? 'Abmelden' : 'Log Out'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect('register')}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] text-center cursor-pointer"
                  >
                    {isDe ? '👤 Mein Profil verwalten' : '👤 Manage My Profile'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { openEntryModal(); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isDe ? 'Anmelden' : 'Log In'}</span>
                </button>
              )}
            </div>

            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
              Navigation
            </div>

            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors min-h-[48px] ${
                    isActive
                      ? 'bg-[#005A36] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Mobile Donate Button - ONLY WHEN ACTIVE */}
            {donationSettings && donationSettings.is_active && (
              <button
                onClick={() => {
                  setDonationModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors min-h-[48px] bg-rose-50 text-rose-800 border border-rose-200"
              >
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                <span>{isDe ? '❤️ Spenden & Sponsoring' : '❤️ Donate & Sponsor'}</span>
              </button>
            )}

            {/* Admin Link in Mobile Drawer */}
            <button
              onClick={() => handleSelect('admin')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors min-h-[48px] border-t border-slate-100 mt-2 ${
                activePage === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Lock className="w-5 h-5 text-emerald-700" />
              <span>{t.nav.admin} Dashboard</span>
            </button>

            {/* Mobile Drawer Language & Venue Info */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-2">
              <span>{t.topbar.venue}</span>
              <span className="font-bold text-[#005A36] uppercase">{language.toUpperCase()}</span>
            </div>

          </div>
        </div>
      )}

      {/* Donation Modal - Active only when settings loaded and toggled */}
      <DonationModal
        isOpen={donationModalOpen}
        onClose={() => setDonationModalOpen(false)}
        settings={donationSettings}
      />

    </header>
  );
}
