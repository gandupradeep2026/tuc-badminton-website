import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Download, 
  ExternalLink, 
  AlertCircle,
  Sparkles,
  Users
} from 'lucide-react';

export default function TournamentsSection({ refreshTrigger = 0 }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [refreshTrigger]);

  return (
    <section id="tournaments" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold tracking-wide">
            <Trophy className="w-3.5 h-3.5" />
            <span>Official Hochschulsport & Regional Tournaments</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            Tournaments & Ausschreibung Board
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Official announcements, registration deadlines, and downloadable Ausschreibung documents for university championships and regional cups.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
            <div className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800" />
          </div>
        )}

        {/* Empty State */}
        {!loading && tournaments.length === 0 && (
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-800 max-w-2xl mx-auto">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No Tournaments Posted Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Check back soon for the upcoming semester championships or submit an inquiry.
            </p>
          </div>
        )}

        {/* Tournaments List */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {tournaments.map((tourney) => (
            <div
              key={tourney.id}
              className="rounded-3xl p-6 sm:p-8 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
            >
              <div className="space-y-4 flex-1">
                {/* Badge row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-tuc-800 text-white dark:bg-tuc-700">
                    Ausschreibung Active
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Meldeschluss: {tourney.deadline}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display font-black text-xl sm:text-2xl text-slate-900 dark:text-white group-hover:text-tuc-800 dark:group-hover:text-emerald-400 transition-colors">
                  {tourney.title}
                </h3>

                {/* Description */}
                {tourney.description && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {tourney.description}
                  </p>
                )}

                {/* Meta details */}
                <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-tuc-700 dark:text-emerald-400 flex-shrink-0" />
                    <span><strong>Event Date:</strong> {tourney.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-tuc-700 dark:text-emerald-400 flex-shrink-0" />
                    <span><strong>Venue:</strong> {tourney.location}</span>
                  </div>
                </div>
              </div>

              {/* Download / View Button */}
              <div className="md:w-56 flex flex-col gap-2 flex-shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                {tourney.document_url ? (
                  <a
                    href={tourney.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 dark:bg-tuc-700 dark:hover:bg-tuc-600 shadow-md shadow-tuc-900/20 hover:shadow-glow-tuc transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Ausschreibung ({tourney.file_type ? tourney.file_type.toUpperCase() : 'PDF'})</span>
                  </a>
                ) : (
                  <span className="text-center text-xs text-slate-400 py-2">
                    Online Notice Only
                  </span>
                )}
                <span className="text-[10px] text-center text-slate-400">
                  TU Chemnitz Hochschulsport
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
