import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, 
  GraduationCap, 
  Target, 
  Mail, 
  UserPlus, 
  Star, 
  School, 
  Phone, 
  Trophy, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Key, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  LogOut, 
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson, getUploadUrl } from '../api/client';
import PartnerRequestModal from '../components/PartnerRequestModal';
import SelfDeleteModal from '../components/SelfDeleteModal';
import BadmintonAvatar from '../components/BadmintonAvatar';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function PlayersPage({ onNavigate }) {
  const { language, t } = useLanguage();
  const pl = t.players;
  const isDe = language === 'de';

  // State
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'men' | 'women'
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [partnerModalPlayer, setPartnerModalPlayer] = useState(null);
  const [selfDeleteOpen, setSelfDeleteOpen] = useState(false);

  // Student Gate Form State
  const [gateEmail, setGateEmail] = useState('');
  const [gateCode, setGateCode] = useState('');
  const [gateStep, setGateStep] = useState(1); // 1 = Enter Uni Email, 2 = Enter 6-digit OTP
  const [gateSending, setGateSending] = useState(false);
  const [gateVerifying, setGateVerifying] = useState(false);
  const [gateError, setGateError] = useState('');
  const [gateSuccessMsg, setGateSuccessMsg] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Inactivity Tracking
  const lastActivityRef = useRef(Date.now());

  // Record user interaction to keep 30-min session alive
  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const clearStudentSession = (expired = false) => {
    try {
      const token = sessionStorage.getItem('tuc_student_token');
      if (token) {
        safeFetchJson('/api/auth/student-logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        }).catch(() => {});
      }
      sessionStorage.removeItem('tuc_student_token');
      sessionStorage.removeItem('tuc_student_email');
    } catch (e) {}

    setIsLocked(true);
    setPlayers([]);
    setGateStep(1);
    setGateCode('');
    setVerifiedEmail('');
    if (expired) {
      setSessionExpiredNotice(true);
    }
  };

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      // Check if user has admin session or student session
      const adminToken = localStorage.getItem('tuc_admin_token');
      const studentToken = sessionStorage.getItem('tuc_student_token');
      const storedEmail = sessionStorage.getItem('tuc_student_email') || '';

      if (!adminToken && !studentToken) {
        setIsLocked(true);
        setLoading(false);
        return;
      }

      const res = await safeFetchJson('/api/players');
      if (res.ok && Array.isArray(res.data)) {
        setIsLocked(false);
        setSessionExpiredNotice(false);
        if (storedEmail) setVerifiedEmail(storedEmail);
        const list = res.data.map(p => ({
          ...p,
          photo_url: (p.photo_url && p.photo_url.includes('images.unsplash.com')) ? '' : p.photo_url
        }));
        setPlayers(list);
      } else {
        if (res.status === 401 || res.data?.locked) {
          clearStudentSession(false);
        } else {
          setPlayers([]);
        }
      }
    } catch (err) {
      console.error('Failed to load players:', err);
      setIsLocked(true);
    } finally {
      setLoading(false);
    }
  };

  // On initial mount: verify session & set up 30-minute inactivity timer
  useEffect(() => {
    fetchPlayers();

    // Activity event listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, handleUserActivity, { passive: true }));

    // Inactivity interval check every 15 seconds
    const interval = setInterval(() => {
      const studentToken = sessionStorage.getItem('tuc_student_token');
      const adminToken = localStorage.getItem('tuc_admin_token');
      
      // Only apply student idle timer if not admin
      if (studentToken && !adminToken) {
        if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
          console.log('Student session timed out due to 30 minutes of inactivity');
          clearStudentSession(true);
        }
      }
    }, 15000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
      clearInterval(interval);
    };
  }, [handleUserActivity]);

  // Handle Request OTP Code for Student Gate
  const handleRequestGateCode = async (e) => {
    e.preventDefault();
    setGateError('');
    setGateSuccessMsg('');

    if (!gateEmail || !gateEmail.includes('@')) {
      setGateError(isDe ? 'Bitte gib deine universitäre E-Mail-Adresse ein.' : 'Please enter your university email address.');
      return;
    }

    try {
      setGateSending(true);
      const res = await safeFetchJson('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: gateEmail.trim().toLowerCase(),
          scope: 'student_gate'
        })
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Senden des Codes.' : 'Failed to send code.'));
      }

      setGateSuccessMsg(res.data?.message || (isDe ? 'Code erfolgreich gesendet! Bitte prüfe dein Postfach.' : 'Code sent! Check your inbox.'));
      setGateStep(2);
      lastActivityRef.current = Date.now();
    } catch (err) {
      setGateError(err.message || 'Error');
    } finally {
      setGateSending(false);
    }
  };

  // Handle Verify OTP Code & Unlock
  const handleVerifyGateCode = async (e) => {
    e.preventDefault();
    setGateError('');
    setGateSuccessMsg('');

    if (!gateCode || gateCode.trim().length !== 6) {
      setGateError(isDe ? 'Bitte gib den 6-stelligen Code ein.' : 'Please enter the 6-digit code.');
      return;
    }

    try {
      setGateVerifying(true);
      const res = await safeFetchJson('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: gateEmail.trim().toLowerCase(),
          code: gateCode.trim(),
          scope: 'student_gate'
        })
      });

      if (!res.ok || !res.data?.sessionToken) {
        throw new Error(res.error || (isDe ? 'Ungültiger oder abgelaufener Bestätigungscode.' : 'Invalid or expired code.'));
      }

      sessionStorage.setItem('tuc_student_token', res.data.sessionToken);
      sessionStorage.setItem('tuc_student_email', gateEmail.trim().toLowerCase());
      setVerifiedEmail(gateEmail.trim().toLowerCase());
      setIsLocked(false);
      setSessionExpiredNotice(false);
      lastActivityRef.current = Date.now();
      
      // Immediately fetch players with new session
      await fetchPlayers();
    } catch (err) {
      setGateError(err.message || 'Error');
    } finally {
      setGateVerifying(false);
    }
  };

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
      
      {/* Page Header */}
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
            <button
              onClick={() => setSelfDeleteOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              title={isDe ? 'Eigenes Spielerprofil löschen' : 'Delete my profile'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDe ? 'Profil löschen' : 'Delete Profile'}</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {pl.subtitle}
          </p>
        </div>

        {/* Filter Tabs (Visible when unlocked) */}
        {!isLocked && (
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
        )}
      </div>

      {/* Session Expired Alert if triggered by 30-min inactivity */}
      {sessionExpiredNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">
              {isDe ? '⏱️ Sitzung nach 30 Minuten Inaktivität abgelaufen' : '⏱️ Session expired after 30 minutes of inactivity'}
            </p>
            <p className="text-amber-800 mt-0.5">
              {isDe 
                ? 'Zum Schutz der Spielerdaten wurde die Übersicht automatisch gesperrt. Bitte bestätige dich erneut mit deiner Hochschul-E-Mail.'
                : 'For player privacy, the directory has been automatically locked. Please re-verify with your university email.'}
            </p>
          </div>
        </div>
      )}

      {/* Unlocked Session Banner with Expiration Notice & Relock Button */}
      {!isLocked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#005A36] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Unlock className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                  {isDe ? '🔓 Studierenden-Zugang aktiv' : '🔓 Student Access Verified'}
                </h4>
                {verifiedEmail && (
                  <span className="text-[10px] bg-emerald-100/90 text-[#005A36] px-2 py-0.5 rounded-full font-mono font-medium">
                    {verifiedEmail}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-800 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{isDe ? 'Automatische Sperre nach 30 Min. Inaktivität • Kontaktdaten bleiben geschützt' : 'Auto-locks after 30 mins idle • Direct contact protected'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => clearStudentSession(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>{isDe ? 'Sperren' : 'Lock Directory'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STUDENT GATE / LOCKED VIEW */}
      {isLocked && !loading && (
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
              {isDe ? 'Spieler-Verzeichnis freischalten' : 'Unlock Player Directory'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
              {isDe 
                ? 'Zum Schutz der Privatsphäre unserer Badminton-Spieler sind Namen, Fotos und Kontaktdaten nur für immatrikulierte Studierende der TU Chemnitz und Partnerhochschulen einsehbar.'
                : 'To protect student privacy, player photos, names, and contact details are exclusively accessible to verified university students.'}
            </p>

            {/* Error Message */}
            {gateError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{gateError}</span>
              </div>
            )}

            {/* Step 1: Request OTP */}
            {gateStep === 1 && (
              <form onSubmit={handleRequestGateCode} className="mt-6 space-y-4 text-left max-w-md mx-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isDe ? 'Universitäts- / Hochschul-E-Mail' : 'University Email ID'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={gateEmail}
                      onChange={(e) => setGateEmail(e.target.value)}
                      placeholder="z.B. max.mustermann@tu-chemnitz.de oder @mytuc.org"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#005A36] focus:border-[#005A36] outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isDe 
                      ? 'Erlaubt: @tu-chemnitz.de, @mytuc.org sowie alle akkreditierten Hochschul-Domains (.ac.*, .edu, usw.)' 
                      : 'Accepted: @tu-chemnitz.de, @mytuc.org and academic domains (.ac.*, .edu, etc.)'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={gateSending}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#005A36] to-emerald-700 hover:from-[#00472A] hover:to-emerald-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {gateSending ? (
                    <span>{isDe ? 'Code wird gesendet...' : 'Sending code...'}</span>
                  ) : (
                    <>
                      <span>{isDe ? '6-stelligen Freischaltcode anfordern' : 'Send Verification Code'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {gateStep === 2 && (
              <form onSubmit={handleVerifyGateCode} className="mt-6 space-y-4 text-left max-w-md mx-auto">
                {gateSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{gateSuccessMsg}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                  <span className="font-mono truncate">{gateEmail}</span>
                  <button
                    type="button"
                    onClick={() => setGateStep(1)}
                    className="text-[11px] font-bold text-[#005A36] hover:underline"
                  >
                    {isDe ? 'Ändern' : 'Change'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isDe ? '6-stelliger Freischaltcode aus deiner E-Mail' : '6-digit Verification Code'}
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength="6"
                      required
                      value={gateCode}
                      onChange={(e) => setGateCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-mono tracking-widest text-center font-bold focus:ring-2 focus:ring-[#005A36] focus:border-[#005A36] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGateStep(1)}
                    className="w-1/3 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    {isDe ? 'Zurück' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={gateVerifying || gateCode.length !== 6}
                    className="w-2/3 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {gateVerifying ? (
                      <span>{isDe ? 'Wird geprüft...' : 'Verifying...'}</span>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>{isDe ? 'Freischalten' : 'Unlock Directory'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400 space-y-1">
              <p>⏱️ {isDe ? 'Die Freischaltung bleibt bei Inaktivität für 30 Minuten aktiv.' : 'Unlocked session remains active for 30 minutes of inactivity.'}</p>
              <p>🔒 {isDe ? 'Kostenlose Verifizierung über unseren Universitätsserver.' : 'Zero-cost verification powered by University Server.'}</p>
            </div>
          </div>

          {/* Anonymized squad teaser to show visitors that active players exist */}
          <div className="text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {isDe ? 'Aktiver Badminton-Kader (Vorschau)' : 'Active Badminton Squad (Preview)'}
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

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      )}

      {/* UNLOCKED PLAYERS DIRECTORY */}
      {!isLocked && !loading && players.length === 0 && (
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
      {!isLocked && !loading && players.length > 0 && (activeTab === 'all' || activeTab === 'men') && (
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
      {!isLocked && !loading && players.length > 0 && (activeTab === 'all' || activeTab === 'women') && (
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

      {/* Self Delete Modal */}
      <SelfDeleteModal
        isOpen={selfDeleteOpen}
        onClose={() => setSelfDeleteOpen(false)}
        onDeleted={() => {
          fetchPlayers();
        }}
      />

    </div>
  );
}
