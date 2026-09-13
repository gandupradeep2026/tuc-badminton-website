import React from 'react';
import { Database, MapPin, Mail, ExternalLink, Heart, Shield } from 'lucide-react';

export default function Footer({ onOpenDbInspector, onOpenRegister }) {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-tuc-700 flex items-center justify-center text-white">
                <svg className="w-5 h-5 transform -rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 0-4 4c0 1.25.6 2.37 1.5 3.09L5 17h14l-4.5-7.91A3.99 3.99 0 0 0 12 2z" />
                  <path d="m9 17-1 4h8l-1-4" />
                </svg>
              </div>
              <span className="font-display font-black text-lg text-white tracking-tight">
                TU Chemnitz <span className="text-emerald-400">Badminton</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Official badminton sports portal for students, university employees, and guest athletes at Technische Universität Chemnitz.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs">
              <button
                onClick={onOpenDbInspector}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 transition-colors font-semibold"
              >
                <Database className="w-3.5 h-3.5" />
                <span>SQLite DB Explorer</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#schedule" className="hover:text-white transition-colors">Training Schedule Matrix</a></li>
              <li><a href="#venues" className="hover:text-white transition-colors">Sports Halls & Transit</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Guidelines & FAQ</a></li>
              <li>
                <button onClick={() => onOpenRegister('trial')} className="hover:text-white transition-colors text-left">
                  Trial Session Booking
                </button>
              </li>
              <li>
                <button onClick={() => onOpenRegister('tournament')} className="hover:text-white transition-colors text-left">
                  Tournament Registration
                </button>
              </li>
            </ul>
          </div>

          {/* Venues */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Training Facilities
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Sporthalle Thüringer Weg 11<br/><span className="text-slate-500">Main Campus (6 Courts)</span></span>
              </li>
              <li className="flex items-start gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>CPS Sporthalle Reichenhainer Str. 90<br/><span className="text-slate-500">Athletics Complex (4 Courts)</span></span>
              </li>
            </ul>
          </div>

          {/* Affiliations */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Affiliations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://www.tu-chemnitz.de/usz/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>TUC Universitäts-Sportzentrum</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.bvsachsen.de/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Badminton-Verband Sachsen e.V.</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.adh.de/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>adh - Allgemeiner Deutscher Hochschulsportverband</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} TU Chemnitz Badminton Community & Hochschulsport. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Non-marking Hallenschuhe mandatory</span>
            </span>
            <span>•</span>
            <span>Chemnitz, Saxony, Germany</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
