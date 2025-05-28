
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Language, AllTranslations } from '../types';
import { TRANSLATIONS } from '../constants';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: AllTranslations[Language];
  dir: 'ltr' | 'rtl';
}

export const LanguageContext = createContext<LanguageContextType>({
  language: Language.EN,
  setLanguage: () => {},
  translations: TRANSLATIONS[Language.EN],
  dir: 'ltr',
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(Language.EN);
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  }, []);
  
  useEffect(() => {
    const storedLang = localStorage.getItem('appLanguage') as Language | null;
    if (storedLang && (storedLang === Language.EN || storedLang === Language.AR)) {
      setLanguageState(storedLang);
    }
  }, []);

  useEffect(() => {
    const newDir = language === Language.AR ? 'rtl' : 'ltr';
    setDir(newDir);
    document.documentElement.lang = language;
    document.documentElement.dir = newDir;
  }, [language]);

  const currentTranslations = TRANSLATIONS[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations: currentTranslations, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};
