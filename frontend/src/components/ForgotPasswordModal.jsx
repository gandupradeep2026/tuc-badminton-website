import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert,
  ShieldCheck,
  Send,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getApiUrl } from '../api/client';

export default function ForgotPasswordModal({ 
  isOpen, 
  onClose, 
  initialToken = null,
  onResetSuccess 
}) {
  const { t, language } = useLanguage();
  const f = t.admin?.forgotPassword || {};
  const isDe = language === 'de';

  // Steps: 'request' (enter email to receive 6-digit OTP) -> 'verify' (enter 6-digit OTP & set new password)
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('gandupradeep2026@gmail.com');
  const [approvalCode, setApprovalCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleRequestApprovalCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(getApiUrl('/api/admin/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isDe ? 'Fehler beim Anfordern des Codes.' : 'Failed to request approval code.'));
      }

      setFeedback({ 
        type: 'success', 
        message: data.message || (isDe 
          ? '6-stelliger Bestätigungscode wurde an Ihre autorisierte E-Mail gesendet.' 
          : 'A 6-digit approval code was sent to your authorized email.')
      });
      setStep('verify');

    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetWithApprovalCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    if (!approvalCode.trim()) {
      setFeedback({ 
        type: 'error', 
        message: isDe ? 'Bitte geben Sie den 6-stelligen Bestätigungscode ein.' : 'Please enter the 6-digit approval code.' 
      });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ 
        type: 'error', 
        message: isDe ? 'Die Passwörter stimmen nicht überein.' : 'Passwords do not match.' 
      });
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({ 
        type: 'error', 
        message: isDe ? 'Das Passwort muss mindestens 8 Zeichen lang sein.' : 'Password must be at least 8 characters long.' 
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/admin/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(),
          approvalCode: approvalCode.trim(), 
          newPassword 
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isDe ? 'Passwortänderung verweigert: Ungültiger Code.' : 'Password change refused: Invalid code.'));
      }

      setFeedback({ 
        type: 'success', 
        message: data.message || (isDe ? 'Ihr Passwort wurde erfolgreich aktualisiert!' : 'Your password has been updated successfully!') 
      });
      
      setTimeout(() => {
        if (onResetSuccess) onResetSuccess();
        onClose();
      }, 1600);

    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 p-6 text-slate-900 space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base sm:text-lg leading-tight">
                {step === 'verify' 
                  ? (isDe ? 'Admin-Autorisierung & Neues Passwort' : 'Admin Authorization & New Password')
                  : (isDe ? 'Passwort-Reset autorisieren' : 'Authorize Password Reset')}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold">
                TU Chemnitz Badminton Security Protocol
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notice Pill */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            {isDe 
              ? 'Aus Sicherheitsgründen kann das Admin-Passwort ausschließlich mit einem einmaligen 6-stelligen Bestätigungscode geändert werden.'
              : 'For security reasons, the admin password can only be changed with a one-time 6-digit approval code.'}
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-bold leading-relaxed ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Step 1: Request Approval Code */}
        {step === 'request' && (
          <form onSubmit={handleRequestApprovalCode} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              {isDe 
                ? 'Geben Sie Ihre autorisierte Admin-E-Mail-Adresse ein. Wir senden Ihnen einen 6-stelligen Bestätigungscode (OTP) zu.'
                : 'Enter your authorized admin email address. We will send you a 6-digit approval code (OTP).'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isDe ? 'Autorisierte Admin-Adresse' : 'Authorized Admin Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gandupradeep2026@gmail.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#004328] active:bg-[#003B23] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isDe ? 'Code wird generiert...' : 'Generating code...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDe ? '6-stelligen Bestätigungscode anfordern' : 'Request 6-digit Approval Code'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Input 6-Digit Approval Code & New Password */}
        {step === 'verify' && (
          <form onSubmit={handleResetWithApprovalCode} className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-700" />
                <span>{isDe ? 'Code übermittelt an:' : 'Code transmitted to:'}</span>
              </span>
              <p className="font-mono text-xs font-bold text-amber-900">
                {email}
              </p>
              <p className="text-[11px] text-amber-800 leading-tight">
                {isDe 
                  ? 'Gültig für 15 Minuten. Sie finden den Code im E-Mail-Postfach oder direkt im Konsolenfenster des Laptop-Servers.'
                  : 'Valid for 15 minutes. Find the code in your inbox or directly in the laptop server console.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isDe ? '6-stelliger Bestätigungscode (oder Master-Recovery-Key)' : '6-digit Approval Code (or Master Recovery Key)'}
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={approvalCode}
                  onChange={(e) => setApprovalCode(e.target.value)}
                  placeholder="z. B. 481920"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isDe ? 'Neues Admin-Passwort (mind. 8 Zeichen)' : 'New Admin Password (min. 8 chars)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isDe ? 'Neues Passwort wiederholen' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
              >
                {isDe ? 'Zurück' : 'Back'}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#004328] active:bg-[#003B23] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isDe ? 'Wird überprüft...' : 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isDe ? 'Passwort autorisieren & ändern' : 'Authorize & Change Password'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
