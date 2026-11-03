import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Two-click embed: the third-party iframe (Google Maps, YouTube) loads only after the visitor agrees,
// so no IP address reaches the provider on page load (DSGVO Art. 6 Abs. 1 lit. a)
const STORAGE_PREFIX = 'tuc_consent_';

export function hasConsent(provider) {
  try {
    return localStorage.getItem(STORAGE_PREFIX + provider) === '1';
  } catch {
    return false;
  }
}

export function useConsent(provider) {
  const [allowed, setAllowed] = useState(() => hasConsent(provider));
  const allow = () => {
    try {
      localStorage.setItem(STORAGE_PREFIX + provider, '1');
    } catch {
      // Private mode: consent holds for this page view only
    }
    setAllowed(true);
  };
  return [allowed, allow];
}

const PROVIDERS = {
  youtube: { name: 'YouTube', company: 'Google Ireland Limited' },
  maps: { name: 'Google Maps', company: 'Google Ireland Limited' },
};

export default function ConsentEmbed({ provider, allowed, onAllow, className = '', children }) {
  const { language } = useLanguage();
  const isDe = language === 'de';
  const p = PROVIDERS[provider];

  if (allowed) return children;

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 p-4 text-center bg-slate-100 ${className}`}>
      <ShieldCheck className="w-6 h-6 text-[#005A36]" />
      <p className="text-[11px] sm:text-xs text-slate-600 max-w-sm leading-relaxed">
        {isDe
          ? `Beim Laden von ${p.name} wird Ihre IP-Adresse an ${p.company} übertragen. Details in der `
          : `Loading ${p.name} sends your IP address to ${p.company}. Details in the `}
        <a href="#datenschutz" className="underline font-semibold text-[#005A36]">
          {isDe ? 'Datenschutzerklärung' : 'privacy policy'}
        </a>.
      </p>
      <button
        type="button"
        onClick={onAllow}
        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#004328] transition-colors"
      >
        {isDe ? `${p.name} laden` : `Load ${p.name}`}
      </button>
    </div>
  );
}
