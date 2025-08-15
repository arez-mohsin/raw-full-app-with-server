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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import networkService from '../utils/NetworkService';
import apiService from '../utils/ApiService';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;
    const [networkStatus, setNetworkStatus] = useState('checking');
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    useEffect(() => {
        startAnimations();
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            console.log('Initializing app...');

            // Perform comprehensive network health check
            const networkHealth = await networkService.performNetworkHealthCheck();
            console.log('Network health check result:', networkHealth);

            if (networkHealth.healthy) {
                setNetworkStatus('connected');
                console.log('Network is healthy, proceeding with app initialization');
                // Wait for animations to complete before checking navigation
                setTimeout(() => {
                    checkNavigation();
                }, 3000);
            } else {
                setNetworkStatus('disconnected');
                console.log('Network is not healthy:', networkHealth.message);

                // Try to wait for network to become available
                await waitForNetworkWithRetry();
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
                // Max retries reached, show network error
                setTimeout(() => {
                    navigation.replace('NetworkError');
                }, 1000);
            }
        }
    };

    const waitForNetworkWithRetry = async () => {
        try {
            console.log('Waiting for network to become available...');

            // Wait for network with timeout
            const networkHealth = await networkService.waitForNetwork(15000); // 15 seconds

            if (networkHealth.healthy) {
                setNetworkStatus('connected');
                console.log('Network became available, proceeding with navigation check');
                setTimeout(() => {
                    checkNavigation();
                }, 1000);
            } else {
                throw new Error('Network did not become available');
            }
        } catch (error) {
            console.error('Failed to wait for network:', error);
            setNetworkStatus('disconnected');

            // Show retry option or navigate to network error
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    retryInitialization();
                }, 3000);
            } else {
                setTimeout(() => {
                    navigation.replace('NetworkError');
                }, 1000);
            }
        }
    };

    const retryInitialization = () => {
        console.log(`Retrying initialization (${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        setNetworkStatus('checking');
        initializeApp();
    };

    const startAnimations = () => {
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
    };

    const checkNavigation = async () => {
        try {
            console.log('Checking navigation state...');

            // Double-check network health before proceeding
            const networkHealth = await networkService.performNetworkHealthCheck();
            if (!networkHealth.healthy) {
                console.log('Network became unhealthy during navigation check, redirecting to network error');
                navigation.replace('NetworkError');
                return;
            }

            // Wait for Firebase Auth to restore state first
            const destination = await determineNavigationDestination();
            console.log('Navigation destination determined:', destination);

            navigation.replace(destination);
        } catch (error) {
            console.error('Navigation check error:', error);

            // Handle specific error types
            if (error.message.includes('Network unavailable') ||
                error.message.includes('Network did not become available')) {
                navigation.replace('NetworkError');
            } else {
                // For other errors, try to continue with basic navigation
                console.log('Falling back to basic navigation check');
                try {
                    const basicDestination = await performBasicNavigationCheck();
                    navigation.replace(basicDestination);
                } catch (basicError) {
                    console.error('Basic navigation check also failed:', basicError);
                    navigation.replace('NetworkError');
                }
            }
        }
    };

    const determineNavigationDestination = async () => {
        return new Promise(async (resolve) => {
            const authTimeout = setTimeout(async () => {
                console.log('Auth state check timeout, using fallback navigation');
                const fallbackDestination = await getFallbackDestination();
                resolve(fallbackDestination);
            }, 8000); // 8 second timeout

            try {
                const unsubscribe = onAuthStateChanged(auth, async (user) => {
                    clearTimeout(authTimeout);
                    unsubscribe();

                    if (user) {
                        console.log('User authenticated:', user.uid);

                        try {
                            // Check if user document exists in Firestore
                            const userDocRef = doc(db, 'users', user.uid);
                            const userDoc = await getDoc(userDocRef);

                            if (userDoc.exists()) {
                                // Check if email is verified - REQUIRED for access
                                if (user.emailVerified) {
                                    console.log('User is authenticated, has valid document, and email is verified');
                                    resolve('Main');
                                } else {
                                    console.log('User is authenticated but email is not verified');
                                    resolve('EmailVerification');
                                }
                            } else {
                                console.log('Security error - user has auth but no document');
                                resolve('SecurityError');
                            }
                        } catch (firestoreError) {
                            console.error('Error checking user document:', firestoreError);

                            // Check if it's a network error
                            if (firestoreError.message.includes('Network request failed') ||
                                firestoreError.message.includes('Failed to fetch')) {
                                // Queue the check for later when network is available
                                console.log('Network error during user document check, queuing for later');
                                resolve('Main'); // Allow user to proceed, will sync later
                            } else {
                                // On other errors, assume security issue
                                resolve('SecurityError');
                            }
                        }
                    } else {
                        console.log('No user authenticated, checking app launch status');
                        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                        if (!hasLaunched || hasLaunched === 'false') {
                            resolve('Onboarding');
                        } else {
                            resolve('Login');
                        }
                    }
                });
            } catch (error) {
                clearTimeout(authTimeout);
                console.error('Auth state change listener error:', error);
                const fallbackDestination = await getFallbackDestination();
                resolve(fallbackDestination);
            }
        });
    };

    const performBasicNavigationCheck = async () => {
        try {
            // Simple check without network requests
            const hasLaunched = await AsyncStorage.getItem('hasLaunched');
            if (!hasLaunched || hasLaunched === 'false') {
                return 'Onboarding';
            } else {
                return 'Login';
            }
        } catch (error) {
            console.error('Basic navigation check error:', error);
            return 'Onboarding'; // Default fallback
        }
    };

    const getFallbackDestination = async () => {
        try {
            const hasLaunched = await AsyncStorage.getItem('hasLaunched');
            if (!hasLaunched || hasLaunched === 'false') {
                return 'Onboarding';
            } else {
                return 'Login';
            }
        } catch (error) {
            console.error('Fallback destination error:', error);
            return 'Onboarding';
        }
    };

    const insets = useSafeAreaInsets();

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

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
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
