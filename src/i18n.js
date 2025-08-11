import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import es from './locales/es.json';

// Safe import of ExpoLocalization with fallback
let deviceLocale = 'en';
try {
    const Localization = require('expo-localization');
    deviceLocale = Localization.locale ? Localization.locale.split('-')[0] : 'en';
} catch (error) {
    console.warn('ExpoLocalization not available, using default locale:', error);
    deviceLocale = 'en';
}

const resources = {
    en: {
        translation: en,
    },
    zh: {
        translation: zh,
    },
    hi: {
        translation: hi,
    },
    es: {
        translation: es,
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: deviceLocale,
        fallbackLng: 'en',
        debug: __DEV__, // Enable debug mode in development

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        react: {
            useSuspense: false, // Disable Suspense for React Native
        },
    });

// Function to change language
export const changeLanguage = async (language) => {
    try {
        await i18n.changeLanguage(language);
        return true;
    } catch (error) {
        console.error('Error changing language:', error);
        return false;
    }
};

// Function to get current language
export const getCurrentLanguage = () => {
    return i18n.language;
};

// Function to get available languages
export const getAvailableLanguages = () => {
    return [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'zh', name: 'Chinese', nativeName: '中文' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' }
    ];
};

export default i18n;
