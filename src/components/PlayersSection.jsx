import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Target, 
  Mail, 
  ShieldCheck, 
  Sparkles,
  UserCheck,
  Award
} from 'lucide-react';
import { getApiUrl, getUploadUrl, safeFetchJson } from '../api/client';
import { DEFAULT_PLAYERS } from '../data/mockData';

export default function PlayersSection({ refreshTrigger = 0 }) {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'men' | 'women'
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    try {
      const res = await safeFetchJson('/api/players');
      if (res.ok && Array.isArray(res.data)) {
        setPlayers(res.data.map(p => ({
          ...p,
          photo_url: (p.photo_url && p.photo_url.includes('images.unsplash.com')) ? '' : p.photo_url
        })));
      } else {
        setPlayers(DEFAULT_PLAYERS);
      }
    } catch (err) {
      console.error('Error fetching players, using fallback:', err);
      setPlayers(DEFAULT_PLAYERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [refreshTrigger]);

  const menPlayers = players.filter((p) => p.gender === 'men');
  const womenPlayers = players.filter((p) => p.gender === 'women');

  const renderPlayerCard = (player) => {
    const specializations = player.specialization 
      ? player.specialization.split(',').map((s) => s.trim())
      : [];

    return (
      <div
        key={player.id}
        className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div className="space-y-4">
          {/* Avatar & Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center">
              {player.photo_url && getUploadUrl(player.photo_url) ? (
                <img
                  src={getUploadUrl(player.photo_url)}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#005A36]/10 text-[#005A36] font-bold flex items-center justify-center text-xl">
                  {player.name ? player.name.charAt(0) : <Users className="w-6 h-6 text-slate-400" />}
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  player.gender === 'women'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {player.gender === 'women' ? 'Damen / Women' : 'Herren / Men'}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {player.team}
                </span>
              </div>

              <h4 className="font-display font-black text-base text-slate-900 dark:text-white truncate">
                {player.name}
              </h4>

              {/* Course of Study */}
              <div className="flex items-center gap-1.5 text-xs text-tuc-800 dark:text-emerald-400 font-semibold truncate">
                <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{player.study_program}</span>
              </div>
            </div>
          </div>

          {/* Badminton Specialization */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-[#005A36] dark:text-emerald-400" />
              <span>Badminton-Spezialisierung</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {specializations.map((spec, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Email Contact Button */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <a
            href={`mailto:${player.email}?subject=TU%20Chemnitz%20Badminton%20Kontakt`}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-tuc-50 hover:text-tuc-800 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-[#005A36] dark:text-emerald-400" />
            <span className="truncate">{player.email}</span>
          </a>
        </div>
      </div>
    );
  };

  return (
    <section id="spieler" className="py-16 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-tuc-100 dark:bg-tuc-950 text-tuc-800 dark:text-emerald-400 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Team-Roster & Aktive</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              Spielerliste (Player List)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Unsere aktiven Badmintonspielerinnen und -spieler der TU Chemnitz mit Studiengang, Disziplin und E-Mail.
            </p>
          </div>

          {/* Subsection Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-tuc-800 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Alle ({players.length})
            </button>
            <button
              onClick={() => setActiveFilter('men')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'men'
                  ? 'bg-tuc-800 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Herren / Men ({menPlayers.length})
            </button>
            <button
              onClick={() => setActiveFilter('women')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'women'
                  ? 'bg-tuc-800 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Damen / Women ({womenPlayers.length})
            </button>
          </div>
        </div>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {!loading && players.length === 0 && (
          <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Noch keine Spieler eingetragen / No players registered yet
            </h3>
          </div>
        )}

        {/* Subsection: Herren / Men */}
        {!loading && players.length > 0 && (activeFilter === 'all' || activeFilter === 'men') && (
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                Herren (Men's Squad)
              </h3>
              <span className="text-xs text-slate-400 font-mono">({menPlayers.length} Spieler)</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {menPlayers.map(renderPlayerCard)}
            </div>
          </div>
        )}

        {/* Subsection: Damen / Women */}
        {!loading && players.length > 0 && (activeFilter === 'all' || activeFilter === 'women') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                Damen (Women's Squad)
              </h3>
              <span className="text-xs text-slate-400 font-mono">({womenPlayers.length} Spielerinnen)</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {womenPlayers.map(renderPlayerCard)}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
