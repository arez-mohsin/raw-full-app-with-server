import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Linking,
    ScrollView,
    AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { hapticMedium, hapticLight, hapticSuccess, hapticError, hapticWarning } from '../utils/HapticUtils';
import ErrorHandler from '../utils/ErrorHandler';
import ToastService from '../utils/ToastService';
import AccountStatusService from '../services/AccountStatusService';

const EmailVerificationScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [user, setUser] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const [appState, setAppState] = useState(AppState.currentState);
    const [retryCount, setRetryCount] = useState(0);
    const [lastError, setLastError] = useState(null);

    // Countdown timer for resend button
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // Monitor app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                // App has come to foreground, check verification status
                checkVerificationStatus();
            }
            setAppState(nextAppState);
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [appState]);

    // Update user document in Firestore when email is verified
    const updateUserEmailVerified = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                emailVerified: true,
                emailVerifiedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
            });
            console.log('User document updated with email verification status');
        } catch (error) {
            console.error('Error updating user document:', error);
            // Don't block the flow if Firestore update fails
        }
    };

    // Check verification status
    const checkVerificationStatus = async () => {
        try {
            if (user) {
                await user.reload();
                const updatedUser = auth.currentUser;
                if (updatedUser?.emailVerified) {
                    setIsVerified(true);

                    // Update user document in Firestore
                    await updateUserEmailVerified(updatedUser.uid);

                    // Check account status before navigating
                    try {
                        const accountStatus = await AccountStatusService.canUserAccess(updatedUser.uid);
                        if (accountStatus.canAccess) {
                            // Account is active, navigate to main app
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Main' }],
                            });
                        } else {
                            // Account is disabled or locked
                            navigation.replace('AccountStatusError');
                        }
                    } catch (error) {
                        console.error('Error checking account status:', error);
                        // On error, assume account status issue
                        navigation.replace('AccountStatusError');
                    }
                }
            }
        } catch (error) {
            console.error('Error checking verification status:', error);
        }
    };

    // Check email verification status and send verification email
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsVerified(currentUser.emailVerified);

                // If email is verified, navigate to main app (optional)
                if (currentUser.emailVerified) {
                    // Update user document in Firestore
                    await updateUserEmailVerified(currentUser.uid);

                    // Show success message and navigate after a delay
                    ToastService.success('Your email has been successfully verified. You can continue to the app now.');

                    // Check account status before navigating
                    setTimeout(async () => {
                        try {
                            const accountStatus = await AccountStatusService.canUserAccess(currentUser.uid);
                            if (accountStatus.canAccess) {
                                // Account is active, navigate to main app
                                navigation.replace('Main');
                            } else {
                                // Account is disabled or locked
                                navigation.replace('AccountStatusError');
                            }
                        } catch (error) {
                            console.error('Error checking account status:', error);
                            // On error, assume account status issue
                            navigation.replace('AccountStatusError');
                        }
                    }, 2000);
                } else {
                    // Send verification email automatically when screen loads
                    try {
                        await sendEmailVerification(currentUser);
                        setCountdown(60); // 60 second cooldown
                        console.log('Verification email sent automatically');
                    } catch (error) {
                        console.error('Error sending automatic verification email:', error);

                        // Handle specific Firebase errors
                        if (error.code === 'auth/too-many-requests') {
                            setCountdown(60); // Set cooldown even on error
                            ToastService.warning('Please wait a moment before requesting another verification email.');
                        } else if (error.code === 'auth/user-not-found') {
                            ToastService.error('Please log in again to verify your account.');
                        } else if (error.code === 'auth/network-request-failed') {
                            ToastService.error('Please check your internet connection and try again.');
                        } else {
                            ToastService.error('Failed to send verification email. Please try again later.');
                        }
                    }
                }
            } else {
                // If no user, go back to login
                navigation.replace('Login');
            }
        });

        return () => unsubscribe();
    }, [navigation]);

    // Send verification email
    const sendVerificationEmail = async () => {
        if (!user) return;

        try {
            setIsResending(true);
            setLastError(null);
            await sendEmailVerification(user);
            setCountdown(60); // 60 second cooldown
            setRetryCount(0); // Reset retry count on success
            await hapticSuccess();
            ToastService.success('Please check your email and click the verification link.');
        } catch (error) {
            console.error('Error sending verification email:', error);

            // Handle specific Firebase errors
            if (error.code === 'auth/too-many-requests') {
                setCountdown(60); // Set cooldown even on error
                ToastService.warning('Please wait a moment before requesting another verification email. You can try again in 60 seconds.');
                await hapticError();
            } else if (error.code === 'auth/user-not-found') {
                ToastService.error('Please log in again to verify your account.');
                await hapticError();
            } else if (error.code === 'auth/network-request-failed') {
                setLastError(error.code);
                setRetryCount(prev => prev + 1);

                if (retryCount < 3) {
                    ToastService.warning(`Connection failed. Retrying... (${retryCount + 1}/3)`);
                    // Auto-retry after 2 seconds
                    setTimeout(() => {
                        sendVerificationEmail();
                    }, 2000);
                } else {
                    ToastService.error('Please check your internet connection and try again.');
                }
                await hapticError();
            } else if (error.code === 'auth/invalid-user') {
                ToastService.error('Please log in again to verify your account.');
                await hapticError();
            } else {
                const errorMessage = ErrorHandler.getErrorMessage(error);
                ToastService.error(errorMessage);
                await hapticError();
            }
        } finally {
            setIsResending(false);
        }
    };

    // Open email app
    const openEmailApp = () => {
        hapticMedium();
        Linking.openURL('mailto:');
    };

    // Refresh verification status
    const refreshVerificationStatus = async () => {
        try {
            setIsLoading(true);
            await checkVerificationStatus();

            // If not verified after check, show alert
            if (!isVerified) {
                await hapticWarning();
                ToastService.warning('Please check your email and click the verification link, then try again.');
            } else {
                // If verified, update Firestore (this will be handled in checkVerificationStatus)
                await hapticSuccess();
            }
        } catch (error) {
            console.error('Error refreshing verification status:', error);

            // Handle specific errors
            if (error.code === 'auth/network-request-failed') {
                ToastService.error('Please check your internet connection and try again.');
            } else if (error.code === 'auth/user-not-found') {
                ToastService.error('Please log in again to verify your account.');
            } else if (error.code === 'auth/too-many-requests') {
                ToastService.warning('Please wait a moment before checking again.');
            } else {
                ToastService.error('Failed to check verification status. Please try again.');
            }
            await hapticError();
        } finally {
            setIsLoading(false);
        }
    };

    // Handle back navigation
    const handleBackPress = () => {
        hapticLight();
        ToastService.warning(t('emailVerification.mustVerifyEmail'));
        // For now, we'll just show a warning. In a real app, you might want to add a confirmation modal
        // or use a different approach for destructive actions
    };

    return (
        <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackPress}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.logoContainer}>
                        <Ionicons name="mail" size={50} color="#FFD700" />
                    </View>

                    <Text style={styles.title}>{t('emailVerification.verifyEmail')}</Text>
                    <Text style={styles.subtitle}>
                        {t('emailVerification.verificationSent')}{'\n'}
                        <Text style={styles.emailText}>{user?.email}</Text>
                    </Text>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    <View style={styles.verificationCard}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="mail-unread" size={40} color="#FFD700" />
                        </View>

                        <Text style={styles.cardTitle}>{t('emailVerification.checkEmail')}</Text>
                        <Text style={styles.cardDescription}>
                            {t('emailVerification.checkEmailDescription')}
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
                            onPress={refreshVerificationStatus}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="refresh" size={18} color="#000" />
                                    <Text style={styles.primaryButtonText}>{t('emailVerification.iveVerifiedEmail')}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={openEmailApp}
                        >
                            <Ionicons name="mail-open" size={18} color="#FFD700" />
                            <Text style={styles.secondaryButtonText}>{t('emailVerification.openEmailApp')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.resendButton,
                                (isResending || countdown > 0) && { opacity: 0.5 }
                            ]}
                            onPress={sendVerificationEmail}
                            disabled={isResending || countdown > 0}
                        >
                            {isResending ? (
                                <ActivityIndicator color="#FFD700" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="send" size={18} color="#FFD700" />
                                    <Text style={styles.resendButtonText}>
                                        {countdown > 0
                                            ? t('emailVerification.resendInSeconds', { seconds: countdown })
                                            : t('emailVerification.resendEmail')
                                        }
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Compact Help Section */}
                    {lastError && (
                        <View style={styles.errorInfo}>
                            <Ionicons name="warning" size={16} color="#ff4444" />
                            <Text style={styles.errorInfoText}>
                                {lastError === 'auth/too-many-requests' ? t('emailVerification.tooManyRequests') :
                                    lastError === 'auth/network-request-failed' ? t('emailVerification.networkError') :
                                        lastError === 'auth/user-not-found' ? t('emailVerification.userNotFound') : t('emailVerification.unknownError')}
                            </Text>
                        </View>
                    )}

                    <View style={styles.helpSection}>
                        <Text style={styles.helpText}>
                            {t('emailVerification.helpText')}
                        </Text>
                    </View>
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
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
    },
    emailText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 18,
    },
    mainContent: {
        flex: 1,
    },
    verificationCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#444',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    cardDescription: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 0,
    },
    stepsContainer: {
        marginTop: 20,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    stepNumberText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    stepText: {
        color: '#fff',
        fontSize: 16,
        flex: 1,
        fontWeight: '500',
    },
    actionButtons: {
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    secondaryButtonText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    resendButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#555',
    },
    resendButtonText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    helpSection: {
        backgroundColor: 'transparent',
        borderRadius: 10,
        padding: 15,
        borderWidth: 0,
    },
    helpText: {
        color: '#888',
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'center',
    },
    errorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 68, 68, 0.3)',
    },
    errorInfoText: {
        color: '#ff4444',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },
});

export default EmailVerificationScreen; 