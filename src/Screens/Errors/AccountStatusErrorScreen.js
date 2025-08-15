import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import AccountStatusService from '../../services/AccountStatusService';

const AccountStatusErrorScreen = ({ navigation, route }) => {
    const { t } = useTranslation();
    const [statusDetails, setStatusDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const [checkAgainStatus, setCheckAgainStatus] = useState({ canCheck: true, remainingAttempts: 5, disabledUntil: null });
    const [checkAgainCountdown, setCheckAgainCountdown] = useState(0);

    // Get user ID from route params or current auth
    const userId = route?.params?.userId || auth.currentUser?.uid;

    useEffect(() => {
        loadStatusDetails();
    }, []);

    // Countdown timer for lockout duration
    useEffect(() => {
        let timer;
        if (statusDetails?.remainingTime && statusDetails.remainingTime > 0) {
            setCountdown(Math.ceil(statusDetails.remainingTime / 1000));

            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        // Countdown finished, reload status
                        loadStatusDetails();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [statusDetails?.remainingTime]);

    // Check "Check Again" button status
    useEffect(() => {
        const checkCheckAgainStatus = async () => {
            if (userId) {
                const status = await AccountStatusService.canCheckAgain(userId);
                setCheckAgainStatus(status);

                if (status.disabledUntil) {
                    const remainingTime = Math.ceil((status.disabledUntil.getTime() - Date.now()) / 1000);
                    setCheckAgainCountdown(Math.max(0, remainingTime));
                }
            }
        };

        checkCheckAgainStatus();
    }, [userId]);

    // Countdown timer for "Check Again" button
    useEffect(() => {
        let timer;
        if (checkAgainCountdown > 0) {
            timer = setInterval(() => {
                setCheckAgainCountdown(prev => {
                    if (prev <= 1) {
                        // Countdown finished, check status again
                        const checkStatus = async () => {
                            if (userId) {
                                const status = await AccountStatusService.canCheckAgain(userId);
                                setCheckAgainStatus(status);
                            }
                        };
                        checkStatus();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [checkAgainCountdown, userId]);

    const loadStatusDetails = async () => {
        try {
            setIsLoading(true);
            if (userId) {
                const details = await AccountStatusService.getAccountStatusDetails(userId);
                const lockoutStatus = await AccountStatusService.getLockoutStatus(userId);

                // Enhance details with lockout information
                if (lockoutStatus.isLocked && lockoutStatus.remainingTime > 0) {
                    const minutesRemaining = Math.ceil(lockoutStatus.remainingTime / 60000);
                    details.message = `Account temporarily locked due to ${lockoutStatus.failedAttempts} failed login attempts. Try again in ${minutesRemaining} minutes.`;
                    details.remainingTime = lockoutStatus.remainingTime;
                    details.failedAttempts = lockoutStatus.failedAttempts;
                    details.maxAttempts = lockoutStatus.maxAttempts;
                }

                setStatusDetails(details);
            }
        } catch (error) {
            console.error('Error loading status details:', error);
            // Set default details if error occurs
            setStatusDetails({
                title: t('errors.accountStatus.statusUnknown'),
                message: t('errors.accountStatus.statusUnknownMessage'),
                icon: 'help-circle',
                color: '#6B7280',
                action: 'contact_support'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    const handleContactSupport = () => {
        // You can customize this to open email, phone, or navigate to support screen
        Alert.alert(
            'Contact Support',
            'Please contact our support team:\n\nEmail: support@rawapp.com\nPhone: +1-800-RAW-HELP\n\nOr visit our website for more information.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Email',
                    onPress: () => {
                        Linking.openURL('mailto:support@rawapp.com?subject=Account Status Issue');
                    }
                },
                {
                    text: 'Visit Website',
                    onPress: () => {
                        Linking.openURL('https://rawapp.com/support');
                    }
                }
            ]
        );
    };

    const handleTryAgain = async () => {
        try {
            // Check if button is disabled due to spam protection
            if (!checkAgainStatus.canCheck) {
                Alert.alert('Rate Limit Exceeded', 'You have exceeded the maximum check attempts. Please wait before trying again.');
                return;
            }

            setIsLoading(true);

            // Record this attempt
            if (userId) {
                const attemptResult = await AccountStatusService.recordCheckAgainAttempt(userId);
                setCheckAgainStatus(attemptResult);

                if (!attemptResult.canCheck) {
                    // Update countdown for disabled state
                    const remainingTime = Math.ceil((checkAgainStatus.disabledUntil?.getTime() - Date.now()) / 1000);
                    setCheckAgainCountdown(Math.max(0, remainingTime));
                }
            }

            if (userId) {
                const accessCheck = await AccountStatusService.canUserAccess(userId);
                if (accessCheck.canAccess) {
                    // Account is now active, navigate to main app
                    navigation.replace('Main');
                } else {
                    // Still disabled/locked, reload details
                    await loadStatusDetails();
                }
            }
        } catch (error) {
            console.error('Error checking account status again:', error);
            Alert.alert('Error', 'Failed to check account status. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <Ionicons name="refresh" size={64} color="#6B7280" />
                    <Text style={styles.title}>{t('errors.accountStatus.checkingStatus')}</Text>
                    <Text style={styles.message}>{t('errors.accountStatus.checkingStatusMessage')}</Text>
                </View>
            </View>
        );
    }

    if (!statusDetails) {
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <Ionicons name="alert-circle" size={64} color="#6B7280" />
                    <Text style={styles.title}>Status Unknown</Text>
                    <Text style={styles.message}>Unable to determine account status. Please try again or contact support.</Text>
                    <TouchableOpacity style={styles.button} onPress={handleTryAgain}>
                        <Text style={styles.buttonText}>{t('common.retry')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleSignOut}>
                        <Text style={styles.buttonText}>{t('common.logout')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Ionicons
                    name={statusDetails.icon}
                    size={64}
                    color={statusDetails.color}
                />
                <Text style={[styles.title, { color: statusDetails.color }]}>
                    {statusDetails.title}
                </Text>
                <Text style={styles.message}>
                    {statusDetails.message}
                </Text>

                {/* Countdown timer for lockout */}
                {countdown > 0 && (
                    <View style={styles.countdownContainer}>
                        <Text style={styles.countdownText}>
                            Unlocks in: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                        </Text>
                    </View>
                )}

                {statusDetails.action === 'contact_support' && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: statusDetails.color }]}
                        onPress={handleContactSupport}
                    >
                        <Text style={styles.buttonText}>{t('errors.accountStatus.contactSupport')}</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.secondaryButton,
                        !checkAgainStatus.canCheck && styles.disabledButton
                    ]}
                    onPress={handleTryAgain}
                    disabled={!checkAgainStatus.canCheck}
                >
                    <Text style={[
                        styles.secondaryButtonText,
                        !checkAgainStatus.canCheck && styles.disabledButtonText
                    ]}>
                        {checkAgainStatus.canCheck
                            ? `${t('errors.accountStatus.checkAgain')} (${checkAgainStatus.remainingAttempts} left)`
                            : `Rate Limited - Try again in ${Math.floor(checkAgainCountdown / 60)}:${(checkAgainCountdown % 60).toString().padStart(2, '0')}`
                        }
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.tertiaryButton]}
                    onPress={handleSignOut}
                >
                    <Text style={styles.tertiaryButtonText}>{t('common.logout')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 350,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginBottom: 12,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#6B7280',
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tertiaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    tertiaryButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: 'bold',
    },
    countdownContainer: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    countdownText: {
        color: '#F59E0B',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    disabledButton: {
        backgroundColor: '#D1D5DB',
        opacity: 0.6,
    },
    disabledButtonText: {
        color: '#6B7280',
    },
});

export default AccountStatusErrorScreen;
