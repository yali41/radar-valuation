
import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
// Removed: import { Translations } from '../types'; // Let LanguageContext provide the specific type

// Helper function for deep key access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getNestedTranslation = (obj: any, path: string): string | undefined => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
};


export const useTranslations = () => {
  const { translations, language, dir } = useContext(LanguageContext);

  const t = (key: string, options?: Record<string, string | number | undefined> | string): string => {
    const rawText = getNestedTranslation(translations, key);
    let textToReturn: string;

    if (rawText === undefined) {
      console.warn(`Translation key "${key}" not found for language "${language}".`);
      // Check if options is intended as a fallback string
      if (typeof options === 'string') {
        textToReturn = options;
      } else {
        // If options is an object or undefined, or if no fallback string provided, use key
        textToReturn = key;
      }
    } else {
      textToReturn = rawText;
    }

    // Perform interpolation if options is an object
    if (typeof options === 'object' && options !== null && typeof textToReturn === 'string') {
      Object.entries(options).forEach(([placeholder, value]) => {
        if (value !== undefined) {
          textToReturn = textToReturn.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
        }
      });
    }
    
    return typeof textToReturn === 'string' ? textToReturn : key; // Ensure a string is always returned
  };
  
  return { t, language, dir };
};