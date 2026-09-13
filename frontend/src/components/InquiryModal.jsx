import React, { useState } from 'react';
import { X, Send, ShieldCheck, CheckCircle2, AlertCircle, Calendar, Mail, Phone, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson } from '../api/client';

export default function InquiryModal({ isOpen, onClose, target }) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [form, setForm] = useState({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    preferred_date: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !target) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.requester_name.trim()) {
      setErrorMsg(isDe ? 'Bitte gib deinen Namen ein.' : 'Please enter your name.');
      return;
    }
    if (!form.requester_email.trim() || !form.requester_email.includes('@')) {
      setErrorMsg(isDe ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.');
      return;
    }
    if (!form.message.trim()) {
      setErrorMsg(isDe ? 'Bitte gib deine Nachricht oder Trainingswunsch ein.' : 'Please enter your message or request.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await safeFetchJson('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: target.type || 'trainer',
          target_id: target.id,
          requester_name: form.requester_name.trim(),
          requester_email: form.requester_email.trim().toLowerCase(),
          requester_phone: form.requester_phone.trim(),
          preferred_date: form.preferred_date.trim(),
          message: form.message.trim(),
        }),
      });

      if (res.ok) {
        setSuccessMsg(
          res.data.message ||
            (isDe
              ? `Deine Anfrage für ${target.name} wurde erfolgreich an das Admin-Team übermittelt! Wir leiten sie schnellstmöglich weiter.`
              : `Your inquiry for ${target.name} was successfully submitted to the admin team!`)
        );
      } else {
        setErrorMsg(res.error || (isDe ? 'Fehler beim Senden der Anfrage.' : 'Failed to send inquiry.'));
      }
    } catch (err) {
      setErrorMsg(isDe ? 'Verbindungsfehler. Bitte versuche es später erneut.' : 'Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setForm({
      requester_name: '',
      requester_email: '',
      requester_phone: '',
      preferred_date: '',
      message: '',
    });
    onClose();
  };

  const isTrainer = target.type === 'trainer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#005A36] to-emerald-900 text-white relative flex-shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer"
            title={isDe ? 'Schließen' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-white/15 backdrop-blur-xs text-emerald-200 inline-flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </span>
            <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-emerald-200">
              {isTrainer
                ? (isDe ? 'Trainer-Vermittlung' : 'Coaching Inquiry')
                : (isDe ? 'Besaitungs- & Ausrüstungsanfrage' : 'Service & Gear Inquiry')}
            </span>
          </div>

          <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight pr-8">
            {target.name}
          </h3>
          {target.subtitle && (
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5 font-medium">
              {target.subtitle}
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {successMsg ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#005A36] mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-black text-lg text-slate-900">
                {isDe ? 'Anfrage erfolgreich übermittelt!' : 'Inquiry Submitted Successfully!'}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {successMsg}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-[#005A36] hover:bg-[#00472A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isDe ? 'Fertig & Schließen' : 'Done & Close'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Privacy Shield Banner */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-[#005A36] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[#005A36]">
                    {isDe ? 'Diskret & Verlässlich über das Admin-Team' : 'Privacy-Protected via Admin'}
                  </p>
                  <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                    {isDe
                      ? 'Deine Kontaktdaten werden sicher an unser Admin-Team gesendet und nach Prüfung direkt an den Anbieter weitergeleitet.'
                      : 'Your inquiry goes to the TU Chemnitz Badminton admin team and will be forwarded directly to the provider.'}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isDe ? 'Dein vollständiger Name *' : 'Your Full Name *'}
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={form.requester_name}
                      onChange={(e) => setForm({ ...form, requester_name: e.target.value })}
                      placeholder="z.B. Anna Schmidt"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isDe ? 'Deine E-Mail-Adresse *' : 'Your Email Address *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={form.requester_email}
                      onChange={(e) => setForm({ ...form, requester_email: e.target.value })}
                      placeholder="anna@example.com"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isDe ? 'Telefon / WhatsApp (optional)' : 'Phone / WhatsApp (optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={form.requester_phone}
                      onChange={(e) => setForm({ ...form, requester_phone: e.target.value })}
                      placeholder="+49 176 ..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isDe ? 'Wunschtermin / Tage (optional)' : 'Preferred Day/Time (optional)'}
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={form.preferred_date}
                      onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                      placeholder="z.B. Dienstag ab 18 Uhr"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTrainer
                    ? (isDe ? 'Was möchtest du trainieren / verbessern? *' : 'What would you like to train / improve? *')
                    : (isDe ? 'Details zu Schläger, Saite oder Bällen *' : 'Racket / String / Shuttlecock details *')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={
                    isTrainer
                      ? (isDe ? 'z.B. Ich möchte gerne meine Beinarbeit und meinen Rückhand-Clear trainieren. Bin Einsteiger/Fortgeschrittener...' : 'e.g. Looking for footwork and backhand coaching...')
                      : (isDe ? 'z.B. Besaitung für Yonex Astrox 88D mit BG 80 Saite auf 11,5 kg. Übergabe gerne nächsten Dienstag in der Halle.' : 'e.g. Need stringing with BG 80 at 25 lbs...')
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {isDe ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#005A36] hover:bg-[#00472A] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>{isDe ? 'Wird gesendet...' : 'Sending...'}</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isDe ? 'Anfrage absenden' : 'Submit Inquiry'}</span>
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
