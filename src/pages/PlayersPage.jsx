import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  Target, 
  Mail, 
  UserPlus, 
  Star, 
  School, 
  Phone, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  LogOut, 
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Edit3,
  Trash2,
  Award,
  Wrench,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson } from '../api/client';
import PlayRequestModal from '../components/PlayRequestModal';
import SelfDeleteModal from '../components/SelfDeleteModal';
import SelfEditModal from '../components/SelfEditModal';
import BadmintonAvatar from '../components/BadmintonAvatar';

export default function PlayersPage({ onNavigate }) {
  const { user, token, isAuthenticated, logout, openEntryModal } = useAuth();
  const { language, t } = useLanguage();
  const pl = t.players;
  const isDe = language === 'de';

  // State
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'trainer' | 'service'
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [uniFilter, setUniFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name' | 'level'

  // Modals
  const [selectedMember, setSelectedMember] = useState(null);
  const [selfDeleteOpen, setSelfDeleteOpen] = useState(false);
  const [selfEditOpen, setSelfEditOpen] = useState(false);

  // Fetch Community Members
  const fetchMembers = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (roleFilter !== 'all') queryParams.append('role', roleFilter);
      if (skillFilter !== 'all') queryParams.append('skill_level', skillFilter);
      if (categoryFilter !== 'all') queryParams.append('category', categoryFilter);
      if (genderFilter !== 'all') queryParams.append('gender', genderFilter);
      if (uniFilter !== 'all') queryParams.append('university', uniFilter);
      if (sortBy) queryParams.append('sort', sortBy);

      const res = await safeFetchJson(`/api/community/members?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-student-token': token
        }
      });

      if (res.ok && Array.isArray(res.data)) {
        setMembers(res.data);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Failed to load community members:', err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMembers();
    }
  }, [isAuthenticated, roleFilter, skillFilter, categoryFilter, genderFilter, uniFilter, sortBy]);

  // Client-side search filtering
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = m.name && m.name.toLowerCase().includes(q);
      const matchUni = m.university && m.university.toLowerCase().includes(q);
      const matchSpec = m.specialization && m.specialization.toLowerCase().includes(q);
      const matchCat = m.preferred_category && m.preferred_category.toLowerCase().includes(q);
      const matchRole = m.role_label && m.role_label.toLowerCase().includes(q);
      return matchName || matchUni || matchSpec || matchCat || matchRole;
    });
  }, [members, searchQuery]);

  // Counts for role tabs
  const counts = useMemo(() => {
    return {
      all: members.length,
      student: members.filter(m => m.member_type === 'student').length,
      trainer: members.filter(m => m.member_type === 'trainer').length,
      service: members.filter(m => m.member_type === 'service').length,
    };
  }, [members]);

  const renderMemberCard = (member) => {
    const isStudent = member.member_type === 'student';
    const isTrainer = member.member_type === 'trainer';
    const isService = member.member_type === 'service';

    const specializations = member.specialization
      ? member.specialization.split(',').map((s) => s.trim())
      : (member.preferred_category ? [member.preferred_category] : []);

    return (
      <div
        key={`${member.member_type}-${member.id}`}
        className="rounded-3xl p-5 bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
      >
        <div className="space-y-3.5">
          {/* Top Badge Bar */}
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Role Badge */}
              {isStudent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#005A36] border border-emerald-200 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  <span>{isDe ? 'Studierende' : 'Student'}</span>
                </span>
              )}
              {isTrainer && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>{isDe ? 'Trainer / Coach' : 'Trainer'}</span>
                </span>
              )}
              {isService && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  <span>{isDe ? 'Ausrüstung & Service' : 'Gear & Service'}</span>
                </span>
              )}

              {/* Gender Badge */}
              {member.gender && member.gender !== 'any' && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  member.gender === 'women'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-50 text-blue-800'
                }`}>
                  {member.gender === 'women' ? (isDe ? 'Damen' : 'Women') : (isDe ? 'Herren' : 'Men')}
                </span>
              )}
            </div>

            {/* Skill Level Badge */}
            {member.skill_level && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {member.skill_level}
              </span>
            )}
          </div>

          {/* Member Info Row */}
          <div className="flex items-start gap-3.5">
            <BadmintonAvatar
              photoUrl={member.photo_url}
              avatarType={member.avatar_type || 'badminton_smash'}
              name={member.name}
              size="md"
            />

            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="font-display font-black text-base text-slate-900 truncate">
                {member.name}
              </h4>

              {/* University or Location */}
              <div className="flex items-center gap-1.5 text-xs text-[#005A36] font-semibold truncate">
                <School className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{member.university || 'TU Chemnitz'}</span>
              </div>

              {/* Study program or role label */}
              {member.study_program && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate">
                  <GraduationCap className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{member.study_program}</span>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Player / Idol if available */}
          {member.favorite_player && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-900">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400 flex-shrink-0" />
              <span className="font-bold">{isDe ? 'Vorbild:' : 'Idol:'}</span>
              <span className="truncate font-medium">{member.favorite_player}</span>
            </div>
          )}

          {/* Trainer / Service Details */}
          {isTrainer && member.experience_years && (
            <div className="text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2 border border-slate-100 space-y-0.5">
              <p><span className="font-bold">{isDe ? 'Erfahrung:' : 'Experience:'}</span> {member.experience_years}</p>
              {member.hourly_rate && <p><span className="font-bold">{isDe ? 'Honorar:' : 'Rate:'}</span> {member.hourly_rate}</p>}
            </div>
          )}

          {isService && member.pricing_details && (
            <div className="text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2 border border-slate-100">
              <span className="font-bold">{isDe ? 'Preise / Service:' : 'Pricing:'}</span> {member.pricing_details}
            </div>
          )}

          {/* Preferred Categories / Disciplines */}
          <div className="space-y-1 pt-1.5 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-[#005A36]" />
              <span>{isDe ? 'Kategorien & Disziplinen' : 'Categories & Focus'}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {specializations.map((spec, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700 border border-slate-200"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy Shielding & Direct Message Action */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={() => setSelectedMember(member)}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 min-h-[42px] rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#005A36] to-emerald-700 hover:from-[#00472A] hover:to-emerald-800 shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-200" />
            <span>
              {isDe 
                ? (isTrainer ? '🏸 Trainer diskret anfragen' : (isService ? '🔧 Service anfragen' : '💬 Spielanfrage senden')) 
                : '💬 Send Play Request'}
            </span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">
              {isDe ? 'Kontaktdaten geschützt • Weiterleitung an E-Mail' : 'Contact shielded • Routed to email'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-xs font-bold mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Badminton Student Community</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {isDe ? 'Community-Kader & Netzwerk' : 'Community Members & Network'}
            </h1>
            {onNavigate && (
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isDe ? 'Mein Profil anlegen' : 'Create Profile'}</span>
              </button>
            )}
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setSelfEditOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#005A36] hover:text-[#00472A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                  title={isDe ? 'Eigenes Spielerprofil bearbeiten' : 'Edit profile'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isDe ? 'Profil bearbeiten' : 'Edit Profile'}</span>
                </button>
                <button
                  onClick={() => setSelfDeleteOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                  title={isDe ? 'Eigenes Profil löschen' : 'Delete profile'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDe ? 'Profil löschen' : 'Delete Profile'}</span>
                </button>
              </>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {isDe 
              ? 'Finde Spielpartner aller Spielstärken, qualifizierte Trainer sowie Besaitungs- & Ausrüstungsservice an der TU Chemnitz und Partnerhochschulen.' 
              : 'Find badminton sparring partners, certified coaches, and racket stringing services across TU Chemnitz.'}
          </p>
        </div>

        {/* Authenticated Status or Login Prompt */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <span className="font-bold text-emerald-950 block">{user?.name || user?.email}</span>
                <span className="text-[10px] text-emerald-700 capitalize font-medium">
                  {user?.role === 'trainer' ? 'Trainer' : (user?.role === 'service' ? 'Service-Partner' : 'Student')}
                </span>
              </div>
              <button
                onClick={logout}
                className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                title={isDe ? 'Abmelden' : 'Log out'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openEntryModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-sm transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isDe ? 'Einloggen / Freischalten' : 'Log In / Unlock'}</span>
            </button>
          )}
        </div>
      </div>

      {/* NON-AUTHENTICATED GATE VIEW */}
      {!isAuthenticated && (
        <div className="space-y-8">
          <div className="max-w-xl mx-auto bg-gradient-to-b from-white to-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center relative overflow-hidden">
            
            {/* Top Accent Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#005A36] to-emerald-700 text-white flex items-center justify-center mx-auto shadow-md mb-4">
              <Lock className="w-8 h-8 text-emerald-100" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isDe ? 'Privatsphäre-Schutz aktiv' : 'Privacy Protection Active'}</span>
            </span>

            <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900">
              {isDe ? 'Community-Verzeichnis freischalten' : 'Unlock Community Directory'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
              {isDe 
                ? 'Zum Schutz der Privatsphäre unserer Badminton-Community sind Mitgliederprofile nur für registrierte Studierende, Trainer und Service-Partner zugänglich.'
                : 'To protect community privacy, member profiles are exclusively visible to registered students, coaches, and service partners.'}
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left text-xs space-y-2 text-emerald-950">
              <div className="flex items-start gap-2">
                <span className="font-bold">🎓 Studierende:</span>
                <span>Registrierung & Login mit Hochschul-E-Mail (z.B. @tu-chemnitz.de).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">👥 Trainer & Service:</span>
                <span>Registrierung & Login mit Google Mail / Gmail.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">✨ Einmalige Bestätigung:</span>
                <span>Einmaliger 6-stelliger Bestätigungscode per E-Mail – danach uneingeschränkter Zugang!</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={openEntryModal}
                className="w-full py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#005A36] to-emerald-700 hover:from-[#00472A] hover:to-emerald-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-emerald-200" />
                <span>{isDe ? 'Jetzt kostenlos einloggen / registrieren' : 'Sign in / Register for free'}</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400 space-y-1">
              <p>🔒 {isDe ? 'Kostenlose Verifizierung über unseren Universitätsserver.' : 'Zero-cost verification powered by University Server.'}</p>
            </div>
          </div>

          {/* Anonymized squad teaser */}
          <div className="text-center space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isDe ? 'Aktiver Community-Kader (Vorschau)' : 'Active Community Members (Preview)'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-40 select-none pointer-events-none filter blur-[2px]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                      <div className="h-3 bg-slate-100 rounded w-32" />
                    </div>
                  </div>
                  <div className="h-8 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTICATED DIRECTORY VIEW */}
      {isAuthenticated && (
        <div className="space-y-6">

          {/* Top Role Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setRoleFilter('all')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-[#005A36] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isDe ? 'Alle Mitglieder' : 'All Members'}</span>
              <span className="text-[10px] opacity-80">({counts.all})</span>
            </button>

            <button
              onClick={() => setRoleFilter('student')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === 'student'
                  ? 'bg-[#005A36] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{isDe ? '🎓 Studierende' : '🎓 Students'}</span>
              <span className="text-[10px] opacity-80">({counts.student})</span>
            </button>

            <button
              onClick={() => setRoleFilter('trainer')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === 'trainer'
                  ? 'bg-[#005A36] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isDe ? '👥 Trainer & Coaches' : '👥 Trainers'}</span>
              <span className="text-[10px] opacity-80">({counts.trainer})</span>
            </button>

            <button
              onClick={() => setRoleFilter('service')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === 'service'
                  ? 'bg-[#005A36] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{isDe ? '🔧 Ausrüstung & Service' : '🔧 Gear & Service'}</span>
              <span className="text-[10px] opacity-80">({counts.service})</span>
            </button>
          </div>

          {/* Search and Multi-Criteria Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              
              {/* Search input */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isDe ? 'Name, Fachbereich, Schlagwort...' : 'Search by name, program, skill...'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#005A36] focus:border-[#005A36] outline-none"
                />
              </div>

              {/* Skill Filter */}
              <div>
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#005A36]"
                >
                  <option value="all">{isDe ? 'Alle Spielstärken' : 'All Skill Levels'}</option>
                  <option value="Anfänger">{isDe ? 'Anfänger / Beginner' : 'Beginner'}</option>
                  <option value="Fortgeschritten">{isDe ? 'Fortgeschritten' : 'Intermediate'}</option>
                  <option value="Profi">{isDe ? 'Profi / Erfahren' : 'Advanced / Profi'}</option>
                  <option value="Vereinsspieler">{isDe ? 'Vereinsspieler / Liga' : 'Club / League'}</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#005A36]"
                >
                  <option value="all">{isDe ? 'Alle Kategorien' : 'All Categories'}</option>
                  <option value="Einzel">{isDe ? 'Einzel (Singles)' : 'Singles'}</option>
                  <option value="Doppel">{isDe ? 'Doppel (Doubles)' : 'Doubles'}</option>
                  <option value="Mixed">{isDe ? 'Mixed' : 'Mixed'}</option>
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#005A36]"
                >
                  <option value="all">{isDe ? 'Alle Geschlechter' : 'All Genders'}</option>
                  <option value="men">{isDe ? 'Herren' : 'Men'}</option>
                  <option value="women">{isDe ? 'Damen' : 'Women'}</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#005A36]"
                >
                  <option value="newest">{isDe ? 'Neueste zuerst' : 'Newest First'}</option>
                  <option value="name">{isDe ? 'Name (A-Z)' : 'Name (A-Z)'}</option>
                </select>
              </div>

            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredMembers.length === 0 && (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">
                {isDe ? 'Keine passenden Mitglieder gefunden' : 'No matching members found'}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                {isDe 
                  ? 'Versuche die Filter zurückzusetzen oder erstelle dein eigenes Profil in der Community!' 
                  : 'Try resetting your filters or register your profile in the community!'}
              </p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('register')}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isDe ? 'Jetzt Spielerprofil anlegen' : 'Register Profile'}</span>
                </button>
              )}
            </div>
          )}

          {/* Members Grid */}
          {!loading && filteredMembers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredMembers.map(renderMemberCard)}
            </div>
          )}

        </div>
      )}

      {/* Direct Play Request Modal */}
      <PlayRequestModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        player={selectedMember}
      />

      {/* Self Delete Modal */}
      <SelfDeleteModal
        isOpen={selfDeleteOpen}
        onClose={() => setSelfDeleteOpen(false)}
        onDeleted={() => {
          fetchMembers();
        }}
      />

      {/* Self Edit Modal */}
      <SelfEditModal
        isOpen={selfEditOpen}
        onClose={() => setSelfEditOpen(false)}
        onUpdated={() => {
          fetchMembers();
        }}
      />

    </div>
  );
}
