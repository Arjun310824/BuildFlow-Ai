import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import gu from './locales/gu.json';

export const LANGUAGE_STORAGE_KEY = 'buildflow_language';

// Get initial language from localStorage or default to 'en'
const savedLanguage = typeof window !== 'undefined'
  ? localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en'
  : 'en';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  gu: { translation: gu },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Automatically persist language selection on change
i18n.on('languageChanged', (lng) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    }
  } catch (err) {
    console.warn('Failed to save language to localStorage:', err);
  }
});

export default i18n;
