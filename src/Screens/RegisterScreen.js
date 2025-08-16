import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    Vibration,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../utils/HapticUtils';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, increment, arrayUnion, updateDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import ErrorHandler from '../utils/ErrorHandler';
import ActivityLogger from '../utils/ActivityLogger';



const RegisterScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [isCheckingEmailAvailability, setIsCheckingEmailAvailability] = useState(false);
    const [isCheckingUsernameAvailability, setIsCheckingUsernameAvailability] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState(null);
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [registrationAttempts, setRregistrationAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [inviteCodeValid, setInviteCodeValid] = useState(null);
    const [isCheckingInviteCode, setIsCheckingInviteCode] = useState(false);
    const errorTimeoutRef = useRef(null);



    // Enhanced validation functions
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const validateUsername = (username) => {
        // Username rules: 3-20 characters, alphanumeric + underscore + hyphen, no consecutive special chars
        const re = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,19}$/;
        return re.test(username) && !/_{2,}|-{2,}|_-|-_/.test(username);
    };

    const formatUsername = (input) => {
        // Remove special characters except underscore and hyphen
        let formatted = input.replace(/[^a-zA-Z0-9_-]/g, '');
        // Ensure it starts with alphanumeric
        formatted = formatted.replace(/^[_-]+/, '');
        // Limit length to 20 characters
        formatted = formatted.substring(0, 20);
        // Convert to lowercase
        return formatted.toLowerCase();
    };

    const validatePassword = (password) => {
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return re.test(password);
    };

    const validateFirstName = (name) => {
        // First name should be 2-30 characters, letters only
        const re = /^[a-zA-Z]{2,30}$/;
        return re.test(name.trim());
    };

    const validateLastName = (name) => {
        // Last name should be 2-30 characters, letters only
        const re = /^[a-zA-Z]{2,30}$/;
        return re.test(name.trim());
    };

    // Enhanced error message helper
    const getErrorMessage = (errorCode, fieldName = '') => {
        const errorMessages = {
            'auth/email-already-in-use': {
                title: 'Email Already Exists',
                message: 'This email address is already registered. Please use a different email or try logging in instead.',
                action: 'login',
                icon: 'mail-unread'
            },
            'auth/weak-password': {
                title: 'Weak Password',
                message: 'Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters.',
                action: 'retry',
                icon: 'lock-closed'
            },
            'auth/invalid-email': {
                title: 'Invalid Email',
                message: 'Please enter a valid email address format (e.g., user@example.com).',
                action: 'retry',
                icon: 'mail'
            },
            'auth/network-request-failed': {
                title: 'Network Error',
                message: 'Network connection failed. Please check your internet connection and try again.',
                action: 'retry',
                icon: 'wifi'
            },
            'auth/too-many-requests': {
                title: 'Too Many Attempts',
                message: 'Too many registration attempts. Please wait a few minutes before trying again.',
                action: 'wait',
                icon: 'time'
            },
            'auth/operation-not-allowed': {
                title: 'Registration Disabled',
                message: 'Account creation is currently disabled. Please try again later or contact support.',
                action: 'support',
                icon: 'settings'
            }
        };

        return errorMessages[errorCode] || {
            title: 'Registration Error',
            message: 'An unexpected error occurred. Please try again or contact support.',
            action: 'support',
            icon: 'alert-circle'
        };
    };

    // Enhanced availability checks
    const checkUsernameAvailability = async (username) => {
        if (!username || username.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        setIsCheckingUsernameAvailability(true);
        try {
            // Check if username exists in Firestore
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username.toLowerCase()));
            const querySnapshot = await getDocs(q);

            const isAvailable = querySnapshot.empty;
            setUsernameAvailable(isAvailable);
        } catch (error) {
            console.error("Error checking username availability:", error);
            setUsernameAvailable(null);
        } finally {
            setIsCheckingUsernameAvailability(false);
        }
    };

    const checkEmailAvailability = async (email) => {
        if (!email || !validateEmail(email)) {
            setEmailAvailable(null);
            return;
        }

        setIsCheckingEmailAvailability(true);
        try {
            // Check if email exists in Firestore
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email.toLowerCase()));
            const querySnapshot = await getDocs(q);

            const isAvailable = querySnapshot.empty;
            setEmailAvailable(isAvailable);
        } catch (error) {
            console.error("Error checking email availability:", error);
            setEmailAvailable(null);
        } finally {
            setIsCheckingEmailAvailability(false);
        }
    };

    const checkInviteCodeValidity = async (code) => {
        try {
            setIsCheckingInviteCode(true);
            const codeQuery = query(collection(db, "users"), where("inviteCode", "==", code));
            const codeSnapshot = await getDocs(codeQuery);

            if (!codeSnapshot.empty) {
                const referrerDoc = codeSnapshot.docs[0];
                const referrerData = referrerDoc.data();

                // Check if user is not trying to use their own code
                if (referrerData.email === email.toLowerCase()) {
                    setInviteCodeValid(false);
                    return;
                }

                setInviteCodeValid(true);
            } else {
                setInviteCodeValid(false);
            }
        } catch (error) {
            console.error("Error checking invite code validity:", error);
            setInviteCodeValid(null);
        } finally {
            setIsCheckingInviteCode(false);
        }
    };

    // Enhanced error handling with security features
    const triggerError = (field, message) => {
        hapticError();
        Vibration.vibrate(50);
        setErrors((prev) => ({ ...prev, [field]: message }));

        // Increment registration attempts
        setRegistrationAttempts(prev => prev + 1);

        // Block registration after 5 failed attempts
        if (registrationAttempts >= 4) {
            setIsBlocked(true);
            setTimeout(() => {
                setIsBlocked(false);
                setRegistrationAttempts(0);
                hapticSuccess();
            }, 300000); // 5 minutes block
        }

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

    // Enhanced device history tracking
    const saveDeviceHistory = async (userId) => {
        try {
            const userRef = doc(db, "users", userId);
            const ipAddress = "192.168.1.1"; // In production, get real IP
            const deviceId = Device.osInternalBuildId ?? Device.modelId ?? "unknown-device";

            const deviceInfo = {
                os: Device.osName,
                osVersion: Device.osVersion,
                model: Device.modelName,
                ip: ipAddress,
                deviceId: deviceId,
                timestamp: new Date().toISOString(),
                type: "registration",
            };

            await setDoc(
                userRef,
                {
                    deviceHistory: arrayUnion(deviceInfo),
                    createdAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (error) {
            console.error("Error saving device history:", error);
        }
    };

    // Debounced username availability check
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (username && validateUsername(username)) {
                checkUsernameAvailability(username);
            } else {
                setUsernameAvailable(null);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [username]);

    // Debounced email availability check
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (email && validateEmail(email)) {
                checkEmailAvailability(email);
            } else {
                setEmailAvailable(null);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [email]);

    // Debounced invite code validation
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inviteCode && inviteCode.trim().length === 8) {
                checkInviteCodeValidity(inviteCode.trim().toUpperCase());
            } else {
                setInviteCodeValid(null);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [inviteCode]);

    useEffect(() => {
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, []);

    const getDeviceInfo = async () => {
        try {
            return {
                os: Device.osName || 'Unknown',
                osVersion: Device.osVersion || 'Unknown',
                model: Device.modelName || 'Unknown',
                deviceId: Device.osInternalBuildId || Device.deviceName || 'Unknown',
                appVersion: Application.nativeApplicationVersion || '1.0.0',
                platform: Platform.OS,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Error getting device info:', error);
            return {
                os: 'Unknown',
                osVersion: 'Unknown',
                model: 'Unknown',
                deviceId: 'Unknown',
                appVersion: '1.0.0',
                platform: Platform.OS,
                timestamp: new Date().toISOString(),
            };
        }
    };

    // Input change handlers
    const handleFirstNameChange = (text) => {
        setFirstName(text);
        setGeneralError('');
        if (errors.firstName) {
            setErrors(prev => ({ ...prev, firstName: '' }));
        }
    };

    const handleLastNameChange = (text) => {
        setLastName(text);
        setGeneralError('');
        if (errors.lastName) {
            setErrors(prev => ({ ...prev, lastName: '' }));
        }
    };

    const handleUsernameChange = (text) => {
        const formatted = formatUsername(text);
        setUsername(formatted);
        setGeneralError('');
        if (errors.username) {
            setErrors(prev => ({ ...prev, username: '' }));
        }
    };

    const handleEmailChange = (text) => {
        setEmail(text);
        setGeneralError('');
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: '' }));
        }
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        setGeneralError('');
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: '' }));
        }
    };

    const handleConfirmPasswordChange = (text) => {
        setConfirmPassword(text);
        setGeneralError('');
        if (errors.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    };

    // Navigation handler for guide
    const handleShowGuide = useCallback(() => {
        navigation.navigate('RegisterGuide');
    }, [navigation]);


    // Handle registration with comprehensive validation
    const handleRegister = async () => {
        console.log('handleRegister called');
        console.log('isButtonDisabled:', isButtonDisabled);
        console.log('isBlocked:', isBlocked);

        if (isButtonDisabled || isBlocked) {
            console.log('Registration blocked or button disabled');
            return;
        }

        if (isBlocked) {
            triggerError("general", "Too many failed attempts. Please wait 5 minutes before trying again.");
            return;
        }

        setErrors({});
        console.log('Starting validation...');

        if (!username.trim()) {
            console.log('Username validation failed');
            triggerError("username", "Username is required");
            return;
        }

        if (!validateUsername(username)) {
            triggerError("username", "Username must be 3-20 characters, alphanumeric with _ or - only");
            return;
        }

        if (usernameAvailable === false) {
            triggerError("username", "Username is already taken");
            return;
        }

        if (usernameAvailable === null && username.length >= 3) {
            triggerError("username", "Please wait while we check username availability");
            return;
        }

        if (!email.trim()) {
            triggerError("email", "Email is required");
            return;
        }

        if (!validateEmail(email)) {
            triggerError("email", "Invalid email format");
            return;
        }

        if (emailAvailable === false) {
            triggerError("email", "Email is already registered");
            return;
        }

        if (emailAvailable === null && email.length > 0) {
            triggerError("email", "Please wait while we check email availability");
            return;
        }

        if (!firstName.trim()) {
            triggerError("firstName", "First name is required");
            return;
        }

        if (!validateFirstName(firstName)) {
            triggerError("firstName", "First name must be 2-30 characters, letters only");
            return;
        }

        if (!lastName.trim()) {
            triggerError("lastName", "Last name is required");
            return;
        }

        if (!validateLastName(lastName)) {
            triggerError("lastName", "Last name must be 2-30 characters, letters only");
            return;
        }

        if (!password.trim()) {
            triggerError("password", "Password is required");
            return;
        }

        if (password.length < 8) {
            triggerError("password", "Password must be at least 8 characters");
            return;
        }

        if (!validatePassword(password)) {
            triggerError(
                "password",
                "Must include uppercase, lowercase, number, and special character"
            );
            return;
        }

        if (password !== confirmPassword) {
            triggerError("confirmPassword", "Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            console.log('Creating Firebase user...');
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            console.log('Firebase user created successfully:', userCredential.user.uid);

            console.log('Saving device history...');
            await saveDeviceHistory(userCredential.user.uid);

            // Handle invite code if provided
            let referrerId = null;
            let initialBalance = 0;

            if (inviteCode && inviteCodeValid) {
                try {
                    const codeQuery = query(collection(db, "users"), where("inviteCode", "==", inviteCode.trim().toUpperCase()));
                    const codeSnapshot = await getDocs(codeQuery);

                    if (!codeSnapshot.empty) {
                        const referrerDoc = codeSnapshot.docs[0];
                        referrerId = referrerDoc.id;
                        initialBalance = 50; // Bonus coins for using invite code

                        // Update referrer's stats
                        const referrerRef = doc(db, "users", referrerId);
                        await updateDoc(referrerRef, {
                            totalReferrals: increment(1),
                            totalReferralEarnings: increment(50),
                            balance: increment(50),
                            updatedAt: serverTimestamp(),
                        });

                        // Log referral activity for both users
                        await ActivityLogger.logReferralBonus(referrerId, 50, `Referral bonus for ${email}`);
                        await ActivityLogger.logReferralBonus(userCredential.user.uid, 50, `Welcome bonus from invite code`);
                    }
                } catch (error) {
                    console.error("Error processing invite code:", error);
                }
            }

            console.log('Creating user document in Firestore...');
            const userRef = doc(db, "users", userCredential.user.uid);
            await setDoc(userRef, {
                uid: userCredential.user.uid,
                username: formatUsername(username),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.toLowerCase(),
                photoURL: "",
                bannerURL: "",
                createdAt: serverTimestamp(),
                authProvider: "email",
                lastLogin: serverTimestamp(),
                isVerified: false,
                role: "user",
                balance: initialBalance,
                miningPower: 0,
                referredBy: referrerId,
                totalReferrals: 0,
                totalReferralEarnings: 0,
                securitySettings: {
                    twoFactorEnabled: false,
                    lastPasswordChange: serverTimestamp(),
                    loginAttempts: 0,
                    accountLocked: false,
                },
                isTermsAccepted: false, // Will be updated to true after accepting terms
                termsAcceptedAt: null,
            });

            console.log('User document created, navigating to Terms of Service');
            hapticSuccess();
            navigation.navigate("TermsOfService", {
                isRegistrationFlow: true,
                email: email,
                uid: userCredential.user.uid,
            });
        } catch (error) {
            console.error('Registration error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            let errorMessage = "Registration failed. Please try again.";
            let errorTitle = "Registration Error";
            let showLoginOption = false;
            let showPasswordReset = false;

            switch (error.code) {
                case "auth/email-already-in-use":
                    errorMessage = "This email address is already registered. Please use a different email or try logging in instead.";
                    errorTitle = "Email Already Exists";
                    showLoginOption = true;
                    break;

                case "auth/operation-not-allowed":
                    errorMessage = "Account creation is currently disabled. Please try again later or contact support.";
                    errorTitle = "Registration Disabled";
                    break;

                case "auth/too-many-requests":
                    errorMessage = "Too many registration attempts. Please wait a few minutes before trying again.";
                    errorTitle = "Too Many Attempts";
                    break;

                case "auth/weak-password":
                    errorMessage = "Password is too weak. Please use at least 8 characters with uppercase, lowercase, numbers, and special characters.";
                    errorTitle = "Weak Password";
                    break;

                case "auth/invalid-email":
                    errorMessage = "Please enter a valid email address format (e.g., user@example.com).";
                    errorTitle = "Invalid Email";
                    break;

                case "auth/user-disabled":
                    errorMessage = "This account has been disabled. Please contact support for assistance.";
                    errorTitle = "Account Disabled";
                    break;

                case "auth/network-request-failed":
                    errorMessage = "Network connection failed. Please check your internet connection and try again.";
                    errorTitle = "Network Error";
                    break;

                case "auth/invalid-phone-number":
                    errorMessage = "Invalid phone number format. Please enter a valid phone number.";
                    errorTitle = "Invalid Phone Number";
                    break;

                case "auth/phone-number-already-exists":
                    errorMessage = "This phone number is already registered. Please use a different number or try logging in.";
                    errorTitle = "Phone Number Exists";
                    showLoginOption = true;
                    break;

                case "auth/quota-exceeded":
                    errorMessage = "Service temporarily unavailable due to high demand. Please try again later.";
                    errorTitle = "Service Unavailable";
                    break;

                case "auth/app-not-authorized":
                    errorMessage = "App is not authorized to access Firebase. Please contact support.";
                    errorTitle = "App Authorization Error";
                    break;

                case "auth/key-expired":
                    errorMessage = "Authentication key has expired. Please restart the app and try again.";
                    errorTitle = "Authentication Error";
                    break;

                case "auth/user-token-expired":
                    errorMessage = "Your session has expired. Please restart the app and try again.";
                    errorTitle = "Session Expired";
                    break;

                case "auth/requires-recent-login":
                    errorMessage = "For security reasons, please log out and log in again before registering.";
                    errorTitle = "Security Verification Required";
                    break;

                case "auth/account-exists-with-different-credential":
                    errorMessage = "An account already exists with this email but different sign-in method. Please try signing in with the original method.";
                    errorTitle = "Account Exists";
                    showLoginOption = true;
                    break;

                case "auth/credential-already-in-use":
                    errorMessage = "This credential is already associated with another account. Please use different credentials.";
                    errorTitle = "Credential In Use";
                    break;

                case "auth/invalid-credential":
                    errorMessage = "Invalid credentials provided. Please check your information and try again.";
                    errorTitle = "Invalid Credentials";
                    break;

                case "auth/invalid-verification-code":
                    errorMessage = "Invalid verification code. Please check the code and try again.";
                    errorTitle = "Invalid Code";
                    break;

                case "auth/invalid-verification-id":
                    errorMessage = "Verification session expired. Please request a new verification code.";
                    errorTitle = "Verification Expired";
                    break;

                case "auth/missing-verification-code":
                    errorMessage = "Verification code is required. Please enter the code sent to your device.";
                    errorTitle = "Missing Code";
                    break;

                case "auth/missing-verification-id":
                    errorMessage = "Verification session not found. Please request a new verification code.";
                    errorTitle = "Verification Error";
                    break;

                case "auth/captcha-check-failed":
                    errorMessage = "Security verification failed. Please try again or contact support.";
                    errorTitle = "Security Check Failed";
                    break;

                case "auth/invalid-app-credential":
                    errorMessage = "Invalid app credentials. Please restart the app and try again.";
                    errorTitle = "App Error";
                    break;

                case "auth/session-expired":
                    errorMessage = "Your session has expired. Please restart the app and try again.";
                    errorTitle = "Session Expired";
                    break;

                case "auth/unauthorized-domain":
                    errorMessage = "This domain is not authorized for authentication. Please contact support.";
                    errorTitle = "Unauthorized Domain";
                    break;

                case "auth/unsupported-persistence-type":
                    errorMessage = "Authentication persistence type not supported. Please contact support.";
                    errorTitle = "Unsupported Feature";
                    break;

                case "auth/invalid-tenant-id":
                    errorMessage = "Invalid tenant configuration. Please contact support.";
                    errorTitle = "Configuration Error";
                    break;

                case "auth/tenant-id-mismatch":
                    errorMessage = "Tenant configuration mismatch. Please contact support.";
                    errorTitle = "Configuration Error";
                    break;

                case "auth/unsupported-tenant-operation":
                    errorMessage = "Tenant operation not supported. Please contact support.";
                    errorTitle = "Unsupported Operation";
                    break;

                default:
                    // For unknown error codes, provide a generic but helpful message
                    if (error.message.includes("network") || error.message.includes("timeout")) {
                        errorMessage = "Network connection issue. Please check your internet connection and try again.";
                        errorTitle = "Network Error";
                    } else if (error.message.includes("permission") || error.message.includes("denied")) {
                        errorMessage = "Permission denied. Please check your app permissions and try again.";
                        errorTitle = "Permission Error";
                    } else {
                        errorMessage = `Registration failed: ${error.message}. Please try again or contact support if the problem persists.`;
                        errorTitle = "Registration Error";
                    }
                    break;
            }

            // Show enhanced error alert with options
            if (showLoginOption) {
                Alert.alert(
                    errorTitle,
                    errorMessage,
                    [
                        {
                            text: "Try Again",
                            style: "default",
                            onPress: () => {
                                // Clear the error and let user try again
                                setErrors({});
                            }
                        },
                        {
                            text: "Go to Login",
                            style: "default",
                            onPress: () => {
                                navigation.navigate("Login");
                            }
                        },
                        {
                            text: "Cancel",
                            style: "cancel"
                        }
                    ]
                );
            } else {
                // Show regular error alert
                Alert.alert(
                    errorTitle,
                    errorMessage,
                    [
                        {
                            text: "Try Again",
                            style: "default",
                            onPress: () => {
                                // Clear the error and let user try again
                                setErrors({});
                            }
                        },
                        {
                            text: "Contact Support",
                            style: "default",
                            onPress: () => {
                                // Navigate to support or open email
                                Linking.openURL('mailto:rawchain01@gmail.com?subject=Registration%20Error%20Support&body=Error%20Code:%20' + error.code + '%0AError%20Message:%20' + error.message);
                            }
                        },
                        {
                            text: "Cancel",
                            style: "cancel"
                        }
                    ]
                );
            }

            // Also trigger the general error display
            triggerError("general", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };



    return (
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
                                hapticLight();
                                navigation.goBack();
                            }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.infoButton}
                            onPress={() => {
                                hapticLight();
                                handleShowGuide();
                            }}
                        >
                            <Ionicons name="information-circle" size={24} color="#FFD700" />
                        </TouchableOpacity>

                        <View style={styles.logoContainer}>
                            <Ionicons name="diamond" size={50} color="#FFD700" />
                        </View>
                        <Text style={styles.title}>{t('register.createAccount')}</Text>
                        <Text style={styles.subtitle}>{t('register.joinRevolution')}</Text>
                    </View>

                    {/* Enhanced General Error Message */}
                    {generalError ? (
                        <View style={styles.enhancedErrorContainer}>
                            <View style={styles.errorHeader}>
                                <Ionicons name="alert-circle" size={24} color="#ff4444" />
                                <Text style={styles.errorTitle}>Registration Error</Text>
                                <TouchableOpacity
                                    onPress={() => setGeneralError('')}
                                    style={styles.errorCloseButton}
                                >
                                    <Ionicons name="close" size={20} color="#888" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.enhancedErrorText}>{generalError}</Text>
                            <View style={styles.errorActions}>
                                <TouchableOpacity
                                    style={styles.errorActionButton}
                                    onPress={() => setGeneralError('')}
                                >
                                    <Text style={styles.errorActionText}>Try Again</Text>
                                </TouchableOpacity>
                                {generalError.includes('already registered') || generalError.includes('already exists') ? (
                                    <TouchableOpacity
                                        style={[styles.errorActionButton, styles.errorActionButtonSecondary]}
                                        onPress={() => navigation.navigate("Login")}
                                    >
                                        <Text style={styles.errorActionTextSecondary}>Go to Login</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.errorActionButton, styles.errorActionButtonSecondary]}
                                        onPress={() => Linking.openURL('mailto:rawchain01@gmail.com?subject=Registration%20Error%20Support&body=Error%20Message:%20' + generalError)}
                                    >
                                        <Text style={styles.errorActionTextSecondary}>Contact Support</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ) : null}

                    {/* Helpful Tips Section */}
                    {generalError && (
                        <View style={styles.tipsContainer}>
                            <Text style={styles.tipsTitle}>💡 Quick Solutions:</Text>
                            <View style={styles.tipItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.tipText}>Check your internet connection</Text>
                            </View>
                            <View style={styles.tipItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.tipText}>Ensure password meets requirements</Text>
                            </View>
                            <View style={styles.tipItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.tipText}>Use a different email if already registered</Text>
                            </View>
                            <View style={styles.tipItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.tipText}>Wait a few minutes if too many attempts</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.formContainer}>
                        {/* First Name and Last Name Row */}
                        <View style={styles.nameRow}>
                            <View style={styles.nameFieldContainer}>
                                <View style={[
                                    styles.inputContainer,
                                    errors.firstName ? { borderColor: '#ff4444' } : {}
                                ]}>
                                    <Ionicons
                                        name="person"
                                        size={20}
                                        color={errors.firstName ? '#ff4444' : "#888"}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('register.firstNamePlaceholder')}
                                        placeholderTextColor="#888"
                                        value={firstName}
                                        onChangeText={handleFirstNameChange}
                                        autoCapitalize="words"
                                        editable={!isLoading}
                                    />
                                </View>
                                {errors.firstName ? (
                                    <Text style={styles.errorText}>{errors.firstName}</Text>
                                ) : null}
                            </View>

                            <View style={styles.nameFieldContainer}>
                                <View style={[
                                    styles.inputContainer,
                                    errors.lastName ? { borderColor: '#ff4444' } : {}
                                ]}>
                                    <Ionicons
                                        name="person"
                                        size={20}
                                        color={errors.lastName ? '#ff4444' : "#888"}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('register.lastNamePlaceholder')}
                                        placeholderTextColor="#888"
                                        value={lastName}
                                        onChangeText={handleLastNameChange}
                                        autoCapitalize="words"
                                        editable={!isLoading}
                                    />
                                </View>
                                {errors.lastName ? (
                                    <Text style={styles.errorText}>{errors.lastName}</Text>
                                ) : null}
                            </View>
                        </View>

                        {/* Username Field */}
                        <View style={[
                            styles.inputContainer,
                            errors.username ? { borderColor: '#ff4444' } :
                                usernameAvailable === true ? { borderColor: '#4CAF50' } :
                                    usernameAvailable === false ? { borderColor: '#ff4444' } : {}
                        ]}>
                            <Ionicons
                                name="at"
                                size={20}
                                color={
                                    errors.username ? '#ff4444' :
                                        usernameAvailable === true ? '#4CAF50' :
                                            usernameAvailable === false ? '#ff4444' : "#888"
                                }
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={t('register.usernamePlaceholder')}
                                placeholderTextColor="#888"
                                value={username}
                                onChangeText={handleUsernameChange}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            {isCheckingUsernameAvailability && (
                                <ActivityIndicator size="small" color="#FFD700" style={styles.availabilityIndicator} />
                            )}
                        </View>
                        {errors.username ? (
                            <Text style={styles.errorText}>{errors.username}</Text>
                        ) : usernameAvailable === true ? (
                            <Text style={styles.successText}>{t('register.usernameAvailable')}</Text>
                        ) : usernameAvailable === false ? (
                            <Text style={styles.errorText}>{t('register.usernameTaken')}</Text>
                        ) : null}

                        {/* Email Field */}
                        <View style={[
                            styles.inputContainer,
                            errors.email ? { borderColor: '#ff4444' } :
                                emailAvailable === true ? { borderColor: '#4CAF50' } :
                                    emailAvailable === false ? { borderColor: '#ff4444' } : {}
                        ]}>
                            <Ionicons
                                name="mail"
                                size={20}
                                color={
                                    errors.email ? '#ff4444' :
                                        emailAvailable === true ? '#4CAF50' :
                                            emailAvailable === false ? '#ff4444' : "#888"
                                }
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={t('register.emailPlaceholder')}
                                placeholderTextColor="#888"
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            {isCheckingEmailAvailability && (
                                <ActivityIndicator size="small" color="#FFD700" style={styles.availabilityIndicator} />
                            )}
                        </View>
                        {errors.email ? (
                            <Text style={styles.errorText}>{errors.email}</Text>
                        ) : emailAvailable === true ? (
                            <Text style={styles.successText}>{t('register.emailAvailable')}</Text>
                        ) : emailAvailable === false ? (
                            <Text style={styles.errorText}>{t('register.emailRegistered')}</Text>
                        ) : null}



                        {/* Password Field */}
                        <View style={[
                            styles.inputContainer,
                            errors.password ? { borderColor: '#ff4444' } : {}
                        ]}>
                            <Ionicons
                                name="lock-closed"
                                size={20}
                                color={errors.password ? '#ff4444' : "#888"}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={t('register.passwordPlaceholder')}
                                placeholderTextColor="#888"
                                value={password}
                                onChangeText={handlePasswordChange}
                                secureTextEntry={!showPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => {
                                    setShowPassword(!showPassword);
                                    hapticLight();
                                }}
                                disabled={isLoading}
                            >
                                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                        {errors.password ? (
                            <Text style={styles.errorText}>{errors.password}</Text>
                        ) : null}

                        {/* Confirm Password Field */}
                        <View style={[
                            styles.inputContainer,
                            errors.confirmPassword ? { borderColor: '#ff4444' } : {}
                        ]}>
                            <Ionicons
                                name="lock-closed"
                                size={20}
                                color={errors.confirmPassword ? '#ff4444' : "#888"}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={t('register.confirmPasswordPlaceholder')}
                                placeholderTextColor="#888"
                                value={confirmPassword}
                                onChangeText={handleConfirmPasswordChange}
                                secureTextEntry={!showConfirmPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => {
                                    setShowConfirmPassword(!showConfirmPassword);
                                    hapticLight();
                                }}
                                disabled={isLoading}
                            >
                                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPassword && (
                            <Text style={[styles.fieldError, { color: theme.colors.error }]}>
                                {errors.confirmPassword}
                            </Text>
                        )}

                        {/* Invite Code Field */}
                        <View style={[
                            styles.inputContainer,
                            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                            inviteCodeValid === false && { borderColor: theme.colors.error },
                            inviteCodeValid === true && { borderColor: theme.colors.success }
                        ]}>
                            <Ionicons
                                name="gift"
                                size={20}
                                color={
                                    inviteCodeValid === false
                                        ? theme.colors.error
                                        : inviteCodeValid === true
                                            ? theme.colors.success
                                            : theme.colors.textSecondary
                                }
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.colors.textSecondary }]}
                                placeholder={t('register.inviteCodePlaceholder')}
                                placeholderTextColor={theme.colors.textSecondary}
                                value={inviteCode}
                                onChangeText={(text) => {
                                    setInviteCode(text.toUpperCase());
                                }}
                                autoCapitalize="characters"
                                maxLength={8}
                                returnKeyType="done"
                            />
                            {isCheckingInviteCode && (
                                <ActivityIndicator size="small" color={theme.colors.accent} />
                            )}
                            {inviteCodeValid === true && (
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                            )}
                            {inviteCodeValid === false && (
                                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                            )}
                        </View>
                        {inviteCodeValid === true && (
                            <Text style={[styles.fieldSuccess, { color: theme.colors.success }]}>
                                {t('register.validInviteCode')}
                            </Text>
                        )}
                        {inviteCodeValid === false && inviteCode.length === 8 && (
                            <Text style={[styles.fieldError, { color: theme.colors.error }]}>
                                {t('register.invalidInviteCode')}
                            </Text>
                        )}

                        {/* Registration attempts warning */}
                        {registrationAttempts > 0 && registrationAttempts < 5 && (
                            <View style={[styles.warningContainer, { backgroundColor: theme.colors.warning + '20' }]}>
                                <Ionicons name="warning" size={20} color={theme.colors.warning} />
                                <Text style={[styles.warningText, { color: theme.colors.warning }]}>
                                    {t('register.failedAttemptsWarning', { attempts: registrationAttempts })}
                                </Text>
                            </View>
                        )}

                        {/* Blocked status */}
                        {isBlocked && (
                            <View style={[styles.blockedContainer, { backgroundColor: theme.colors.error + '20' }]}>
                                <Ionicons name="lock-closed" size={20} color={theme.colors.error} />
                                <Text style={[styles.blockedText, { color: theme.colors.error }]}>
                                    {t('register.registrationBlocked')}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.registerButton,
                                (isLoading || isButtonDisabled) && { opacity: 0.7 }
                            ]}
                            onPress={handleRegister}
                            disabled={isLoading || isButtonDisabled}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" size="small" />
                            ) : isButtonDisabled ? (
                                <Text style={styles.registerButtonText}>
                                    {t('register.waitSeconds', { seconds: 5 - Math.floor(registrationAttempts / 5) })}
                                </Text>
                            ) : (
                                <Text style={styles.registerButtonText}>{t('register.createAccount')}</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                {t('register.termsAgreement')}{' '}
                                <Text style={styles.termsLink}>{t('common.termsOfService')}</Text> {t('common.and')}{' '}
                                <Text style={styles.termsLink}>{t('common.privacyPolicy')}</Text>
                            </Text>
                        </View>



                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => {
                                hapticLight();
                                navigation.goBack();
                            }}
                            disabled={isLoading}
                        >
                            <Text style={styles.loginButtonText}>{t('register.alreadyHaveAccount')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
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
    enhancedErrorContainer: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ff4444',
        padding: 16,
    },
    errorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    errorTitle: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
        flex: 1,
    },
    errorCloseButton: {
        padding: 4,
    },
    enhancedErrorText: {
        color: '#ff4444',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    errorActions: {
        flexDirection: 'row',
        gap: 12,
    },
    errorActionButton: {
        flex: 1,
        backgroundColor: '#ff4444',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    errorActionButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ff4444',
    },
    errorActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorActionTextSecondary: {
        color: '#ff4444',
        fontSize: 14,
        fontWeight: 'bold',
    },
    tipsContainer: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#4CAF50',
        padding: 16,
    },
    tipsTitle: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tipText: {
        color: '#4CAF50',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    formContainer: {
        width: '100%',
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    nameFieldContainer: {
        flex: 1,
        marginHorizontal: 4,
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
        fontSize: 14,
    },
    eyeButton: {
        padding: 8,
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
    registerButton: {
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
    registerButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    termsContainer: {
        marginTop: 16,
        paddingHorizontal: 10,
    },
    termsText: {
        color: '#888',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#FFD700',
    },

    loginButton: {
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFD700',
        fontSize: 16,
    },
    // New styles for invite code field
    fieldError: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    fieldSuccess: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 20,
    },
    warningText: {
        fontSize: 12,
        marginLeft: 8,
    },
    blockedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 20,
    },
    blockedText: {
        fontSize: 12,
        marginLeft: 8,
    },
});

export default RegisterScreen;
