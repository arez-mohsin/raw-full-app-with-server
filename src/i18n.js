import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { isRTLLanguage, getTextDirection } from './utils/RTLUtils';

// Import translation files
import en from './locales/en.json'; //
import zh from './locales/zh.json';
import hi from './locales/hi.json'; //
import es from './locales/es.json'; //
import fr from './locales/fr.json'; //
import ar from './locales/ar.json'; //
import ckb from './locales/ckb.json'; //
import ru from './locales/ru.json'; //
import pt from './locales/pt.json'; //
import tr from './locales/tr.json';
import de from './locales/de.json'; //
import fa from './locales/fa.json'; //
import ja from './locales/ja.json';          
import it from './locales/it.json';


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
    },
    fr: {
        translation: fr,
    },
    ar: {
        translation: ar,
    },
    ckb: {
        translation: ckb,
    },
    ru: {
        translation: ru,
    },
    pt: {
        translation: pt,
    },
    tr: {
        translation: tr,
    },
    de: {
        translation: de,
    },
    fa: {
        translation: fa,
    }, 
    ja: {
        translation: ja,     
    },
    it: {
        translation: it,
    },
};

// Debug: Check if languageSelection translations are loaded
console.log('i18n resources loaded:', Object.keys(resources));
console.log('English translations keys:', Object.keys(en));
console.log('languageSelection in en:', en.languageSelection);

// Initialize i18n with proper error handling
const initI18n = async () => {
    try {
        // Add a small delay to ensure all resources are loaded
        await new Promise(resolve => setTimeout(resolve, 100));

        await i18n
            .use(initReactI18next)
            .init({
                resources,
                lng: deviceLocale,
                fallbackLng: 'en',
                debug: __DEV__, // Enable debug mode in development
                load: 'languageOnly', // Only load language, not region
                preload: ['en', 'ar', 'ckb'], // Preload common languages

                interpolation: {
                    escapeValue: false, // React already escapes values
                },

                react: {
                    useSuspense: false, // Disable Suspense for React Native
                },
            });

        // Debug: Check i18n initialization
        console.log('i18n initialized with language:', i18n.language);
        console.log('i18n has languageSelection.title:', i18n.exists('languageSelection.title'));

        return true;
    } catch (error) {
        console.error('Failed to initialize i18n:', error);
        return false;
    }
};

// Initialize i18n immediately
initI18n();

// Function to change language with better error handling
export const changeLanguage = async (language) => {
    try {
        // Ensure i18n is initialized
        if (!i18n.isInitialized) {
            console.log('i18n not initialized, waiting...');
            await new Promise(resolve => {
                const checkInit = () => {
                    if (i18n.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 100);
                    }
                };
                checkInit();
            });
        }

        // Check if the language exists in resources
        if (!resources[language]) {
            console.error(`Language ${language} not found in resources`);
            return false;
        }

        // Change language
        await i18n.changeLanguage(language);
        console.log('Language changed to:', language);
        console.log('New language has languageSelection.title:', i18n.exists('languageSelection.title'));

        // Verify the change was successful
        if (i18n.language === language) {
            console.log('Language change successful');
            return true;
        } else {
            console.error('Language change failed - language mismatch');
            return false;
        }
    } catch (error) {
        console.error('Error changing language:', error);
        return false;
    }
};

// Function to get current language
export const getCurrentLanguage = () => {
    return i18n.language;
};

// Function to get current language direction
export const getCurrentLanguageDirection = () => {
    return getTextDirection(getCurrentLanguage());
};

// Function to check if current language is RTL
export const isCurrentLanguageRTL = () => {
    return isRTLLanguage(getCurrentLanguage());
};

// Function to get available languages
export const getAvailableLanguages = () => {
    return [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'zh', name: 'Chinese', nativeName: '中文' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
        { code: 'fr', name: 'French', nativeName: 'Français' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
        { code: 'ckb', name: 'Kurdish', nativeName: 'کوردی' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
        { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語' }, 
        { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    ];
};

export default i18n;
