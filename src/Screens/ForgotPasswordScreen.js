import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    ScrollView,
    ActivityIndicator,
    Platform,
    Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet';
import { auth, db } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import ErrorHandler from '../utils/ErrorHandler';

const ForgotPasswordScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    // Check if user is already authenticated
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // Check if email is verified before redirecting to main app
                if (user.emailVerified) {
                    navigation.replace('Main');
                } else {
                    // User is authenticated but email is not verified
                    navigation.replace('EmailVerification');
                }
            }
        });

        return () => unsubscribe();
    }, [navigation]);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailExists, setEmailExists] = useState(null);
    const [checkAttempts, setCheckAttempts] = useState(0);
    const errorTimeoutRef = useRef(null);

    // Bottom sheet refs and snap points
    const bottomSheetModalRef = useRef(null);
    const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

    // Validation functions
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    // Check if email exists in Firestore
    const checkEmailExists = async (email) => {
        if (!email || !validateEmail(email)) {
            setEmailExists(null);
            return;
        }

        // Rate limiting: max 10 checks per session
        if (checkAttempts >= 10) {
            setGeneralError('Too many email checks. Please try again later.');
            return;
        }

        setIsCheckingEmail(true);
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email.toLowerCase()));
            const querySnapshot = await getDocs(q);

            const exists = !querySnapshot.empty;
            setEmailExists(exists);
            setCheckAttempts(prev => prev + 1);
        } catch (error) {
            console.error("Error checking email existence:", error);
            setEmailExists(null);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    // Enhanced error handling with security features
    const triggerError = (field, message) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate(50);
        setErrors((prev) => ({ ...prev, [field]: message }));
        setGeneralError('');

        setIsButtonDisabled(true);

        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }

        errorTimeoutRef.current = setTimeout(() => {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
            setIsButtonDisabled(false);
            errorTimeoutRef.current = null;
        }, 5000);
    };

    // Debounced email existence check
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (email && validateEmail(email)) {
                checkEmailExists(email);
            } else {
                setEmailExists(null);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [email]);

    // Input change handlers
    const handleEmailChange = (text) => {
        setEmail(text);
        setGeneralError('');
        setSuccessMessage('');
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: '' }));
        }
    };

    // Bottom sheet handlers
    const handlePresentModalPress = useCallback(() => {
        bottomSheetModalRef.current?.present();
    }, []);

    const handleDismiss = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();
    }, []);

    // Handle password reset
    const handleResetPassword = async () => {
        if (isButtonDisabled) return;

        setErrors({});
        setGeneralError('');
        setSuccessMessage('');

        if (!email.trim()) {
            triggerError("email", "Email is required");
            return;
        }

        if (!validateEmail(email)) {
            triggerError("email", "Invalid email format");
            return;
        }

        // Check if email exists in our data
        if (emailExists === false) {
            triggerError("email", "No account found with this email address");
            return;
        }

        if (emailExists === null && email.length > 0) {
            triggerError("email", "Please wait while we verify your email");
            return;
        }

        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, email.trim().toLowerCase());

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSuccessMessage('Password reset email sent! Check your inbox and spam folder.');

            // Clear form after success
            setEmail('');
            setEmailExists(null);

        } catch (error) {
            let errorMessage = "Failed to send reset email. Please try again.";
            switch (error.code) {
                case "auth/user-not-found":
                    errorMessage = "No account found with this email address";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Invalid email address";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Too many attempts. Try again later";
                    break;
                case "auth/network-request-failed":
                    errorMessage = "Network error. Check your connection";
                    break;
            }
            triggerError("general", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <BottomSheetModalProvider>
            <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.goBack();
                                }}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.infoButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    handlePresentModalPress();
                                }}
                            >
                                <Ionicons name="information-circle" size={24} color="#FFD700" />
                            </TouchableOpacity>

                            <View style={styles.logoContainer}>
                                <Ionicons name="lock-open" size={50} color="#FFD700" />
                            </View>
                            <Text style={styles.title}>{t('forgotPassword.resetPassword')}</Text>
                            <Text style={styles.subtitle}>{t('forgotPassword.enterEmailToReset')}</Text>
                        </View>

                        {/* Success Message */}
                        {successMessage ? (
                            <View style={styles.successContainer}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={styles.successText}>{successMessage}</Text>
                            </View>
                        ) : null}

                        {/* General Error Message */}
                        {generalError ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#ff4444" />
                                <Text style={styles.generalErrorText}>{generalError}</Text>
                            </View>
                        ) : null}

                        <View style={styles.formContainer}>
                            {/* Email Field */}
                            <View style={[
                                styles.inputContainer,
                                errors.email ? { borderColor: '#ff4444' } :
                                    emailExists === true ? { borderColor: '#4CAF50' } :
                                        emailExists === false ? { borderColor: '#ff4444' } : {}
                            ]}>
                                <Ionicons
                                    name="mail"
                                    size={20}
                                    color={
                                        errors.email ? '#ff4444' :
                                            emailExists === true ? '#4CAF50' :
                                                emailExists === false ? '#ff4444' : "#888"
                                    }
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('forgotPassword.emailPlaceholder')}
                                    placeholderTextColor="#888"
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                                {isCheckingEmail && (
                                    <ActivityIndicator size="small" color="#FFD700" style={styles.availabilityIndicator} />
                                )}
                            </View>
                            {errors.email ? (
                                <Text style={styles.errorText}>{errors.email}</Text>
                            ) : emailExists === true ? (
                                <Text style={styles.successText}>{t('forgotPassword.emailFound')}</Text>
                            ) : emailExists === false ? (
                                <Text style={styles.errorText}>{t('forgotPassword.emailNotFound')}</Text>
                            ) : null}

                            <TouchableOpacity
                                style={[
                                    styles.resetButton,
                                    (isLoading || isButtonDisabled) && { opacity: 0.7 }
                                ]}
                                onPress={handleResetPassword}
                                disabled={isLoading || isButtonDisabled}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#000" size="small" />
                                ) : (
                                    <Text style={styles.resetButtonText}>{t('forgotPassword.sendResetLink')}</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.infoContainer}>
                                <Text style={styles.infoText}>
                                    {t('forgotPassword.infoText')}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.backToLoginButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.goBack();
                                }}
                                disabled={isLoading}
                            >
                                <Text style={styles.backToLoginButtonText}>{t('forgotPassword.backToLogin')}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Sheet Modal */}
                <BottomSheetModal
                    ref={bottomSheetModalRef}
                    index={1}
                    snapPoints={snapPoints}
                    backgroundStyle={styles.bottomSheetBackground}
                    handleIndicatorStyle={styles.bottomSheetIndicator}
                >
                    <BottomSheetView style={styles.bottomSheetContent}>
                        <Text style={styles.bottomSheetTitle}>{t('forgotPassword.passwordResetGuide')}</Text>

                        <View style={styles.infoSection}>
                            <Text style={styles.infoSectionTitle}>{t('forgotPassword.howItWorks')}</Text>
                            <View style={styles.infoItem}>
                                <Ionicons name="mail" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>{t('forgotPassword.enterEmailAssociated')}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="link" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>{t('forgotPassword.sendSecureResetLink')}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="lock-closed" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>{t('forgotPassword.clickLinkToCreatePassword')}</Text>
                            </View>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.infoSectionTitle}>{t('forgotPassword.importantNotes')}</Text>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.infoText}>{t('forgotPassword.checkSpamFolder')}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.infoText}>{t('forgotPassword.resetLinkExpires')}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.infoText}>{t('forgotPassword.requestNewLink')}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>{t('forgotPassword.verifyEmailBeforeSending')}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleDismiss}
                        >
                            <Text style={styles.closeButtonText}>{t('forgotPassword.gotIt')}</Text>
                        </TouchableOpacity>
                    </BottomSheetView>
                </BottomSheetModal>
            </LinearGradient>
        </BottomSheetModalProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 10,
    },
    infoButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 10,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    successText: {
        color: '#4CAF50',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ff4444',
    },
    generalErrorText: {
        color: '#ff4444',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        marginBottom: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#444',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 50,
        color: '#fff',
        fontSize: 16,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 4,
    },
    successText: {
        color: '#4CAF50',
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 4,
    },
    availabilityIndicator: {
        marginRight: 8,
    },
    resetButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        minHeight: 50,
        justifyContent: 'center',
    },
    resetButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoContainer: {
        marginTop: 20,
        paddingHorizontal: 10,
    },
    infoText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    backToLoginButton: {
        alignItems: 'center',
        marginTop: 30,
    },
    backToLoginButtonText: {
        color: '#FFD700',
        fontSize: 16,
    },
    // Bottom Sheet Modal Styles
    bottomSheetBackground: {
        backgroundColor: '#2a2a2a',
    },
    bottomSheetIndicator: {
        backgroundColor: '#666',
    },
    bottomSheetContent: {
        padding: 20,
    },
    bottomSheetTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    infoSection: {
        marginBottom: 24,
    },
    infoSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    closeButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    closeButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ForgotPasswordScreen; 