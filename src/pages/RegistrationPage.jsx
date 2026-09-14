import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  GraduationCap, 
  Target, 
  Mail, 
  Phone, 
  Star, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  ArrowRight, 
  Sparkles, 
  School, 
  Check, 
  Wrench, 
  Lock, 
  Unlock 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson, fileToDataUrl, getUploadUrl } from '../api/client';
import BadmintonAvatar, { AVATAR_OPTIONS } from '../components/BadmintonAvatar';

export default function RegistrationPage({ onNavigate }) {
  const { user, token, isAuthenticated, openEntryModal, refreshProfile } = useAuth();
  const { language, t } = useLanguage();
  const reg = t.registration;
  const isDe = language === 'de';

  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'trainer' | 'service'
  const [submitting, setSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // -------------------------------------------------------------
  // Player Profile State
  // -------------------------------------------------------------
  const [playerName, setPlayerName] = useState('');
  const [playerGender, setPlayerGender] = useState('men');
  const [playerDisciplines, setPlayerDisciplines] = useState(['Einzel', 'Doppel']);
  const [playerLevel, setPlayerLevel] = useState('Fortgeschritten / Advanced');
  const [playerFav, setPlayerFav] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [playerUniType, setPlayerUniType] = useState('tuc');
  const [playerUniName, setPlayerUniName] = useState('TU Chemnitz');
  const [playerStudy, setPlayerStudy] = useState('');
  const [playerAvatarType, setPlayerAvatarType] = useState('badminton_smash');
  const [playerPhotoFile, setPlayerPhotoFile] = useState(null);
  const [playerPhotoPreview, setPlayerPhotoPreview] = useState('');

  // -------------------------------------------------------------
  // Trainer Form State
  // -------------------------------------------------------------
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerRole, setTrainerRole] = useState('Badminton Coach');
  const [trainerHourlyRate, setTrainerHourlyRate] = useState('');
  const [trainerExperience, setTrainerExperience] = useState('');
  const [trainerFocus, setTrainerFocus] = useState('Technik & Beinarbeit');

  // -------------------------------------------------------------
  // Service Provider Form State
  // -------------------------------------------------------------
  const [serviceName, setServiceName] = useState('');
  const [serviceEmail, setServiceEmail] = useState('');
  const [servicePhone, setServicePhone] = useState('');
  const [serviceTypes, setServiceTypes] = useState(['Schläger-Besaitungsservice']);
  const [servicePricing, setServicePricing] = useState('');
  const [serviceLocation, setServiceLocation] = useState('Sporthalle Thüringer Weg 11 / Campus');

  // Auto-populate when authenticated user is loaded
  useEffect(() => {
    if (user) {
      if (user.name && !playerName) setPlayerName(user.name);
      if (user.university && !playerUniName) {
        setPlayerUniName(user.university);
        setPlayerUniType(user.university === 'TU Chemnitz' ? 'tuc' : 'other');
      }
      if (user.name && !trainerName) setTrainerName(user.name);
      if (user.email && !trainerEmail) setTrainerEmail(user.email);
      if (user.name && !serviceName) setServiceName(user.name);
      if (user.email && !serviceEmail) setServiceEmail(user.email);
    }
  }, [user]);

  const toggleDiscipline = (disc) => {
    if (playerDisciplines.includes(disc)) {
      if (playerDisciplines.length > 1) {
        setPlayerDisciplines(playerDisciplines.filter(d => d !== disc));
      }
    } else {
      setPlayerDisciplines([...playerDisciplines, disc]);
    }
  };

  const toggleServiceType = (type) => {
    if (serviceTypes.includes(type)) {
      if (serviceTypes.length > 1) {
        setServiceTypes(serviceTypes.filter((t) => t !== type));
      }
    } else {
      setServiceTypes([...serviceTypes, type]);
    }
  };

  // -------------------------------------------------------------
  // Handle Player Submit (Zero-OTP for Authenticated Member)
  // -------------------------------------------------------------
  const handleSubmitPlayer = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAuthenticated) {
      openEntryModal();
      return;
    }

    if (!playerName.trim()) {
      setErrorMsg(isDe ? 'Bitte gib deinen Namen ein.' : 'Please enter your name.');
      return;
    }

    const finalUni = playerUniType === 'other' ? (playerUniName.trim() || 'Andere Hochschule') : 'TU Chemnitz';

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('name', playerName.trim());
      formData.append('gender', playerGender);
      formData.append('university', finalUni);
      formData.append('skill_level', playerLevel);
      formData.append('preferred_category', playerDisciplines.join(', '));
      formData.append('specialization', playerDisciplines.join(', '));
      formData.append('phone', playerPhone.trim());
      formData.append('avatar_type', playerAvatarType);
      formData.append('favorite_player', playerFav.trim());
      formData.append('study_program', playerStudy.trim() || 'Badminton Member');

      if (playerPhotoFile) {
        formData.append('photo', playerPhotoFile);
      }

      const res = await safeFetchJson('/api/players/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-student-token': token
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Speichern des Profils.' : 'Failed to save profile.'));
      }

      setSubmittedType('player');
      setSuccessMsg(res.data?.message || (isDe ? 'Spielerprofil erfolgreich gespeichert!' : 'Player profile saved successfully!'));
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err.message || 'Verbindungsfehler beim Speichern.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Handle Trainer Submit
  // -------------------------------------------------------------
  const handleSubmitTrainer = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const emailToUse = user?.email || trainerEmail.trim().toLowerCase();
    if (!trainerName.trim() || !emailToUse) {
      setErrorMsg(isDe ? 'Name und E-Mail sind erforderlich.' : 'Name and email are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await safeFetchJson('/api/trainers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trainerName.trim(),
          email: emailToUse,
          phone: trainerPhone.trim(),
          role: trainerRole.trim(),
          hourly_rate: trainerHourlyRate.trim(),
          experience_years: trainerExperience.trim(),
          focus_areas: trainerFocus.trim(),
          show_phone: 0,
        })
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler bei der Trainer-Registrierung.' : 'Trainer registration failed.'));
      }

      setSubmittedType('trainer');
      setSuccessMsg(res.data?.message || (isDe ? 'Trainer-Profil erfolgreich eingereicht!' : 'Trainer profile submitted!'));
    } catch (err) {
      setErrorMsg(err.message || 'Fehler beim Absenden.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Handle Service Submit
  // -------------------------------------------------------------
  const handleSubmitService = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const emailToUse = user?.email || serviceEmail.trim().toLowerCase();
    if (!serviceName.trim() || !emailToUse) {
      setErrorMsg(isDe ? 'Name und E-Mail sind erforderlich.' : 'Name and email are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await safeFetchJson('/api/equipment-services/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceName.trim(),
          email: emailToUse,
          phone: servicePhone.trim(),
          service_type: serviceTypes.join(', '),
          pricing_details: servicePricing.trim(),
          location_note: serviceLocation.trim(),
          show_phone: 0,
        })
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler bei der Service-Registrierung.' : 'Service registration failed.'));
      }

      setSubmittedType('service');
      setSuccessMsg(res.data?.message || (isDe ? 'Ausrüstungs-Service erfolgreich eingereicht!' : 'Equipment service submitted!'));
    } catch (err) {
      setErrorMsg(err.message || 'Fehler beim Absenden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Badminton Student Community</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {isDe ? 'Profil erstellen & Community beitreten' : 'Create Profile & Join Community'}
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          {isDe 
            ? 'Trage dich in unseren Kader ein, finde Spielpartner für Einzel, Doppel & Mixed oder biete deine Trainings- und Besaitungsdienste an.' 
            : 'Join our player roster, find sparring partners for singles/doubles, or offer coaching and stringing services.'}
        </p>
      </div>

      {/* Role Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('player'); setSubmittedType(null); setErrorMsg(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'player'
                ? 'bg-[#005A36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isDe ? '🎓 Spieler / Student' : '🎓 Player / Student'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('trainer'); setSubmittedType(null); setErrorMsg(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trainer'
                ? 'bg-[#005A36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isDe ? '👥 Trainer & Coach' : '👥 Trainer & Coach'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('service'); setSubmittedType(null); setErrorMsg(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'service'
                ? 'bg-[#005A36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>{isDe ? '🔧 Ausrüstung & Service' : '🔧 Gear & Service'}</span>
          </button>
        </div>
      </div>

      {/* Authenticated Status or Sign-In Prompt Box */}
      {!isAuthenticated ? (
        <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-11 h-11 rounded-2xl bg-amber-200/80 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {isDe ? 'Einmalige Registrierung erforderlich' : 'One-time registration required'}
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {isDe 
                  ? 'Studierende registrieren sich mit ihrer Hochschul-E-Mail (@tu-chemnitz.de). Trainer & Service-Anbieter können sich direkt mit Gmail anmelden.' 
                  : 'Students register with university email. Trainers & service providers can use Gmail.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openEntryModal}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Unlock className="w-4 h-4 text-emerald-200" />
            <span>{isDe ? 'Jetzt kostenlos einloggen' : 'Sign in for free'}</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#005A36] text-white flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold">
                  {isDe ? '🔓 Angemeldet als verifiziertes Mitglied:' : '🔓 Signed in as verified member:'}
                </span>
                <span className="text-xs font-mono font-bold text-[#005A36] bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  {user?.email}
                </span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {user?.role === 'trainer' ? 'Trainer' : (user?.role === 'service' ? 'Service' : 'Student')}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {isDe 
                  ? 'Keine weiteren Codes oder Bestätigungen nötig – Änderungen werden sofort aktiv.' 
                  : 'Zero OTP required – your updates take effect immediately.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success View */}
      {submittedType && (
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-emerald-200 shadow-xl text-center space-y-4 max-w-lg mx-auto animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isDe ? 'Profil erfolgreich gespeichert!' : 'Profile Saved!'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isDe 
              ? 'Dein Profil ist nun aktiv in der Badminton Student Community hinterlegt. Deine Kontaktdaten bleiben strikt geschützt.' 
              : 'Your profile is now active in the Badminton Student Community. Your direct contact details remain completely shielded.'}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('players')}
                className="py-3 px-6 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>{isDe ? 'Zum Community-Kader' : 'View Community Roster'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSubmittedType(null)}
              className="py-3 px-5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              {isDe ? 'Weiteres bearbeiten' : 'Edit Again'}
            </button>
          </div>
        </div>
      )}

      {/* Form Container */}
      {!submittedType && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">

          {/* Privacy Guarantee Box */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-900">
                {isDe ? '🔒 Strikter Privatsphäre-Schutz nach deinen Wünschen:' : '🔒 Strict Privacy Shielding:'}
              </p>
              <p className="leading-relaxed">
                {isDe 
                  ? 'Nur dein Name, Badminton-Level, deine bevorzugten Kategorien und dein Avatar/Foto werden öffentlich im Verzeichnis angezeigt. Deine Telefonnummer und E-Mail sind vollständig verborgen und werden erst sichtbar, wenn dir jemand eine Spielanfrage sendet und du dieser zustimmst.' 
                  : 'Only your name, skill level, preferred categories, and avatar are shown publicly. Your contact details remain shielded until you accept a play request.'}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: PLAYER / STUDENT PROFILE */}
          {activeTab === 'player' && (
            <form onSubmit={handleSubmitPlayer} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Name / Vorname & Nachname' : 'Full Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="z.B. Lukas Weber"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] focus:border-[#005A36] outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isDe ? 'Wird im Verzeichnis für Spielpartner angezeigt.' : 'Displayed in the roster for sparring partners.'}
                  </p>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Geschlecht' : 'Gender'} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlayerGender('men')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        playerGender === 'men'
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-extrabold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isDe ? 'Herren (Men)' : 'Men'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayerGender('women')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        playerGender === 'women'
                          ? 'bg-purple-50 border-purple-500 text-purple-900 font-extrabold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isDe ? 'Damen (Women)' : 'Women'}
                    </button>
                  </div>
                </div>

                {/* University */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Universität / Hochschule' : 'University / College'} <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setPlayerUniType('tuc'); setPlayerUniName('TU Chemnitz'); }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          playerUniType === 'tuc'
                            ? 'bg-emerald-50 border-[#005A36] text-[#005A36]'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        TU Chemnitz
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerUniType('other')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          playerUniType === 'other'
                            ? 'bg-emerald-50 border-[#005A36] text-[#005A36]'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {isDe ? 'Andere Hochschule' : 'Other University'}
                      </button>
                    </div>
                    {playerUniType === 'other' && (
                      <input
                        type="text"
                        required
                        value={playerUniName}
                        onChange={(e) => setPlayerUniName(e.target.value)}
                        placeholder="z.B. TU Dresden, HTWK Leipzig, etc."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#005A36] outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Registered Email (Protected) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Verifizierte E-Mail-Adresse' : 'Registered Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={user?.email || 'Wird nach Login verknüpft'}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs sm:text-sm font-mono text-slate-700 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{isDe ? 'Bereits verifiziert • Bleibt im Verzeichnis verborgen' : 'Verified • Hidden in directory'}</span>
                  </p>
                </div>

                {/* Skill Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Badminton-Level / Spielstärke' : 'Badminton Level'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={playerLevel}
                    onChange={(e) => setPlayerLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#005A36]"
                  >
                    <option value="Anfänger / Beginner">{isDe ? 'Anfänger / Beginner (Grundregeln & Spaß)' : 'Beginner'}</option>
                    <option value="Fortgeschritten / Advanced">{isDe ? 'Fortgeschritten / Advanced (Regelmäßiges Spiel)' : 'Intermediate / Advanced'}</option>
                    <option value="Profi / Wettkampf">{isDe ? 'Profi / Wettkampf (Turnier- & Uni-Cup Erfahrung)' : 'Pro / Tournament'}</option>
                    <option value="Vereinsspieler / Liga">{isDe ? 'Vereinsspieler / Liga (Sachsenliga / Bezirksliga)' : 'Club / League Player'}</option>
                  </select>
                </div>

                {/* Preferred Categories / Disciplines */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Bevorzugte Spielkategorien' : 'Preferred Categories'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {['Einzel', 'Doppel', 'Mixed'].map((cat) => {
                      const isSel = playerDisciplines.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleDiscipline(cat)}
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#005A36] border-[#005A36] text-white shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isDe ? 'Wähle alle Kategorien, für die du Spielpartner suchst.' : 'Select all categories you want to play.'}
                  </p>
                </div>

                {/* Optional Phone / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Telefon / WhatsApp (optional)' : 'Phone / WhatsApp (optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={playerPhone}
                      onChange={(e) => setPlayerPhone(e.target.value)}
                      placeholder="+49 152 12345678"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isDe ? 'Wird niemals öffentlich angezeigt. Nur für bestätigte Partner sichtbar.' : 'Never shown publicly. Revealed only upon accepted request.'}
                  </p>
                </div>

                {/* Favorite Player / Idol */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Lieblingsspieler / Vorbild (optional)' : 'Favorite Player / Idol (optional)'}
                  </label>
                  <div className="relative">
                    <Star className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={playerFav}
                      onChange={(e) => setPlayerFav(e.target.value)}
                      placeholder="z.B. Viktor Axelsen, Tai Tzu-ying, Lin Dan"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Badminton Avatar & Photo Selection */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isDe ? 'Badminton-Avatar & Profilbild (optional)' : 'Avatar & Photo (optional)'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isDe 
                      ? 'Wähle einen unserer stilvollen Badminton-Avatare oder lade dein eigenes Foto hoch.' 
                      : 'Choose a badminton avatar or upload your photo.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Avatar Preview */}
                  <BadmintonAvatar
                    photoUrl={playerPhotoPreview}
                    avatarType={playerAvatarType}
                    name={playerName || 'Player'}
                    size="lg"
                  />

                  {/* Avatar Choice Dropdown */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {isDe ? 'Standard-Avatar wählen' : 'Select Avatar Style'}
                    </label>
                    <select
                      value={playerAvatarType}
                      onChange={(e) => setPlayerAvatarType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#005A36]"
                    >
                      {AVATAR_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {isDe ? opt.labelDe : opt.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Custom File Upload */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {isDe ? 'Oder eigenes Foto hochladen' : 'Or upload photo'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPlayerPhotoFile(file);
                          setPlayerPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#005A36] hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#005A36] to-emerald-700 hover:from-[#00472A] hover:to-emerald-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{isDe ? 'Profil jetzt kostenlos speichern (Zero OTP)' : 'Save Profile (Zero OTP)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: TRAINER / COACH */}
          {activeTab === 'trainer' && (
            <form onSubmit={handleSubmitTrainer} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Name des Trainers / Coaches' : 'Trainer Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    placeholder="z.B. Alex Schmidt"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'E-Mail-Adresse' : 'Email'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={user?.email || trainerEmail}
                    onChange={(e) => setTrainerEmail(e.target.value)}
                    placeholder="alex.schmidt@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Trainings-Schwerpunkte' : 'Focus Areas'}
                  </label>
                  <input
                    type="text"
                    value={trainerFocus}
                    onChange={(e) => setTrainerFocus(e.target.value)}
                    placeholder="z.B. Einsteiger-Technik, Smash & Abwehr, Doppel-Taktik"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Honorar / Konditionen (optional)' : 'Hourly Rate (optional)'}
                  </label>
                  <input
                    type="text"
                    value={trainerHourlyRate}
                    onChange={(e) => setTrainerHourlyRate(e.target.value)}
                    placeholder="z.B. 15€ / Std. oder USZ-Kurs"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>{isDe ? 'Als Trainer eintragen' : 'Submit Trainer Profile'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: GEAR & STRINGING SERVICE */}
          {activeTab === 'service' && (
            <form onSubmit={handleSubmitService} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Anbieter-Name / Werkstatt' : 'Provider Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="z.B. Marco Racket Service"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'E-Mail-Adresse' : 'Email'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={user?.email || serviceEmail}
                    onChange={(e) => setServiceEmail(e.target.value)}
                    placeholder="service@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Angebotene Services' : 'Offered Services'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Schläger-Besaitungsservice', 'Griffbandwechsel', 'Bälle & Zubehör', 'Schlägerverleih'].map((type) => {
                      const isSel = serviceTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleServiceType(type)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#005A36] border-[#005A36] text-white'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isDe ? 'Preise & Details' : 'Pricing & Details'}
                  </label>
                  <input
                    type="text"
                    value={servicePricing}
                    onChange={(e) => setServicePricing(e.target.value)}
                    placeholder="z.B. Besaitung 15€ inkl. Saite (Yonex BG65 / Nanogy98)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Wrench className="w-4 h-4" />
                    <span>{isDe ? 'Service-Eintrag speichern' : 'Submit Service Profile'}</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      )}

    </div>
  );
}
