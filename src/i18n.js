import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { isRTLLanguage, getTextDirection } from './utils/RTLUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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

// Temporarily disable expo-updates to avoid conflicts with AdMob
// let Updates = null;
// try {
//     Updates = require("expo-updates");
// } catch (error) {
//     console.warn('expo-updates not available:', error.message);
//     Updates = null;
// }

// Default language is always English
const defaultLanguage = 'en';

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

// Debug: Check if languageSelection translations are loaded (only in development)
if (__DEV__) {
    console.log('i18n resources loaded:', Object.keys(resources));
    console.log('English translations keys:', Object.keys(en));
    console.log('languageSelection in en:', en.languageSelection);
}

// Function to get user's preferred language from AsyncStorage
export const getUserLanguage = async () => {
    try {
        const userLanguage = await AsyncStorage.getItem('userLanguage');
        if (userLanguage && resources[userLanguage]) {
            if (__DEV__) console.log('User language found:', userLanguage);
            return userLanguage;
        }
        if (__DEV__) console.log('No user language found, using default language:', defaultLanguage);
        return defaultLanguage;
    } catch (error) {
        console.warn('Error getting user language:', error);
        return defaultLanguage;
    }
};

// Initialize i18n with proper error handling and async user language loading
const initI18n = async () => {
    try {
        // Get user's preferred language
        const userLanguage = await getUserLanguage();

        // Add a small delay to ensure all resources are loaded
        await new Promise(resolve => setTimeout(resolve, 100));

        await i18n
            .use(initReactI18next)
            .init({
                resources,
                lng: userLanguage,
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
        if (__DEV__) {
            console.log('i18n initialized with user language:', i18n.language);
            console.log('i18n has languageSelection.title:', i18n.exists('languageSelection.title'));
        }

        return true;
    } catch (error) {
        console.error('Failed to initialize i18n:', error);
        return false;
    }
};

// Initialize i18n with proper error handling
let initPromise = null;

export const ensureI18nInitialized = async () => {
    if (!initPromise) {
        initPromise = initI18n();
    }
    return initPromise;
};

// Function to check if i18n is ready
export const isI18nReady = () => {
    return i18n.isInitialized;
};

// Initialize i18n when module is imported (but don't await it)
// This is now handled by the useI18n hook for better React integration
if (__DEV__) {
    ensureI18nInitialized().catch(error => {
        console.error('Failed to initialize i18n:', error);
    });
}

// Function to change language with better error handling and AsyncStorage update
export const changeLanguage = async (language, navigation = null) => {
    try {
        // Ensure i18n is initialized
        await ensureI18nInitialized();

        // Check if the language exists in resources
        if (!resources[language]) {
            console.error(`Language ${language} not found in resources`);
            return false;
        }

        // Change language
        await i18n.changeLanguage(language);
        if (__DEV__) {
            console.log('Language changed to:', language);
            console.log('New language has languageSelection.title:', i18n.exists('languageSelection.title'));
        }

        // Update AsyncStorage with user's language preference
        try {
            await AsyncStorage.setItem('userLanguage', language);
            if (__DEV__) console.log('User language preference saved to AsyncStorage');
        } catch (storageError) {
            console.warn('Failed to save language preference to AsyncStorage:', storageError);
        }

        // Verify the change was successful
        if (i18n.language === language) {
            if (__DEV__) console.log('Language change successful');

            // Reload the app to apply the new language
            setTimeout(() => {
                if (navigation) {
                    reloadAppWithNavigation(navigation);
                } else {
                    reloadApp();
                }
            }, 500); // Small delay to ensure language change is processed

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

// Function to reload user language from AsyncStorage (useful for app resume)
export const reloadUserLanguage = async (navigation = null) => {
    try {
        const userLanguage = await getUserLanguage();
        if (userLanguage && userLanguage !== i18n.language) {
            if (__DEV__) console.log('Reloading user language from:', i18n.language, 'to:', userLanguage);
            return await changeLanguage(userLanguage, navigation);
        }
        return true;
    } catch (error) {
        console.error('Error reloading user language:', error);
        return false;
    }
};

// Function to reload the app after language change
export const reloadApp = () => {
    // Get current language for alert text
    const currentLang = i18n.language;

    // Define alert text in different languages
    const alertTexts = {
        en: {
            title: 'Language Changed',
            message: 'The app needs to restart to apply the new language. Please close and reopen the app.',
            button: 'OK'
        },
        ar: {
            title: 'تم تغيير اللغة',
            message: 'يحتاج التطبيق إلى إعادة تشغيل لتطبيق اللغة الجديدة. يرجى إغلاق وإعادة فتح التطبيق.',
            button: 'حسناً'
        },
        ckb: {
            title: 'زمان گۆڕدرا',
            message: 'ئەپەکە پێویستی بە دووبارەکردنەوەیە بۆ جێبەجێکردنی زمانە نوێیەکە. تکایە ئەپەکە دابخە و دووبارە بیکەوە.',
            button: 'باشە'
        },
        fr: {
            title: 'Langue Changée',
            message: 'L\'application doit redémarrer pour appliquer la nouvelle langue. Veuillez fermer et rouvrir l\'application.',
            button: 'OK'
        },
        ja: {
            title: '言語が変更されました',
            message: '新しい言語を適用するには、アプリを再起動する必要があります。アプリを閉じて再度開いてください。',
            button: 'OK'
        },
        de: {
            title: 'Sprache Geändert',
            message: 'Die App muss neu gestartet werden, um die neue Sprache zu übernehmen. Bitte schließen und öffnen Sie die App erneut.',
            button: 'OK'
        },
        es: {
            title: 'Idioma Cambiado',
            message: 'La aplicación debe reiniciarse para aplicar el nuevo idioma. Por favor, cierre y vuelva a abrir la aplicación.',
            button: 'OK'
        },
        hi: {
            title: 'भाषा बदली गई',
            message: 'नई भाषा लागू करने के लिए ऐप को पुनः प्रारंभ करना होगा। कृपया ऐप को बंद करें और फिर से खोलें।',
            button: 'ठीक है'
        },
        ru: {
            title: 'Язык Изменен',
            message: 'Приложению необходимо перезапуститься для применения нового языка. Пожалуйста, закройte и снова откройте приложение.',
            button: 'OK'
        },
        pt: {
            title: 'Idioma Alterado',
            message: 'O aplicativo precisa ser reiniciado para aplicar o novo idioma. Por favor, feche e reabra o aplicativo.',
            button: 'OK'
        },
        tr: {
            title: 'Dil Değiştirildi',
            message: 'Yeni dili uygulamak için uygulamanın yeniden başlatılması gerekiyor. Lütfen uygulamayı kapatın ve tekrar açın.',
            button: 'Tamam'
        },
        fa: {
            title: 'زبان تغییر کرد',
            message: 'برای اعمال زبان جدید، برنامه باید مجدداً راه‌اندازی شود. لطفاً برنامه را ببندید و دوباره باز کنید.',
            button: 'باشه'
        },
        it: {
            title: 'Lingua Cambiata',
            message: 'L\'app deve essere riavviata per applicare la nuova lingua. Si prega di chiudere e riaprire l\'app.',
            button: 'OK'
        },
        zh: {
            title: '语言已更改',
            message: '应用需要重新启动以应用新语言。请关闭并重新打开应用。',
            button: '确定'
        }
    };

    // Get text for current language or fallback to English
    const text = alertTexts[currentLang] || alertTexts.en;

    Alert.alert(
        text.title,
        text.message,
        [
            {
                text: text.button,
                onPress: () => {
                    // For React Native, we can't force restart, but we can guide the user
                    // In a real app, you might want to use a native module or navigation reset
                    if (__DEV__) console.log('App reload requested - user should manually restart');
                }
            }
        ],
        { cancelable: false }
    );
};

// Function to reload the app with navigation reset (more effective than just alert)
export const reloadAppWithNavigation = (navigation) => {
    if (!navigation) {
        // Fallback to regular reload if no navigation available
        reloadApp();
        return;
    }

    // Get current language for alert text
    const currentLang = i18n.language;

    // Define alert text in different languages
    const alertTexts = {
        en: {
            title: 'Language Changed',
            message: 'The app will restart to apply the new language.',
            button: 'Restart Now'
        },
        ar: {
            title: 'تم تغيير اللغة',
            message: 'سيتم إعادة تشغيل التطبيق لتطبيق اللغة الجديدة.',
            button: 'إعادة التشغيل الآن'
        },
        ckb: {
            title: 'زمان گۆڕدرا',
            message: 'ئەپەکە دووبارە دەکرێتەوە بۆ جێبەجێکردنی زمانە نوێیەکە.',
            button: 'ئێستا دووبارە بکەوە'
        },
        fr: {
            title: 'Langue Changée',
            message: 'L\'application va redémarrer pour appliquer la nouvelle langue.',
            button: 'Redémarrer Maintenant'
        },
        ja: {
            title: '言語が変更されました',
            message: '新しい言語を適用するためにアプリが再起動されます。',
            button: '今すぐ再起動'
        },
        de: {
            title: 'Sprache Geändert',
            message: 'Die App wird neu gestartet, um die neue Sprache zu übernehmen.',
            button: 'Jetzt Neustarten'
        },
        es: {
            title: 'Idioma Cambiado',
            message: 'La aplicación se reiniciará para aplicar el nuevo idioma.',
            button: 'Reiniciar Ahora'
        },
        hi: {
            title: 'भाषा बदली गई',
            message: 'नई भाषा लागू करने के लिए ऐप पुनः प्रारंभ होगा।',
            button: 'अभी पुनः प्रारंभ करें'
        },
        ru: {
            title: 'Язык Изменен',
            message: 'Приложение перезапустится для применения нового языка.',
            button: 'Перезапустить Сейчас'
        },
        pt: {
            title: 'Idioma Alterado',
            message: 'O aplicativo será reiniciado para aplicar o novo idioma.',
            button: 'Reiniciar Agora'
        },
        tr: {
            title: 'Dil Değiştirildi',
            message: 'Yeni dili uygulamak için uygulama yeniden başlatılacak.',
            button: 'Şimdi Yeniden Başlat'
        },
        fa: {
            title: 'زبان تغییر کرد',
            message: 'برای اعمال زبان جدید، برنامه مجدداً راه‌اندازی خواهد شد.',
            button: 'حالا مجدداً راه‌اندازی کنید'
        },
        it: {
            title: 'Lingua Cambiata',
            message: 'L\'app si riavvierà per applicare la nuova lingua.',
            button: 'Riavvia Ora'
        },
        zh: {
            title: '语言已更改',
            message: '应用将重新启动以应用新语言。',
            button: '立即重启'
        }
    };

    // Get text for current language or fallback to English
    const text = alertTexts[currentLang] || alertTexts.en;

    Alert.alert(
        text.title,
        text.message,
        [
            {
                text: text.button,
                onPress: async () => {
                    try {
                        // Temporarily use fallback reload to avoid expo-updates conflicts
                        reloadApp();
                        if (__DEV__) console.log('App reloaded with fallback method');
                    } catch (error) {
                        console.error('App reload failed:', error);
                        // Try to reload the app anyway
                        reloadApp();
                    }
                }
            }
        ],
        { cancelable: false }
    );
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
