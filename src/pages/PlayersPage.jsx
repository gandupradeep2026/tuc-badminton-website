import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Target, Mail, UserPlus, Star, School, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson } from '../api/client';
import { DEFAULT_PLAYERS } from '../data/mockData';

export default function PlayersPage({ onNavigate }) {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'men' | 'women'
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();
  const pl = t.players;
  const isDe = language === 'de';

  const fetchPlayers = async () => {
    try {
      const res = await safeFetchJson('/api/players');
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setPlayers(res.data);
      } else {
        setPlayers(DEFAULT_PLAYERS);
      }
    } catch (err) {
      console.error('Failed to load players, using fallback:', err);
      setPlayers(DEFAULT_PLAYERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const menList = players.filter((p) => p.gender === 'men');
  const womenList = players.filter((p) => p.gender === 'women');

  const renderPlayerCard = (player) => {
    const specializations = player.specialization
      ? player.specialization.split(',').map((s) => s.trim())
      : [];

    const localizedStudy = pl.studyPrograms[player.study_program] || player.study_program;

    return (
      <div
        key={player.id}
        className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3.5"
      >
        <div className="space-y-3">
          {/* Header with Photo & Basic Info */}
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
              <img
                src={player.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'}
                alt={player.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = player.gender === 'women'
                    ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
                    : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80';
                }}
              />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] sm:text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    player.gender === 'women'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {player.gender === 'women' ? pl.genderLabelWomen : pl.genderLabelMen}
                  </span>
                  {player.skill_level && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                      {player.skill_level}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">
                  {player.team}
                </span>
              </div>

              <h4 className="font-display font-black text-sm sm:text-base text-slate-900 truncate">
                {player.name}
              </h4>

              {/* Course of Study */}
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#005A36] font-semibold truncate" title={localizedStudy}>
                <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{localizedStudy}</span>
              </div>

              {/* Other University badge if external */}
              {(player.university_type === 'other' || (player.university_name && player.university_name !== 'TU Chemnitz')) && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
                  <School className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{player.university_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Player / Idol if provided */}
          {player.favorite_player && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[10px] text-amber-900">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400 flex-shrink-0" />
              <span className="font-bold">Idol:</span>
              <span className="truncate font-medium">{player.favorite_player}</span>
            </div>
          )}

          {/* Badminton Specialization */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-[#005A36]" />
              <span>{pl.specTitle}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {specializations.map((spec, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] sm:text-[11px] font-medium text-slate-700 border border-slate-200"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Email & Optional Public Phone Contact Buttons */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <a
            href={`mailto:${player.email}?subject=${encodeURIComponent(pl.emailPrefix)}`}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 min-h-[40px] rounded-xl text-xs font-bold text-slate-700 hover:text-white bg-slate-50 hover:bg-[#005A36] active:bg-[#00472A] border border-slate-200 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{player.email}</span>
          </a>
          {player.phone && (player.show_phone === 1 || player.show_phone === true || player.show_phone === '1') && (
            <a
              href={`tel:${player.phone}`}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 min-h-[36px] rounded-xl text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 flex-shrink-0 text-[#005A36]" />
              <span className="truncate">{player.phone}</span>
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Page Header with Responsive Horizontal Scroll Filter Tabs & Registration CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4 sm:pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-[11px] sm:text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>{pl.badge}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {pl.title}
            </h1>
            {onNavigate && (
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isDe ? 'Mitmachen & Registrieren' : 'Join / Register'}</span>
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {pl.subtitle}
          </p>
        </div>

        {/* Mobile Swipeable / Desktop Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto max-w-full flex-nowrap sm:flex-wrap self-start sm:self-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'all'
                ? 'bg-[#005A36] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {pl.tabAll} ({players.length})
          </button>
          <button
            onClick={() => setActiveTab('men')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'men'
                ? 'bg-[#005A36] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {pl.tabMen} ({menList.length})
          </button>
          <button
            onClick={() => setActiveTab('women')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'women'
                ? 'bg-[#005A36] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {pl.tabWomen} ({womenList.length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Subsection: Herren / Men */}
      {(activeTab === 'all' || activeTab === 'men') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <h3 className="font-display font-black text-base sm:text-lg text-slate-900">
              {pl.menSquad}
            </h3>
            <span className="text-xs text-slate-400 font-medium">({menList.length} {pl.playersCount})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {menList.map(renderPlayerCard)}
          </div>
        </div>
      )}

      {/* Subsection: Damen / Women */}
      {(activeTab === 'all' || activeTab === 'women') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <span className="w-3 h-3 rounded-full bg-purple-600" />
            <h3 className="font-display font-black text-base sm:text-lg text-slate-900">
              {pl.womenSquad}
            </h3>
            <span className="text-xs text-slate-400 font-medium">({womenList.length} {pl.playersCountWomen})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {womenList.map(renderPlayerCard)}
          </div>
        </div>
      )}

    </div>
  );
}
