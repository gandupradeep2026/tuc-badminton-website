import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Mail, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  User,
  GraduationCap,
  Target,
  Phone,
  Star,
  Upload,
  Sparkles,
  School,
  Save
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson, fileToDataUrl } from '../api/client';
import BadmintonAvatar, { AVATAR_OPTIONS } from './BadmintonAvatar';

const DISCIPLINE_OPTIONS = ['Einzel', 'Doppel', 'Mixed'];

export default function SelfEditModal({ isOpen, onClose, onUpdated }) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [step, setStep] = useState(1); // 1 = OTP Verification, 2 = Edit Form
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editToken, setEditToken] = useState('');

  // Editable Player Form State
  const [playerId, setPlayerId] = useState(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('men');
  const [studyProgram, setStudyProgram] = useState('');
  const [specializations, setSpecializations] = useState(['Einzel', 'Doppel']);
  const [team, setTeam] = useState('Hochschulsport & Spielbetrieb');
  const [phone, setPhone] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [favoritePlayer, setFavoritePlayer] = useState('');
  const [skillLevel, setSkillLevel] = useState('Fortgeschritten');
  const [universityType, setUniversityType] = useState('tu_chemnitz');
  const [universityName, setUniversityName] = useState('TU Chemnitz');
  const [avatarType, setAvatarType] = useState('badminton_smash');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState('');

  // Pre-fill email if student session exists
  useEffect(() => {
    if (isOpen) {
      const storedEmail = sessionStorage.getItem('tuc_student_email') || '';
      if (storedEmail) setEmail(storedEmail);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !email.trim() || !email.includes('@')) {
      setErrorMsg(isDe ? 'Bitte gib deine registrierte E-Mail-Adresse ein.' : 'Please enter your registered email address.');
      return;
    }

    try {
      setSendingCode(true);
      const res = await safeFetchJson('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          scope: 'edit_profile'
        })
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Senden des Codes.' : 'Failed to send verification code.'));
      }

      setErrorMsg('');
      setSuccessMsg(res.data?.message || (isDe ? 'Code gesendet! Bitte prüfe dein Postfach.' : 'Code sent to your inbox!'));
    } catch (err) {
      setErrorMsg(err.message || 'Error');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!code || code.trim().length !== 6) {
      setErrorMsg(isDe ? 'Bitte gib den 6-stelligen Code aus deiner E-Mail ein.' : 'Please enter the 6-digit code from your email.');
      return;
    }

    try {
      setVerifying(true);
      const res = await safeFetchJson('/api/players/self-edit/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim()
        })
      });

      if (!res.ok || !res.data?.player) {
        throw new Error(res.error || (isDe ? 'Code ungültig oder Spieler nicht gefunden.' : 'Invalid code or player not found.'));
      }

      const p = res.data.player;
      setEditToken(res.data.editToken);
      setPlayerId(p.id);
      setName(p.name || '');
      setGender(p.gender || 'men');
      setStudyProgram(p.study_program || '');
      setSpecializations(p.specialization ? p.specialization.split(',').map(s => s.trim()) : ['Einzel', 'Doppel']);
      setTeam(p.team || 'Hochschulsport & Spielbetrieb');
      setPhone(p.phone || '');
      setShowPhone(Boolean(p.show_phone));
      setFavoritePlayer(p.favorite_player || '');
      setSkillLevel(p.skill_level || 'Fortgeschritten');
      setUniversityType(p.university_type || 'tu_chemnitz');
      setUniversityName(p.university_name || 'TU Chemnitz');
      setAvatarType(p.avatar_type || 'badminton_smash');
      setExistingPhotoUrl(p.photo_url || '');

      setStep(2);
      setErrorMsg('');
      setSuccessMsg('');
    } catch (err) {
      setErrorMsg(err.message || 'Error');
    } finally {
      setVerifying(false);
    }
  };

  const toggleSpecialization = (spec) => {
    if (specializations.includes(spec)) {
      if (specializations.length > 1) {
        setSpecializations(specializations.filter(s => s !== spec));
      }
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const preview = await fileToDataUrl(file);
      setPhotoPreview(preview);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !studyProgram.trim()) {
      setErrorMsg(isDe ? 'Bitte fülle alle Pflichtfelder aus (Name, Studiengang).' : 'Please fill all required fields (Name, Major).');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('edit_token', editToken);
      formData.append('name', name.trim());
      formData.append('gender', gender);
      formData.append('study_program', studyProgram.trim());
      formData.append('specialization', specializations.join(', '));
      formData.append('team', team.trim());
      formData.append('phone', phone.trim());
      formData.append('show_phone', showPhone ? '1' : '0');
      formData.append('favorite_player', favoritePlayer.trim());
      formData.append('skill_level', skillLevel);
      formData.append('university_type', universityType);
      formData.append('university_name', universityType === 'other' ? universityName.trim() : 'TU Chemnitz');
      formData.append('avatar_type', avatarType);

      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (existingPhotoUrl) {
        formData.append('photo_url_input', existingPhotoUrl);
      }

      const res = await safeFetchJson('/api/players/self-edit', {
        method: 'PUT',
        body: formData
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Speichern des Profils.' : 'Failed to save profile.'));
      }

      setSuccessMsg(isDe ? '🎉 Profil erfolgreich aktualisiert!' : '🎉 Profile updated successfully!');
      if (onUpdated) onUpdated();
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCode('');
    setErrorMsg('');
    setSuccessMsg('');
    setPhotoFile(null);
    setPhotoPreview('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#005A36] to-emerald-700 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Edit3 className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-display font-black text-base sm:text-lg">
                {isDe ? 'Eigenes Spielerprofil bearbeiten' : 'Edit Your Player Profile'}
              </h3>
              <p className="text-xs text-emerald-100">
                {step === 1 
                  ? (isDe ? 'Schritt 1: E-Mail & OTP Verifikation' : 'Step 1: Email & OTP Verification') 
                  : (isDe ? 'Schritt 2: Profil anpassen & speichern' : 'Step 2: Update & Save Profile')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: VERIFICATION */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <p>
                  {isDe 
                    ? 'Um sicherzustellen, dass nur du dein Profil bearbeiten kannst, senden wir einen 6-stelligen Bestätigungscode an deine hinterlegte E-Mail-Adresse.' 
                    : 'To ensure only you can edit your profile, we will send a 6-digit confirmation code to your registered email address.'}
                </p>
              </div>

              <form onSubmit={handleRequestCode} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isDe ? 'Deine registrierte E-Mail-Adresse *' : 'Your registered email address *'}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="max.mustermann@tu-chemnitz.de"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:border-[#005A36] outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sendingCode || !email.includes('@')}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] disabled:opacity-50 transition-colors whitespace-nowrap shadow-2xs"
                    >
                      {sendingCode ? (isDe ? 'Sendet...' : 'Sending...') : (isDe ? 'Code anfordern' : 'Send Code')}
                    </button>
                  </div>
                </div>
              </form>

              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isDe ? '6-stelliger Bestätigungscode aus deiner E-Mail *' : '6-digit Confirmation Code from Email *'}
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength="6"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center font-bold focus:border-[#005A36] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#005A36] to-emerald-700 hover:from-[#00472A] hover:to-emerald-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {verifying ? (
                    <span>{isDe ? 'Wird überprüft...' : 'Verifying...'}</span>
                  ) : (
                    <>
                      <span>{isDe ? 'Code bestätigen & Profil bearbeiten' : 'Verify & Open Editor'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: EDIT FORM */}
          {step === 2 && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              
              {/* Name & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isDe ? 'Name / Vorname *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#005A36]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isDe ? 'Kader-Bereich *' : 'Squad Division *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('men')}
                      className={`py-2 rounded-xl font-bold border transition-all text-center ${
                        gender === 'men' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isDe ? 'Herren' : 'Men'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('women')}
                      className={`py-2 rounded-xl font-bold border transition-all text-center ${
                        gender === 'women' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isDe ? 'Damen' : 'Women'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Study Program */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isDe ? 'Studiengang / Fachrichtung *' : 'Course of Study / Major *'}
                </label>
                <input
                  type="text"
                  required
                  value={studyProgram}
                  onChange={(e) => setStudyProgram(e.target.value)}
                  placeholder="z.B. Master ASE oder Informatik"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#005A36]"
                />
              </div>

              {/* Badminton Specialization Chips */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isDe ? 'Disziplinen (Mehrfachauswahl möglich)' : 'Disciplines'}
                </label>
                <div className="flex gap-2">
                  {DISCIPLINE_OPTIONS.map(disc => {
                    const isSelected = specializations.includes(disc);
                    return (
                      <button
                        key={disc}
                        type="button"
                        onClick={() => toggleSpecialization(disc)}
                        className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                          isSelected
                            ? 'bg-[#005A36] text-white border-[#005A36]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{disc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skill Level & Idol */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isDe ? 'Spielstärke' : 'Skill Level'}
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Hobby / Freizeit">Hobby / Freizeit</option>
                    <option value="Fortgeschritten">Fortgeschritten</option>
                    <option value="Erfahren">Erfahren</option>
                    <option value="Wettkampf / Liga">Wettkampf / Liga</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isDe ? 'Vorbild / Lieblingsspieler (optional)' : 'Idol / Favorite Player'}
                  </label>
                  <input
                    type="text"
                    value={favoritePlayer}
                    onChange={(e) => setFavoritePlayer(e.target.value)}
                    placeholder="z.B. Lin Dan, Viktor Axelsen"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Badminton Avatar Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {isDe ? 'Badminton Avatar wählen' : 'Choose Badminton Avatar'}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_OPTIONS.map(av => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarType(av.id)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        avatarType === av.id
                          ? 'border-[#005A36] bg-emerald-50 ring-2 ring-[#005A36]/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl leading-none">{av.icon}</span>
                      <span className="text-[9px] font-bold text-slate-700 truncate w-full">{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload (Optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isDe ? 'Profilfoto ersetzen (optional)' : 'Replace Profile Photo (optional)'}
                </label>
                <div className="flex items-center gap-3">
                  {(photoPreview || existingPhotoUrl) && (
                    <img 
                      src={photoPreview || existingPhotoUrl} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200" 
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              {/* Phone (Optional) & Privacy Toggle */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isDe ? 'Telefon / WhatsApp (optional)' : 'Phone / WhatsApp (optional)'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 ..."
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    className="rounded border-slate-300 text-[#005A36] focus:ring-[#005A36]"
                  />
                  <span>{isDe ? 'Telefonnummer für Mitspieler sichtbar machen' : 'Show phone number to players'}</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  {isDe ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#005A36] text-white hover:bg-[#00472A] disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {saving ? (
                    <span>{isDe ? 'Wird gespeichert...' : 'Saving...'}</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isDe ? 'Änderungen speichern' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
