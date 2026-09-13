import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('tuc_badminton_lang');
    if (saved && (saved === 'de' || saved === 'en')) {
      return saved;
    }
    // Check browser language
    if (typeof navigator !== 'undefined' && navigator.language) {
      if (navigator.language.startsWith('de')) return 'de';
    }
    return 'de';
  });

  const setLanguage = (lang) => {
    if (lang === 'de' || lang === 'en') {
      setLanguageState(lang);
      localStorage.setItem('tuc_badminton_lang', lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'de' ? 'en' : 'de');
  };

  useEffect(() => {
    localStorage.setItem('tuc_badminton_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language] || translations.de;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
