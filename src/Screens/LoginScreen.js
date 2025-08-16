import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, updateDoc, serverTimestamp, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import ErrorHandler from '../utils/ErrorHandler';
import BiometricService from '../services/BiometricService';
import SecurityService from '../services/SecurityService';
import SocialAuthService from '../services/SocialAuthService';
import { hapticMedium, hapticSuccess, hapticError, hapticLight } from '../utils/HapticUtils';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import * as Constants from 'expo-constants';
import * as Application from 'expo-application';
import ToastService from '../utils/ToastService';
import AccountStatusService from '../services/AccountStatusService';

const LoginScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [buttonCooldown, setButtonCooldown] = useState(0);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [lastLoginEmail, setLastLoginEmail] = useState('');

    // Cooldown timer effect
    useEffect(() => {
        let timer;
        if (buttonCooldown > 0) {
            timer = setTimeout(() => setButtonCooldown(buttonCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [buttonCooldown]);

    // Initialize biometric authentication
    useEffect(() => {
        initializeBiometric();
        loadLastLoginEmail();
    }, []);

    // Initialize biometric authentication
    const initializeBiometric = async () => {
        try {
            const biometricStatus = await BiometricService.checkBiometricAvailability();
            setBiometricAvailable(biometricStatus.isAvailable);
        } catch (error) {
            console.error('Error initializing biometric:', error);
            setBiometricAvailable(false);
        }
    };

    // Load last login email from storage
    const loadLastLoginEmail = async () => {
        try {
            const email = await AsyncStorage.getItem('lastLoginEmail');
            if (email) {
                setLastLoginEmail(email);
            }
        } catch (error) {
            console.error('Error loading last login email:', error);
        }
    };

    // Get user-friendly Firebase error messages
    const getFirebaseErrorMessage = (error) => {
        if (!error || !error.code) {
            return t('errors.generic');
        }

        // Map Firebase error codes to user-friendly messages
        const errorMessages = {
            'auth/invalid-credential': t('errors.firebase.invalidCredential'),
            'auth/user-not-found': t('errors.firebase.userNotFound'),
            'auth/wrong-password': t('errors.firebase.wrongPassword'),
            'auth/email-already-in-use': t('errors.firebase.emailInUse'),
            'auth/weak-password': t('errors.firebase.weakPassword'),
            'auth/invalid-email': t('errors.firebase.invalidEmail'),
            'auth/user-disabled': t('errors.firebase.userDisabled'),
            'auth/too-many-requests': t('errors.firebase.tooManyRequests'),
            'auth/network-request-failed': t('errors.firebase.networkFailed'),
            'auth/operation-not-allowed': t('errors.firebase.operationNotAllowed'),
            'auth/account-exists-with-different-credential': t('errors.firebase.accountExists'),
            'auth/requires-recent-login': t('errors.firebase.requiresRecentLogin'),
            'auth/invalid-verification-code': t('errors.firebase.invalidVerificationCode'),
            'auth/invalid-verification-id': t('errors.firebase.invalidVerificationId'),
            'auth/quota-exceeded': t('errors.firebase.quotaExceeded'),
            'auth/credential-already-in-use': t('errors.firebase.credentialInUse'),
            'auth/timeout': t('errors.firebase.timeout'),
            'auth/cancelled-popup-request': t('errors.firebase.cancelledPopup'),
            'auth/popup-closed-by-user': t('errors.firebase.popupClosed'),
            'auth/popup-blocked': t('errors.firebase.popupBlocked'),
            'auth/unauthorized-domain': t('errors.firebase.unauthorizedDomain'),
            'auth/unsupported-persistence-type': t('errors.firebase.unsupportedPersistence'),
            'auth/invalid-persistence-type': t('errors.firebase.invalidPersistence'),
            'auth/invalid-tenant-id': t('errors.firebase.invalidTenantId'),
            'auth/unsupported-tenant-operation': t('errors.firebase.unsupportedTenantOperation'),
            'auth/invalid-dynamic-link-domain': t('errors.firebase.invalidDynamicLink'),
            'auth/duplicate-credential': t('errors.firebase.duplicateCredential'),
            'auth/maximum-second-factor-count-exceeded': t('errors.firebase.maxSecondFactors'),
            'auth/second-factor-already-in-use': t('errors.firebase.secondFactorInUse'),
            'auth/tenant-id-mismatch': t('errors.firebase.tenantIdMismatch'),
            'auth/unsupported-first-factor': t('errors.firebase.unsupportedFirstFactor'),
            'auth/email-change-needs-verification': t('errors.firebase.emailChangeVerification'),
            'auth/missing-or-invalid-nonce': t('errors.firebase.invalidNonce'),
            'auth/invalid-app-credential': t('errors.firebase.invalidAppCredential'),
            'auth/invalid-app-id': t('errors.firebase.invalidAppId'),
            'auth/invalid-user-token': t('errors.firebase.invalidUserToken'),
            'auth/not-authorized': t('errors.firebase.notAuthorized'),
            'auth/argument-error': t('errors.firebase.argumentError'),
            'auth/invalid-api-key': t('errors.firebase.invalidApiKey'),
        };

        return errorMessages[error.code] || t('errors.generic');
    };



    // Get comprehensive device information
    const getDeviceInfo = async () => {
        try {
            // Generate a unique device identifier using available device properties
            const deviceId = `${Device.deviceName || 'unknown'}-${Device.osName || 'unknown'}-${Device.modelName || 'unknown'}-${Application.applicationId || 'unknown'}`;

            const deviceInfo = {
                deviceId: deviceId,
                deviceName: Device.deviceName || 'Unknown Device',
                deviceType: Device.deviceType || 'unknown',
                osName: Device.osName || 'Unknown OS',
                osVersion: Device.osVersion || 'Unknown',
                osBuildId: Device.osBuildId || 'Unknown',
                osInternalBuildId: Device.osInternalBuildId || 'Unknown',
                deviceYearClass: Device.deviceYearClass || 'Unknown',
                totalMemory: Device.totalMemory || 'Unknown',
                supportedCpuArchitectures: Device.supportedCpuArchitectures || [],
                brand: Device.brand || 'Unknown',
                manufacturer: Device.manufacturer || 'Unknown',
                modelName: Device.modelName || 'Unknown Model',
                modelId: Device.modelId || 'Unknown',
                designName: Device.designName || 'Unknown',
                productName: Device.productName || 'Unknown',
                platformApiLevel: Device.platformApiLevel || 'Unknown',
                appVersion: Constants.expoConfig?.version || '1.0.0',
                appBuildVersion: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
                bundleIdentifier: Application.applicationId || 'Unknown',
                appName: Application.applicationName || 'Unknown App',
                timestamp: new Date().toISOString(),
            };

            // Get network information
            try {
                const networkState = await Network.getNetworkStateAsync();
                deviceInfo.networkType = networkState.type;
                deviceInfo.isConnected = networkState.isConnected;
                deviceInfo.isInternetReachable = networkState.isInternetReachable;
            } catch (error) {
                console.log('Network info error:', error);
                deviceInfo.networkType = 'unknown';
                deviceInfo.isConnected = false;
                deviceInfo.isInternetReachable = false;
            }

            // Get location information (if permission granted)
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    deviceInfo.location = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy,
                        altitude: location.coords.altitude,
                        heading: location.coords.heading,
                        speed: location.coords.speed,
                    };
                }
            } catch (error) {
                console.log('Location error:', error);
            }

            return deviceInfo;
        } catch (error) {
            console.error('Error getting device info:', error);
            return {
                deviceId: 'unknown',
                timestamp: new Date().toISOString(),
            };
        }
    };

    // Validate email on change
    const handleEmailChange = (text) => {
        setEmail(text);
        setGeneralError('');
        if (text && !ErrorHandler.validateEmail(text)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    // Validate password on change
    const handlePasswordChange = (text) => {
        setPassword(text);
        setGeneralError('');
        if (text && text.length < 6) {
            setPasswordError('Password must be at least 6 characters');
        } else {
            setPasswordError('');
        }
    };

    // Handle login with comprehensive error handling
    const handleLogin = async () => {
        // Prevent multiple clicks
        if (buttonDisabled) return;

        try {
            // Disable button and start cooldown
            setButtonDisabled(true);
            setButtonCooldown(5);

            // Clear previous errors
            setEmailError('');
            setPasswordError('');
            setGeneralError('');

            // Validate all required fields and set individual errors
            const newErrors = {};
            let hasErrors = false;

            if (!email.trim()) {
                newErrors.email = 'Email is required';
                hasErrors = true;
            }

            if (!password.trim()) {
                newErrors.password = 'Password is required';
                hasErrors = true;
            }

            if (hasErrors) {
                setEmailError(newErrors.email || '');
                setPasswordError(newErrors.password || '');
                await hapticError();
                // Re-enable button on validation error
                setButtonDisabled(false);
                setButtonCooldown(0);
                return;
            }

            // Validate email format
            if (!ErrorHandler.validateEmail(email)) {
                setEmailError('Please enter a valid email address');
                await hapticError();
                // Re-enable button on validation error
                setButtonDisabled(false);
                setButtonCooldown(0);
                return;
            }

            // Validate password length
            if (password.length < 6) {
                setPasswordError('Password must be at least 6 characters');
                await hapticError();
                // Re-enable button on validation error
                setButtonDisabled(false);
                setButtonCooldown(0);
                return;
            }

            setIsLoading(true);

            // Get device information
            let deviceInfo;
            try {
                deviceInfo = await getDeviceInfo();
            } catch (error) {
                console.error('Error getting device info:', error);
                deviceInfo = {
                    deviceId: 'unknown',
                    timestamp: new Date().toISOString(),
                };
            }

            // Attempt login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Reset failed login attempts on successful login
            try {
                await AccountStatusService.resetFailedLoginAttempts(user.uid);
            } catch (resetError) {
                console.error('Error resetting failed attempts:', resetError);
                // Continue with login even if reset fails
            }

            // Update user document with device info and login data
            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    lastSeen: serverTimestamp(),
                    isActive: true,
                    lastLoginDevice: deviceInfo,
                    loginHistory: serverTimestamp(),
                    totalLogins: serverTimestamp(), // This will be incremented by Firestore
                });
            } catch (error) {
                console.error('Error updating user document:', error);
                // Continue with login even if document update fails
            }

            // Store credentials for biometric login if available
            if (biometricAvailable) {
                try {
                    await storeCredentials(email, password);
                    setLastLoginEmail(email);
                } catch (error) {
                    console.error('Error storing credentials:', error);
                    // Continue with login even if credential storage fails
                }
            }

            // Success haptic feedback
            await hapticSuccess();

            // Check if email is verified before navigating to main app
            if (user.emailVerified) {
                // Check account status (disabled/locked)
                try {
                    const accountStatus = await AccountStatusService.canUserAccess(user.uid);
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
            } else {
                // Navigate to email verification screen
                navigation.replace('EmailVerification');
            }

        } catch (error) {
            console.error('Login error:', error);

            // Record failed login attempt if user exists
            if (email) {
                try {
                    // Try to find user by email to record failed attempt
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('email', '==', email.toLowerCase()));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        const userId = userDoc.id;

                        // Record failed attempt
                        await AccountStatusService.recordFailedLoginAttempt(userId, {
                            deviceInfo: await getDeviceInfo(),
                            ipAddress: 'unknown', // Could be enhanced with actual IP
                            userAgent: 'React Native App'
                        });

                        // Check if account is now locked
                        const lockoutStatus = await AccountStatusService.getLockoutStatus(userId);
                        if (lockoutStatus.isLocked && lockoutStatus.remainingTime > 0) {
                            const minutesRemaining = Math.ceil(lockoutStatus.remainingTime / 60000);
                            setGeneralError(`Account temporarily locked due to too many failed attempts. Try again in ${minutesRemaining} minutes.`);
                        } else {
                            const errorMessage = getFirebaseErrorMessage(error);
                            setGeneralError(errorMessage);
                        }
                    } else {
                        const errorMessage = getFirebaseErrorMessage(error);
                        setGeneralError(errorMessage);
                    }
                } catch (recordError) {
                    console.error('Error recording failed attempt:', recordError);
                    const errorMessage = getFirebaseErrorMessage(error);
                    setGeneralError(errorMessage);
                }
            } else {
                const errorMessage = getFirebaseErrorMessage(error);
                setGeneralError(errorMessage);
            }

            await hapticError();
        } finally {
            setIsLoading(false);
            // Re-enable button after 5 seconds
            setTimeout(() => {
                setButtonDisabled(false);
                setButtonCooldown(0);
            }, 5000);
        }
    };



    // Handle biometric login
    const handleBiometricLogin = async () => {
        if (!biometricAvailable || !lastLoginEmail) {
            ToastService.warning('Biometric login is not available. Please log in with your password first.');
            return;
        }

        try {
            setBiometricLoading(true);
            await hapticMedium();

            // Authenticate with biometric
            const biometricResult = await BiometricService.authenticateWithBiometric('Log in to your account');

            if (!biometricResult.success) {
                throw new Error(biometricResult.error || 'Biometric authentication failed');
            }

            // Get stored credentials for the last login email
            const storedCredentials = await getStoredCredentials(lastLoginEmail);
            if (!storedCredentials) {
                throw new Error('No stored credentials found. Please log in with your password.');
            }

            // Attempt login with stored credentials
            const userCredential = await signInWithEmailAndPassword(auth, lastLoginEmail, storedCredentials.password);
            const user = userCredential.user;

            // Reset failed login attempts on successful biometric login
            try {
                await AccountStatusService.resetFailedLoginAttempts(user.uid);
            } catch (resetError) {
                console.error('Error resetting failed attempts:', resetError);
                // Continue with login even if reset fails
            }

            // Check if biometric is enabled for this user
            const biometricEnabled = await BiometricService.isBiometricEnabled(user.uid);
            if (!biometricEnabled) {
                throw new Error('Biometric login is not enabled for this account.');
            }

            // Update user document with device info and login data
            let deviceInfo;
            try {
                deviceInfo = await getDeviceInfo();
            } catch (error) {
                console.error('Error getting device info for biometric login:', error);
                deviceInfo = {
                    deviceId: 'unknown',
                    timestamp: new Date().toISOString(),
                };
            }

            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    lastSeen: serverTimestamp(),
                    isActive: true,
                    lastLoginDevice: deviceInfo,
                    lastBiometricLogin: serverTimestamp(),
                    loginHistory: serverTimestamp(),
                });
            } catch (error) {
                console.error('Error updating user document for biometric login:', error);
                // Continue with login even if document update fails
            }

            // Log security event
            try {
                await SecurityService.logSecurityEvent('biometric_login', {
                    timestamp: new Date(),
                    deviceInfo: deviceInfo
                });
            } catch (error) {
                console.error('Error logging security event:', error);
                // Continue with login even if logging fails
            }

            await hapticSuccess();

            // Check if email is verified before navigating to main app
            if (user.emailVerified) {
                // Check account status (disabled/locked)
                try {
                    const accountStatus = await AccountStatusService.canUserAccess(user.uid);
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
            } else {
                // Navigate to email verification screen
                navigation.replace('EmailVerification');
            }

        } catch (error) {
            console.error('Biometric login error:', error);
            let errorMessage = 'Biometric login failed';

            // Check if it's a Firebase auth error first
            if (error.code && error.code.startsWith('auth/')) {
                errorMessage = getFirebaseErrorMessage(error);
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Stored credentials are invalid. Please log in with your password.';
            } else if (error.message.includes('No stored credentials')) {
                errorMessage = 'No stored credentials found. Please log in with your password.';
            } else if (error.message.includes('Biometric login is not enabled')) {
                errorMessage = 'Biometric login is not enabled for this account.';
            } else if (error.message.includes('Biometric authentication failed')) {
                errorMessage = 'Biometric authentication failed. Please try again.';
            }

            setGeneralError(errorMessage);
            await hapticError();
        } finally {
            setBiometricLoading(false);
        }
    };

    // Get stored credentials for biometric login
    const getStoredCredentials = async (email) => {
        try {
            const credentials = await AsyncStorage.getItem(`credentials_${email}`);
            if (credentials) {
                return JSON.parse(credentials);
            }
            return null;
        } catch (error) {
            console.error('Error getting stored credentials:', error);
            return null;
        }
    };

    // Store credentials for biometric login
    const storeCredentials = async (email, password) => {
        try {
            const credentials = { email, password };
            await AsyncStorage.setItem(`credentials_${email}`, JSON.stringify(credentials));
            await AsyncStorage.setItem('lastLoginEmail', email);
        } catch (error) {
            console.error('Error storing credentials:', error);
        }
    };

    // Handle social login
    const handleSocialLogin = async (provider) => {
        if (buttonDisabled) return;

        try {
            setButtonDisabled(true);
            setButtonCooldown(5);
            setIsLoading(true);
            setGeneralError('');

            await hapticMedium();

            let result;
            if (provider === 'Google') {
                result = await SocialAuthService.signInWithGoogle();
            } else if (provider === 'Apple') {
                result = await SocialAuthService.signInWithApple();
            } else {
                throw new Error('Unsupported provider');
            }

            if (result.success) {
                await hapticSuccess();

                // Check account status for social login users
                try {
                    const user = auth.currentUser;
                    if (user) {
                        const accountStatus = await AccountStatusService.canUserAccess(user.uid);
                        if (accountStatus.canAccess) {
                            // Account is active, navigate to main app
                            navigation.replace('Main');
                        } else {
                            // Account is disabled or locked
                            navigation.replace('AccountStatusError');
                        }
                    } else {
                        // Fallback to main app if no user found
                        navigation.replace('Main');
                    }
                } catch (error) {
                    console.error('Error checking account status for social login:', error);
                    // On error, assume account status issue
                    navigation.replace('AccountStatusError');
                }
            }

        } catch (error) {
            console.error(`${provider} login error:`, error);
            let errorMessage = `${provider} login failed`;

            // Check if it's a Firebase auth error first
            if (error.code && error.code.startsWith('auth/')) {
                errorMessage = getFirebaseErrorMessage(error);
            } else if (error.message.includes('cancelled')) {
                errorMessage = `${provider} login was cancelled`;
            } else if (error.message.includes('not available')) {
                errorMessage = `${provider} login is not available on this device`;
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection';
            } else {
                errorMessage = error.message || `${provider} login failed. Please try again.`;
            }

            setGeneralError(errorMessage);
            await hapticError();
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                setButtonDisabled(false);
                setButtonCooldown(0);
            }, 5000);
        }
    };

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={styles.container}
        >
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    {/* Logo and Title */}
                    <View style={styles.header}>
                        <View style={[styles.logoContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.accent }]}>
                            <Ionicons name="diamond" size={48} color={theme.colors.accent} />
                        </View>
                        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t('login.welcomeBack')}</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                            {t('login.signInToContinue')}
                        </Text>
                    </View>

                    {/* General Error Message */}
                    {generalError ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#ff4444" />
                            <Text style={styles.generalErrorText}>{generalError}</Text>
                        </View>
                    ) : null}

                    {/* Login Form */}
                    <View style={styles.form}>
                        <View style={[
                            styles.inputContainer,
                            { backgroundColor: theme.colors.card, borderColor: emailError ? '#ff4444' : theme.colors.border }
                        ]}>
                            <Ionicons name="mail" size={20} color={emailError ? '#ff4444' : theme.colors.textTertiary} />
                            <TextInput
                                style={[styles.input, { color: theme.colors.textPrimary }]}
                                placeholder={t('login.emailPlaceholder')}
                                placeholderTextColor={theme.colors.textTertiary}
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>
                        {emailError ? (
                            <Text style={styles.errorText}>{emailError}</Text>
                        ) : null}

                        <View style={[
                            styles.inputContainer,
                            { backgroundColor: theme.colors.card, borderColor: passwordError ? '#ff4444' : theme.colors.border }
                        ]}>
                            <Ionicons name="lock-closed" size={20} color={passwordError ? '#ff4444' : theme.colors.textTertiary} />
                            <TextInput
                                style={[styles.input, { color: theme.colors.textPrimary }]}
                                placeholder={t('login.passwordPlaceholder')}
                                placeholderTextColor={theme.colors.textTertiary}
                                value={password}
                                onChangeText={handlePasswordChange}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    setShowPassword(!showPassword);
                                    hapticLight();
                                }}
                                style={styles.eyeButton}
                                disabled={isLoading}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color={theme.colors.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                        {passwordError ? (
                            <Text style={styles.errorText}>{passwordError}</Text>
                        ) : null}

                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={() => {
                                hapticLight();
                                navigation.navigate('ForgotPassword');
                            }}
                            disabled={isLoading}
                        >
                            <Text style={[styles.forgotPasswordText, { color: theme.colors.accent }]}>
                                {t('login.forgotPassword')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.loginButton,
                                { backgroundColor: theme.colors.accent },
                                (isLoading || buttonDisabled) && { opacity: 0.7 }
                            ]}
                            onPress={handleLogin}
                            disabled={isLoading || buttonDisabled}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={theme.colors.primary} size="small" />
                            ) : buttonCooldown > 0 ? (
                                <Text style={[styles.loginButtonText, { color: theme.colors.primary }]}>
                                    {t('login.waitSeconds', { seconds: buttonCooldown })}
                                </Text>
                            ) : (
                                <Text style={[styles.loginButtonText, { color: theme.colors.primary }]}>
                                    {t('login.signIn')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Biometric Login Button */}
                        {biometricAvailable && lastLoginEmail && (
                            <TouchableOpacity
                                style={[
                                    styles.biometricButton,
                                    { backgroundColor: theme.colors.card, borderColor: theme.colors.accent },
                                    biometricLoading && { opacity: 0.7 }
                                ]}
                                onPress={handleBiometricLogin}
                                disabled={biometricLoading || isLoading}
                            >
                                {biometricLoading ? (
                                    <ActivityIndicator color={theme.colors.accent} size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="finger-print" size={20} color={theme.colors.accent} />
                                        <Text style={[styles.biometricButtonText, { color: theme.colors.accent }]}>
                                            {t('login.signInWithBiometric', { types: BiometricService.getAvailableBiometricTypes().join(' or ') })}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                        <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>{t('login.or')}</Text>
                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    </View>

                    {/* Social Login */}
                    <View style={styles.socialLogin}>
                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                            onPress={() => handleSocialLogin('Google')}
                            disabled={isLoading}
                        >
                            <Ionicons name="logo-google" size={24} color={theme.colors.textPrimary} />
                            <Text style={[styles.socialButtonText, { color: theme.colors.textPrimary }]}>{t('login.google')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                            onPress={() => handleSocialLogin('Apple')}
                            disabled={isLoading}
                        >
                            <Ionicons name="logo-apple" size={24} color={theme.colors.textPrimary} />
                            <Text style={[styles.socialButtonText, { color: theme.colors.textPrimary }]}>{t('login.apple')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sign Up Link */}
                    <View style={styles.signUpContainer}>
                        <Text style={[styles.signUpText, { color: theme.colors.textSecondary }]}>
                            {t('login.dontHaveAccount')}{' '}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                hapticLight();
                                navigation.navigate('Register');
                            }}
                            disabled={isLoading}
                        >
                            <Text style={[styles.signUpLink, { color: theme.colors.accent }]}>{t('login.signUp')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
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
        shadowColor: '#ff4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    generalErrorText: {
        color: '#ff4444',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    form: {
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        width: '100%',
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
    },
    eyeButton: {
        padding: 4,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 4,
        fontWeight: '500',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        minHeight: 50,
        justifyContent: 'center',
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 12,
        minHeight: 50,
    },
    biometricButtonText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: '500',
    },
    socialLogin: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        marginHorizontal: 6,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    signUpText: {
        fontSize: 16,
    },
    signUpLink: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
