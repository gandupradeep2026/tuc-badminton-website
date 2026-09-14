import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  User, 
  School, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Award, 
  Wrench, 
  GraduationCap, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  HelpCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson } from '../api/client';

export default function AppEntryModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const { language, t } = useLanguage();
  const a = t.auth;
  const isDe = language === 'de';

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regRole, setRegRole] = useState('student');
  const [regStep, setRegStep] = useState(1); // 1: details, 2: 6-digit OTP
  const [regName, setRegName] = useState('');
  const [regUniversity, setRegUniversity] = useState('TU Chemnitz');
  const [regCustomUni, setRegCustomUni] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regCode, setRegCode] = useState('');

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter code & new pass
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const switchMode = (newMode) => {
    resetMessages();
    setMode(newMode);
    setRegStep(1);
    setForgotStep(1);
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setShowForgotNewPass(false);
    setShowForgotConfirmPass(false);
  };

  // -------------------------------------------------------------
  // 1. Handle Login (Email + Password, zero OTP)
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg(isDe ? 'Bitte E-Mail und Passwort eingeben.' : 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await safeFetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });

      if (!res.ok || !res.data?.token) {
        throw new Error(res.error || (isDe ? 'Anmeldung fehlgeschlagen. Bitte prüfe deine Zugangsdaten.' : 'Login failed. Please check your credentials.'));
      }

      login({
        token: res.data.token,
        user: res.data.user,
        playerProfile: res.data.playerProfile || null,
      });

      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Handle Register Step 1 (Request OTP)
  // -------------------------------------------------------------
  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!regName.trim()) {
      setErrorMsg(isDe ? 'Bitte gib deinen vollständigen Namen ein.' : 'Please enter your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg(isDe ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.');
      return;
    }

    if (regRole === 'student') {
      const emailLower = regEmail.trim().toLowerCase();
      const forbiddenDomains = [
        '@gmail.', '@googlemail.', '@yahoo.', '@hotmail.', '@outlook.', '@gmx.', '@web.', '@icloud.', '@aol.', '@proton.'
      ];
      if (forbiddenDomains.some(dom => emailLower.includes(dom))) {
        setErrorMsg(
          isDe
            ? 'Studierende müssen ihre Hochschul-E-Mail nutzen (z.B. @tu-chemnitz.de, @mytuc.org, .edu). Private E-Mails (Gmail, Yahoo etc.) sind nicht zugelassen.'
            : 'Students must use their university email (e.g. @tu-chemnitz.de, @mytuc.org, .edu). Personal emails (Gmail, Yahoo, etc.) are strictly rejected.'
        );
        return;
      }
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMsg(isDe ? 'Das Passwort muss mindestens 6 Zeichen lang sein.' : 'Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg(isDe ? 'Die Passwörter stimmen nicht überein.' : 'Passwords do not match.');
      return;
    }

    const finalUni = regUniversity === 'other' ? (regCustomUni.trim() || 'Andere Hochschule') : regUniversity;

    try {
      setLoading(true);
      const res = await safeFetchJson('/api/auth/register-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim().toLowerCase(),
          name: regName.trim(),
          university: finalUni,
          role: regRole,
          password: regPassword,
        }),
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Senden des Codes.' : 'Failed to send verification code.'));
      }

      setSuccessMsg(res.data?.message || (isDe ? '6-stelliger Code wurde gesendet!' : '6-digit code sent!'));
      setRegStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Registration request failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. Handle Register Step 2 (Confirm OTP)
  // -------------------------------------------------------------
  const handleRegisterConfirm = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!regCode || regCode.trim().length !== 6) {
      setErrorMsg(isDe ? 'Bitte gib den 6-stelligen Bestätigungscode ein.' : 'Please enter the 6-digit confirmation code.');
      return;
    }

    const finalUni = regUniversity === 'other' ? (regCustomUni.trim() || 'Andere Hochschule') : regUniversity;

    try {
      setLoading(true);
      const res = await safeFetchJson('/api/auth/register-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim().toLowerCase(),
          code: regCode.trim(),
          password: regPassword,
          name: regName.trim(),
          university: finalUni,
          role: regRole,
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
      setErrorMsg(err.message || 'Confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 4. Handle Forgot Password Step 1 (Send Code)
  // -------------------------------------------------------------
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMsg(isDe ? 'Bitte gib deine registrierte E-Mail-Adresse ein.' : 'Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await safeFetchJson('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });

      setSuccessMsg(res.data?.message || (isDe ? 'Code gesendet! Bitte prüfe dein Postfach.' : 'Code sent! Check your inbox.'));
      setForgotStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 5. Handle Forgot Password Step 2 (Reset Password)
  // -------------------------------------------------------------
  const handleForgotReset = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!forgotCode || forgotCode.trim().length !== 6) {
      setErrorMsg(isDe ? 'Bitte gib den 6-stelligen Code ein.' : 'Please enter the 6-digit code.');
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 6) {
      setErrorMsg(isDe ? 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' : 'New password must be at least 6 characters.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setErrorMsg(isDe ? 'Die Passwörter stimmen nicht überein.' : 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await safeFetchJson('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          code: forgotCode.trim(),
          newPassword: forgotNewPass,
        }),
      });

      if (!res.ok || !res.data?.token) {
        throw new Error(res.error || (isDe ? 'Fehler beim Zurücksetzen des Passworts.' : 'Failed to reset password.'));
      }

      login({
        token: res.data.token,
        user: res.data.user,
        playerProfile: res.data.playerProfile || null,
      });

      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Password reset failed.');
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
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isDe ? 'Schließen' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Badminton Student Community</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {mode === 'login' ? a.loginTitle : (mode === 'register' ? a.registerTitle : a.forgotTitle)}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            {mode === 'login' ? a.loginSubtitle : (mode === 'register' ? a.registerSubtitle : a.forgotSubtitle)}
          </p>
        </div>

        {/* Tab switcher: Login vs Register */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1 gap-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {a.loginTab}
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {a.registerTab}
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODE: LOGIN (Email + Password)                            */}
          {/* ========================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {a.emailLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@tu-chemnitz.de or gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] focus:border-[#005A36] outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {a.passwordLabel} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-[#005A36] hover:underline font-bold cursor-pointer"
                  >
                    {a.forgotLink}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] focus:border-[#005A36] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{a.loginBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-xs text-slate-500">
                <span>{a.noAccount} </span>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold text-[#005A36] hover:underline cursor-pointer"
                >
                  {a.registerNow}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* MODE: REGISTER (One-Time: Details + Password + OTP)       */}
          {/* ========================================================= */}
          {mode === 'register' && (
            <div className="space-y-4">
              
              {/* Role Selection */}
              {regStep === 1 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {a.roleLabel}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('student')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        regRole === 'student'
                          ? 'border-[#005A36] bg-emerald-50/80 text-[#005A36] font-bold shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-[11px]">{a.studentRole}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('trainer')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        regRole === 'trainer'
                          ? 'border-[#005A36] bg-emerald-50/80 text-[#005A36] font-bold shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      <span className="text-[11px]">{a.trainerRole}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('service')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        regRole === 'service'
                          ? 'border-[#005A36] bg-emerald-50/80 text-[#005A36] font-bold shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      <span className="text-[11px]">{a.serviceRole}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {regRole === 'student' ? a.studentHint : (regRole === 'trainer' ? a.trainerHint : a.serviceHint)}
                  </p>
                </div>
              )}

              {/* Step 1: Input Form */}
              {regStep === 1 && (
                <form onSubmit={handleRegisterRequest} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {a.nameLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Lukas Weber"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                      />
                    </div>
                  </div>

                  {regRole === 'student' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {a.universityLabel} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setRegUniversity('TU Chemnitz'); }}
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            regUniversity === 'TU Chemnitz'
                              ? 'bg-emerald-50 border-[#005A36] text-[#005A36]'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          TU Chemnitz
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRegUniversity('other'); }}
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            regUniversity === 'other'
                              ? 'bg-emerald-50 border-[#005A36] text-[#005A36]'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {isDe ? 'Andere Hochschule' : 'Other University'}
                        </button>
                      </div>
                      {regUniversity === 'other' && (
                        <input
                          type="text"
                          required
                          value={regCustomUni}
                          onChange={(e) => setRegCustomUni(e.target.value)}
                          placeholder="z.B. TU Dresden, HTWK, etc."
                          className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#005A36] outline-none"
                        />
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {a.emailLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder={regRole === 'student' ? 'name@tu-chemnitz.de' : 'name@gmail.com'}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {a.passwordLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] focus:border-[#005A36] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex="-1"
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {a.passwordConfirmLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] focus:border-[#005A36] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex="-1"
                        aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{a.sendCodeBtn}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Enter 6-digit Code */}
              {regStep === 2 && (
                <form onSubmit={handleRegisterConfirm} className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">{a.emailLabel}</span>
                      <span className="font-mono font-bold text-slate-900">{regEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="text-xs text-[#005A36] hover:underline font-bold cursor-pointer"
                    >
                      {isDe ? 'Ändern' : 'Change'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {a.codeLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength="6"
                        required
                        value={regCode}
                        onChange={(e) => setRegCode(e.target.value.replace(/\D/g, ''))}
                        placeholder={a.codePlaceholder}
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-center font-mono font-bold text-lg tracking-widest focus:ring-2 focus:ring-[#005A36] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="w-1/3 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {isDe ? 'Zurück' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || regCode.length !== 6}
                      className="w-2/3 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>{a.registerBtn}</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center pt-2 text-xs text-slate-500">
                <span>{a.hasAccount} </span>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-[#005A36] hover:underline cursor-pointer"
                >
                  {a.signInNow}
                </button>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* MODE: FORGOT PASSWORD                                     */}
          {/* ========================================================= */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              
              {/* Step 1: Input registered email */}
              {forgotStep === 1 && (
                <form onSubmit={handleForgotRequest} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {a.emailLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@tu-chemnitz.de or gmail.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{a.sendCodeBtn}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Enter code & new password */}
              {forgotStep === 2 && (
                <form onSubmit={handleForgotReset} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {a.codeLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      required
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                      placeholder={a.codePlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center font-mono font-bold text-base tracking-widest focus:ring-2 focus:ring-[#005A36] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {a.newPasswordLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showForgotNewPass ? 'text' : 'password'}
                        required
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex="-1"
                        aria-label={showForgotNewPass ? 'Hide password' : 'Show password'}
                      >
                        {showForgotNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {a.passwordConfirmLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showForgotConfirmPass ? 'text' : 'password'}
                        required
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#005A36] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex="-1"
                        aria-label={showForgotConfirmPass ? 'Hide password' : 'Show password'}
                      >
                        {showForgotConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || forgotCode.length !== 6}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{a.resetPasswordBtn}</span>
                    )}
                  </button>
                </form>
              )}

              <div className="text-center pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-[#005A36] hover:underline cursor-pointer"
                >
                  ← {a.backToLogin}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
