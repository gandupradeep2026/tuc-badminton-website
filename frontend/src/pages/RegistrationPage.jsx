import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getApiUrl, safeFetchJson, saveOfflineSubmission, fileToDataUrl } from '../api/client';

export default function RegistrationPage({ onNavigate }) {
  const { language, t } = useLanguage();
  const reg = t.registration;
  const isDe = language === 'de';

  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'trainer'
  const [submitting, setSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState(null); // 'player' | 'trainer' | null
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // Player Form State
  // -------------------------------------------------------------
  const [playerName, setPlayerName] = useState('');
  const [playerGender, setPlayerGender] = useState('men'); // 'men' | 'women'
  const [playerDisciplines, setPlayerDisciplines] = useState(['Einzel']);
  const [playerLevel, setPlayerLevel] = useState('Fortgeschritten / Advanced');
  const [playerFav, setPlayerFav] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [playerShowPhone, setPlayerShowPhone] = useState(false);
  const [playerUniType, setPlayerUniType] = useState('tuc'); // 'tuc' | 'other'
  const [playerUniName, setPlayerUniName] = useState('TU Chemnitz');
  const [playerStudy, setPlayerStudy] = useState('');
  const [playerPhotoFile, setPlayerPhotoFile] = useState(null);
  const [playerPhotoPreview, setPlayerPhotoPreview] = useState('');
  const [playerPhotoUrl, setPlayerPhotoUrl] = useState('');

  // -------------------------------------------------------------
  // Trainer Form State
  // -------------------------------------------------------------
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerShowPhone, setTrainerShowPhone] = useState(false);
  const [trainerRole, setTrainerRole] = useState('');
  const [trainerFocus, setTrainerFocus] = useState('');
  const [trainerUszApproved, setTrainerUszApproved] = useState(false);
  const [trainerUszNote, setTrainerUszNote] = useState('');
  const [trainerPhotoFile, setTrainerPhotoFile] = useState(null);
  const [trainerPhotoPreview, setTrainerPhotoPreview] = useState('');
  const [trainerPhotoUrl, setTrainerPhotoUrl] = useState('');

  // Discipline toggle helper
  const toggleDiscipline = (disc) => {
    if (playerDisciplines.includes(disc)) {
      if (playerDisciplines.length > 1) {
        setPlayerDisciplines(playerDisciplines.filter(d => d !== disc));
      }
    } else {
      setPlayerDisciplines([...playerDisciplines, disc]);
    }
  };

  // -------------------------------------------------------------
  // Handle Player Submit
  // -------------------------------------------------------------
  const handleSubmitPlayer = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (!playerName.trim() || !playerEmail.trim() || !playerStudy.trim()) {
      setErrorMsg(reg.errGeneral);
      setSubmitting(false);
      return;
    }

    if (playerUniType === 'other' && !playerUniName.trim()) {
      setErrorMsg(isDe ? 'Bitte gib den Namen deiner Universität / Hochschule an.' : 'Please enter your university name.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: playerName.trim(),
        gender: playerGender,
        specialization: playerDisciplines.join(', '),
        skill_level: playerLevel,
        favorite_player: playerFav.trim(),
        email: playerEmail.trim().toLowerCase(),
        phone: playerPhone.trim(),
        show_phone: playerShowPhone ? 1 : 0,
        university_type: playerUniType,
        university_name: playerUniType === 'other' ? playerUniName.trim() : 'TU Chemnitz',
        study_program: playerStudy.trim(),
      };

      let photoDataUrl = playerPhotoUrl.trim();
      if (playerPhotoFile) {
        photoDataUrl = await fileToDataUrl(playerPhotoFile);
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
      if (playerPhotoFile) {
        formData.append('photo', playerPhotoFile);
      } else if (photoDataUrl) {
        formData.append('photo_url_input', photoDataUrl);
      }

      const result = await safeFetchJson('/api/register/player', {
        method: 'POST',
        body: formData,
      });

      if (!result.ok) {
        if (result.isOffline) {
          saveOfflineSubmission({
            type: 'player',
            data: payload,
            photoDataUrl,
          });
          setIsOfflineSaved(true);
          setSubmittedType('player');
          return;
        }
        throw new Error(result.error || (isDe ? 'Fehler beim Übermitteln der Spieler-Registrierung.' : 'Error submitting player registration.'));
      }

      setIsOfflineSaved(false);
      setSubmittedType('player');
    } catch (err) {
      setErrorMsg(err.message || (isDe ? 'Übermittlung fehlgeschlagen.' : 'Submission failed.'));
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
    setSubmitting(true);

    if (!trainerName.trim() || !trainerEmail.trim() || !trainerPhone.trim() || !trainerRole.trim()) {
      setErrorMsg(reg.errGeneral);
      setSubmitting(false);
      return;
    }

    if (!trainerUszApproved) {
      setErrorMsg(reg.errUszApproval);
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: trainerName.trim(),
        role: trainerRole.trim(),
        email: trainerEmail.trim().toLowerCase(),
        phone: trainerPhone.trim(),
        show_phone: trainerShowPhone ? 1 : 0,
        focus_areas: trainerFocus.trim(),
        hochschulsport_approved: 'true',
        hochschulsport_note: trainerUszNote.trim() || 'USZ Genehmigung bestätigt',
      };

      let photoDataUrl = trainerPhotoUrl.trim();
      if (trainerPhotoFile) {
        photoDataUrl = await fileToDataUrl(trainerPhotoFile);
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
      if (trainerPhotoFile) {
        formData.append('photo', trainerPhotoFile);
      } else if (photoDataUrl) {
        formData.append('photo_url_input', photoDataUrl);
      }

      const result = await safeFetchJson('/api/register/trainer', {
        method: 'POST',
        body: formData,
      });

      if (!result.ok) {
        if (result.isOffline) {
          saveOfflineSubmission({
            type: 'trainer',
            data: payload,
            photoDataUrl,
          });
          setIsOfflineSaved(true);
          setSubmittedType('trainer');
          return;
        }
        throw new Error(result.error || (isDe ? 'Fehler beim Übermitteln der Trainer-Bewerbung.' : 'Error submitting trainer application.'));
      }

      setIsOfflineSaved(false);
      setSubmittedType('trainer');
    } catch (err) {
      setErrorMsg(err.message || (isDe ? 'Übermittlung fehlgeschlagen.' : 'Submission failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedType(null);
    setIsOfflineSaved(false);
    setErrorMsg('');
    if (activeTab === 'player') {
      setPlayerName('');
      setPlayerFav('');
      setPlayerEmail('');
      setPlayerPhone('');
      setPlayerShowPhone(false);
      setPlayerStudy('');
      setPlayerPhotoFile(null);
      setPlayerPhotoPreview('');
      setPlayerPhotoUrl('');
    } else {
      setTrainerName('');
      setTrainerEmail('');
      setTrainerPhone('');
      setTrainerShowPhone(false);
      setTrainerRole('');
      setTrainerFocus('');
      setTrainerUszApproved(false);
      setTrainerUszNote('');
      setTrainerPhotoFile(null);
      setTrainerPhotoPreview('');
      setTrainerPhotoUrl('');
    }
  };

  // -------------------------------------------------------------
  // View: Success Screen
  // -------------------------------------------------------------
  if (submittedType) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden p-6 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-[#005A36] mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-[#005A36] border border-emerald-200">
                {submittedType === 'player' ? (reg.badgePlayerSubmitted || '🏸 Spieler-Registrierung') : (reg.badgeTrainerSubmitted || '👥 Badminton-Trainer Registrierung')}
              </span>
              {isOfflineSaved && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  {reg.badgeOfflineQueue || '⚡ Offline gespeichert (Warteschlange)'}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {reg.successTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              {isOfflineSaved
                ? (submittedType === 'player' ? (reg.msgOfflinePlayer || 'Ihre Spieler-Registrierung wurde sicher auf diesem Gerät gespeichert!') : (reg.msgOfflineTrainer || 'Ihre Trainer-Registrierung wurde sicher auf diesem Gerät gespeichert!'))
                : (submittedType === 'player' ? reg.successPlayerDesc : reg.successTrainerDesc)
              }
            </p>
          </div>

          {/* Workflow Steps Card */}
          <div className="text-left bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              {reg.whatNext}
            </h4>
            <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#005A36] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>{reg.step1}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#005A36] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>{reg.step2}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#005A36] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>{reg.step3}</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="w-full sm:w-auto px-6 py-3 min-h-[46px] rounded-xl text-xs sm:text-sm font-bold bg-[#005A36] hover:bg-[#00472A] text-white transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>{reg.btnBackHome}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-5 py-3 min-h-[46px] rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {reg.btnAnother}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // View: Main Registration Form
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 pb-16 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-5 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-[11px] sm:text-xs font-bold mb-2">
          <UserPlus className="w-3.5 h-3.5" />
          <span>{reg.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          {reg.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {reg.subtitle}
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold shadow-xs">
        <button
          type="button"
          onClick={() => { setActiveTab('player'); setErrorMsg(''); }}
          className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 min-h-[46px] ${
            activeTab === 'player'
              ? 'bg-[#005A36] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>{reg.tabPlayer}</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('trainer'); setErrorMsg(''); }}
          className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 min-h-[46px] ${
            activeTab === 'trainer'
              ? 'bg-[#005A36] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>{reg.tabTrainer}</span>
        </button>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">{reg.validationError || (isDe ? 'Eingabefehler:' : 'Validation Error:')}</span>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. PLAYER REGISTRATION FORM                                */}
      {/* ========================================================= */}
      {activeTab === 'player' && (
        <form onSubmit={handleSubmitPlayer} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-display font-black text-xl text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#005A36]" />
              <span>{reg.playerTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {reg.playerDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
            
            {/* Full Name */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.nameLabel}
              </label>
              <input
                type="text"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={reg.namePlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium"
              />
            </div>

            {/* Gender / Category */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.genderLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className={`cursor-pointer p-2.5 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center ${
                  playerGender === 'men' ? 'bg-[#005A36] text-white border-[#005A36]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}>
                  <input
                    type="radio"
                    name="playerGender"
                    value="men"
                    checked={playerGender === 'men'}
                    onChange={() => setPlayerGender('men')}
                    className="sr-only"
                  />
                  <span>{reg.genderMen}</span>
                </label>
                <label className={`cursor-pointer p-2.5 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center ${
                  playerGender === 'women' ? 'bg-[#005A36] text-white border-[#005A36]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}>
                  <input
                    type="radio"
                    name="playerGender"
                    value="women"
                    checked={playerGender === 'women'}
                    onChange={() => setPlayerGender('women')}
                    className="sr-only"
                  />
                  <span>{reg.genderWomen}</span>
                </label>
                <label className={`cursor-pointer p-2.5 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center ${
                  playerGender === 'diverse' ? 'bg-[#005A36] text-white border-[#005A36]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}>
                  <input
                    type="radio"
                    name="playerGender"
                    value="diverse"
                    checked={playerGender === 'diverse'}
                    onChange={() => setPlayerGender('diverse')}
                    className="sr-only"
                  />
                  <span>{reg.genderDiverse}</span>
                </label>
              </div>
            </div>

            {/* Disciplines Selection (Multi-select) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700">
                  {reg.disciplinesLabel}
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {reg.disciplinesHelp}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'Einzel', label: reg.singles },
                  { id: 'Doppel', label: reg.doubles },
                  { id: 'Mixed', label: reg.mixed }
                ].map((item) => {
                  const isChecked = playerDisciplines.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleDiscipline(item.id)}
                      className={`p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
                        isChecked
                          ? 'bg-emerald-50 border-[#005A36] text-[#005A36] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-[#005A36] border-[#005A36] text-white' : 'border-slate-300'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skill Level Selection */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.levelLabel}
              </label>
              <select
                value={playerLevel}
                onChange={(e) => setPlayerLevel(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white font-medium focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all"
              >
                <option value="Anfänger">{reg.levelBeginner}</option>
                <option value="Fortgeschritten">{reg.levelIntermediate}</option>
                <option value="Erfahren">{reg.levelAdvanced}</option>
                <option value="Wettkampf">{reg.levelCompetitive}</option>
              </select>
            </div>

            {/* Favorite Player / Idol (Clean text input without preset recommendations) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.favPlayerLabel}
              </label>
              <input
                type="text"
                value={playerFav}
                onChange={(e) => setPlayerFav(e.target.value)}
                placeholder={reg.favPlayerPlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.emailLabel}
              </label>
              <input
                type="email"
                required
                value={playerEmail}
                onChange={(e) => setPlayerEmail(e.target.value)}
                placeholder={reg.emailPlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium font-mono text-xs sm:text-sm"
              />
            </div>

            {/* Phone Number / WhatsApp & Show/Hide Toggle */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.phoneLabel}
              </label>
              <input
                type="tel"
                required
                value={playerPhone}
                onChange={(e) => setPlayerPhone(e.target.value)}
                placeholder={reg.phonePlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium font-mono text-xs sm:text-sm"
              />
              <label className="flex items-start gap-2.5 mt-2 cursor-pointer select-none p-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={playerShowPhone}
                  onChange={(e) => setPlayerShowPhone(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#005A36] focus:ring-[#005A36]"
                />
                <div className="text-xs">
                  <span className="text-slate-800 font-semibold block">{reg.showPhoneLabel}</span>
                  <span className="text-slate-400 text-[11px] block">{reg.phonePrivacyHint}</span>
                </div>
              </label>
            </div>

            {/* University Status Radio Group */}
            <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-800 block">
                {reg.uniStatusLabel}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className={`cursor-pointer p-3 rounded-xl border font-bold text-xs transition-all flex items-center gap-2.5 ${
                  playerUniType === 'tu_chemnitz'
                    ? 'bg-emerald-50 border-[#005A36] text-[#005A36]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="uniType"
                    value="tu_chemnitz"
                    checked={playerUniType === 'tu_chemnitz'}
                    onChange={() => setPlayerUniType('tu_chemnitz')}
                    className="text-[#005A36] focus:ring-[#005A36]"
                  />
                  <span>{reg.uniTuChemnitz}</span>
                </label>

                <label className={`cursor-pointer p-3 rounded-xl border font-bold text-xs transition-all flex items-center gap-2.5 ${
                  playerUniType === 'other'
                    ? 'bg-emerald-50 border-[#005A36] text-[#005A36]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="uniType"
                    value="other"
                    checked={playerUniType === 'other'}
                    onChange={() => setPlayerUniType('other')}
                    className="text-[#005A36] focus:ring-[#005A36]"
                  />
                  <span>{reg.uniOther}</span>
                </label>

                <label className={`cursor-pointer p-3 rounded-xl border font-bold text-xs transition-all flex items-center gap-2.5 ${
                  playerUniType === 'none'
                    ? 'bg-emerald-50 border-[#005A36] text-[#005A36]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="uniType"
                    value="none"
                    checked={playerUniType === 'none'}
                    onChange={() => setPlayerUniType('none')}
                    className="text-[#005A36] focus:ring-[#005A36]"
                  />
                  <span>{reg.uniNone}</span>
                </label>
              </div>
            </div>

            {/* Other University Name (Conditional) */}
            {playerUniType === 'other' && (
              <div className="sm:col-span-2 animate-in fade-in duration-150">
                <label className="font-bold text-slate-700 block mb-1.5">
                  {reg.uniNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={playerUniName}
                  onChange={(e) => setPlayerUniName(e.target.value)}
                  placeholder={reg.uniNamePlaceholder}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium"
                />
              </div>
            )}

            {/* Study Program */}
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.studyProgramLabel}
              </label>
              <input
                type="text"
                required
                value={playerStudy}
                onChange={(e) => setPlayerStudy(e.target.value)}
                placeholder={reg.studyProgramPlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium"
              />
            </div>

            {/* Profile Photo (Upload or URL) */}
            <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 block">
                {reg.photoLabel}
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {playerPhotoPreview || playerPhotoUrl ? (
                    <img 
                      src={playerPhotoPreview || playerPhotoUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Users className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPlayerPhotoFile(file);
                        setPlayerPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#005A36] file:text-white hover:file:bg-[#00472A] cursor-pointer"
                  />
                  <input
                    type="url"
                    value={playerPhotoUrl}
                    onChange={(e) => {
                      setPlayerPhotoUrl(e.target.value);
                      if (e.target.value) setPlayerPhotoPreview('');
                    }}
                    placeholder={reg.photoUrlPlaceholder}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Admin Approval Notice Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#005A36] flex-shrink-0" />
            <p>
              <strong>Admin-Prüfung:</strong> Neue Spieler-Registrierungen werden aus Sicherheitsgründen durch den Administrator geprüft und nach Freigabe in der offiziellen Spielerliste aufgeführt.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-[#005A36] hover:bg-[#00472A] active:bg-[#003820] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              <span>{submitting ? reg.submitting : reg.submitPlayerBtn}</span>
            </button>
          </div>

        </form>
      )}

      {/* ========================================================= */}
      {/* 2. TRAINER APPLICATION FORM                               */}
      {/* ========================================================= */}
      {activeTab === 'trainer' && (
        <form onSubmit={handleSubmitTrainer} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-display font-black text-xl text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#005A36]" />
              <span>{reg.trainerTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {reg.trainerDesc}
            </p>
          </div>

          {/* Mandatory USZ Approval Notice Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{reg.uszApprovalRequired}</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900/90">
              {reg.uszApprovalNotice}
            </p>
            <label className="flex items-start gap-3 cursor-pointer pt-1 bg-white/80 p-3 rounded-xl border border-amber-200">
              <input
                type="checkbox"
                required
                checked={trainerUszApproved}
                onChange={(e) => setTrainerUszApproved(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#005A36] rounded border-amber-400 focus:ring-[#005A36]"
              />
              <span className="text-xs font-bold text-slate-900 leading-snug">
                {reg.uszCheckboxLabel}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
            
            {/* Trainer Full Name */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.nameLabel}
              </label>
              <input
                type="text"
                required
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                placeholder={reg.namePlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium"
              />
            </div>

            {/* Role / License */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.trainerRoleLabel}
              </label>
              <input
                type="text"
                required
                value={trainerRole}
                onChange={(e) => setTrainerRole(e.target.value)}
                placeholder={reg.trainerRolePlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.emailLabel}
              </label>
              <input
                type="email"
                required
                value={trainerEmail}
                onChange={(e) => setTrainerEmail(e.target.value)}
                placeholder={reg.emailPlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium font-mono text-xs sm:text-sm"
              />
            </div>

            {/* Phone Number & Show/Hide Toggle */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.phoneLabel}
              </label>
              <input
                type="tel"
                required
                value={trainerPhone}
                onChange={(e) => setTrainerPhone(e.target.value)}
                placeholder={reg.phonePlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium font-mono text-xs sm:text-sm"
              />
              <label className="flex items-start gap-2.5 mt-2 cursor-pointer select-none p-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={trainerShowPhone}
                  onChange={(e) => setTrainerShowPhone(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#005A36] focus:ring-[#005A36]"
                />
                <div className="text-xs">
                  <span className="text-slate-800 font-semibold block">{reg.showPhoneLabel}</span>
                  <span className="text-slate-400 text-[11px] block">{reg.phonePrivacyHint}</span>
                </div>
              </label>
            </div>

            {/* USZ Reference Note */}
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.uszNoteLabel}
              </label>
              <input
                type="text"
                required
                value={trainerUszNote}
                onChange={(e) => setTrainerUszNote(e.target.value)}
                placeholder={reg.uszNotePlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium"
              />
            </div>

            {/* Focus / Bio */}
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">
                {reg.trainerFocusLabel}
              </label>
              <textarea
                rows={3}
                required
                value={trainerFocus}
                onChange={(e) => setTrainerFocus(e.target.value)}
                placeholder={reg.trainerFocusPlaceholder}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/20 transition-all font-medium resize-none"
              />
            </div>

            {/* Profile Photo (Upload or URL) */}
            <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 block">
                {reg.photoLabel}
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {trainerPhotoPreview || trainerPhotoUrl ? (
                    <img 
                      src={trainerPhotoPreview || trainerPhotoUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setTrainerPhotoFile(file);
                        setTrainerPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#005A36] file:text-white hover:file:bg-[#00472A] cursor-pointer"
                  />
                  <input
                    type="url"
                    value={trainerPhotoUrl}
                    onChange={(e) => {
                      setTrainerPhotoUrl(e.target.value);
                      if (e.target.value) setTrainerPhotoPreview('');
                    }}
                    placeholder={reg.photoUrlPlaceholder}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Admin Approval Notice Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#005A36] flex-shrink-0" />
            <p>
              <strong>Admin-Freigabe:</strong> Die Trainer-Registrierung wird zusammen mit dem USZ-Genehmigungsnachweis durch den Admin überprüft. Nach Bestätigung wird das Trainerprofil öffentlich sichtbar.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-[#005A36] hover:bg-[#00472A] active:bg-[#003820] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{submitting ? reg.submitting : reg.submitTrainerBtn}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
