import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Lock, 
  Users, 
  Trophy, 
  Calendar, 
  Clock, 
  Film, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function Navbar({ 
  darkMode, 
  toggleDarkMode, 
  onOpenAdmin, 
  onOpenRegister 
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Verein', href: '#verein' },
    { name: 'Aktuelles & Termine', href: '#aktuelles' },
    { name: 'Mannschaften', href: '#mannschaften' },
    { name: 'Spielerliste', href: '#spieler' },
    { name: 'Trainer', href: '#trainers' },
    { name: 'Ausschreibungen', href: '#tournaments' },
    { name: 'Galerie', href: '#media' },
    { name: 'Trainingszeiten', href: '#schedule' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      {/* 1. Official TU Chemnitz Brand Header Strip */}
      <div className="bg-tuc-800 text-white text-[11px] font-medium py-1.5 px-4 sm:px-6 lg:px-8 border-b border-tuc-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-wider uppercase text-emerald-300">
              TU Chemnitz Badminton
            </span>
            <span className="text-white/30 hidden sm:inline">•</span>
            <span className="text-white/80 hidden sm:inline">
              Universitäts-Sportzentrum (USZ) & BVS Mitglied
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors"
            >
              <Lock className="w-3 h-3 text-emerald-300" />
              <span>Mitglieder-Login / Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div 
        className={`transition-all duration-300 ${
          isScrolled 
            ? 'glass-panel shadow-md border-b border-slate-200/80 dark:border-slate-800/80 py-2.5' 
            : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-3 border-b border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-tuc-800 flex items-center justify-center text-white shadow-sm">
              <svg className="w-5 h-5 transform -rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2a4 4 0 0 0-4 4c0 1.25.6 2.37 1.5 3.09L5 17h14l-4.5-7.91A3.99 3.99 0 0 0 12 2z" />
                <path d="m9 17-1 4h8l-1-4" />
              </svg>
            </div>
            <div>
              <span className="font-display font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                TU Chemnitz <span className="text-tuc-800 dark:text-emerald-400">Badminton</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                Hochschulsport & Spielbetrieb
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-tuc-800 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Theme toggle"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onOpenRegister('trial')}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 rounded-lg transition-colors"
            >
              Probetraining
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-lg"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAdmin(); }}
                className="flex-1 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg text-center"
              >
                Admin-Login
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenRegister('trial'); }}
                className="flex-1 py-2 text-xs font-bold text-white bg-tuc-800 rounded-lg text-center"
              >
                Probetraining
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
