import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldAlert,
  Send
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPasswordModal({ 
  isOpen, 
  onClose, 
  initialToken = null,
  onResetSuccess 
}) {
  const { t, language } = useLanguage();
  const f = t.admin?.forgotPassword || {};
  const isDe = language === 'de';

  const [step, setStep] = useState(initialToken ? 'reset' : 'request'); // 'request' | 'sent' | 'reset'
  const [email, setEmail] = useState('gandupradeep2026@gmail.com');
  const [resetToken, setResetToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [devResetLink, setDevResetLink] = useState('');

  if (!isOpen) return null;

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Senden des Reset-Links.');

      setFeedback({ type: 'success', message: data.message });
      if (data.reset_link) {
        setDevResetLink(data.reset_link);
      }
      setStep('sent');

    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: isDe ? 'Die Passwörter stimmen nicht überein.' : 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({ type: 'error', message: isDe ? 'Das Passwort muss mindestens 8 Zeichen lang sein.' : 'Password must be at least 8 characters long.' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Zurücksetzen des Passworts.');

      setFeedback({ type: 'success', message: data.message });
      setTimeout(() => {
        if (onResetSuccess) onResetSuccess();
        onClose();
      }, 1800);

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
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base sm:text-lg leading-tight">
                {step === 'reset' ? (f.resetFormTitle || 'Neues Passwort festlegen') : (f.modalTitle || 'Admin-Passwort zurücksetzen')}
              </h3>
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

        {/* Step 1: Request Reset Link */}
        {step === 'request' && (
          <form onSubmit={handleSendResetLink} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              {f.modalDesc || 'Geben Sie Ihre autorisierte Admin-E-Mail-Adresse ein. Wir senden Ihnen einen sicheren Link zum Zurücksetzen Ihres Passworts zu.'}
            </p>

            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-700" />
                <span>Autorisierte Admin-Adresse:</span>
              </span>
              <p className="font-mono text-[11px] text-amber-950 font-bold">
                gandupradeep2026@gmail.com
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {f.emailLabel || 'Admin-E-Mail-Adresse'}
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
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? (f.sending || 'Wird gesendet...') : (f.sendBtn || 'Reset-Link an gandupradeep2026@gmail.com senden')}</span>
            </button>
          </form>
        )}

        {/* Step 2: Link Sent Confirmation & Dev Direct Access */}
        {step === 'sent' && (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reset-E-Mail erfolgreich versendet!</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Ein zeitlich begrenzter Reset-Link (60 Min.) wurde an <strong className="font-mono text-emerald-950">gandupradeep2026@gmail.com</strong> übermittelt.
              </p>
            </div>

            {/* Direct button to activate reset immediately */}
            {devResetLink && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">
                  {f.clickLinkDirect || 'Direktes Zurücksetzen (Entwicklungsmodus):'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const match = devResetLink.match(/reset_token=([^&]+)/);
                    if (match) setResetToken(match[1]);
                    setStep('reset');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{f.resetNowBtn || 'Jetzt neues Passwort vergeben'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              Schließen
            </button>
          </div>
        )}

        {/* Step 3: Enter New Password */}
        {step === 'reset' && (
          <form onSubmit={handleSetNewPassword} className="space-y-3.5 pt-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              Legen Sie Ihr neues sicheres Master-Admin-Passwort für die Website fest.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {f.newPassLabel || 'Neues Passwort (mind. 8 Zeichen)'}
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
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#005A36]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {f.confirmPassLabel || 'Neues Passwort wiederholen'}
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
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#005A36]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#004328] active:bg-[#003B23] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{loading ? (f.sending || 'Wird gespeichert...') : (f.saveNewPassBtn || 'Neues Passwort aktivieren')}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
