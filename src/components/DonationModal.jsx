import React, { useState } from 'react';
import { X, Heart, CreditCard, Building2, Check, Copy, Mail, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DonationModal({ isOpen, onClose, settings }) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !settings) return null;

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#005A36] to-emerald-800 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
            title={isDe ? 'Schließen' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-xl bg-white/15 backdrop-blur-xs text-rose-300 inline-flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
            </span>
            <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-emerald-200">
              {isDe ? 'Gemeinschaft & Förderung' : 'Community & Support'}
            </span>
          </div>

          <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight pr-8">
            {settings.title || (isDe ? 'Unterstütze das Badminton-Team der TU Chemnitz' : 'Support the TU Chemnitz Badminton Team')}
          </h3>
          {settings.subtitle && (
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 font-medium">
              {settings.subtitle}
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          
          {/* Mission Note */}
          {settings.description && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-950 text-xs sm:text-sm leading-relaxed">
              {settings.description}
            </div>
          )}

          {/* Option 1: PayPal Donation */}
          {(settings.paypal_me_link || settings.paypal_email) && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      PayPal {isDe ? 'Spende' : 'Donation'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isDe ? 'Schnell, sicher und unkompliziert' : 'Fast, safe and simple online donation'}
                    </p>
                  </div>
                </div>

                {settings.paypal_me_link && (
                  <a
                    href={settings.paypal_me_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <span>{isDe ? 'Zu PayPal' : 'Open PayPal'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {settings.paypal_email && !settings.paypal_me_link && (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-mono text-xs text-slate-800 truncate">{settings.paypal_email}</span>
                  <button
                    onClick={() => copyToClipboard(settings.paypal_email, 'paypal')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    {copiedField === 'paypal' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'paypal' ? (isDe ? 'Kopiert!' : 'Copied!') : (isDe ? 'Kopieren' : 'Copy')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Option 2: Bank Transfer (SEPA) */}
          {(settings.bank_iban || settings.bank_recipient) && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isDe ? 'Banküberweisung (SEPA)' : 'Bank Transfer (SEPA)'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isDe ? 'Direkt auf das Gemeinschaftskonto' : 'Direct bank transfer'}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {settings.bank_recipient && (
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium">{isDe ? 'Empfänger:' : 'Recipient:'}</span>
                    <span className="font-bold text-slate-900 truncate">{settings.bank_recipient}</span>
                  </div>
                )}
                {settings.bank_iban && (
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium">IBAN:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 select-all">{settings.bank_iban}</span>
                      <button
                        onClick={() => copyToClipboard(settings.bank_iban, 'iban')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                        title={isDe ? 'IBAN kopieren' : 'Copy IBAN'}
                      >
                        {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
                {settings.bank_bic && (
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium">BIC / SWIFT:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 select-all">{settings.bank_bic}</span>
                      <button
                        onClick={() => copyToClipboard(settings.bank_bic, 'bic')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                        title={isDe ? 'BIC kopieren' : 'Copy BIC'}
                      >
                        {copiedField === 'bic' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
                {settings.bank_name && (
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium">{isDe ? 'Bank:' : 'Bank Name:'}</span>
                    <span className="font-semibold text-slate-800">{settings.bank_name}</span>
                  </div>
                )}
                {settings.bank_reference && (
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500 font-medium">{isDe ? 'Verwendungszweck:' : 'Reference:'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">{settings.bank_reference}</span>
                      <button
                        onClick={() => copyToClipboard(settings.bank_reference, 'ref')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                        title={isDe ? 'Zweck kopieren' : 'Copy reference'}
                      >
                        {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Option 3: Sponsor & Corporate Partner Inquiries */}
          {(settings.sponsor_info || settings.sponsor_email) && (
            <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <h4 className="font-bold text-amber-950 text-sm">
                  {isDe ? 'Offizieller Sponsor oder Partner werden' : 'Become a Sponsor or Official Partner'}
                </h4>
              </div>
              <p className="text-xs text-amber-900/85 leading-relaxed">
                {settings.sponsor_info || (isDe 
                  ? 'Möchten Sie oder Ihr Unternehmen unser Team unterstützen (z. B. Trikotwerbung, Turniersponsoring oder Trainingsbälle)?' 
                  : 'Interested in supporting our team with jersey branding, tournament sponsorship or equipment support?')}
              </p>
              {settings.sponsor_email && (
                <div className="pt-1">
                  <a
                    href={`mailto:${settings.sponsor_email}?subject=${encodeURIComponent(isDe ? 'Sponsoring-Anfrage TU Chemnitz Badminton' : 'Sponsorship Inquiry TU Chemnitz Badminton')}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isDe ? 'Sponsoring-Kontakt aufnehmen' : 'Contact Sponsor Representative'}</span>
                  </a>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isDe ? 'TU Chemnitz Badminton Gemeinschaft' : 'TU Chemnitz Badminton Community'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {isDe ? 'Schließen' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
