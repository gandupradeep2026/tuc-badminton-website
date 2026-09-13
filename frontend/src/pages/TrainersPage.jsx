import React, { useState, useEffect } from 'react';
import { Shield, Mail, Phone, UserPlus, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getApiUrl, getUploadUrl, safeFetchJson } from '../api/client';
import { DEFAULT_TRAINERS } from '../data/mockData';

export default function TrainersPage({ onNavigate }) {
  const [trainers, setTrainers] = useState(DEFAULT_TRAINERS);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();
  const tr = t.trainers;
  const isDe = language === 'de';

  const fetchTrainers = async () => {
    try {
      const res = await safeFetchJson('/api/trainers');
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setTrainers(res.data);
      } else {
        setTrainers(DEFAULT_TRAINERS);
      }
    } catch (err) {
      console.error('Failed to load trainers, using fallback:', err);
      setTrainers(DEFAULT_TRAINERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4 sm:pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-[11px] sm:text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>{tr.badge}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {tr.title}
            </h1>
            {onNavigate && (
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isDe ? 'Als Badminton-Trainer registrieren' : 'Register as a Badminton Trainer'}</span>
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {tr.subtitle}
          </p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Trainers Grid (1-col on mobile, 2-col on tablet, 3-col on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {trainers.map((trainer) => {
          const localizedRole = tr.trainerRoles[trainer.id] || trainer.role;
          const localizedFocusList = tr.focusAreas[trainer.id] || (
            trainer.focus_areas ? trainer.focus_areas.split(',').map((f) => f.trim()) : []
          );

          return (
            <div
              key={trainer.id}
              className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-64 sm:h-72 bg-slate-100 overflow-hidden">
                  <img
                    src={getUploadUrl(trainer.photo_url) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'}
                    alt={trainer.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#005A36] text-white shadow-sm mb-1.5">
                      {localizedRole}
                    </span>
                    <h3 className="font-display font-black text-lg sm:text-xl leading-tight">
                      {trainer.name}
                    </h3>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                  {/* Focus / Specialties */}
                  <div className="space-y-2">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      {tr.focusTitle}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {localizedFocusList.map((focus, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#005A36] text-[11px] sm:text-xs font-semibold border border-emerald-100/80"
                        >
                          {focus}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Contact Footer - Mobile friendly touch target */}
              <div className="p-4 sm:p-5 pt-0 space-y-2">
                <a
                  href={`mailto:${trainer.email}?subject=${encodeURIComponent(tr.emailPrefix)}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 hover:text-white bg-slate-100 hover:bg-[#005A36] active:bg-[#00472A] transition-colors border border-slate-200 min-h-[44px]"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{trainer.email}</span>
                </a>
                {trainer.phone && (trainer.show_phone === 1 || trainer.show_phone === true || trainer.show_phone === '1' || trainer.show_phone === undefined) && (
                  <a
                    href={`tel:${trainer.phone}`}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/80 min-h-[40px]"
                  >
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-[#005A36]" />
                    <span className="truncate">{trainer.phone}</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
