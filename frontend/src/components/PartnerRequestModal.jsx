import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Calendar, Trophy, Mail, User, Phone, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson, getUploadUrl } from '../api/client';

export default function PartnerRequestModal({ isOpen, onClose, player }) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [tournamentName, setTournamentName] = useState('TUC Badminton Sommerturnier 2026');
  const [discipline, setDiscipline] = useState('Mixed (MX)');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Default tournament suggestions
  const TOURNAMENT_OPTIONS = isDe
    ? [
        'TUC Badminton Sommerturnier 2026',
        'Chemnitzer Stadtmeisterschaft 2026',
        'Sächsische Hochschulmeisterschaft (SHM) 2026',
        'Freundschaftsturnier TU Chemnitz',
        'Anderes Turnier (bitte in Nachricht angeben)',
      ]
    : [
        'TUC Badminton Summer Cup 2026',
        'Chemnitz City Championship 2026',
        'Saxon University Championship (SHM) 2026',
        'TUC Friendly Tournament',
        'Other Tournament (specify in message)',
      ];

  const DISCIPLINE_OPTIONS = isDe
    ? [
        'Mixed (MX)',
        'Herrendoppel (HD)',
        'Damendoppel (DD)',
        'Doppel beliebig',
      ]
    : [
        'Mixed Doubles (MX)',
        'Men\'s Doubles (MD)',
        'Women\'s Doubles (WD)',
        'Any Doubles',
      ];

  // Set smart default discipline based on player gender
  useEffect(() => {
    if (player) {
      if (player.gender === 'women') {
        setDiscipline(isDe ? 'Damendoppel (DD)' : 'Women\'s Doubles (WD)');
      } else {
        setDiscipline(isDe ? 'Herrendoppel (HD)' : 'Men\'s Doubles (MD)');
      }
      setSuccessMsg('');
      setErrorMsg('');
      setMessage('');
    }
  }, [player, isDe]);

  if (!isOpen || !player) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!requesterName.trim()) {
      setErrorMsg(isDe ? 'Bitte gib deinen Namen ein.' : 'Please enter your name.');
      return;
    }
    if (!requesterEmail.trim() || !requesterEmail.includes('@')) {
      setErrorMsg(isDe ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await safeFetchJson(`/api/players/${player.id}/partner-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_name: requesterName.trim(),
          requester_email: requesterEmail.trim().toLowerCase(),
          requester_phone: requesterPhone.trim(),
          tournament_name: tournamentName,
          discipline,
          message: message.trim() || (isDe 
            ? `Hallo ${player.name}, ich suche noch einen Partner für ${tournamentName} (${discipline}) und würde mich freuen, wenn wir gemeinsam als Team antreten!`
            : `Hi ${player.name}, I'm looking for a partner for ${tournamentName} (${discipline}) and would love to team up!`),
        }),
      });

      if (!res.ok) {
        throw new Error(res.error || (isDe ? 'Fehler beim Senden der Partneranfrage.' : 'Failed to send partner request.'));
      }

      setSuccessMsg(
        res.data?.message || (isDe
          ? `Deine Anfrage wurde erfolgreich an ${player.name} gesendet!`
          : `Your request was sent successfully to ${player.name}!`)
      );
    } catch (err) {
      setErrorMsg(err.message || (isDe ? 'Verbindung fehlgeschlagen.' : 'Connection failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#005A36] to-[#004328] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex-shrink-0 flex items-center justify-center text-xl">
              {player.photo_url && getUploadUrl(player.photo_url) ? (
                <img
                  src={getUploadUrl(player.photo_url)}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-black text-white">{player.name ? player.name.charAt(0) : '🏸'}</span>
              )}
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-slate-950 uppercase tracking-wider mb-1">
                {isDe ? 'Partneranfrage' : 'Partner Request'}
              </span>
              <h3 className="font-display font-black text-lg sm:text-xl leading-tight">
                {player.name}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                {player.study_program} • {player.specialization}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Success Screen */}
          {successMsg ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#005A36] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-black text-lg text-slate-900">
                {isDe ? 'Anfrage erfolgreich verschickt!' : 'Request Sent Successfully!'}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {successMsg}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {isDe
                  ? 'Eine E-Mail mit deinen Kontaktdaten wurde an den Spieler gesendet. Du erhältst die Antwort direkt per E-Mail.'
                  : 'An email with your contact info has been sent to the player. You will receive their reply directly via email.'}
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#005A36] hover:bg-[#004328] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  {isDe ? 'Fertig' : 'Done'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Introduction Note */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-[11px] text-emerald-900 leading-relaxed">
                {isDe ? (
                  <span>
                    🏸 Suche nicht alleine! Schicke <strong>{player.name}</strong> direkt eine Einladung als Doppel- oder Mixed-Partner für das nächste Turnier. Deine Anfrage wird sofort an die hinterlegte E-Mail-Adresse zugestellt.
                  </span>
                ) : (
                  <span>
                    🏸 Don't play alone! Send <strong>{player.name}</strong> an invite to team up as doubles or mixed partners for an upcoming tournament. Your request will be delivered straight to their email inbox.
                  </span>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Requester Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isDe ? 'Dein Name *' : 'Your Name *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder={isDe ? 'z. B. Max Mustermann' : 'e.g. John Doe'}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#005A36] focus:border-transparent outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isDe ? 'Deine E-Mail-Adresse *' : 'Your Email Address *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={requesterEmail}
                      onChange={(e) => setRequesterEmail(e.target.value)}
                      placeholder={isDe ? 'name@tu-chemnitz.de' : 'name@example.com'}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#005A36] focus:border-transparent outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Requester Phone (Optional) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isDe ? 'Telefonnummer / WhatsApp (optional)' : 'Phone / WhatsApp (Optional)'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={requesterPhone}
                    onChange={(e) => setRequesterPhone(e.target.value)}
                    placeholder={isDe ? '+49 176 12345678' : '+49 176 12345678'}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#005A36] focus:border-transparent outline-hidden"
                  />
                </div>
              </div>

              {/* Tournament Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isDe ? 'Turnier *' : 'Tournament *'}
                </label>
                <div className="relative">
                  <Trophy className="w-4 h-4 text-[#005A36] absolute left-3 top-3" />
                  <select
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#005A36] focus:border-transparent outline-hidden cursor-pointer"
                  >
                    {TOURNAMENT_OPTIONS.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Discipline Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isDe ? 'Disziplin *' : 'Discipline *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DISCIPLINE_OPTIONS.map((disc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDiscipline(disc)}
                      className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                        discipline === disc
                          ? 'border-[#005A36] bg-emerald-50 text-[#005A36]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {disc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message to Player */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isDe ? 'Persönliche Nachricht (optional)' : 'Personal Message (Optional)'}
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isDe
                        ? `Hallo ${player.name}, ich suche noch einen Partner für das Turnier. Melde dich gern bei mir!`
                        : `Hi ${player.name}, looking for a partner for the tournament. Let me know if you are interested!`
                    }
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#005A36] focus:border-transparent outline-hidden"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  {isDe ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#005A36] hover:bg-[#004328] disabled:opacity-50 text-white font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {submitting ? (
                    <span>{isDe ? 'Wird gesendet...' : 'Sending...'}</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isDe ? 'Anfrage absenden' : 'Send Request'}</span>
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
