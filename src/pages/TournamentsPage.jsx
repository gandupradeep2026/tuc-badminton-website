import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Clock, 
  FileText, 
  Download, 
  AlertCircle,
  Medal,
  ExternalLink,
  Users,
  Award
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();
  const trn = t.tournaments;
  const isDe = language === 'de';

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
      }
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4 sm:pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-[11px] sm:text-xs font-bold mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>{trn.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          {trn.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
          {trn.subtitle}
        </p>
      </div>

      {/* UNI Badminton Team Cup 2026 Spotlight Box */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#005A36] via-[#00472A] to-[#00331E] text-white p-5 sm:p-7 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] sm:text-xs font-bold font-mono">
              <Trophy className="w-3.5 h-3.5" />
              <span>{isDe ? 'Turnier-Highlight 2026' : 'Tournament Highlight 2026'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              UNI Badminton Team Cup 2026
            </h2>
            <p className="text-xs text-white/80">
              {isDe 
                ? 'Austragung am 31.01.2026 in der Universitäts-Sporthalle Thüringer Weg 11, Chemnitz (12 Badminton-Spielfelder) • 7 Teams • 45 Spieler*innen aus 10 Nationen' 
                : 'Held on 31.01.2026 at University Sports Hall Thüringer Weg 11, Chemnitz (12 Badminton Courts) • 7 Teams • 45 Athletes from 10 Nations'}
            </p>
          </div>

          <a
            href="#gallery"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#005A36] hover:bg-emerald-50 transition-colors self-start sm:self-auto shadow-sm"
          >
            <span>{isDe ? '📸 Zur Fotogalerie' : '📸 View Gallery'}</span>
          </a>
        </div>

        {/* Podium Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-black text-base flex-shrink-0 shadow-sm">
              🥇
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold block">{isDe ? '1. Platz (Gold)' : '1st Place (Gold)'}</span>
              <strong className="text-sm text-white block">TUC Shuttlers</strong>
              <span className="text-[11px] text-white/70 block">{isDe ? 'Finale 4 : 0 Sieg' : 'Finals 4 : 0 Win'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-900 flex items-center justify-center font-black text-base flex-shrink-0 shadow-sm">
              🥈
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold block">{isDe ? '2. Platz (Silber)' : '2nd Place (Silver)'}</span>
              <strong className="text-sm text-white block">TUC Titans</strong>
              <span className="text-[11px] text-white/70 block">{isDe ? 'Halbfinale 3 : 1 Sieg' : 'Semifinal 3 : 1 Win'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-700 text-white flex items-center justify-center font-black text-base flex-shrink-0 shadow-sm">
              🥉
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold block">{isDe ? '3. Platz (Bronze)' : '3rd Place (Bronze)'}</span>
              <strong className="text-sm text-white block">TUC Challengers</strong>
              <span className="text-[11px] text-white/70 block">{isDe ? 'Kleines Finale 3 : 2 Sieg' : 'Bronze Match 3 : 2 Win'}</span>
            </div>
          </div>
        </div>

        {/* Downloadable Tournament Documents from folder */}
        <div className="pt-2">
          <span className="text-xs font-bold text-emerald-200 block mb-2">
            {isDe ? 'Offizielle Turnierunterlagen zum Download:' : 'Official Tournament Documents for Download:'}
          </span>
          <div className="flex flex-wrap gap-2">
            <a
              href="/uploads/tournament_2026/Uni_Badminton_Team_Cup_2026_Ergebnisbericht.pdf"
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isDe ? 'Ergebnisbericht (12 Seiten PDF)' : 'Results Report (12-Page PDF)'}</span>
              <Download className="w-3 h-3 opacity-70" />
            </a>

            <a
              href="/uploads/tournament_2026/UNI_Badminton_Rules_EN_DE.pdf"
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isDe ? 'Turnierregeln (DE / EN)' : 'Tournament Rules (DE / EN)'}</span>
              <Download className="w-3 h-3 opacity-70" />
            </a>

            <a
              href="/uploads/tournament_2026/UNI_Badminton_Team_Cup_2026_Schedule_Printable.pdf"
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isDe ? 'Spielplan & Zeitraster (PDF)' : 'Schedule & Brackets (PDF)'}</span>
              <Download className="w-3 h-3 opacity-70" />
            </a>

            <a
              href="/uploads/tournament_2026/1.Platz.pdf"
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isDe ? '1. Platz Urkunde (PDF)' : '1st Place Certificate (PDF)'}</span>
              <Download className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Tournaments List */}
      <div className="space-y-4 sm:space-y-5">
        {tournaments.map((tourney) => {
          const localizedTitle = trn.titles[tourney.id] || tourney.title;
          const localizedDesc = trn.descriptions[tourney.id] || tourney.description;

          return (
            <div
              key={tourney.id}
              className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
            >
              {/* Left Info */}
              <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold font-mono bg-emerald-100 text-[#005A36]">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{tourney.date}</span>
                  </span>
                  
                  {tourney.deadline && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
                      <span>{trn.deadlineLabel} {tourney.deadline}</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-display font-black text-base sm:text-xl text-slate-900 leading-snug">
                    {localizedTitle}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#005A36] flex-shrink-0" />
                    <span>{tourney.location}</span>
                  </div>
                </div>

                {localizedDesc && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {localizedDesc}
                  </p>
                )}
              </div>

              {/* Right Action: Download Notice/Report */}
              <div className="flex-shrink-0 pt-2 md:pt-0">
                {tourney.document_url ? (
                  <a
                    href={tourney.document_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl sm:rounded-2xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#004328] active:bg-[#003B23] shadow-sm hover:shadow transition-all w-full md:w-auto"
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span>{trn.downloadPdf}</span>
                    <Download className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 w-full md:w-auto">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{trn.soonNotice}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
