import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { auth, db } from '../firebase';
import {
    signInWithCredential,
    OAuthProvider,
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    increment,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import * as Constants from 'expo-constants';
import SecurityService from './SecurityService';
import ActivityLogger from '../utils/ActivityLogger';
import ErrorHandler from '../utils/ErrorHandler';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '256440351138-bfei1dd2h716836bv1qfllv0q60fio73.apps.googleusercontent.com'; // Replace with your Google Web Client ID
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
    scheme: 'com.arezmohssin99.rawapp',
    path: 'auth'
});

class SocialAuthService {
    constructor() {
        this.isInitialized = false;
        this.initializeService();
    }

    async initializeService() {
        try {
            // Initialize expo-auth-session
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing social auth service:', error);
            this.isInitialized = false;
        }
    }

    // Get comprehensive device information for security logging
    async getDeviceInfo() {
        try {
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
    }

    // Generate secure random string for state parameter
    generateState() {
        return Crypto.randomUUID();
    }

    // Validate and sanitize user data
    sanitizeUserData(userData) {
        const sanitized = {};

        // Sanitize name fields
        if (userData.firstName) {
            sanitized.firstName = userData.firstName.trim().replace(/[^a-zA-Z\s]/g, '').substring(0, 30);
        }
        if (userData.lastName) {
            sanitized.lastName = userData.lastName.trim().replace(/[^a-zA-Z\s]/g, '').substring(0, 30);
        }

        // Sanitize email
        if (userData.email) {
            sanitized.email = userData.email.toLowerCase().trim();
        }

        // Sanitize username
        if (userData.username) {
            sanitized.username = userData.username.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
        }

        return sanitized;
    }

    // Create or update user document with comprehensive data
    async createUserDocument(user, userData, authProvider) {
        try {
            const deviceInfo = await this.getDeviceInfo();
            const sanitizedData = this.sanitizeUserData(userData);

            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                // Update existing user
                await updateDoc(userRef, {
                    lastSeen: serverTimestamp(),
                    isActive: true,
                    lastLoginDevice: deviceInfo,
                    lastSocialLogin: serverTimestamp(),
                    loginHistory: serverTimestamp(),
                    totalLogins: increment(1),
                    authProvider: authProvider,
                    updatedAt: serverTimestamp(),
                });
            } else {
                // Create new user document
                const userDocument = {
                    uid: user.uid,
                    username: sanitizedData.username || `user_${user.uid.substring(0, 8)}`,
                    firstName: sanitizedData.firstName || 'User',
                    lastName: sanitizedData.lastName || '',
                    email: sanitizedData.email || user.email,
                    photoURL: user.photoURL || '',
                    bannerURL: '',
                    createdAt: serverTimestamp(),
                    authProvider: authProvider,
                    lastLogin: serverTimestamp(),
                    isVerified: true, // Social login users are pre-verified
                    role: 'user',
                    balance: 0,
                    miningPower: 0,
                    referredBy: null,
                    totalReferrals: 0,
                    totalReferralEarnings: 0,
                    securitySettings: {
                        twoFactorEnabled: false,
                        lastPasswordChange: serverTimestamp(),
                        loginAttempts: 0,
                        accountLocked: false,
                        socialLoginEnabled: true,
                    },
                    deviceHistory: [deviceInfo],
                    socialLoginHistory: [{
                        provider: authProvider,
                        timestamp: new Date().toISOString(),
                        deviceInfo: deviceInfo,
                    }],
                };

                await setDoc(userRef, userDocument);
            }

            // Log security event
            await SecurityService.logSecurityEvent('social_login', {
                provider: authProvider,
                timestamp: new Date(),
                deviceInfo: deviceInfo,
                userId: user.uid,
            });

            // Log activity
            await ActivityLogger.logActivity(user.uid, 'social_login', {
                provider: authProvider,
                deviceInfo: deviceInfo,
            });

            return true;
        } catch (error) {
            console.error('Error creating/updating user document:', error);
            throw error;
        }
    }

    // Check if username is available
    async checkUsernameAvailability(username) {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username.toLowerCase()));
            const querySnapshot = await getDocs(q);
            return querySnapshot.empty;
        } catch (error) {
            console.error('Error checking username availability:', error);
            return false;
        }
    }

    // Generate unique username
    async generateUniqueUsername(firstName, lastName) {
        const baseUsername = `${firstName}${lastName}`.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        let username = baseUsername;
        let counter = 1;

        while (!(await this.checkUsernameAvailability(username))) {
            username = `${baseUsername}${counter}`;
            counter++;
            if (counter > 100) {
                username = `user_${Date.now()}`;
                break;
            }
        }

        return username;
    }

    // Apple Sign-In
    async signInWithApple() {
        try {
            if (!this.isInitialized) {
                throw new Error('Social authentication service not initialized');
            }

            // Check if Apple authentication is available
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (!isAvailable) {
                throw new Error('Apple authentication is not available on this device');
            }

            // Perform Apple authentication
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (!credential.identityToken) {
                throw new Error('Apple authentication failed: No identity token received');
            }

            // Create Firebase credential
            const provider = new OAuthProvider('apple.com');
            const firebaseCredential = provider.credential({
                idToken: credential.identityToken,
                rawNonce: credential.nonce,
            });

            // Sign in to Firebase
            const userCredential = await signInWithCredential(auth, firebaseCredential);
            const user = userCredential.user;

            // Prepare user data
            const userData = {
                firstName: credential.fullName?.givenName || 'Apple',
                lastName: credential.fullName?.familyName || 'User',
                email: credential.email || user.email,
                username: await this.generateUniqueUsername(
                    credential.fullName?.givenName || 'Apple',
                    credential.fullName?.familyName || 'User'
                ),
            };

            // Create/update user document
            await this.createUserDocument(user, userData, 'apple');

            return {
                success: true,
                user: user,
                userData: userData,
            };

        } catch (error) {
            console.error('Apple sign-in error:', error);

            if (error.code === 'ERR_CANCELED') {
                throw new Error('Apple sign-in was cancelled');
            }

            throw new Error(ErrorHandler.getErrorMessage(error));
        }
    }

    // Google Sign-In
    async signInWithGoogle() {
        try {
            if (!this.isInitialized) {
                throw new Error('Social authentication service not initialized');
            }

            // Create Google OAuth request
            const discovery = {
                authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenEndpoint: 'https://oauth2.googleapis.com/token',
                revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
            };

            const request = new AuthSession.AuthRequest({
                clientId: GOOGLE_CLIENT_ID,
                scopes: ['openid', 'profile', 'email'],
                redirectUri: GOOGLE_REDIRECT_URI,
                responseType: AuthSession.ResponseType.Code,
                additionalParameters: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            });

            // Get the authorization URL
            const authUrl = await request.makeAuthUrlAsync(discovery);
            console.log('Google OAuth Redirect URI:', GOOGLE_REDIRECT_URI);
            console.log('Google OAuth Auth URL:', authUrl);

            // Open the authorization URL in a web browser
            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                GOOGLE_REDIRECT_URI
            );

            if (result.type === 'cancel') {
                throw new Error('Google sign-in was cancelled');
            }

            if (result.type !== 'success') {
                throw new Error('Google sign-in failed');
            }

            // Exchange the authorization code for tokens
            const tokenResponse = await AuthSession.exchangeCodeAsync(
                {
                    clientId: GOOGLE_CLIENT_ID,
                    code: result.params.code,
                    redirectUri: GOOGLE_REDIRECT_URI,
                    extraParams: {
                        code_verifier: request.codeChallenge || '',
                    },
                },
                {
                    tokenEndpoint: 'https://oauth2.googleapis.com/token',
                }
            );

            // Get user info from Google
            const userInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.accessToken}`
            );
            const userInfo = await userInfoResponse.json();

            if (!userInfo.id) {
                throw new Error('Failed to get user info from Google');
            }

            // Create Firebase credential
            const provider = new OAuthProvider('google.com');
            const firebaseCredential = provider.credential({
                idToken: tokenResponse.idToken,
                accessToken: tokenResponse.accessToken,
            });

            // Sign in to Firebase
            const userCredential = await signInWithCredential(auth, firebaseCredential);
            const user = userCredential.user;

            // Prepare user data
            const userData = {
                firstName: userInfo.given_name || 'Google',
                lastName: userInfo.family_name || 'User',
                email: userInfo.email || user.email,
                username: await this.generateUniqueUsername(
                    userInfo.given_name || 'Google',
                    userInfo.family_name || 'User'
                ),
            };

            // Create/update user document
            await this.createUserDocument(user, userData, 'google');

            return {
                success: true,
                user: user,
                userData: userData,
            };

        } catch (error) {
            console.error('Google sign-in error:', error);

            if (error.message.includes('cancelled')) {
                throw new Error('Google sign-in was cancelled');
            }

            throw new Error(ErrorHandler.getErrorMessage(error));
        }
    }

    // Sign out from all social providers
    async signOut() {
        try {
            // Sign out from Firebase
            await auth.signOut();

            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    // Check if social login is available
    async checkSocialLoginAvailability() {
        try {
            const appleAvailable = await AppleAuthentication.isAvailableAsync();
            // Google is always available with expo-auth-session
            const googleAvailable = true;

            return {
                apple: appleAvailable,
                google: googleAvailable,
            };
        } catch (error) {
            console.error('Error checking social login availability:', error);
            return {
                apple: false,
                google: false,
            };
        }
    }

    // Get user's social login history
    async getSocialLoginHistory(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                return userDoc.data().socialLoginHistory || [];
            }

            return [];
        } catch (error) {
            console.error('Error getting social login history:', error);
            return [];
        }
    }

    // Disable social login for user
    async disableSocialLogin(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                'securitySettings.socialLoginEnabled': false,
                updatedAt: serverTimestamp(),
            });

            // Log security event
            await SecurityService.logSecurityEvent('social_login_disabled', {
                timestamp: new Date(),
                userId: userId,
            });

            return true;
        } catch (error) {
            console.error('Error disabling social login:', error);
            throw error;
        }
    }

    // Enable social login for user
    async enableSocialLogin(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                'securitySettings.socialLoginEnabled': true,
                updatedAt: serverTimestamp(),
            });

            // Log security event
            await SecurityService.logSecurityEvent('social_login_enabled', {
                timestamp: new Date(),
                userId: userId,
            });

            return true;
        } catch (error) {
            console.error('Error enabling social login:', error);
            throw error;
        }
    }
}

export default new SocialAuthService(); 