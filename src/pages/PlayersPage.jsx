import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Target, Mail, UserPlus, Star, School, Phone, Trophy, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson, getUploadUrl } from '../api/client';
import { DEFAULT_PLAYERS } from '../data/mockData';
import PartnerRequestModal from '../components/PartnerRequestModal';
import BadmintonAvatar from '../components/BadmintonAvatar';

export default function PlayersPage({ onNavigate }) {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'men' | 'women'
  const [loading, setLoading] = useState(true);
  const [partnerModalPlayer, setPartnerModalPlayer] = useState(null);
  const { language, t } = useLanguage();
  const pl = t.players;
  const isDe = language === 'de';

  const fetchPlayers = async () => {
    try {
      localStorage.removeItem('tuc_custom_players');
      localStorage.removeItem('tuc_deleted_player_ids');
      const res = await safeFetchJson('/api/players');
      let list = (res.ok && Array.isArray(res.data)) ? res.data : [...DEFAULT_PLAYERS];
      list = list.map(p => ({
        ...p,
        photo_url: (p.photo_url && p.photo_url.includes('images.unsplash.com')) ? '' : p.photo_url
      }));
      setPlayers(list);
    } catch (err) {
      console.error('Failed to load players, using fallback:', err);
      setPlayers([...DEFAULT_PLAYERS]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const handleStorageChange = () => fetchPlayers();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
          {/* Header with Badminton Avatar / Photo & Basic Info */}
          <div className="flex items-start gap-3 sm:gap-3.5">
            <BadmintonAvatar
              photoUrl={player.photo_url}
              avatarType={player.avatar_type}
              name={player.name}
              size="md"
            />

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

        {/* Privacy-Shielded Contact Action */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={() => setPartnerModalPlayer(player)}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 min-h-[40px] rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#005A36] to-emerald-700 hover:from-[#00472A] hover:to-emerald-800 shadow-xs hover:shadow transition-all"
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-emerald-200" />
            <span>{isDe ? '🏸 Spieler diskret anfragen' : '🏸 Contact Player Privately'}</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{isDe ? 'E-Mail geschützt • Diskrete Weiterleitung' : 'Email protected • Discrete relay'}</span>
          </div>
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

      {/* Privacy Shield Info Banner */}
      <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#005A36] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
              {isDe ? '🛡️ Schutz der Privatsphäre aller Studierenden' : '🛡️ Student Privacy Shield'}
            </h4>
            <p className="text-[11px] sm:text-xs text-emerald-800 leading-snug">
              {isDe 
                ? 'E-Mails, Telefonnummern und Nachnamen werden niemals öffentlich angezeigt. Kontaktanfragen werden sicher und diskret per Server an den Spieler weitergeleitet.'
                : 'Emails, phone numbers, and last names are kept strictly private. Requests are relayed discreetly and securely via our server.'}
            </p>
          </div>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('sessions')}
            className="whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#005A36] hover:bg-emerald-100/60 border border-emerald-200 transition-colors shadow-xs self-end sm:self-auto"
          >
            {isDe ? '🤝 Zu den Spielrunden' : '🤝 Looking for Games?'}
          </button>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">
            {isDe ? 'Noch keine Spieler eingetragen' : 'No players registered yet'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {isDe 
              ? 'Neue Spieler können über das Anmeldeformular beitreten oder im Admin-Bereich freigeschaltet werden.'
              : 'New players can sign up via the registration page or be added in the Admin portal.'}
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate('register')}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isDe ? 'Jetzt als Spieler registrieren' : 'Register as a Player'}</span>
            </button>
          )}
        </div>
      )}

      {/* Subsection: Herren / Men */}
      {!loading && players.length > 0 && (activeTab === 'all' || activeTab === 'men') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <h3 className="font-display font-black text-base sm:text-lg text-slate-900">
              {pl.menSquad}
            </h3>
            <span className="text-xs text-slate-400 font-medium">({menList.length} {pl.playersCount})</span>
          </div>

          {menList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">{isDe ? 'Keine Spieler in dieser Kategorie.' : 'No players in this category.'}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {menList.map(renderPlayerCard)}
            </div>
          )}
        </div>
      )}

      {/* Subsection: Damen / Women */}
      {!loading && players.length > 0 && (activeTab === 'all' || activeTab === 'women') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <span className="w-3 h-3 rounded-full bg-purple-600" />
            <h3 className="font-display font-black text-base sm:text-lg text-slate-900">
              {pl.womenSquad}
            </h3>
            <span className="text-xs text-slate-400 font-medium">({womenList.length} {pl.playersCountWomen})</span>
          </div>

          {womenList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">{isDe ? 'Keine Spielerinnen in dieser Kategorie.' : 'No players in this category.'}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {womenList.map(renderPlayerCard)}
            </div>
          )}
        </div>
      )}

      {/* Partner Request Modal */}
      <PartnerRequestModal
        isOpen={!!partnerModalPlayer}
        onClose={() => setPartnerModalPlayer(null)}
        player={partnerModalPlayer}
      />

    </div>
  );
}
