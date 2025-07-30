import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import * as Network from 'expo-network';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        startAnimations();
    }, []);

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

        // Navigate after 3 seconds
        setTimeout(() => {
            checkNavigation();
        }, 3000);
    };

    const checkNavigation = async () => {
        try {
            // Check network connectivity first
            const networkState = await Network.getNetworkStateAsync();

            if (!networkState.isConnected || !networkState.isInternetReachable) {
                // No internet connection, show network error screen
                navigation.replace('NetworkError');
                return;
            }

            // Wait for Firebase Auth to restore state first
            const checkAuthState = () => {
                return new Promise((resolve) => {
                    const unsubscribe = onAuthStateChanged(auth, async (user) => {
                        unsubscribe(); // Unsubscribe immediately

                        if (user) {
                            // Check if user document exists in Firestore
                            try {
                                const userDocRef = doc(db, 'users', user.uid);
                                const userDoc = await getDoc(userDocRef);

                                if (userDoc.exists()) {
                                    // Check if email is verified - REQUIRED for access
                                    if (user.emailVerified) {
                                        // User is authenticated, has valid document, and email is verified
                                        resolve('Main');
                                    } else {
                                        // User is authenticated but email is not verified - show email verification
                                        resolve('EmailVerification');
                                    }
                                } else {
                                    // Security error - user has auth but no document
                                    resolve('SecurityError');
                                }
                            } catch (error) {
                                console.error('Error checking user document:', error);
                                // On error, assume security issue
                                resolve('SecurityError');
                            }
                        } else {
                            // No user authenticated, check if app has been launched before
                            const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                            if (!hasLaunched) {
                                resolve('Onboarding');
                            } else {
                                resolve('Login');
                            }
                        }
                    });
                });
            };

            // Wait for auth state to be determined with timeout
            const destination = await Promise.race([
                checkAuthState(),
                new Promise(async (resolve) => {
                    setTimeout(async () => {
                        // If timeout, check if app has been launched before
                        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                        if (!hasLaunched) {
                            resolve('Onboarding');
                        } else {
                            resolve('Login');
                        }
                    }, 5000); // 5 second timeout
                })
            ]);
            navigation.replace(destination);
        } catch (error) {
            console.log('Error checking navigation state:', error);
            // If there's an error checking network, assume no connection
            navigation.replace('NetworkError');
        }
    };

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={styles.container}
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
                    <Text style={[styles.appName, { color: theme.colors.accent }]}>CryptoMiner</Text>
                    <Text style={[styles.appTagline, { color: theme.colors.textSecondary }]}>Mine Crypto, Earn Rewards</Text>
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
        marginBottom: 60,
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
