import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Key, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Filter,
  UserCheck,
  Share2,
  Download,
  DollarSign,
  Activity,
  Flame,
  Smile,
  ChevronDown
} from 'lucide-react';
import {
  downloadIcsCalendarFile,
  getGoogleCalendarUrl,
  getWhatsAppShareUrl,
  getVenueAmenities
} from '../utils/calendar';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { safeFetchJson } from '../api/client';
import BadmintonAvatar, { AVATAR_OPTIONS } from '../components/BadmintonAvatar';

const POPULAR_VENUES = [
  { name: 'Feels Good Club Chemnitz', address: 'Neefestraße 86, 09119 Chemnitz' },
  { name: 'Sporthalle Thüringer Weg 11', address: 'Thüringer Weg 11, 09126 Chemnitz' },
  { name: 'Richard-Hartmann-Halle', address: 'Fabrikstraße 9, 09111 Chemnitz' },
  { name: 'Andere Sporthalle', address: 'Chemnitz' }
];

// Helper functions for bilingual session formatting
export const formatSessionType = (format, isDe) => {
  if (!format) return '';
  if (isDe) return format;
  const f = format.toLowerCase();
  if (f === 'doppel') return 'Doubles';
  if (f === 'einzel') return 'Singles';
  if (f === 'mixed') return 'Mixed';
  if (f === 'spieleabend' || f.includes('offen')) return 'Open Play';
  return format;
};

export const formatSessionSkill = (level, isDe) => {
  if (!level) return '';
  if (isDe) return level;
  const l = level.toLowerCase();
  if (l.includes('alle')) return 'All skill levels welcome';
  if (l.includes('anfänger') || l.includes('hobby')) return 'Beginner / Hobby';
  if (l.includes('fortgeschritten')) return 'Intermediate';
  if (l.includes('wettkampf') || l.includes('liga')) return 'Competitive / League';
  return level;
};

export default function SessionsPage({ onNavigate }) {
  const { user, token, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVenue, setFilterVenue] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');
  const [filterShuttle, setFilterShuttle] = useState('all'); // 'all' | 'feather' | 'plastic'
  const [filterIntensity, setFilterIntensity] = useState('all'); // 'all' | 'casual' | 'sparring'
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalSession, setJoinModalSession] = useState(null);
  const [manageModalSession, setManageModalSession] = useState(null);

  // Create Form State
  const [createTitle, setCreateTitle] = useState('');
  const [createVenue, setCreateVenue] = useState(POPULAR_VENUES[0].name);
  const [createAddress, setCreateAddress] = useState(POPULAR_VENUES[0].address);
  const [createDate, setCreateDate] = useState('');
  const [createStartTime, setCreateStartTime] = useState('18:00');
  const [createEndTime, setCreateEndTime] = useState('20:00');
  const [createFormat, setCreateFormat] = useState('Doppel');
  const [createSkillLevel, setCreateSkillLevel] = useState('Alle Spielstärken');
  const [createMaxPlayers, setCreateMaxPlayers] = useState(4);
  const [createCostNote, setCreateCostNote] = useState('Courtmiete geteilt');
  const [createShuttlecock, setCreateShuttlecock] = useState('feather'); // 'feather' | 'plastic' | 'any'
  const [createIntensity, setCreateIntensity] = useState('casual'); // 'casual' | 'sparring'
  const [createTotalCost, setCreateTotalCost] = useState(24); // default 24€ for 2h court
  const [createDescription, setCreateDescription] = useState('');
  const [createHostName, setCreateHostName] = useState('');
  const [createHostEmail, setCreateHostEmail] = useState('');
  const [createHostPhone, setCreateHostPhone] = useState('');
  const [createHostAvatar, setCreateHostAvatar] = useState('badminton_smash');
  const [createHostPin, setCreateHostPin] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  // Available registered players & invite list
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [invitedPlayerIds, setInvitedPlayerIds] = useState([]);

  // Join Form State
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('speed_racket');
  const [joinNotes, setJoinNotes] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccessMsg, setJoinSuccessMsg] = useState('');

  // Join OTP State
  const [joinOtpCode, setJoinOtpCode] = useState('');
  const [joinOtpSent, setJoinOtpSent] = useState(false);
  const [joinOtpSending, setJoinOtpSending] = useState(false);
  const [joinOtpError, setJoinOtpError] = useState('');
  const [joinOtpSuccess, setJoinOtpSuccess] = useState('');

  // Manage Form State
  const [managePin, setManagePin] = useState('');
  const [manageAction, setManageAction] = useState('close');
  const [manageSubmitting, setManageSubmitting] = useState(false);
  const [manageError, setManageError] = useState('');
  const [manageSuccessMsg, setManageSuccessMsg] = useState('');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await safeFetchJson('/api/game-sessions');
      if (res.ok && Array.isArray(res.data)) {
        setSessions(res.data);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const headers = token ? { 'Authorization': `Bearer ${token}`, 'x-student-token': token } : {};
    safeFetchJson('/api/community/members', { headers }).then(res => {
      if (res.ok && Array.isArray(res.data)) {
        setAvailablePlayers(res.data);
      }
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (user) {
      if (user.name && !createHostName) setCreateHostName(user.name);
      if (user.email && !createHostEmail) setCreateHostEmail(user.email);
      if (user.name && !joinName) setJoinName(user.name);
      if (user.email && !joinEmail) setJoinEmail(user.email);
    }
  }, [user]);

  const handleVenueChange = (e) => {
    const val = e.target.value;
    setCreateVenue(val);
    const found = POPULAR_VENUES.find(v => v.name === val);
    if (found) {
      setCreateAddress(found.address);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccessMsg('');

    if (!createHostName.trim() || !createHostEmail.trim() || !createDate || !createHostPin) {
      setCreateError(isDe ? 'Bitte fülle alle Pflichtfelder inkl. 4-stelligem PIN aus.' : 'Please fill all required fields including 4-digit PIN.');
      return;
    }

    if (createHostPin.trim().length < 4) {
      setCreateError(isDe ? 'Der Host-PIN muss mindestens 4 Ziffern enthalten.' : 'Host PIN must be at least 4 digits.');
      return;
    }

    try {
      setCreateSubmitting(true);
      const payload = {
        title: createTitle.trim() || (isDe ? `${createFormat} im ${createVenue}` : `${createFormat} at ${createVenue}`),
        venue: createVenue,
        address: createAddress,
        session_date: createDate,
        start_time: createStartTime,
        end_time: createEndTime,
        format: createFormat,
        skill_level: createSkillLevel,
        max_players: parseInt(createMaxPlayers, 10) || 4,
        cost_note: createCostNote,
        description: createDescription.trim(),
        host_name: createHostName.trim(),
        host_email: createHostEmail.trim().toLowerCase(),
        host_phone: createHostPhone.trim(),
        host_avatar_type: createHostAvatar,
        host_pin: createHostPin.trim(),
        shuttlecock_type: createShuttlecock,
        intensity_level: createIntensity,
        total_cost: parseFloat(createTotalCost) || 0,
        invited_player_ids: invitedPlayerIds
      };

      const res = await safeFetchJson('/api/game-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}`, 'x-student-token': token } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Erstellen der Spielrunde.' : 'Failed to create session.'));
      }

      setCreateSuccessMsg(isDe 
        ? '🎉 Spielrunde erfolgreich erstellt! Eine Bestätigung wurde an deine E-Mail gesendet.' 
        : '🎉 Session created successfully! Confirmation sent to your email.');
      fetchSessions();
      setTimeout(() => {
        setCreateModalOpen(false);
        setCreateSuccessMsg('');
        setCreateTitle('');
        setCreateDate('');
        setCreateDescription('');
        setCreateHostPin('');
      }, 2000);
    } catch (err) {
      setCreateError(err.message || 'Error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleSendJoinOtp = async () => {
    setJoinOtpError('');
    setJoinOtpSuccess('');
    if (!joinEmail.trim() || !joinEmail.includes('@')) {
      setJoinOtpError(isDe ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.');
      return;
    }
    try {
      setJoinOtpSending(true);
      const res = await safeFetchJson('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: joinEmail.trim().toLowerCase(),
          scope: 'join_session'
        })
      });
      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Senden des Codes.' : 'Failed to send verification code.'));
      }
      setJoinOtpSent(true);
      setJoinOtpSuccess(res.data?.message || (isDe ? 'Code gesendet! Bitte prüfe dein Postfach.' : 'Code sent to your email!'));
    } catch (err) {
      setJoinOtpError(err.message || 'Error');
    } finally {
      setJoinOtpSending(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccessMsg('');

    const emailToUse = (user?.email || joinEmail).trim().toLowerCase();

    if (!joinName.trim() || !emailToUse) {
      setJoinError(isDe ? 'Bitte gib deinen Namen und deine E-Mail an.' : 'Please provide your name and email.');
      return;
    }

    const verifiedStudentEmail = user?.email || sessionStorage.getItem('tuc_student_email') || '';
    const isStudentVerified = isAuthenticated || (verifiedStudentEmail && verifiedStudentEmail === emailToUse);

    if (!isStudentVerified && (!joinOtpCode || joinOtpCode.trim().length !== 6)) {
      setJoinError(isDe 
        ? 'Bitte bestätige deine E-Mail-Adresse mit dem 6-stelligen Code vor dem Beitreten.' 
        : 'Please verify your email address with the 6-digit code before joining.');
      return;
    }

    try {
      setJoinSubmitting(true);
      const payload = {
        participant_name: joinName.trim(),
        participant_email: emailToUse,
        participant_phone: joinPhone.trim(),
        avatar_type: joinAvatar,
        notes: joinNotes.trim(),
        otp_code: joinOtpCode.trim()
      };

      const res = await safeFetchJson(`/api/game-sessions/${joinModalSession.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}`, 'x-student-token': token } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Beitreten.' : 'Failed to join session.'));
      }

      setJoinSuccessMsg(isDe 
        ? '🏸 Du bist dabei! Der Host wurde benachrichtigt und Details wurden an deine E-Mail gesendet.' 
        : '🏸 You are in! The host has been notified and details were sent to your email.');
      fetchSessions();
      setTimeout(() => {
        setJoinModalSession(null);
        setJoinSuccessMsg('');
        setJoinName('');
        setJoinEmail('');
        setJoinPhone('');
        setJoinNotes('');
      }, 2200);
    } catch (err) {
      setJoinError(err.message || 'Error');
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleManageSubmit = async (e) => {
    e.preventDefault();
    setManageError('');
    setManageSuccessMsg('');

    if (!managePin.trim()) {
      setManageError(isDe ? 'Bitte gib deinen 4-stelligen Host-PIN ein.' : 'Please enter your 4-digit host PIN.');
      return;
    }

    try {
      setManageSubmitting(true);
      const res = await safeFetchJson(`/api/game-sessions/${manageModalSession.id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_pin: managePin.trim(),
          action: manageAction
        })
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Ungültiger PIN oder Fehler.' : 'Invalid PIN or server error.'));
      }

      setManageSuccessMsg(isDe ? 'Aktion erfolgreich ausgeführt!' : 'Action completed successfully!');
      fetchSessions();
      setTimeout(() => {
        setManageModalSession(null);
        setManageSuccessMsg('');
        setManagePin('');
      }, 1500);
    } catch (err) {
      setManageError(err.message || 'Error');
    } finally {
      setManageSubmitting(false);
    }
  };

  // Filtered Sessions
  const filteredSessions = sessions.filter((s) => {
    if (showOnlyOpen && (s.status !== 'open' || (s.current_players >= s.max_players))) return false;
    if (filterVenue !== 'all' && !s.venue.toLowerCase().includes(filterVenue.toLowerCase())) return false;
    if (filterFormat !== 'all' && s.format !== filterFormat) return false;
    if (filterShuttle !== 'all') {
      const sType = s.shuttlecock_type || 'feather';
      if (filterShuttle === 'feather' && sType !== 'feather' && sType !== 'any') return false;
      if (filterShuttle === 'plastic' && sType !== 'plastic' && sType !== 'any') return false;
    }
    if (filterIntensity !== 'all') {
      const sInt = s.intensity_level || 'casual';
      if (sInt !== filterIntensity) return false;
    }
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isDe ? 'de-DE' : 'en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-[11px] sm:text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isDe ? 'Looking for Group (LFG) • Match-Treff' : 'Looking for Group (LFG) • Match Finder'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {isDe ? '🏸 Spielrunden & Spielertreff' : '🏸 Badminton Match Finder'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            {isDe 
              ? 'Finde spontan Mitspieler für Matches im Feels Good Club, der Uni-Sporthalle oder organisiere deine eigene Runde — unkompliziert und ohne Zwang!'
              : 'Find players spontaneously for games at Feels Good Club, Uni Gym, or create your own session without needing a fixed club membership!'}
          </p>
        </div>

        {/* Action Button: Create Session */}
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-[#005A36] text-white hover:bg-[#00472A] active:bg-[#003820] transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isDe ? 'Neue Spielrunde erstellen' : 'Create Game Session'}</span>
        </button>
      </div>

      {/* Privacy Shield Notice */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#005A36] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
              {isDe ? 'Diskreter & sicherer Kontakt' : 'Discreet & Secure Contact'}
            </h4>
            <p className="text-[11px] sm:text-xs text-emerald-800 leading-snug">
              {isDe 
                ? 'Deine privaten Kontaktdaten bleiben geschützt. Nach dem Beitreten erhalten nur du und der Host gegenseitig die Spieldetails per E-Mail.'
                : 'Your contact details stay private. Only you and the session host receive confirmation emails once a spot is booked.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>

          <select
            value={filterVenue}
            onChange={(e) => setFilterVenue(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
          >
            <option value="all">{isDe ? '📍 Alle Hallen & Orte' : '📍 All Venues'}</option>
            <option value="Feels Good">Feels Good Club Chemnitz</option>
            <option value="Thüringer">Sporthalle Thüringer Weg 11</option>
            <option value="Richard-Hartmann">Richard-Hartmann-Halle</option>
          </select>

          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
          >
            <option value="all">{isDe ? '🏸 Alle Spielmodi' : '🏸 All Formats'}</option>
            <option value="Einzel">Einzel (1 vs 1)</option>
            <option value="Doppel">Doppel (2 vs 2)</option>
            <option value="Mixed">Mixed</option>
            <option value="Spieleabend">Offener Spieleabend</option>
          </select>

          <select
            value={filterShuttle}
            onChange={(e) => setFilterShuttle(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
          >
            <option value="all">{isDe ? '🪶/🟡 Alle Bälle' : '🪶/🟡 All Shuttles'}</option>
            <option value="feather">{isDe ? '🪶 Nur Federbälle' : '🪶 Feather Shuttles'}</option>
            <option value="plastic">{isDe ? '🟡 Nur Plastik/Nylon' : '🟡 Plastic/Nylon'}</option>
          </select>

          <select
            value={filterIntensity}
            onChange={(e) => setFilterIntensity(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
          >
            <option value="all">{isDe ? '⚡ Alle Intensitäten' : '⚡ All Intensities'}</option>
            <option value="casual">{isDe ? '😊 Casual / Lockeres Spiel' : '😊 Casual / Fun'}</option>
            <option value="sparring">{isDe ? '🔥 Sparring / Intensiv' : '🔥 Sparring / Matchplay'}</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer ml-1 text-slate-700 font-semibold select-none">
            <input
              type="checkbox"
              checked={showOnlyOpen}
              onChange={(e) => setShowOnlyOpen(e.target.checked)}
              className="rounded border-slate-300 text-[#005A36] focus:ring-[#005A36] w-3.5 h-3.5"
            />
            <span>{isDe ? 'Nur freie Plätze' : 'Only Open Slots'}</span>
          </label>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {filteredSessions.length} {isDe ? 'Spielrunden aktiv' : 'active sessions'}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSessions.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">
            {isDe ? 'Keine passenden Spielrunden gefunden' : 'No game sessions found'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {isDe 
              ? 'Sei der Erste und erstelle eine neue Spielrunde für Feels Good Club oder die Uni-Halle!' 
              : 'Be the first to create a badminton game session for Feels Good Club or the university gym!'}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isDe ? 'Spielrunde jetzt erstellen' : 'Create Session Now'}</span>
          </button>
        </div>
      )}

      {/* Sessions Grid */}
      {!loading && filteredSessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => {
            const isFull = session.current_players >= session.max_players;
            const isOpen = session.status === 'open' && !isFull;
            const slotsLeft = Math.max(0, session.max_players - session.current_players);

            return (
              <div
                key={session.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative"
              >
                {/* Top Status Bar */}
                <div className="p-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                      session.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : isFull
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-[#005A36]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        session.status === 'cancelled' ? 'bg-rose-600' : isFull ? 'bg-amber-600' : 'bg-emerald-600'
                      }`} />
                      {session.status === 'cancelled'
                        ? (isDe ? 'Abgesagt' : 'Cancelled')
                        : isFull
                        ? (isDe ? 'Voll belegt' : 'Fully Booked')
                        : (isDe ? `Offen (${slotsLeft} frei)` : `Open (${slotsLeft} slots)`)}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {formatSessionType(session.format, isDe)}
                      </span>
                      {/* Shuttlecock Badge */}
                      <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] border ${
                        session.shuttlecock_type === 'plastic'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : session.shuttlecock_type === 'any'
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      }`}>
                        {session.shuttlecock_type === 'plastic'
                          ? (isDe ? '🟡 Plastik' : '🟡 Plastic')
                          : session.shuttlecock_type === 'any'
                          ? (isDe ? '🏸 Beliebig' : '🏸 Any')
                          : (isDe ? '🪶 Federbälle' : '🪶 Feather')}
                      </span>
                      {/* Intensity Badge */}
                      <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] border ${
                        session.intensity_level === 'sparring'
                          ? 'bg-rose-50 text-rose-900 border-rose-200'
                          : 'bg-sky-50 text-sky-900 border-sky-200'
                      }`}>
                        {session.intensity_level === 'sparring' ? '🔥 Sparring' : '😊 Casual'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {session.title}
                  </h3>

                  {session.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {session.description}
                    </p>
                  )}
                </div>

                {/* Session Details */}
                <div className="p-5 py-3 space-y-2.5 text-xs text-slate-600 bg-slate-50/50 flex-1">
                  
                  {/* Date & Time */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#005A36] flex-shrink-0" />
                    <span className="font-bold text-slate-800">{formatDate(session.session_date)}</span>
                    <span className="text-slate-400">•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{session.start_time} - {session.end_time}</span>
                  </div>

                  {/* Venue & Maps link */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((session.venue || '') + ' ' + (session.address || 'Chemnitz'))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-slate-900 hover:text-[#005A36] flex items-center gap-1 group"
                      >
                        <span className="truncate">{session.venue}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#005A36] flex-shrink-0" />
                      </a>
                      {session.address && (
                        <p className="text-[11px] text-slate-400 truncate">{session.address}</p>
                      )}
                    </div>
                  </div>

                  {/* Venue Amenities Chips */}
                  {(() => {
                    const amenities = getVenueAmenities(session.venue);
                    return (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {amenities.map(a => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100/90 text-slate-600 text-[10px] font-medium"
                            title={isDe ? a.labelDe : a.labelEn}
                          >
                            <span>{a.icon}</span>
                            <span className="truncate max-w-[120px]">{isDe ? a.labelDe : a.labelEn}</span>
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Level & Cost */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>{isDe ? 'Niveau:' : 'Level:'} <strong className="text-slate-700">{formatSessionSkill(session.skill_level, isDe)}</strong></span>
                    {session.cost_note && (
                      <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {session.cost_note}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Court Split Cost Calculator */}
                  {(() => {
                    const totalCost = Number(session.total_cost) || 0;
                    if (totalCost <= 0) return null;
                    const maxP = Number(session.max_players) || 4;
                    const curP = Math.max(1, Number(session.current_players) || 1);
                    const curSplit = (totalCost / curP).toFixed(2).replace('.', ',');
                    const fullSplit = (totalCost / maxP).toFixed(2).replace('.', ',');
                    const isFullSession = curP >= maxP;
                    return (
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1 text-[#005A36]">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{isDe ? 'Court-Kostenrechner:' : 'Court Cost Split Calculator:'}</span>
                          </span>
                          <span className="font-mono">{isDe ? `${totalCost.toFixed(2).replace('.', ',')} € Gesamt` : `€${totalCost.toFixed(2)} Total`}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-emerald-900">
                          <span>{isDe ? `Aktuell (${curP} Spieler):` : `Current (${curP} player${curP === 1 ? '' : 's'}):`} <strong>{isDe ? `${curSplit} € p.P.` : `€${(totalCost / curP).toFixed(2)} / person`}</strong></span>
                          <span>{isDe ? `Bei Vollbelegung (${maxP}):` : `When full (${maxP}):`} <strong className="text-[#005A36]">{isDe ? `${fullSplit} € p.P.` : `€${(totalCost / maxP).toFixed(2)} / person`}</strong></span>
                        </div>
                        {!isFullSession && (
                          <p className="text-[9.5px] text-emerald-700 font-medium italic pt-0.5 border-t border-emerald-200/50">
                            🎉 {isDe 
                              ? `Jeder neue Mitspieler senkt die Kosten für alle auf ${(totalCost / (curP + 1)).toFixed(2).replace('.', ',')} €!` 
                              : `Each new player lowers the cost for everyone to €${(totalCost / (curP + 1)).toFixed(2)}!`}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Slot Visualizer & Host */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadmintonAvatar avatarType={session.host_avatar_type || 'badminton_smash'} size="sm" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isDe ? 'Host / Ersteller:' : 'Host:'}</span>
                        <span className="text-xs font-bold text-slate-800">{session.host_name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">{isDe ? 'Spieler:' : 'Players:'}</span>
                      <span className="text-xs font-black text-slate-900">
                        {session.current_players} / {session.max_players}
                      </span>
                    </div>
                  </div>

                  {/* Participant Chips */}
                  {Array.isArray(session.participants) && session.participants.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {session.participants.map((p, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-700"
                        >
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>{p.participant_name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                  {isOpen ? (
                    <button
                      onClick={() => setJoinModalSession(session)}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] active:bg-[#003820] transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isDe ? 'Mitspielen' : 'Join Game'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed text-center"
                    >
                      {session.status === 'cancelled' 
                        ? (isDe ? 'Abgesagt' : 'Cancelled') 
                        : (isDe ? 'Voll belegt' : 'Full')}
                    </button>
                  )}

                  <button
                    onClick={() => { setManageModalSession(session); setManagePin(''); setManageError(''); setManageSuccessMsg(''); }}
                    title={isDe ? 'Spielrunde als Host verwalten (PIN erforderlich)' : 'Manage session as host (PIN required)'}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. MODAL: CREATE GAME SESSION                             */}
      {/* ========================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  {isDe ? 'Neue Spielrunde erstellen' : 'Create Game Session'}
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {createSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{createSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs sm:text-sm">
              
              {/* Host Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  {isDe ? '1. Deine Angaben als Host (geschützt)' : '1. Your Host Information (protected)'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Dein Name / Spitzname *' : 'Your Name / Nickname *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={createHostName}
                      onChange={(e) => setCreateHostName(e.target.value)}
                      placeholder="z.B. Joshep"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Deine E-Mail (für Bestätigung) *' : 'Your Email (for confirmation) *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={createHostEmail}
                      onChange={(e) => setCreateHostEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36] font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Telefon / WhatsApp (optional)' : 'Phone / WhatsApp (optional)'}
                    </label>
                    <input
                      type="tel"
                      value={createHostPhone}
                      onChange={(e) => setCreateHostPhone(e.target.value)}
                      placeholder="+49 ..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36] font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? '4-stelliger Host-PIN (zum Verwalten) *' : '4-digit Host PIN (to manage later) *'}
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={createHostPin}
                      onChange={(e) => setCreateHostPin(e.target.value)}
                      placeholder="z.B. 1234"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36] font-mono tracking-widest text-center text-sm"
                    />
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    {isDe ? 'Wähle dein Host-Avatar' : 'Choose Host Avatar'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_OPTIONS.slice(0, 4).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCreateHostAvatar(opt.id)}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          createHostAvatar === opt.id ? 'border-[#005A36] bg-emerald-50 ring-1 ring-[#005A36]' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <BadmintonAvatar avatarType={opt.id} size="sm" />
                        <span className="text-[10px] font-bold truncate max-w-full">{isDe ? opt.nameDe : opt.nameEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Match Details */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  {isDe ? '2. Spieldetails & Ort' : '2. Match Details & Venue'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Halle / Ort *' : 'Venue / Location *'}
                    </label>
                    <select
                      value={createVenue}
                      onChange={handleVenueChange}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#005A36] bg-white font-medium"
                    >
                      {POPULAR_VENUES.map((v) => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Datum *' : 'Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={createDate}
                      onChange={(e) => setCreateDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#005A36] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Von' : 'Start'}
                    </label>
                    <input
                      type="time"
                      value={createStartTime}
                      onChange={(e) => setCreateStartTime(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Bis' : 'End'}
                    </label>
                    <input
                      type="time"
                      value={createEndTime}
                      onChange={(e) => setCreateEndTime(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Format' : 'Format'}
                    </label>
                    <select
                      value={createFormat}
                      onChange={(e) => setCreateFormat(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Doppel">{isDe ? 'Doppel' : 'Doubles'}</option>
                      <option value="Einzel">{isDe ? 'Einzel' : 'Singles'}</option>
                      <option value="Mixed">{isDe ? 'Mixed' : 'Mixed'}</option>
                      <option value="Spieleabend">{isDe ? 'Offen / Treff' : 'Open Play'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Max Spieler' : 'Max Players'}
                    </label>
                    <select
                      value={createMaxPlayers}
                      onChange={(e) => setCreateMaxPlayers(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="2">{isDe ? '2 Spieler' : '2 Players'}</option>
                      <option value="4">{isDe ? '4 Spieler' : '4 Players'}</option>
                      <option value="6">{isDe ? '6 Spieler' : '6 Players'}</option>
                      <option value="8">{isDe ? '8 Spieler' : '8 Players'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Spielstärke' : 'Skill Level'}
                    </label>
                    <select
                      value={createSkillLevel}
                      onChange={(e) => setCreateSkillLevel(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Alle Spielstärken">{isDe ? 'Alle Spielstärken willkommen' : 'All skill levels welcome'}</option>
                      <option value="Anfänger">{isDe ? 'Anfänger / Hobby' : 'Beginner / Hobby'}</option>
                      <option value="Fortgeschritten">{isDe ? 'Fortgeschritten' : 'Intermediate'}</option>
                      <option value="Wettkampf / Liga">{isDe ? 'Wettkampf / Liga' : 'Competitive / League'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Kosten-Hinweis' : 'Cost Note'}
                    </label>
                    <input
                      type="text"
                      value={createCostNote}
                      onChange={(e) => setCreateCostNote(e.target.value)}
                      placeholder={isDe ? 'z.B. Courtmiete geteilt' : 'e.g. Court fee split evenly'}
                      className="w-full p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                {/* Match Quality: Shuttlecock & Intensity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5 text-xs">
                      {isDe ? '🪶 Ballart (Shuttlecock)' : '🪶 Shuttlecock Type'}
                    </label>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setCreateShuttlecock('feather')}
                        className={`py-2 px-1 rounded-xl font-bold border transition-all text-center ${
                          createShuttlecock === 'feather'
                            ? 'bg-[#005A36] text-white border-[#005A36]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🪶 {isDe ? 'Feder' : 'Feather'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateShuttlecock('plastic')}
                        className={`py-2 px-1 rounded-xl font-bold border transition-all text-center ${
                          createShuttlecock === 'plastic'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🟡 {isDe ? 'Plastik' : 'Plastic'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateShuttlecock('any')}
                        className={`py-2 px-1 rounded-xl font-bold border transition-all text-center ${
                          createShuttlecock === 'any'
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🏸 {isDe ? 'Beliebig' : 'Any'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5 text-xs">
                      {isDe ? '⚡ Spiel-Intensität' : '⚡ Match Intensity'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setCreateIntensity('casual')}
                        className={`py-2 px-2 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1 ${
                          createIntensity === 'casual'
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5" />
                        <span>Casual</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateIntensity('sparring')}
                        className={`py-2 px-2 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1 ${
                          createIntensity === 'sparring'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Sparring</span>
                      </button>
                    </div>
                  </div>

                  {/* Total Court Cost & Live Split Calculation */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="font-bold text-slate-800 text-xs block">
                        {isDe ? 'Gesamte Courtmiete (€)' : 'Total Court Booking Cost (€)'}
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {isDe ? 'Wird automatisch unter allen Mitspielern aufgeteilt' : 'Will be split automatically among players'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={createTotalCost}
                        onChange={(e) => setCreateTotalCost(e.target.value)}
                        placeholder="24"
                        className="w-24 p-2 rounded-xl border border-slate-300 font-mono font-bold text-xs text-center"
                      />
                      <span className="text-xs font-bold text-slate-600">€</span>
                      <span className="text-[11px] font-semibold text-[#005A36] bg-emerald-100/70 px-2 py-1 rounded-lg border border-emerald-200">
                        {createTotalCost && createMaxPlayers > 0 ? `ca. ${(createTotalCost / createMaxPlayers).toFixed(2).replace('.', ',')} € p.P.` : '0 €'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isDe ? 'Notiz / Nachricht für Mitspieler (optional)' : 'Notes for Players (optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder={isDe ? 'z.B. Bälle bringe ich mit, Court 2 reserviert.' : 'e.g. I will bring shuttles, court 2 reserved.'}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Invite specific registered players */}
              {availablePlayers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs">
                      {isDe ? '👥 Registrierte Spieler gezielt einladen (optional)' : '👥 Invite Registered Players (optional)'}
                    </label>
                    <span className="text-[11px] text-[#005A36] font-semibold">
                      {invitedPlayerIds.length} {isDe ? 'ausgewählt' : 'selected'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isDe 
                      ? 'Ausgewählte Spieler erhalten eine persönliche Einladungs-E-Mail mit den Spieldetails.' 
                      : 'Selected players will receive a personal invite email with session details.'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {availablePlayers.map(p => {
                      const isSelected = invitedPlayerIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setInvitedPlayerIds(invitedPlayerIds.filter(id => id !== p.id));
                            } else {
                              setInvitedPlayerIds([...invitedPlayerIds, p.id]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#005A36] text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{p.name}</span>
                          <span className="text-[10px] opacity-75">({p.skill_level || 'Badminton'})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Broadcast Notification Hint */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <span className="text-sm">📧</span>
                <p>
                  {isDe 
                    ? 'Automatische Benachrichtigung: Alle aktiven Spieler im Verzeichnis werden nach Veröffentlichung automatisch per E-Mail informiert.' 
                    : 'Broadcast Alert: All active players in the directory will be automatically notified by email once published.'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  {isDe ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#005A36] text-white hover:bg-[#00472A] disabled:opacity-50"
                >
                  {createSubmitting ? (isDe ? 'Wird erstellt...' : 'Creating...') : (isDe ? 'Spielrunde veröffentlichen' : 'Publish Session')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL: JOIN GAME SESSION                               */}
      {/* ========================================================= */}
      {joinModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {isDe ? 'Spielrunde beitreten' : 'Join Game Session'}
                  </h3>
                  <span className="text-[11px] text-slate-400 block">{joinModalSession.venue} • {formatDate(joinModalSession.session_date)}</span>
                </div>
              </div>
              <button
                onClick={() => setJoinModalSession(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {joinSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{joinSuccessMsg}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadIcsCalendarFile(joinModalSession, isDe)}
                    className="py-2 px-3 rounded-xl font-bold bg-[#005A36] text-white hover:bg-[#00472A] flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDe ? 'In Kalender eintragen (.ics)' : 'Add to Calendar (.ics)'}</span>
                  </button>
                  <a
                    href={getGoogleCalendarUrl(joinModalSession, isDe)}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    <span>Google Calendar</span>
                  </a>
                  <a
                    href={getWhatsAppShareUrl(joinModalSession, isDe)}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl font-bold bg-[#25D366] text-white hover:bg-[#20ba59] flex items-center gap-1.5 ml-auto"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-3 text-xs sm:text-sm">
              
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isDe ? 'Dein Name / Spitzname *' : 'Your Name / Nickname *'}
                </label>
                <input
                  type="text"
                  required
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="z.B. Alex"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#005A36]"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  {isDe ? 'Deine E-Mail-Adresse *' : 'Your Email Address *'}
                </label>
                {isAuthenticated ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-950">{user?.email || joinEmail}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{isDe ? 'Verifiziert (Zero OTP)' : 'Verified (Zero OTP)'}</span>
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={joinEmail}
                        onChange={(e) => {
                          setJoinEmail(e.target.value);
                          if (joinOtpSent) {
                            setJoinOtpSent(false);
                            setJoinOtpCode('');
                          }
                        }}
                        placeholder="name@example.com"
                        className="flex-1 p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-[#005A36] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendJoinOtp}
                        disabled={joinOtpSending || !joinEmail.includes('@')}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] disabled:opacity-50 whitespace-nowrap shadow-xs"
                      >
                        {joinOtpSending ? (isDe ? 'Sendet...' : 'Sending...') : (joinOtpSent ? (isDe ? 'Code erneut' : 'Resend') : (isDe ? 'Code anfordern' : 'Send Code'))}
                      </button>
                    </div>

                    {joinOtpError && (
                      <p className="text-xs text-red-600 font-semibold">{joinOtpError}</p>
                    )}
                    {joinOtpSuccess && (
                      <p className="text-xs text-emerald-700 font-semibold">{joinOtpSuccess}</p>
                    )}

                    {/* OTP Code Input */}
                    {joinOtpSent && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                        <label className="block text-xs font-bold text-emerald-950">
                          {isDe ? '6-stelliger Bestätigungscode aus deiner E-Mail *' : '6-digit Confirmation Code *'}
                        </label>
                        <input
                          type="text"
                          maxLength="6"
                          required
                          value={joinOtpCode}
                          onChange={(e) => setJoinOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white font-mono text-sm tracking-widest text-center font-bold focus:ring-2 focus:ring-[#005A36] outline-none"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isDe ? 'Telefon / WhatsApp (optional)' : 'Phone / WhatsApp (optional)'}
                </label>
                <input
                  type="tel"
                  value={joinPhone}
                  onChange={(e) => setJoinPhone(e.target.value)}
                  placeholder="+49 ..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isDe ? 'Kurze Nachricht an den Host (optional)' : 'Message to host (optional)'}
                </label>
                <input
                  type="text"
                  value={joinNotes}
                  onChange={(e) => setJoinNotes(e.target.value)}
                  placeholder={isDe ? 'z.B. Freue mich! Habe Schläger dabei.' : 'e.g. Looking forward, bringing racket.'}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJoinModalSession(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  {isDe ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={joinSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#005A36] text-white hover:bg-[#00472A] disabled:opacity-50"
                >
                  {joinSubmitting ? (isDe ? 'Wird gebucht...' : 'Joining...') : (isDe ? 'Platz sichern' : 'Join Now')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL: MANAGE SESSION (HOST PIN)                       */}
      {/* ========================================================= */}
      {manageModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {isDe ? 'Spielrunde verwalten' : 'Manage Game Session'}
                  </h3>
                  <span className="text-[11px] text-slate-400 block">{manageModalSession.title}</span>
                </div>
              </div>
              <button
                onClick={() => setManageModalSession(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {manageError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{manageError}</span>
              </div>
            )}

            {manageSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{manageSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleManageSubmit} className="space-y-3 text-xs sm:text-sm">
              
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isDe ? 'Host-PIN eingeben *' : 'Enter Host PIN *'}
                </label>
                <input
                  type="password"
                  required
                  value={managePin}
                  onChange={(e) => setManagePin(e.target.value)}
                  placeholder="****"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono tracking-widest text-center text-sm"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isDe ? 'Den PIN hast du beim Erstellen der Spielrunde vergeben.' : 'The PIN you set when creating the session.'}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isDe ? 'Aktion wählen *' : 'Choose Action *'}
                </label>
                <select
                  value={manageAction}
                  onChange={(e) => setManageAction(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="close">{isDe ? '🔒 Spielrunde schließen (keine weiteren Mitspieler)' : '🔒 Close session (no more joiners)'}</option>
                  <option value="open">{isDe ? '🔓 Spielrunde wieder öffnen' : '🔓 Re-open session'}</option>
                  <option value="cancel">{isDe ? '❌ Spielrunde absagen' : '❌ Cancel session'}</option>
                  <option value="delete">{isDe ? '🗑️ Spielrunde löschen' : '🗑️ Delete session'}</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManageModalSession(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  {isDe ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={manageSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#005A36] text-white hover:bg-[#00472A] disabled:opacity-50"
                >
                  {manageSubmitting ? (isDe ? 'Wird ausgeführt...' : 'Executing...') : (isDe ? 'Bestätigen' : 'Confirm')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
