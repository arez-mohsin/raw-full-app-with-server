import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from './locales/en.json';

const resources = {
    en: {
        translation: en,
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: Localization.locale.split('-')[0] || 'en', // Use device language or fallback to English
        fallbackLng: 'en',
        debug: __DEV__, // Enable debug mode in development

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        react: {
            useSuspense: false, // Disable Suspense for React Native
        },
    });

export default i18n;
