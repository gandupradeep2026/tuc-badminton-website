import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  MapPin, 
  Clock, 
  Users, 
  Trophy, 
  ArrowRight, 
  ChevronRight,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Navigation,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  UserPlus,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import StadiumCarousel from '../components/StadiumCarousel';
import YouTubeSection from '../components/YouTubeSection';
import { getApiUrl, safeFetchJson } from '../api/client';

export default function HomePage({ onNavigate }) {
  const { t, language } = useLanguage();
  const isDe = language === 'de';
  const h = t.home;
  const [announcement, setAnnouncement] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Dynamic Training Schedules state
  const [schedules, setSchedules] = useState([]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('Thüringer Weg 11, 09126 Chemnitz, Deutschland');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fetchSchedules = async () => {
    try {
      const res = await safeFetchJson('/api/training-schedules');
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setSchedules(res.data);
      }
    } catch (err) {
      console.error('Failed to load training schedules:', err);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    safeFetchJson('/api/announcement')
      .then(res => {
        if (
          res.ok && 
          res.data && 
          (res.data.is_active === true || res.data.is_active === 1 || res.data.is_active === '1') && 
          res.data.message && 
          res.data.message.trim()
        ) {
          setAnnouncement(res.data);
        } else {
          setAnnouncement(null);
        }
      })
      .catch(err => {
        console.error('Failed to load announcement:', err);
        setAnnouncement(null);
      });
  }, []);

  return (
    <div className="space-y-6 sm:space-y-10 pb-16">
      
      {/* 0. Top Stadium Showcase Carousel: 10 authentic pictures sliding every 5 seconds */}
      <StadiumCarousel />

      {/* Dynamic Site Announcement Banner (Admin Controlled) */}
      {announcement && (announcement.is_active === true || announcement.is_active === 1 || announcement.is_active === '1') && announcement.message && (
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex items-start gap-3.5 transition-all ${
          announcement.type === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : announcement.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-blue-50 border-blue-200 text-blue-950'
        }`}>
          <div className="p-2 rounded-xl bg-white shadow-xs flex-shrink-0 mt-0.5">
            {announcement.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : announcement.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Bell className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/70 font-mono">
                {announcement.type === 'warning' ? 'Wichtig' : 'Mitteilung'}
              </span>
              <h4 className="font-bold text-sm sm:text-base leading-tight truncate">
                {announcement.title}
              </h4>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed opacity-90">
              {announcement.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAnnouncement(null)}
            className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0 cursor-pointer"
            title="Schließen / Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Hero / Overview Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#005A36] to-[#003B23] text-white p-6 sm:p-10 md:p-12 shadow-md">
        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-emerald-200 text-[11px] sm:text-xs font-semibold max-w-full truncate">
            <span className="truncate">{h.heroBadge}</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
            {h.heroTitle1} <span className="text-emerald-300">{h.heroTitle2}</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/85 leading-relaxed">
            {h.heroDesc}
          </p>

          {/* Quick Action Navigation Buttons - Responsive stack on mobile, row on tablet/desktop */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 active:bg-amber-500 transition-colors shadow-md"
            >
              <UserPlus className="w-4 h-4 text-slate-950 flex-shrink-0" />
              <span>{isDe ? 'Mitmachen & Registrieren' : 'Join & Register'}</span>
            </button>
            <button
              onClick={() => onNavigate('sessions')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-emerald-500/25 border border-emerald-400/50 text-white hover:bg-emerald-500/40 active:bg-white/20 transition-colors shadow-sm"
            >
              <span>{isDe ? '🤝 Match-Treff & Spielrunden' : '🤝 Find Games / LFG'}</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-amber-300" />
            </button>
            <button
              onClick={() => onNavigate('trainers')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-white text-[#005A36] hover:bg-emerald-50 active:bg-slate-100 transition-colors shadow-sm"
            >
              <span>{h.ctaTrainers}</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </button>
            <button
              onClick={() => onNavigate('players')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-[#00472A] border border-white/20 text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <span>{h.ctaPlayers}</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </button>
            <button
              onClick={() => onNavigate('tournaments')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-[#00472A] border border-white/20 text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <span>{h.ctaTournaments}</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </button>
            <button
              onClick={() => onNavigate('services')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-[#00472A] border border-white/20 text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <span>{isDe ? '🏸 Besaitung & Ausrüstung' : '🏸 Stringing & Gear'}</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </section>

      {/* 2. Key Facts / Overview Matrix (2-col on phones, 4-col on tablet/desktop) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => onNavigate('players')}
          className="p-3.5 sm:p-5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 transition-all cursor-pointer space-y-1 shadow-sm"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center font-black mb-2 sm:mb-3">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">{h.statPlayersNum}</span>
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">{h.statPlayersTitle}</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">{h.statPlayersSub}</p>
        </div>

        <div 
          onClick={() => onNavigate('trainers')}
          className="p-3.5 sm:p-5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 transition-all cursor-pointer space-y-1 shadow-sm"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center font-black mb-2 sm:mb-3">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">{h.statTrainersNum}</span>
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">{h.statTrainersTitle}</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">{h.statTrainersSub}</p>
        </div>

        <div 
          onClick={() => onNavigate('tournaments')}
          className="p-3.5 sm:p-5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 transition-all cursor-pointer space-y-1 shadow-sm"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center font-black mb-2 sm:mb-3">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">{h.statTourneysNum}</span>
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">{h.statTourneysTitle}</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">{h.statTourneysSub}</p>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center font-black mb-2 sm:mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">{h.statTrainingNum}</span>
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight">{h.statTrainingTitle}</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 leading-normal">{h.statTrainingSub}</p>
        </div>
      </section>

      {/* 3. Training & Location Overview (Stacked on phones, 2-col on tablets/desktop) */}
      <section className="grid md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Trainingszeiten */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-[#005A36] flex-shrink-0" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">{h.scheduleTitle}</h3>
            </div>
            <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-[#005A36] border border-emerald-200 flex-shrink-0">
              {h.scheduleBadge}
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-3 text-xs">
            {schedules && schedules.length > 0 ? (
              schedules.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/30 transition-colors border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{item.day_title}</span>
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-[#005A36]">
                        {item.time_slot}
                      </span>
                    </div>
                    <span className="text-slate-600 text-[11px] sm:text-xs font-medium block">
                      {item.group_name}
                    </span>
                    {item.notes && (
                      <span className="text-slate-400 text-[10px] block italic">
                        {item.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex sm:flex-col sm:items-end items-center justify-between gap-1 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <span className="font-mono text-[10px] sm:text-[11px] text-slate-500">{item.hall_name || h.hallNameShort}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                      🏸 {item.courts_info || h.courtsDefault || '12 Spielfelder'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-slate-900 block">{h.session1Day}</span>
                    <span className="text-slate-500 text-[11px] sm:text-xs">{h.session1Desc}</span>
                  </div>
                  <span className="font-mono text-[10px] sm:text-[11px] text-slate-400 self-start sm:self-auto">{h.hallNameShort}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-slate-900 block">{h.session2Day}</span>
                    <span className="text-slate-500 text-[11px] sm:text-xs">{h.session2Desc}</span>
                  </div>
                  <span className="font-mono text-[10px] sm:text-[11px] text-slate-400 self-start sm:self-auto">{h.hallNameShort}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-slate-900 block">{h.session3Day}</span>
                    <span className="text-slate-500 text-[11px] sm:text-xs">{h.session3Desc}</span>
                  </div>
                  <span className="font-mono text-[10px] sm:text-[11px] text-slate-400 self-start sm:self-auto">{h.hallNameShort}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sporthalle Location & Live Interactive Map */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#005A36] flex-shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">{h.venueTitle}</h3>
              </div>
              <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-[#005A36] border border-emerald-200 flex-shrink-0">
                {h.venueBadge}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 pt-3">
              {/* Address Banner with Copy Button */}
              <div className="flex items-start justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5 min-w-0">
                  <strong className="text-slate-900 text-sm block leading-tight">{h.venueName}</strong>
                  <p className="text-slate-600 font-medium text-xs">{h.venueAddress}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  title={h.copyAddress}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors flex-shrink-0 shadow-2xs cursor-pointer active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-700 font-bold">{h.copiedAddress}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{h.copyAddress}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Highlights: 12 Badminton Courts & Transit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2">
                  <span className="text-base leading-none flex-shrink-0">🏸</span>
                  <div>
                    <span className="font-bold text-[#005A36] block">{h.courtsHighlightTitle || '12 Badminton-Spielfelder'}</span>
                    <span className="text-[11px] text-slate-600 leading-tight">{h.courtsHighlightSub || 'Wettkampf- & Trainingsfelder mit Netzanlagen'}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                  <span className="text-base leading-none flex-shrink-0">🚊</span>
                  <div>
                    <span className="font-bold text-slate-900 block">{h.transitLabel}</span>
                    <span className="text-[11px] text-slate-600 leading-tight">{h.transitText}</span>
                  </div>
                </div>
              </div>

              {/* Live Interactive Map Iframe */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-bold flex items-center gap-1 text-[#005A36]">
                    <Navigation className="w-3 h-3" />
                    <span>{h.liveLocationBadge || (isDe ? 'Live-Standort (Interaktive Karte)' : 'Live Location (Interactive Map)')}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">50.8142° N, 12.9304° E</span>
                </div>
                <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-100">
                  <iframe
                    title="Live Location Map - Universitäts-Sporthalle TU Chemnitz"
                    src="https://maps.google.com/maps?q=Universit%C3%A4ts-Sporthalle%20Th%C3%BCringer%20Weg%2011,%2009126%20Chemnitz&t=&z=16&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Direct Route Navigation Button */}
          <div className="pt-2 border-t border-slate-100">
            <a 
              href="https://maps.google.com/?q=Universit%C3%A4ts-Sporthalle+Th%C3%BCringer+Weg+11,+09126+Chemnitz" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#004328] active:bg-[#003B23] transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{h.mapsLink}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>

      </section>

      {/* 3.5 YouTube Video Player & Official Channel Hub */}
      <YouTubeSection />

      {/* 4. Quick Section Cards (1 col phone, 2 col tablet, 3 col desktop) */}
      <section className="space-y-3 sm:space-y-4">
        <h2 className="font-display font-black text-lg sm:text-xl text-slate-900">
          {h.exploreTitle}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Trainer Card */}
          <div 
            onClick={() => onNavigate('trainers')}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#005A36] active:scale-[0.99] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#005A36] flex items-center justify-center font-bold text-lg">
                👥
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-[#005A36] transition-colors">
                {h.cardTrainersTitle}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {h.cardTrainersDesc}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005A36] pt-1">
              <span>{h.cardTrainersAction}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Spielerliste Card */}
          <div 
            onClick={() => onNavigate('players')}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#005A36] active:scale-[0.99] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#005A36] flex items-center justify-center font-bold text-lg">
                🏸
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-[#005A36] transition-colors">
                {h.cardPlayersTitle}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {h.cardPlayersDesc}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005A36] pt-1">
              <span>{h.cardPlayersAction}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Spielrunden / Match-Treff (LFG) Card */}
          <div 
            onClick={() => onNavigate('sessions')}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#005A36] active:scale-[0.99] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center font-bold text-lg">
                🤝
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-[#005A36] transition-colors">
                {isDe ? 'Match-Treff & Spielrunden' : 'Badminton Match Finder'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isDe 
                  ? 'Finde spontan Mitspieler für Feels Good Club oder Uni-Hallen ohne feste Vereinsbindung.' 
                  : 'Find players spontaneously for Feels Good Club or university gyms.'}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005A36] pt-1">
              <span>{isDe ? 'Spielrunden ansehen' : 'Explore Sessions'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Turniere Card */}
          <div 
            onClick={() => onNavigate('tournaments')}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#005A36] active:scale-[0.99] transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#005A36] flex items-center justify-center font-bold text-lg">
                🏆
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-[#005A36] transition-colors">
                {h.cardTourneysTitle}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {h.cardTourneysDesc}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005A36] pt-1">
              <span>{h.cardTourneysAction}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
