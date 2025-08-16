import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
let AsyncStorage;
try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
    console.warn('AsyncStorage not available:', error.message);
    AsyncStorage = null;
}
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
let auth, db, onAuthStateChanged, doc, getDoc;
try {
    const firebaseModule = require('../firebase');
    auth = firebaseModule.auth;
    db = firebaseModule.db;

    const authModule = require('firebase/auth');
    onAuthStateChanged = authModule.onAuthStateChanged;

    const firestoreModule = require('firebase/firestore');
    doc = firestoreModule.doc;
    getDoc = firestoreModule.getDoc;
} catch (error) {
    console.warn('Firebase modules not available:', error.message);
    auth = null;
    db = null;
    onAuthStateChanged = null;
    doc = null;
    getDoc = null;
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
let Network;
try {
    Network = require('expo-network');
} catch (error) {
    console.warn('expo-network not available:', error.message);
    Network = null;
}


const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    // Safety check for translation function
    const safeT = (key, fallback = key) => {
        try {
            return t ? t(key) : fallback;
        } catch (error) {
            console.warn('Translation error:', error);
            return fallback;
        }
    };
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;
    const [networkStatus, setNetworkStatus] = useState('checking');
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    useEffect(() => {
        try {
            // Safety check for required functions
            if (typeof startAnimations === 'function' && typeof initializeApp === 'function') {
                startAnimations();
                initializeApp();
            } else {
                console.error('Required functions not available');
                // Fallback to basic navigation
                setTimeout(() => {
                    checkNavigation();
                }, 1000);
            }
        } catch (error) {
            console.error('Error in useEffect:', error);
            // Fallback to basic navigation
            setTimeout(() => {
                checkNavigation();
            }, 1000);
        }
    }, []);

    const initializeApp = async () => {
        try {
            console.log('Initializing app...');

            // Simple network check without complex health checks
            try {
                if (Network && Network.getNetworkStateAsync) {
                    const networkState = await Network.getNetworkStateAsync();
                    const isConnected = networkState && networkState.isConnected && networkState.isInternetReachable;

                    if (isConnected) {
                        setNetworkStatus('connected');
                        console.log('Network is connected, proceeding with app initialization');
                        // Wait for animations to complete before checking navigation
                        setTimeout(() => {
                            checkNavigation();
                        }, 3000);
                    } else {
                        setNetworkStatus('disconnected');
                        console.log('Network is not connected');
                        // Wait a bit and try to proceed anyway
                        setTimeout(() => {
                            checkNavigation();
                        }, 2000);
                    }
                } else {
                    console.log('Network module not available, proceeding anyway');
                    setNetworkStatus('connected');
                    setTimeout(() => {
                        checkNavigation();
                    }, 2000);
                }
            } catch (networkError) {
                console.log('Network check failed, proceeding anyway:', networkError.message);
                setNetworkStatus('connected'); // Assume connected and proceed
                setTimeout(() => {
                    checkNavigation();
                }, 2000);
            }
        } catch (error) {
            console.error('App initialization error:', error);
            setNetworkStatus('error');

            // Show retry option
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    retryInitialization();
                }, 2000);
            } else {
                // Max retries reached, proceed with basic navigation
                console.log('Max retries reached, proceeding with basic navigation');
                setTimeout(() => {
                    checkNavigation();
                }, 1000);
            }
        }
    };

    const waitForNetworkWithRetry = async () => {
        // Simplified - just proceed with navigation
        console.log('Proceeding with navigation despite network status');
        setTimeout(() => {
            checkNavigation();
        }, 1000);
    };

    const retryInitialization = () => {
        console.log(`Retrying initialization (${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        setNetworkStatus('checking');
        initializeApp();
    };

    const startAnimations = () => {
        try {
            // Logo scale and opacity animation
            Animated.parallel([
                Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]).start();

            // Text fade in animation
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 600,
                delay: 500,
                useNativeDriver: true,
            }).start();

            // Progress bar animation
            Animated.timing(progressWidth, {
                toValue: width - 80,
                duration: 3000,
                useNativeDriver: false,
            }).start();
        } catch (error) {
            console.error('Animation error:', error);
            // Continue without animations
        }
    };

    const checkNavigation = async () => {
        try {
            console.log('Checking navigation state...');

            // Safety check for navigation object
            if (!navigation || typeof navigation.replace !== 'function') {
                console.error('Navigation object not available');
                return;
            }

            // Wait for Firebase Auth to restore state first
            const destination = await determineNavigationDestination();
            console.log('Navigation destination determined:', destination);

            navigation.replace(destination);
        } catch (error) {
            console.error('Navigation check error:', error);

            // For any errors, fall back to basic navigation
            console.log('Falling back to basic navigation check');
            try {
                const basicDestination = await performBasicNavigationCheck();
                if (navigation && typeof navigation.replace === 'function') {
                    navigation.replace(basicDestination);
                }
            } catch (basicError) {
                console.error('Basic navigation check also failed:', basicError);
                // Last resort - go to onboarding
                if (navigation && typeof navigation.replace === 'function') {
                    navigation.replace('Onboarding');
                }
            }
        }
    };

    const determineNavigationDestination = async () => {
        return new Promise(async (resolve) => {
            const authTimeout = setTimeout(async () => {
                console.log('Auth state check timeout, using fallback navigation');
                try {
                    const fallbackDestination = await getFallbackDestination();
                    resolve(fallbackDestination);
                } catch (timeoutError) {
                    console.error('Fallback destination error:', timeoutError);
                    resolve('Onboarding'); // Default fallback
                }
            }, 5000); // Reduced timeout to 5 seconds

            try {
                if (!auth || !onAuthStateChanged) {
                    console.error('Firebase auth not available');
                    resolve('Onboarding');
                    return;
                }

                const unsubscribe = onAuthStateChanged(auth, async (user) => {
                    try {
                        clearTimeout(authTimeout);
                        if (unsubscribe && typeof unsubscribe === 'function') {
                            unsubscribe();
                        }

                        if (user) {
                            console.log('User authenticated:', user.uid);

                            try {
                                // Check if user document exists in Firestore
                                if (db && doc && getDoc) {
                                    const userDocRef = doc(db, 'users', user.uid);
                                    const userDoc = await getDoc(userDocRef);

                                    if (userDoc && userDoc.exists()) {
                                        // Check if email is verified - REQUIRED for access
                                        if (user.emailVerified) {
                                            console.log('User is authenticated, has valid document, and email is verified');
                                            resolve('Main');
                                        } else {
                                            console.log('User is authenticated but email is not verified');
                                            resolve('EmailVerification');
                                        }
                                    } else {
                                        console.log('User document not found, proceeding to Main');
                                        resolve('Main'); // Allow user to proceed, will sync later
                                    }
                                } else {
                                    console.log('Firestore not available, proceeding to Main');
                                    resolve('Main');
                                }
                            } catch (firestoreError) {
                                console.error('Error checking user document:', firestoreError);
                                // On any error, allow user to proceed to Main
                                console.log('Allowing user to proceed to Main despite Firestore error');
                                resolve('Main');
                            }
                        } else {
                            console.log('No user authenticated, checking app launch status');
                            try {
                                if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
                                    const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                                    if (!hasLaunched || hasLaunched === 'false') {
                                        resolve('Onboarding');
                                    } else {
                                        resolve('Login');
                                    }
                                } else {
                                    console.warn('AsyncStorage not available, defaulting to Onboarding');
                                    resolve('Onboarding');
                                }
                            } catch (storageError) {
                                console.error('AsyncStorage error:', storageError);
                                resolve('Onboarding'); // Default to onboarding on storage error
                            }
                        }
                    } catch (userError) {
                        console.error('Error in user processing:', userError);
                        resolve('Onboarding'); // Default to onboarding on any user processing error
                    }
                });
            } catch (error) {
                clearTimeout(authTimeout);
                console.error('Auth state change listener error:', error);
                try {
                    const fallbackDestination = await getFallbackDestination();
                    resolve(fallbackDestination);
                } catch (fallbackError) {
                    console.error('Fallback destination error:', fallbackError);
                    resolve('Onboarding'); // Default fallback
                }
            }
        });
    };

    const performBasicNavigationCheck = async () => {
        try {
            // Simple check without network requests
            try {
                if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
                    const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                    if (!hasLaunched || hasLaunched === 'false') {
                        return 'Onboarding';
                    } else {
                        return 'Login';
                    }
                } else {
                    console.warn('AsyncStorage not available in basic check, defaulting to Onboarding');
                    return 'Onboarding';
                }
            } catch (storageError) {
                console.error('AsyncStorage error in basic check:', storageError);
                return 'Onboarding'; // Default to onboarding on storage error
            }
        } catch (error) {
            console.error('Basic navigation check error:', error);
            return 'Onboarding'; // Default fallback
        }
    };

    const getFallbackDestination = async () => {
        try {
            try {
                if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
                    const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                    if (!hasLaunched || hasLaunched === 'false') {
                        return 'Onboarding';
                    } else {
                        return 'Login';
                    }
                } else {
                    console.warn('AsyncStorage not available in fallback, defaulting to Onboarding');
                    return 'Onboarding';
                }
            } catch (storageError) {
                console.error('AsyncStorage error in fallback:', storageError);
                return 'Onboarding'; // Default to onboarding on storage error
            }
        } catch (error) {
            console.error('Fallback destination error:', error);
            return 'Onboarding';
        }
    };

    const insets = useSafeAreaInsets();

    // Safety check for insets
    const safeInsets = {
        top: insets?.top || 0,
        bottom: insets?.bottom || 0
    };

    // Get status text based on network status
    const getStatusText = () => {
        switch (networkStatus) {
            case 'checking':
                return 'Checking network...';
            case 'connected':
                return 'Connected';
            case 'disconnected':
                return 'No network';
            case 'error':
                return 'Connection error';
            default:
                return 'Loading...';
        }
    };

    // Get status color based on network status
    const getStatusColor = () => {
        switch (networkStatus) {
            case 'connected':
                return theme.colors.accent;
            case 'disconnected':
            case 'error':
                return '#ff4444';
            default:
                return theme.colors.textTertiary;
        }
    };

    // Safety check to ensure theme is available
    if (!theme || !theme.colors) {
        console.warn('Theme not available, using fallback colors');
        return (
            <View style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
                <View style={styles.content}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
                </View>
            </View>
        );
    }

    // Safety check for other required objects
    if (!safeInsets || !logoScale || !logoOpacity || !textOpacity || !progressWidth) {
        console.warn('Required animation objects not available, using fallback UI');
        return (
            <View style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
                <View style={styles.content}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
                </View>
            </View>
        );
    }

    try {
        return (
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
                style={[styles.container, {
                    paddingTop: safeInsets.top,
                    paddingBottom: safeInsets.bottom,
                }]}
            >
                <View style={styles.content}>
                    {/* Logo */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: logoOpacity,
                                transform: [{ scale: logoScale }],
                            },
                        ]}
                    >
                        <View style={[styles.logoCircle, { backgroundColor: theme.colors.card, borderColor: theme.colors.accent }]}>
                            <Ionicons name="diamond" size={60} color={theme.colors.accent} />
                        </View>
                    </Animated.View>

                    {/* App Name */}
                    <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
                        <Text style={[styles.appName, { color: theme.colors.accent }]}>RAW</Text>
                        <Text style={[styles.appTagline, { color: theme.colors.textSecondary }]}>Rewarding your time</Text>
                    </Animated.View>

                    {/* Network Status */}
                    <Animated.View style={[styles.statusContainer, { opacity: textOpacity }]}>
                        <View style={styles.statusRow}>
                            <Ionicons
                                name={networkStatus === 'connected' ? 'wifi' : 'wifi-off'}
                                size={16}
                                color={getStatusColor()}
                            />
                            <Text style={[styles.statusText, { color: getStatusColor() }]}>
                                {getStatusText()}
                            </Text>
                        </View>
                        {retryCount > 0 && (
                            <Text style={[styles.retryText, { color: theme.colors.textTertiary }]}>
                                Retry {retryCount}/{maxRetries}
                            </Text>
                        )}
                    </Animated.View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: progressWidth,
                                        backgroundColor: theme.colors.accent,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.loadingText, { color: theme.colors.textTertiary }]}>Loading...</Text>
                    </View>

                    {/* Version */}
                    <View style={styles.versionContainer}>
                        <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>Version 1.0.0</Text>
                    </View>
                </View>
            </LinearGradient>
        );
    } catch (error) {
        console.error('Error rendering SplashScreen:', error);
        // Fallback render
        return (
            <View style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
                <View style={styles.content}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
                </View>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    logoContainer: {
        marginBottom: 40,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        shadowColor: '#FFD700',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    appTagline: {
        fontSize: 16,
        textAlign: 'center',
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusText: {
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
    },
    retryText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 40,
    },
    progressBar: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    loadingText: {
        fontSize: 14,
    },
    versionContainer: {
        position: 'absolute',
        bottom: 40,
    },
    versionText: {
        fontSize: 12,
    },
});

export default SplashScreen;
