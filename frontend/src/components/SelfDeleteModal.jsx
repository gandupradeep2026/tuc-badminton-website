import React, { useState } from 'react';
import { X, Trash2, Mail, Key, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson } from '../api/client';

export default function SelfDeleteModal({ isOpen, onClose, onDeleted }) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP
  const [sendingCode, setSendingCode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
          scope: 'delete_profile'
        })
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Senden des Codes.' : 'Failed to send verification code.'));
      }

      setStep(2);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.message || 'Error');
    } finally {
      setSendingCode(false);
    }
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!code || code.trim().length !== 6) {
      setErrorMsg(isDe ? 'Bitte gib den 6-stelligen Code aus deiner E-Mail ein.' : 'Please enter the 6-digit code from your email.');
      return;
    }

    try {
      setDeleting(true);
      const res = await safeFetchJson('/api/players/self-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim()
        })
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Löschen des Profils.' : 'Failed to delete profile.'));
      }

      setSuccessMsg(res.data?.message || (isDe ? 'Dein Profil wurde erfolgreich gelöscht.' : 'Your profile has been deleted.'));
      if (onDeleted) onDeleted();
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Error');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setCode('');
    setStep(1);
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-black text-base sm:text-lg">
                {isDe ? 'Profil selbstständig löschen' : 'Delete Your Profile'}
              </h3>
              <p className="text-xs text-red-100">
                {isDe ? 'DSGVO-konforme Selbstverwaltung' : 'GDPR self-service removal'}
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
        <div className="p-6 space-y-4">
          {successMsg ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm sm:text-base">
                {isDe ? 'Profil erfolgreich gelöscht' : 'Profile successfully removed'}
              </h4>
              <p className="text-xs text-emerald-700">{successMsg}</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  {isDe 
                    ? 'Um Missbrauch zu verhindern, senden wir einen Bestätigungscode an deine registrierte E-Mail-Adresse. Nach Bestätigung wird dein Profil sofort entfernt.'
                    : 'To prevent unauthorized deletions, a confirmation code will be sent to your registered email. Your profile will be deleted immediately upon confirmation.'}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isDe ? 'Deine hinterlegte E-Mail-Adresse' : 'Your registered email address'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="z.B. max.mustermann@tu-chemnitz.de"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingCode}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {sendingCode ? (
                      <span>{isDe ? 'Code wird gesendet...' : 'Sending code...'}</span>
                    ) : (
                      <>
                        <span>{isDe ? 'Bestätigungscode anfordern' : 'Request Confirmation Code'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmDelete} className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      {isDe ? 'Code gesendet an:' : 'Code sent to:'}
                    </p>
                    <p className="font-mono text-slate-700">{email}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isDe ? '6-stelliger Bestätigungscode' : '6-digit confirmation code'}
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength="6"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      {isDe ? 'Zurück' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={deleting || code.length !== 6}
                      className="w-2/3 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {deleting ? (
                        <span>{isDe ? 'Wird gelöscht...' : 'Deleting...'}</span>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isDe ? 'Profil endgültig löschen' : 'Permanently Delete'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
