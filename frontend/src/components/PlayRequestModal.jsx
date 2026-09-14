import React, { useState } from 'react';
import { X, Send, ShieldCheck, Mail, User, Phone, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson } from '../api/client';
import BadmintonAvatar from './BadmintonAvatar';

export default function PlayRequestModal({ isOpen, onClose, player }) {
  const { user, token, isAuthenticated, openEntryModal } = useAuth();
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !player) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAuthenticated) {
      onClose();
      openEntryModal();
      return;
    }

    if (!message.trim()) {
      setErrorMsg(isDe ? 'Bitte schreibe eine kurze Nachricht.' : 'Please enter a short message.');
      return;
    }

    try {
      setLoading(true);
      const res = await safeFetchJson(`/api/players/${player.id}/contact-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-student-token': token,
        },
        body: JSON.stringify({
          message: message.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Senden der Spielanfrage.' : 'Failed to send play request.'));
      }

      setSuccessMsg(res.data?.message || (isDe ? 'Spielanfrage erfolgreich gesendet!' : 'Play request sent successfully!'));
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setMessage('');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Verbindungsfehler.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005A36] to-emerald-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <BadmintonAvatar
              photoUrl={player.photo_url}
              avatarType={player.avatar_type}
              name={player.name}
              size="md"
            />
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                <span>{isDe ? 'Diskrete Anfrage' : 'Private Request'}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                {isDe ? `Spielanfrage an ${player.name}` : `Play Request to ${player.name}`}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {!isAuthenticated ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#005A36] flex items-center justify-center mx-auto text-xl">
                🔒
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isDe ? 'Community-Login erforderlich' : 'Community Sign-In Required'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {isDe 
                    ? 'Um Spieler diskret zu kontaktieren, musst du einmalig mit deiner Universitäts-E-Mail eingeloggt sein.' 
                    : 'To contact players privately, please sign in once with your university email.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openEntryModal();
                }}
                className="py-2.5 px-6 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-sm transition-all cursor-pointer"
              >
                {isDe ? 'Jetzt kostenlos einloggen / registrieren' : 'Sign in / Register for free'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-emerald-900">{successMsg}</h3>
                  <p className="text-xs text-emerald-700">
                    {isDe 
                      ? 'Sobald der Spieler antwortet, werdet ihr beide per E-Mail benachrichtigt!' 
                      : 'As soon as the player replies, you will both receive an email!'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Privacy Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      {isDe 
                        ? 'Deine und die Kontaktdaten des Spielers bleiben solange geschützt, bis deine Anfrage angenommen wird.' 
                        : 'Contact details remain shielded until your request is accepted.'}
                    </span>
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {isDe ? 'Deine Nachricht an ' + player.name : 'Your message to ' + player.name} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={isDe 
                        ? `Hi ${player.name}, ich suche noch einen Spielpartner für ein Doppel / Match. Hättest du diese Woche Lust?` 
                        : `Hi ${player.name}, looking for a badminton sparring partner. Are you free to play this week?`}
                      className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005A36] resize-none"
                    />
                  </div>

                  {/* Optional Phone / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {isDe ? 'Deine Telefon- / WhatsApp-Nummer (optional)' : 'Your Phone / WhatsApp (optional)'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+49 152 12345678"
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#005A36]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isDe ? 'Wird dem Spieler nur gezeigt, wenn er/sie die Anfrage annimmt.' : 'Shared only after the player accepts.'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#005A36] hover:bg-[#00472A] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{isDe ? 'Spielanfrage diskret absenden' : 'Send Discreet Play Request'}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
