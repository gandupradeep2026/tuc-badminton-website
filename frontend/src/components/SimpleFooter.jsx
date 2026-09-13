import React from 'react';
import { MapPin, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function SimpleFooter({ onNavigate }) {
  const { t } = useLanguage();
  const f = t.footer;
  const n = t.nav;

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600 text-xs py-8 sm:py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1 max-w-sm">
            <h4 className="font-black text-sm text-slate-900">
              {f.title}
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              {f.subtitle}
            </p>
          </div>

          {/* Quick Page Links - Mobile friendly wrap */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold text-slate-700 pt-2 sm:pt-0">
            <button onClick={() => onNavigate('home')} className="p-1 hover:text-[#005A36] transition-colors">{n.home}</button>
            <button onClick={() => onNavigate('trainers')} className="p-1 hover:text-[#005A36] transition-colors">{n.trainers}</button>
            <button onClick={() => onNavigate('players')} className="p-1 hover:text-[#005A36] transition-colors">{n.players}</button>
            <button onClick={() => onNavigate('tournaments')} className="p-1 hover:text-[#005A36] transition-colors">{n.tournaments}</button>
            <button onClick={() => onNavigate('gallery')} className="p-1 hover:text-[#005A36] transition-colors">{n.gallery}</button>
            <button onClick={() => onNavigate('admin')} className="p-1 hover:text-[#005A36] text-slate-500 transition-colors">🔒 {n.admin}</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#005A36] flex-shrink-0" />
              <span>{f.venue}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#005A36] flex-shrink-0" />
              <a href="mailto:badminton@tu-chemnitz.de" className="hover:underline">badminton@tu-chemnitz.de</a>
            </span>
          </div>

          <div className="pt-2 sm:pt-0">
            © {new Date().getFullYear()} {f.copyright}
          </div>
        </div>

      </div>
    </footer>
  );
}
