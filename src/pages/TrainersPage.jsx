import React, { useState, useEffect } from 'react';
import { Shield, Mail, Phone, UserPlus, ShieldCheck, Sparkles, Clock, DollarSign, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, getUploadUrl, safeFetchJson } from '../api/client';
import { DEFAULT_TRAINERS } from '../data/mockData';
import InquiryModal from '../components/InquiryModal';

export default function TrainersPage({ onNavigate }) {
  const { user, isAuthenticated, openEntryModal } = useAuth();
  const [trainers, setTrainers] = useState(DEFAULT_TRAINERS);
  const [loading, setLoading] = useState(true);
  const [inquiryTarget, setInquiryTarget] = useState(null);
  const { language, t } = useLanguage();
  const tr = t.trainers;
  const isDe = language === 'de';

  const fetchTrainers = async () => {
    try {
      localStorage.removeItem('tuc_custom_trainers');
      localStorage.removeItem('tuc_deleted_trainer_ids');
      const res = await safeFetchJson('/api/trainers');
      let list = (res.ok && Array.isArray(res.data)) ? res.data : [...DEFAULT_TRAINERS];
      list = list.map(t => ({
        ...t,
        photo_url: (t.photo_url && t.photo_url.includes('images.unsplash.com')) ? '' : t.photo_url
      }));
      setTrainers(list);
    } catch (err) {
      console.error('Failed to load trainers, using fallback:', err);
      setTrainers([...DEFAULT_TRAINERS]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
    const handleStorageChange = () => fetchTrainers();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
            {onNavigate && (!isAuthenticated || user?.role === 'trainer') && (
              <button
                onClick={() => {
                  if (!isAuthenticated) openEntryModal();
                  else onNavigate('register');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>
                  {isAuthenticated 
                    ? (isDe ? 'Mein Trainer-Profil verwalten' : 'Manage Coach Profile') 
                    : (isDe ? 'Trainer-Login / Registrieren' : 'Coach Log In / Register')}
                </span>
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

      {!loading && trainers.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">
            {isDe ? 'Noch keine Trainer eingetragen' : 'No trainers registered yet'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {isDe 
              ? 'Trainer und Betreuer können über das Admin-Portal oder die Registrierungsseite hinzugefügt werden.'
              : 'Coaches and trainers can be added via the admin dashboard or registration page.'}
          </p>
          {onNavigate && (!isAuthenticated || user?.role === 'trainer') && (
            <button
              onClick={() => {
                if (!isAuthenticated) openEntryModal();
                else onNavigate('register');
              }}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {isAuthenticated 
                  ? (isDe ? 'Mein Trainer-Profil verwalten' : 'Manage Coach Profile') 
                  : (isDe ? 'Trainer-Login / Registrieren' : 'Coach Log In / Register')}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Trainers Grid (1-col on mobile, 2-col on tablet, 3-col on desktop) */}
      {!loading && trainers.length > 0 && (
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
                <div className="relative h-64 sm:h-72 bg-slate-900 overflow-hidden flex items-center justify-center">
                  {trainer.photo_url && getUploadUrl(trainer.photo_url) ? (
                    <img
                      src={getUploadUrl(trainer.photo_url)}
                      alt={trainer.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-3xl flex items-center justify-center shadow-inner">
                        🏸
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />
                  
                  <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
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
                  {/* Badge Row: Trainer Type */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {trainer.trainer_type === 'private' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>{isDe ? 'Privattrainer (Einzeltraining & Coaching)' : 'Private Coach'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        <span>{isDe ? 'USZ Hochschulsport Trainer' : 'USZ University Coach'}</span>
                      </span>
                    )}
                  </div>

                  {/* Hourly rate / Availability / Experience (if present) */}
                  {(trainer.hourly_rate || trainer.availability || trainer.experience_years) && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-700">
                      {trainer.hourly_rate && (
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span className="text-emerald-700 font-extrabold">💰 {isDe ? 'Tarif / Stundensatz:' : 'Rate:'}</span>
                          <span>{trainer.hourly_rate}</span>
                        </div>
                      )}
                      {trainer.availability && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span><strong>{isDe ? 'Zeiten:' : 'Availability:'}</strong> {trainer.availability}</span>
                        </div>
                      )}
                      {trainer.experience_years && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span><strong>{isDe ? 'Erfahrung:' : 'Experience:'}</strong> {trainer.experience_years}</span>
                        </div>
                      )}
                    </div>
                  )}

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

              {/* Protected Inquiry Action - Privacy Shield (No direct email/phone exposed) */}
              <div className="p-4 sm:p-5 pt-0 space-y-2">
                <button
                  type="button"
                  onClick={() => setInquiryTarget({
                    id: trainer.id,
                    type: 'trainer',
                    name: trainer.name,
                    subtitle: `${localizedRole} • ${trainer.trainer_type === 'private' ? (isDe ? 'Privattraining' : 'Private Coaching') : 'USZ Hochschulsport'}`,
                  })}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] active:scale-[0.98] transition-all shadow-xs cursor-pointer min-h-[44px]"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>{isDe ? 'Training anfragen / Kontakt aufnehmen' : 'Request Coaching / Inquire'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={!!inquiryTarget}
        onClose={() => setInquiryTarget(null)}
        target={inquiryTarget}
      />

    </div>
  );
}
