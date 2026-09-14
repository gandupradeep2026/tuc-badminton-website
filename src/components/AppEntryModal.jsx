import React, { useState } from 'react';
import { X, ShieldCheck, Mail, User, School, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Award, Wrench, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson } from '../api/client';

export default function AppEntryModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [role, setRole] = useState('student'); // 'student' | 'trainer' | 'service'
  const [step, setStep] = useState(1); // 1: input details, 2: verify otp
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('TU Chemnitz');
  const [customUniversity, setCustomUniversity] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg(isDe ? 'Bitte gib deinen Namen ein.' : 'Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(isDe ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.');
      return;
    }

    const finalUni = university === 'other' ? (customUniversity.trim() || 'Andere Hochschule') : university;

    try {
      setLoading(true);
      const res = await safeFetchJson('/api/auth/register-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          university: finalUni,
          role,
        }),
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Senden des Codes.' : 'Failed to send verification code.'));
      }

      setSuccessMsg(res.data?.message || (isDe ? '6-stelliger Code wurde gesendet!' : '6-digit code sent!'));
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Fehler beim Verbindungsaufbau.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg(isDe ? 'Bitte gib den 6-stelligen Bestätigungscode ein.' : 'Please enter the 6-digit code.');
      return;
    }

    const finalUni = university === 'other' ? (customUniversity.trim() || 'Andere Hochschule') : university;

    try {
      setLoading(true);
      const res = await safeFetchJson('/api/auth/verify-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otpCode.trim(),
          name: name.trim(),
          university: finalUni,
          role,
        }),
      });

      if (!res.ok || !res.data?.token) {
        throw new Error(res.error || (isDe ? 'Ungültiger oder abgelaufener Bestätigungscode.' : 'Invalid or expired code.'));
      }

      login({
        token: res.data.token,
        user: res.data.user,
        playerProfile: res.data.playerProfile || null,
      });

      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Verifikation fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005A36] to-emerald-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Badminton Student Community</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isDe ? 'Einmalige Registrierung & Login' : 'Community Sign-In & Onboarding'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            {isDe 
              ? 'Einmal verifizieren – danach alle Community-Funktionen ohne weitere Codes nutzen!' 
              : 'Verify once – use all community features without repeated codes!'}
          </p>
        </div>

        <div className="p-6">
          {/* Role Selection Tabs */}
          {step === 1 && (
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {isDe ? 'Ich trete bei als:' : 'I am joining as:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'student'
                      ? 'border-[#005A36] bg-emerald-50 text-[#005A36] font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span className="text-xs">{isDe ? 'Student' : 'Student'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('trainer')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'trainer'
                      ? 'border-[#005A36] bg-emerald-50 text-[#005A36] font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Award className="w-5 h-5" />
                  <span className="text-xs">{isDe ? 'Trainer' : 'Trainer'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('service')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'service'
                      ? 'border-[#005A36] bg-emerald-50 text-[#005A36] font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Wrench className="w-5 h-5" />
                  <span className="text-xs">{isDe ? 'Ausrüstung' : 'Gear / String'}</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {role === 'service' ? (isDe ? 'Name / Service-Name' : 'Provider Name') : (isDe ? 'Dein Name / Vorname' : 'Your Name')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === 'service' ? (isDe ? 'z.B. Chemnitz Racket Stringing' : 'e.g. Stringing Pro') : (isDe ? 'z.B. Alex Müller' : 'e.g. Alex Miller')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005A36] focus:border-transparent"
                  />
                </div>
              </div>

              {/* University / Affiliation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {role === 'student' ? (isDe ? 'Hochschule / Universität' : 'University') : (isDe ? 'Hochschule oder Standort' : 'Location / Affiliation')}
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005A36] bg-white text-slate-800"
                  >
                    <option value="TU Chemnitz">TU Chemnitz</option>
                    <option value="TU Dresden">TU Dresden</option>
                    <option value="Universität Leipzig">Universität Leipzig</option>
                    <option value="HS Mittweida">HS Mittweida</option>
                    <option value="WHZ Zwickau">WHZ Zwickau</option>
                    <option value="TU Bergakademie Freiberg">TU Bergakademie Freiberg</option>
                    <option value="other">{isDe ? 'Anderer Standort / Verein...' : 'Other Location / Club...'}</option>
                  </select>
                </div>
                {university === 'other' && (
                  <input
                    type="text"
                    value={customUniversity}
                    onChange={(e) => setCustomUniversity(e.target.value)}
                    placeholder={isDe ? 'Name der Hochschule oder Club' : 'University or club name'}
                    className="w-full mt-2 px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005A36]"
                  />
                )}
              </div>

              {/* Email Input with Role Hint */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {role === 'student' ? (isDe ? 'Universitäts-E-Mail' : 'University Email') : (isDe ? 'E-Mail (z.B. Gmail)' : 'Email (e.g. Gmail)')} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {role === 'student' ? (isDe ? '🎓 Uni-Mail Pflicht' : 'Uni Email Required') : (isDe ? '✉️ Gmail erlaubt' : 'Gmail Accepted')}
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'student' ? 'name@tu-chemnitz.de' : 'name@gmail.com'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005A36] focus:border-transparent font-mono"
                  />
                </div>
              </div>

              {/* Privacy Guarantee Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] sm:text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{isDe ? '100% Datenschutz & Privatsphäre' : '100% Privacy Guarantee'}</span>
                </div>
                <p className="leading-relaxed">
                  {isDe 
                    ? 'Deine E-Mail und Kontaktdaten werden niemals öffentlich im Spielerverzeichnis gezeigt. Erst wenn jemand eine Spielanfrage sendet und du antwortest, werden Details ausgetauscht.' 
                    : 'Your email and contact details are never shown publicly. Only when a request is sent and you reply, details are exchanged.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isDe ? 'Bestätigungscode anfordern' : 'Send Verification Code'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500">
                  {isDe ? 'Code gesendet an:' : 'Code sent to:'}
                </p>
                <p className="text-sm font-mono font-bold text-slate-800 bg-slate-100 py-1 px-3 rounded-lg inline-block">
                  {email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                  {isDe ? '6-stelligen Bestätigungscode eingeben' : 'Enter 6-digit code'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[12px] text-2xl font-black py-3 rounded-xl border-2 border-[#005A36] font-mono focus:outline-hidden focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isDe ? 'Bestätigen & Community beitreten' : 'Verify & Enter Community'}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtpCode(''); }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  {isDe ? '← E-Mail-Adresse korrigieren' : '← Change email address'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
