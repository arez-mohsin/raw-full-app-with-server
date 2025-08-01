import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, increment, arrayUnion, updateDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import ErrorHandler from '../utils/ErrorHandler';
import ActivityLogger from '../utils/ActivityLogger';
import SocialAuthService from '../services/SocialAuthService';

const RegisterScreen = ({ navigation }) => {
    const { theme } = useTheme();
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

    // Bottom sheet refs and snap points
    const bottomSheetModalRef = useRef(null);
    const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

    // Bottom sheet handlers
    const handlePresentModalPress = useCallback(() => {
        bottomSheetModalRef.current?.present();
    }, []);

    const handleDismiss = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();
    }, []);


    // Handle registration with comprehensive validation
    const handleRegister = async () => {
        if (isButtonDisabled || isBlocked) return;

        if (isBlocked) {
            triggerError("general", "Too many failed attempts. Please wait 5 minutes before trying again.");
            return;
        }

        setErrors({});

        if (!username.trim()) {
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
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
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
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate("EmailVerification", { email });
        } catch (error) {
            let errorMessage = "Registration failed. Please try again.";
            switch (error.code) {
                case "auth/email-already-in-use":
                    errorMessage = "Email already in use";
                    break;
                case "auth/operation-not-allowed":
                    errorMessage = "Account creation is currently disabled";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Too many attempts. Try again later";
                    break;
                case "auth/weak-password":
                    errorMessage = "Password is too weak";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Invalid email address";
                    break;
            }
            triggerError("general", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle social registration
    const handleSocialRegister = async (provider) => {
        if (isButtonDisabled || isBlocked) return;

        try {
            setIsButtonDisabled(true);
            setIsLoading(true);
            setGeneralError('');

            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            let result;
            if (provider === 'Google') {
                result = await SocialAuthService.signInWithGoogle();
            } else if (provider === 'Apple') {
                result = await SocialAuthService.signInWithApple();
            } else {
                throw new Error('Unsupported provider');
            }

            if (result.success) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Check if email is verified before navigating to main app

                // Navigate to email verification screen
                navigation.replace('EmailVerification');
            }

        } catch (error) {
            console.error(`${provider} registration error:`, error);
            let errorMessage = `${provider} registration failed`;

            if (error.message.includes('cancelled')) {
                errorMessage = `${provider} registration was cancelled`;
            } else if (error.message.includes('not available')) {
                errorMessage = `${provider} registration is not available on this device`;
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection';
            } else {
                errorMessage = error.message || `${provider} registration failed. Please try again.`;
            }

            setGeneralError(errorMessage);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                setIsButtonDisabled(false);
            }, 5000);
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
                                <Ionicons name="diamond" size={50} color="#FFD700" />
                            </View>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join the crypto mining revolution</Text>
                        </View>

                        {/* General Error Message */}
                        {generalError ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#ff4444" />
                                <Text style={styles.generalErrorText}>{generalError}</Text>
                            </View>
                        ) : null}

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
                                            placeholder="First Name"
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
                                            placeholder="Last Name"
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
                                    placeholder="Username"
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
                                <Text style={styles.successText}>Username is available</Text>
                            ) : usernameAvailable === false ? (
                                <Text style={styles.errorText}>Username is already taken</Text>
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
                                    placeholder="Email"
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
                                <Text style={styles.successText}>Email is available</Text>
                            ) : emailAvailable === false ? (
                                <Text style={styles.errorText}>Email is already registered</Text>
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
                                    placeholder="Password"
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
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                                    placeholder="Confirm Password"
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
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                                    placeholder="Invite Code (Optional)"
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
                                    ✓ Valid invite code! You'll get 10 bonus coins
                                </Text>
                            )}
                            {inviteCodeValid === false && inviteCode.length === 8 && (
                                <Text style={[styles.fieldError, { color: theme.colors.error }]}>
                                    Invalid invite code
                                </Text>
                            )}

                            {/* Registration attempts warning */}
                            {registrationAttempts > 0 && registrationAttempts < 5 && (
                                <View style={[styles.warningContainer, { backgroundColor: theme.colors.warning + '20' }]}>
                                    <Ionicons name="warning" size={20} color={theme.colors.warning} />
                                    <Text style={[styles.warningText, { color: theme.colors.warning }]}>
                                        Failed attempts: {registrationAttempts}/5. Account will be temporarily blocked after 5 failed attempts.
                                    </Text>
                                </View>
                            )}

                            {/* Blocked status */}
                            {isBlocked && (
                                <View style={[styles.blockedContainer, { backgroundColor: theme.colors.error + '20' }]}>
                                    <Ionicons name="lock-closed" size={20} color={theme.colors.error} />
                                    <Text style={[styles.blockedText, { color: theme.colors.error }]}>
                                        Registration temporarily blocked due to too many failed attempts. Please wait 5 minutes.
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
                                        Wait {5 - Math.floor(registrationAttempts / 5)}s...
                                    </Text>
                                ) : (
                                    <Text style={styles.registerButtonText}>Create Account</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.termsContainer}>
                                <Text style={styles.termsText}>
                                    By creating an account, you agree to our{' '}
                                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                                    <Text style={styles.termsLink}>Privacy Policy</Text>
                                </Text>
                            </View>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.socialLogin}>
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={() => handleSocialRegister('Google')}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="logo-google" size={24} color="#fff" />
                                    <Text style={styles.socialButtonText}>Google</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={() => handleSocialRegister('Apple')}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="logo-apple" size={24} color="#fff" />
                                    <Text style={styles.socialButtonText}>Apple</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.navigate('Login');
                                }}
                                disabled={isLoading}
                            >
                                <Text style={styles.loginButtonText}>Already have an account? Login</Text>
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
                        <Text style={styles.bottomSheetTitle}>Registration Guide</Text>

                        <View style={styles.infoSection}>
                            <Text style={styles.infoSectionTitle}>Personal Information</Text>
                            <View style={styles.infoItem}>
                                <Ionicons name="person" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>First Name & Last Name: Use your real name as it appears on official documents</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="at" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>Username: 3-20 characters, letters, numbers, and underscores only. Will be converted to lowercase.</Text>
                            </View>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.infoSectionTitle}>Account Security</Text>
                            <View style={styles.infoItem}>
                                <Ionicons name="mail" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>Email: Must be a valid email address. Used for account verification and password recovery.</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="lock-closed" size={16} color="#FFD700" />
                                <Text style={styles.infoText}>Password: Minimum 8 characters with uppercase, lowercase, number, and special character.</Text>
                            </View>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.infoSectionTitle}>Important Notes</Text>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.infoText}>All information is encrypted and securely stored</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.infoText}>Email verification is required to access the app</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.infoText}>Username and email must be unique</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleDismiss}
                        >
                            <Text style={styles.closeButtonText}>Got it!</Text>
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
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#444',
    },
    dividerText: {
        color: '#888',
        marginHorizontal: 16,
        fontSize: 14,
    },
    socialLogin: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
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
        borderColor: '#444',
        backgroundColor: '#2a2a2a',
        marginHorizontal: 6,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
        color: '#fff',
    },
    loginButton: {
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFD700',
        fontSize: 16,
    },
    // Bottom Sheet Styles
    bottomSheetOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
    },
    bottomSheetBackdrop: {
        flex: 1,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#2a2a2a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        zIndex: 1001,
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#666',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
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
    infoText: {
        fontSize: 14,
        color: '#ccc',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
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
    // Bottom Sheet Modal Styles
    bottomSheetBackground: {
        backgroundColor: '#2a2a2a',
    },
    bottomSheetIndicator: {
        backgroundColor: '#666',
    },
});

export default RegisterScreen;
