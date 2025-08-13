import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Animated,
    StatusBar,
    Dimensions,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';
import { useTheme } from '../context/ThemeContext';
import { getAvailableLanguages, changeLanguage } from '../i18n'; // Import from i18n.js

const { width, height } = Dimensions.get('window');

const LanguageSelectionScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const { isRTL, direction, textAlign, flexDirection } = useRTL();
    const { theme } = useTheme();

    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [isChanging, setIsChanging] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [isI18nReady, setIsI18nReady] = useState(false);

    const fadeAnims = useRef([]);
    const slideAnims = useRef([]);
    const scaleAnims = useRef([]);

    // Check if i18n is ready
    useEffect(() => {
        const checkI18nReady = () => {
            if (i18n.isInitialized && i18n.exists('languageSelection.title')) {
                setIsI18nReady(true);
            } else {
                // Check again after a short delay
                setTimeout(checkI18nReady, 100);
            }
        };

        checkI18nReady();
    }, [i18n]);

    // Language extra data (flags, gradients, descriptions)
    const languageExtraData = useMemo(() => ({
        en: {
            flag: '🇺🇸',
            description: 'Global language for international users',
            gradient: ['#667eea', '#764ba2']
        },
        ar: {
            flag: '🇸🇦',
            description: 'لغة عربية مع دعم RTL',
            gradient: ['#f093fb', '#f5576c']
        },
        ckb: {
            flag: '🇮🇶',
            description: 'زمانی کوردی بە پشتگیری RTL',
            gradient: ['#4facfe', '#00f2fe']
        },
        zh: {
            flag: '🇨🇳',
            description: '中文语言支持',
            gradient: ['#43e97b', '#38f9d7']
        },
        hi: {
            flag: '🇮🇳',
            description: 'हिंदी भाषा समर्थन',
            gradient: ['#fa709a', '#fee140']
        },
        es: {
            flag: '🇪🇸',
            description: 'Soporte para idioma español',
            gradient: ['#a8edea', '#fed6e3']
        },
        fr: {
            flag: '🇫🇷',
            description: 'Support de la langue française',
            gradient: ['#ffecd2', '#fcb69f']
        }
    }), []);

    // Load languages from i18n.js and initialize animations
    useEffect(() => {
        const loadLanguages = () => {
            const availableLanguages = getAvailableLanguages();
            const enrichedLanguages = availableLanguages.map(lang => ({
                ...lang,
                ...languageExtraData[lang.code] || {}
            }));
            setLanguages(enrichedLanguages);

            // Initialize animations
            fadeAnims.current = enrichedLanguages.map(() => new Animated.Value(0));
            slideAnims.current = enrichedLanguages.map(() => new Animated.Value(30));
            scaleAnims.current = enrichedLanguages.map(() => new Animated.Value(0.8));
        };

        loadLanguages();
        loadCurrentLanguage();
    }, []);

    // Start staggered animations after language data is loaded
    useEffect(() => {
        if (languages.length > 0 && selectedLanguage) {
            startEntranceAnimation();
        }
    }, [languages, selectedLanguage]);

    const startEntranceAnimation = () => {
        const animations = languages.map((_, index) => {
            return Animated.parallel([
                Animated.timing(fadeAnims.current[index], {
                    toValue: 1,
                    duration: 500,
                    delay: index * 80,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnims.current[index], {
                    toValue: 0,
                    duration: 600,
                    delay: index * 80,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnims.current[index], {
                    toValue: 1,
                    duration: 600,
                    delay: index * 80,
                    useNativeDriver: true,
                }),
            ]);
        });

        Animated.stagger(50, animations).start();
    };

    const loadCurrentLanguage = async () => {
        try {
            const currentLang = await AsyncStorage.getItem('userLanguage');
            if (currentLang) {
                setSelectedLanguage(currentLang);
            } else {
                setSelectedLanguage(i18n.language || 'en');
            }
        } catch (error) {
            console.error('Error loading language:', error);
            setSelectedLanguage(i18n.language || 'en');
        }
    };

    const handleLanguageChange = async (languageCode) => {
        if (languageCode === selectedLanguage || isChanging) return;

        try {
            setIsChanging(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Use the changeLanguage function from i18n.js
            const success = await changeLanguage(languageCode);

            if (success) {
                await AsyncStorage.setItem('userLanguage', languageCode);
                setSelectedLanguage(languageCode);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Navigate to login screen after language change
                setTimeout(() => {
                    navigation.replace('Login');
                }, 800);
            } else {
                console.error('Language change failed');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setIsChanging(false);
            }

        } catch (error) {
            console.error('Error changing language:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setIsChanging(false);
        }
    };

    const renderLanguageCard = (language, index) => {
        if (!language) return null;

        const isSelected = language.code === selectedLanguage;
        const isRTL = ['ar', 'ckb'].includes(language.code);

        return (
            <Animated.View
                key={language.code}
                style={[
                    styles.languageCard,
                    {
                        opacity: fadeAnims.current[index] || 0,
                        transform: [
                            { translateY: slideAnims.current[index] || 30 },
                            { scale: scaleAnims.current[index] || 0.8 }
                        ]
                    }
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.cardTouchable,
                        {
                            borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                            backgroundColor: isSelected ?
                                `${theme.colors.accent}20` : theme.colors.surface,
                            flexDirection: flexDirection
                        }
                    ]}
                    onPress={() => handleLanguageChange(language.code)}
                    disabled={isChanging}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={language.gradient || ['#667eea', '#764ba2']}
                        style={styles.flagContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.flagText}>{language.flag || '🌐'}</Text>
                    </LinearGradient>

                    <View style={[styles.languageInfo, { marginEnd: 16 }]}>
                        <View style={styles.languageHeader}>
                            <Text style={[styles.languageName, { color: theme.colors.textPrimary }]}>
                                {language.name}
                            </Text>
                            {isRTL && (
                                <View style={styles.rtlBadge}>
                                    <Text style={styles.rtlBadgeText}>RTL</Text>
                                </View>
                            )}
                        </View>

                        <Text style={[styles.nativeName, {
                            color: theme.colors.textSecondary,
                            writingDirection: direction
                        }]}>
                            {language.nativeName}
                        </Text>

                        <Text style={[styles.description, {
                            color: theme.colors.textTertiary,
                            writingDirection: direction
                        }]}>
                            {language.description}
                        </Text>
                    </View>

                    <View style={styles.cardRight}>
                        {isSelected ? (
                            <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.accent }]}>
                                <Ionicons name="checkmark" size={20} color="white" />
                            </View>
                        ) : (
                            <Ionicons
                                name={isRTL ? "chevron-back" : "chevron-forward"}
                                size={24}
                                color={theme.colors.textTertiary}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.colors.background}
            />

            {/* Header */}
            <View style={[
                styles.header,
                {
                    borderBottomColor: theme.colors.border,
                    flexDirection: flexDirection
                }
            ]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons
                        name={isRTL ? "arrow-forward" : "arrow-back"}
                        size={24}
                        color={theme.colors.textPrimary}
                    />
                </TouchableOpacity>

                <Text style={[
                    styles.headerTitle,
                    {
                        color: theme.colors.textPrimary,
                        textAlign: textAlign
                    }
                ]}>
                    {t('languageSelection.title', 'Language Selection')}
                </Text>

                <View style={styles.headerRight} />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                scrollEnabled={!isChanging}
            >
                <View style={styles.introSection}>
                    <Text style={[styles.introTitle, { color: theme.colors.textPrimary }]}>
                        {t('languageSelection.chooseLanguage', 'Choose Your Language')}
                    </Text>
                    <Text style={[styles.introSubtitle, { color: theme.colors.textSecondary }]}>
                        {t('languageSelection.selectPreferred', 'Select your preferred language for the app')}
                    </Text>
                </View>

                <View style={styles.languagesContainer}>
                    {languages.map((language, index) => renderLanguageCard(language, index))}
                </View>

                <View style={styles.infoSection}>
                    <View style={[
                        styles.infoCard,
                        {
                            backgroundColor: theme.colors.surface,
                            flexDirection: flexDirection
                        }
                    ]}>
                        <Ionicons
                            name="information-circle"
                            size={24}
                            color={theme.colors.accent}
                        />
                        <Text style={[
                            styles.infoText,
                            {
                                color: theme.colors.textSecondary,
                                marginStart: 12,
                                textAlign: textAlign
                            }
                        ]}>
                            {t('languageSelection.rtlInfo', 'Arabic and Kurdish languages support Right-to-Left (RTL) layout')}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Loading Overlay */}
            {isChanging && (
                <View style={styles.loadingOverlay}>
                    <View style={[
                        styles.loadingCard,
                        {
                            backgroundColor: theme.colors.surface,
                            flexDirection: flexDirection
                        }
                    ]}>
                        <ActivityIndicator
                            size="small"
                            color={theme.colors.accent}
                            style={{ marginEnd: 12 }}
                        />
                        <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
                            {t('languageSelection.changing', 'Changing language...')}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    introSection: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 20,
        alignItems: 'center',
    },
    introTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    introSubtitle: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    languagesContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    languageCard: {
        marginBottom: 16,
    },
    cardTouchable: {
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    flagContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flagText: {
        fontSize: 28,
    },
    languageInfo: {
        flex: 1,
    },
    languageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    languageName: {
        fontSize: 18,
        fontWeight: '700',
        marginEnd: 8,
    },
    rtlBadge: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    rtlBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
    },
    nativeName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
    },
    cardRight: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoSection: {
        paddingHorizontal: 20,
        paddingTop: 30,
    },
    infoCard: {
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingCard: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LanguageSelectionScreen;