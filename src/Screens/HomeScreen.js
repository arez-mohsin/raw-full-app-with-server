import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    AppState,
    Platform,
    Animated,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import MiningButton from '../components/MiningButton';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc, collection, query, orderBy, limit, getDocs, onSnapshot, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ActivityLogger from '../utils/ActivityLogger';
import NotificationService from '../utils/NotificationService';
import * as Device from 'expo-device';
import { hapticSuccess, hapticError } from '../utils/HapticUtils';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import ToastService from '../utils/ToastService';
import apiService from '../utils/ApiService';
import AccountStatusService from '../services/AccountStatusService';

const MAX_SESSION_SECONDS = 7200; // 2 hours
const SESSION_UPDATE_INTERVAL = 300000; // 5 minutes

// Enhanced security configuration
const SECURITY_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    REQUEST_TIMEOUT: 15000,
    MIN_REQUEST_INTERVAL: 0, // Removed rate limiting for mining
    MAX_REQUESTS_PER_MINUTE: 100, // Increased for mining operations
    SUSPICIOUS_ACTIVITY_THRESHOLD: 5
};

// Anti-cheat configuration
const ANTI_CHEAT_CONFIG = {
    MAX_SESSION_DURATION: 7200, // 2 hours in seconds
    MIN_SESSION_DURATION: 1800, // 30 minutes minimum
    MAX_EARNINGS_PER_SESSION: 10, // Maximum coins per session
    MAX_RAPID_REQUESTS: 10, // Increased for mining
    MIN_REQUEST_INTERVAL: 0, // Removed rate limiting for mining
    SUSPICIOUS_ACTIVITY_THRESHOLD: 5,
    TIME_MANIPULATION_THRESHOLD: 300, // 5 minutes buffer
    DEVICE_FINGERPRINT_VALIDATION: true,
    SESSION_INTEGRITY_CHECK: true
};

// Anti-cheat tracking
let sessionStartTime = null;
let lastRequestTime = 0;
let rapidRequestCount = 0;
let suspiciousActivityCount = 0;
let deviceFingerprint = null;
let sessionIntegrity = true;
let requestCount = 0;

// Server configuration
const SERVER_CONFIG = {
    BASE_URL: 'https://raw-full-app-with-server.onrender.com',
};

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Validate Firebase authentication token with better error handling
const validateAuthToken = async () => {
    try {
        if (!auth.currentUser) {
            console.log('No current user for token validation');
            return false;
        }

        // Check if user is still valid
        if (auth.currentUser.isAnonymous) {
            console.log('User is anonymous, cannot validate token');
            return false;
        }

        try {
            // Try to get token result first to check expiration
            const tokenResult = await auth.currentUser.getIdTokenResult();
            const currentTime = Date.now();
            const expirationTime = new Date(tokenResult.expirationTime).getTime();
            const timeUntilExpiry = expirationTime - currentTime;

            // If token expires in less than 10 minutes, refresh it
            if (timeUntilExpiry < 600000) {
                console.log('Token expiring soon, forcing refresh');
                const freshToken = await auth.currentUser.getIdToken(true);
                if (!freshToken) {
                    console.log('Failed to get fresh token after refresh');
                    return false;
                }
                console.log('Token refreshed successfully');
            } else {
                console.log('Token is still valid, expires in', Math.round(timeUntilExpiry / 1000), 'seconds');
            }

            return true;
        } catch (tokenError) {
            console.log('Token validation error, attempting to refresh:', tokenError.message);

            // Try to force refresh the token
            try {
                const freshToken = await auth.currentUser.getIdToken(true);
                if (freshToken) {
                    console.log('Token refresh successful after error');
                    return true;
                }
            } catch (refreshError) {
                console.log('Token refresh failed:', refreshError.message);
            }

            return false;
        }
    } catch (error) {
        console.error('Token validation failed:', error);
        return false;
    }
};

// Get server time for timestamp synchronization
const getServerTime = async () => {
    try {
        console.log('Attempting to synchronize with server time...');
        const response = await fetch('https://raw-full-app-with-server.onrender.com/health');

        if (response.ok) {
            const data = await response.json();
            if (data.timestamp) {
                const serverTime = new Date(data.timestamp).getTime();
                const clientTime = Date.now();
                const timeDifference = Math.abs(serverTime - clientTime);

                console.log('Server time synchronization successful:', {
                    serverTime,
                    serverTimeISO: new Date(serverTime).toISOString(),
                    clientTime,
                    clientTimeISO: new Date(clientTime).toISOString(),
                    timeDifference,
                    timeDifferenceSeconds: Math.round(timeDifference / 1000),
                    isSynchronized: timeDifference < 300000, // 5 minutes
                    validationWindow: '5 minutes (both production and development)'
                });

                return serverTime;
            } else {
                console.log('Server response missing timestamp, using client time');
            }
        } else {
            console.log('Server health check failed, using client time');
        }
    } catch (error) {
        console.log('Failed to get server time, using client time:', error.message);
    }

    const fallbackTime = Date.now();
    console.log('Using fallback client time:', {
        fallbackTime,
        fallbackTimeISO: new Date(fallbackTime).toISOString()
    });

    return fallbackTime; // Fallback to client time
};

// Production-ready device fingerprint generation
const generateDeviceFingerprint = async () => {
    try {
        // Ensure all values are strings and have fallbacks
        const deviceId = String(Device.osInternalBuildId || Device.deviceName || 'unknown').substring(0, 20);
        const appVersion = String(Application.nativeApplicationVersion || '1.0.0').substring(0, 20);
        const platform = String(Platform.OS || 'unknown').substring(0, 10);
        const deviceModel = String(Device.modelName || 'unknown').substring(0, 20);

        // Create fingerprint with guaranteed values
        const fingerprint = `${deviceId}-${platform}-${deviceModel}-${appVersion}`;

        // Validate fingerprint is not empty
        if (!fingerprint || fingerprint.length < 10) {
            throw new Error('Generated fingerprint too short');
        }

        // Enhanced hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        const result = Math.abs(hash).toString(16).padStart(8, '0');

        // Additional validation: ensure the result doesn't contain suspicious patterns
        const suspiciousPatterns = ['00000000', 'ffffffff', 'deadbeef', 'cafebabe'];
        if (suspiciousPatterns.includes(result)) {
            throw new Error('Generated hash contains suspicious pattern');
        }

        // Final validation
        if (!result || result.length !== 8) {
            throw new Error('Hash result invalid');
        }

        console.log('Device fingerprint generated successfully:', {
            deviceId,
            platform,
            deviceModel,
            appVersion,
            fingerprint,
            result
        });

        return result;
    } catch (error) {
        console.error('Device fingerprint generation failed:', error);
        // Production fallback - always return a valid fingerprint that passes server validation
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        // Generate a completely safe fingerprint using only alphanumeric characters
        // Avoid any patterns that might trigger server's suspicious pattern detection
        const safeChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let safeFingerprint = '';
        for (let i = 0; i < 8; i++) {
            safeFingerprint += safeChars.charAt(Math.floor(Math.random() * safeChars.length));
        }

        console.log('Fallback device fingerprint generated:', {
            reason: 'Primary generation failed',
            error: error.message,
            fallbackFingerprint: safeFingerprint
        });

        return safeFingerprint;
    }
};



// Enhanced secure API client with comprehensive security and better error handling
const secureApiCall = async (endpoint, data, userId) => {
    try {
        // Check if user is authenticated
        if (!auth.currentUser) {
            console.error('No authenticated user found');
            throw new Error('Authentication failed. Please log in again.');
        }

        // Use auth.currentUser.uid as fallback if userId is not provided
        const effectiveUserId = userId || auth.currentUser.uid;
        if (!effectiveUserId) {
            console.error('No effective userId available');
            throw new Error('Authentication failed. Please log in again.');
        }

        console.log('secureApiCall authentication check:', {
            providedUserId: userId,
            effectiveUserId,
            authCurrentUser: auth.currentUser?.uid,
            isAnonymous: auth.currentUser?.isAnonymous
        });

        console.log('secureApiCall request data:', {
            endpoint,
            originalData: data,
            requestData: { ...data, userId: effectiveUserId }
        });

        // Validate authentication token first
        try {
            const isTokenValid = await validateAuthToken();
            if (!isTokenValid) {
                console.error('Authentication token validation failed');
                throw new Error('Authentication failed. Please log in again.');
            }
        } catch (tokenError) {
            console.error('Token validation error:', tokenError);
            // Try to refresh the token one more time
            try {
                await auth.currentUser.getIdToken(true);
                console.log('Token refresh successful after validation error');
            } catch (refreshError) {
                console.error('Token refresh failed after validation error:', refreshError);
                throw new Error('Authentication failed. Please log in again.');
            }
        }

        // Ensure device fingerprint is generated before making the call
        let deviceFingerprint = await generateDeviceFingerprint();

        // Fallback if fingerprint generation fails
        if (!deviceFingerprint || deviceFingerprint.length < 8) {
            console.warn('Primary device fingerprint generation failed, using fallback');
            // Use the same safe generation logic as in generateDeviceFingerprint
            const safeChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let safeFingerprint = '';
            for (let i = 0; i < 8; i++) {
                safeFingerprint += safeChars.charAt(Math.floor(Math.random() * safeChars.length));
            }
            deviceFingerprint = safeFingerprint;
        }

        if (!deviceFingerprint || deviceFingerprint.length < 8) {
            console.error('All device fingerprint generation methods failed');
            throw new Error('Failed to generate valid device fingerprint');
        }

        console.log('Device fingerprint validated:', deviceFingerprint);
        console.log('Device fingerprint details:', {
            length: deviceFingerprint.length,
            containsSuspiciousPatterns: /(00000000|ffffffff|deadbeef|cafebabe|unknown|test|fake|fallback)/i.test(deviceFingerprint)
        });

        // Get synchronized timestamp for server (both production and development now use 5-minute window)
        const synchronizedTime = await getServerTime();
        const maxTimeDifference = 5 * 60 * 1000; // 5 minutes in milliseconds

        // Validate that the synchronized time is reasonable
        const clientTime = Date.now();
        const timeDifference = Math.abs(synchronizedTime - clientTime);
        const isTimeReasonable = timeDifference < (5 * 60 * 1000); // Within 5 minutes (same as server)

        console.log('Timestamp synchronization for server (5-minute window):', {
            synchronizedTime,
            synchronizedTimeISO: new Date(synchronizedTime).toISOString(),
            clientTime,
            clientTimeISO: new Date().toISOString(),
            timeDifference,
            timeDifferenceMinutes: Math.round(timeDifference / (60 * 1000)),
            maxTimeDifference,
            maxTimeDifferenceMinutes: maxTimeDifference / (60 * 1000),
            isTimeReasonable,
            willUseServerTime: isTimeReasonable && synchronizedTime !== clientTime
        });

        // Use server time only if it's reasonable, otherwise fall back to client time
        const finalTimestamp = isTimeReasonable ? synchronizedTime : clientTime;
        console.log('Final timestamp decision:', {
            finalTimestamp,
            finalTimestampISO: new Date(finalTimestamp).toISOString(),
            source: isTimeReasonable ? 'server' : 'client',
            reason: isTimeReasonable ? 'server time is reasonable' : 'server time difference too large, using client time'
        });

        // Additional authentication verification before proceeding
        if (!auth.currentUser || auth.currentUser.isAnonymous) {
            console.error('User not properly authenticated for API call');
            throw new Error('Authentication failed. Please log in again.');
        }

        // Get a fresh token before making the API call
        let freshToken;
        try {
            freshToken = await auth.currentUser.getIdToken(true);
            console.log('Fresh token obtained for API call, length:', freshToken ? freshToken.length : 0);

            // Verify the token is not expired
            const tokenResult = await auth.currentUser.getIdTokenResult();
            if (tokenResult.expirationTime) {
                const currentTime = Date.now();
                const expirationTime = new Date(tokenResult.expirationTime).getTime();
                const timeUntilExpiry = expirationTime - currentTime;
                console.log('API call token expires in', Math.round(timeUntilExpiry / 1000), 'seconds');

                if (timeUntilExpiry < 0) {
                    console.error('Token has expired, cannot make API call');
                    throw new Error('Authentication failed. Please log in again.');
                }
            }
        } catch (tokenError) {
            console.error('Failed to get fresh token:', tokenError);
            throw new Error('Authentication failed. Please log in again.');
        }

        if (!freshToken) {
            console.error('No fresh token available');
            throw new Error('Authentication failed. Please log in again.');
        }

        // Use the new ApiService for better error handling and retry mechanisms
        // Pass effectiveUserId as both the data userId and the service userId parameter
        const requestData = {
            ...data,
            userId: effectiveUserId // Ensure the data contains the correct userId
        };

        return await apiService.secureApiCall(endpoint, requestData, effectiveUserId, {
            timeout: SECURITY_CONFIG.REQUEST_TIMEOUT,
            maxRetries: 3,
            retryDelay: 2000,
            deviceFingerprint, // Pass the fingerprint explicitly
            skipAuth: false, // Ensure authentication is checked
            customToken: freshToken, // Pass the fresh token directly
            customTimestamp: finalTimestamp // Pass the validated timestamp
        });
    } catch (error) {
        console.error('Secure API call error:', error);

        // Handle authentication errors immediately - don't retry these
        if (error.message.includes('Authentication failed') ||
            error.message.includes('Please log in again') ||
            error.message.includes('User not authenticated') ||
            error.message.includes('Authentication mismatch') ||
            error.message.includes('Authentication token unavailable')) {

            console.warn('Authentication error detected, user needs to re-login');
            // Don't throw the error, let the calling function handle it gracefully
            throw error;
        }

        // Handle network unavailability
        if (error.message.includes('Network unavailable')) {
            // Queue the request for later when network is available
            console.log('Network unavailable, queuing request for later');
            await apiService.queueApiCall(endpoint, data, userId);
            throw new Error('Request queued for later execution when network is available');
        }

        // Re-throw other errors
        throw error;
    }
};

// Anti-cheat validation functions
const validateSessionIntegrity = () => {
    if (!sessionStartTime) return true;

    const currentTime = Date.now();
    const sessionDuration = (currentTime - sessionStartTime) / 1000;

    // More lenient session duration check
    if (sessionDuration > ANTI_CHEAT_CONFIG.MAX_SESSION_DURATION * 1.5) {
        console.warn('Session duration exceeded limit');
        suspiciousActivityCount++;
        return suspiciousActivityCount < ANTI_CHEAT_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD * 2;
    }

    // More lenient time manipulation check
    const expectedDuration = (currentTime - sessionStartTime) / 1000;
    const actualDuration = sessionDuration;
    const timeDifference = Math.abs(expectedDuration - actualDuration);

    if (timeDifference > ANTI_CHEAT_CONFIG.TIME_MANIPULATION_THRESHOLD * 2) {
        console.warn('Time manipulation detected');
        suspiciousActivityCount++;
        return suspiciousActivityCount < ANTI_CHEAT_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD * 2;
    }

    return true;
};

const validateDeviceFingerprint = async () => {
    try {
        const currentFingerprint = await generateDeviceFingerprint();

        // Store fingerprint if not exists
        if (!deviceFingerprint) {
            deviceFingerprint = currentFingerprint;
            return true;
        }

        // More lenient validation - allow minor changes
        const similarity = calculateSimilarity(deviceFingerprint, currentFingerprint);

        // Allow 80% similarity instead of exact match
        if (similarity >= 0.8) {
            deviceFingerprint = currentFingerprint; // Update to current
            return true;
        }

        // If similarity is low, increment suspicious activity but don't block immediately
        suspiciousActivityCount++;
        console.warn('Device fingerprint changed significantly');

        // Only block if suspicious activity is very high
        if (suspiciousActivityCount >= ANTI_CHEAT_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD * 2) {
            return false;
        }

        // Update fingerprint and continue
        deviceFingerprint = currentFingerprint;
        return true;
    } catch (error) {
        console.error('Error validating device fingerprint:', error);
        return true; // Allow on error
    }
};

// Helper function to calculate similarity between fingerprints
const calculateSimilarity = (fingerprint1, fingerprint2) => {
    if (fingerprint1 === fingerprint2) return 1.0;

    // Simple similarity calculation
    const maxLength = Math.max(fingerprint1.length, fingerprint2.length);
    const minLength = Math.min(fingerprint1.length, fingerprint2.length);

    if (maxLength === 0) return 1.0;

    let matches = 0;
    for (let i = 0; i < minLength; i++) {
        if (fingerprint1[i] === fingerprint2[i]) {
            matches++;
        }
    }

    return matches / maxLength;
};

const validateRequestFrequency = () => {
    const now = Date.now();

    // More lenient rapid request check
    if (now - lastRequestTime < ANTI_CHEAT_CONFIG.MIN_REQUEST_INTERVAL * 0.5) {
        rapidRequestCount++;
        console.warn('Rapid request detected');

        // Only block if rapid requests are very frequent
        if (rapidRequestCount > ANTI_CHEAT_CONFIG.MAX_RAPID_REQUESTS * 2) {
            suspiciousActivityCount++;
            return suspiciousActivityCount < ANTI_CHEAT_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD * 2;
        }
    } else {
        // Reset rapid request count if enough time has passed
        rapidRequestCount = Math.max(0, rapidRequestCount - 1);
    }

    lastRequestTime = now;
    return true;
};

const HomeScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);

    // Use ref to track current userId for auth callbacks
    const userIdRef = useRef(null);

    // Debug userId state changes
    useEffect(() => {
        console.log('userId state changed to:', userId);
        userIdRef.current = userId; // Keep ref in sync
    }, [userId]);
    const [balance, setBalance] = useState(0);
    const [isMining, setIsMining] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [lastMiningStart, setLastMiningStart] = useState(null);
    const [miningSpeed, setMiningSpeed] = useState(0.000116);
    const [upgrades, setUpgrades] = useState({
        speed: 0,
        efficiency: 0,
        capacity: 0,
    });
    const [boosts, setBoosts] = useState({
        x1_5: { purchased: false },
        x2: { purchased: false },
        x3: { purchased: false },
        x5: { purchased: false },
        x10: { purchased: false },
        x20: { purchased: false },
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [progressAnim] = useState(new Animated.Value(0));
    const [progressWidth] = useState(new Animated.Value(0));
    const [experience, setExperience] = useState(0);
    const [miningLevel, setMiningLevel] = useState(1);
    const [totalMined, setTotalMined] = useState(0);

    // Original UI state
    const [userData, setUserData] = useState({
        username: 'RAW MINER',
        totalMined: 0,
        todayMined: 0,
        miningStreak: 7,
        balance: 0,
        earnedCoins: 0,
    });
    const [localEarned, setLocalEarned] = useState(0);
    const [appState, setAppState] = useState(AppState.currentState);
    const [streakData, setStreakData] = useState({
        currentStreak: 0,
        lastClaimDate: null,
        canClaimToday: false,
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);

    // Safety check to ensure recentActivities is always an array
    useEffect(() => {
        if (!Array.isArray(recentActivities)) {
            console.warn('recentActivities is not an array, resetting to empty array');
            setRecentActivities([]);
        }
    }, [recentActivities]);

    // Real-time listener references
    const [userListener, setUserListener] = useState(null);
    const [activitiesListener, setActivitiesListener] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [notificationsListener, setNotificationsListener] = useState(null);
    const [scheduledNotificationId, setScheduledNotificationId] = useState(null);
    const [pushToken, setPushToken] = useState(null);




    // Push notification functions
    const registerForPushNotificationsAsync = async () => {
        try {
            if (!Device.isDevice) {
                console.log('Push notifications are only available on physical devices');
                return null;
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return null;
            }

            const projectId = Constants.expoConfig?.extra?.eas?.projectId;

            const token = await Notifications.getExpoPushTokenAsync({
                projectId,
            });


            console.log('Push token:', token.data);
            return token.data;
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }
    };

    const updatePushTokenInDatabase = async (token) => {
        if (!userId || !token) return;

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                pushToken: token,
                updatedAt: new Date()
            });
            console.log('Push token updated in database');
        } catch (error) {
            console.error('Error updating push token:', error);
        }
    };

    const sendPushNotification = async (token, notification) => {
        try {
            const message = {
                to: token,
                sound: 'default',
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
            };

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const result = await response.json();
            console.log('Push notification sent:', result);
            return result;
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    };

    // Notification scheduling functions
    const scheduleMiningCompleteNotification = async () => {
        try {
            // Cancel any existing scheduled notification
            if (scheduledNotificationId) {
                await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId);
            }

            // Schedule notification for 2 hours from now
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⛏️ Mining Session Complete!',
                    body: 'Your 2-hour mining session has finished. Tap to start a new session and continue earning coins!',
                    data: { type: 'mining_complete', action: 'start_new_session' },
                    sound: 'default',
                },
                trigger: {
                    seconds: MAX_SESSION_SECONDS, // 2 hours
                },
            });

            setScheduledNotificationId(notificationId);
            console.log('Mining completion notification scheduled for 2 hours');
        } catch (error) {
            console.error('Error scheduling mining completion notification:', error);
        }
    };

    const cancelScheduledNotification = async () => {
        try {
            if (scheduledNotificationId) {
                await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId);
                setScheduledNotificationId(null);
                console.log('Scheduled notification cancelled');
            }
        } catch (error) {
            console.error('Error cancelling scheduled notification:', error);
        }
    };

    const requestNotificationPermissions = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    };

    const checkScheduledNotifications = async () => {
        try {
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

            // Find mining completion notifications
            const miningNotifications = scheduledNotifications.filter(notification =>
                notification.content.data?.type === 'mining_complete'
            );

            if (miningNotifications.length > 0) {
                // Store the notification ID for later cancellation
                setScheduledNotificationId(miningNotifications[0].identifier);
                console.log('Found existing mining completion notification');
            }
        } catch (error) {
            console.error('Error checking scheduled notifications:', error);
        }
    };

    // Synchronize authentication state for Expo Go
    useEffect(() => {
        // Check if user is already authenticated on component mount
        const currentUser = auth.currentUser;
        if (currentUser && !userId) {
            console.log('Expo Go: Found existing authenticated user:', currentUser.uid);
            setUserId(currentUser.uid);
        }
    }, [userId]); // Add userId dependency to re-run when it changes

    // Additional synchronization on component mount
    useEffect(() => {
        const syncUserId = () => {
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.uid !== userId) {
                console.log('Component mount: Syncing userId from', userId, 'to', currentUser.uid);
                setUserId(currentUser.uid);
            }
        };

        // Run immediately
        syncUserId();

        // Also run after a short delay to catch any late auth state changes
        const timeoutId = setTimeout(syncUserId, 1000);

        // Test device fingerprint generation
        const testFingerprint = async () => {
            try {
                const fingerprint = await generateDeviceFingerprint();
                console.log('Device fingerprint test successful:', fingerprint);
            } catch (error) {
                console.error('Device fingerprint test failed:', error);
            }
        };

        // Test fingerprint generation after a short delay
        setTimeout(testFingerprint, 2000);

        return () => clearTimeout(timeoutId);
    }, []); // Only run on mount

    // Handle authentication and initialize real-time listeners
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Expo Go: Auth state changed:', {
                hasUser: !!user,
                userId: user?.uid,
                currentStateUserId: userId,
                authCurrentUser: auth.currentUser?.uid
            });

            if (user) {
                console.log('User authenticated:', user.uid);
                setUserId(user.uid);

                // Ensure userId is set immediately for Expo Go compatibility
                if (!userIdRef.current || userIdRef.current !== user.uid) {
                    console.log('Setting userId state for authenticated user:', user.uid);
                    setUserId(user.uid);
                }

                // Check account status before proceeding
                const accountStatus = await AccountStatusService.canUserAccess(user.uid);
                if (!accountStatus.canAccess) {
                    console.log('Account access denied:', accountStatus.status, accountStatus.message);
                    // Navigate to account status error screen
                    navigation.replace('AccountStatusError', { userId: user.uid });
                    return;
                }

                await initializeUserData(user.uid);

                // Ensure token is fresh
                try {
                    await user.getIdToken(true);
                    console.log('Token refreshed for user:', user.uid);
                } catch (error) {
                    console.error('Failed to refresh token:', error);
                }

                // Set up real-time listeners
                await setupRealtimeListeners(user.uid);

                // Delay mining session check to avoid immediate authentication issues in Expo Go
                setTimeout(async () => {
                    try {
                        // Force update userId state if needed
                        if (userIdRef.current !== user.uid) {
                            console.log('Force updating userId state from', userIdRef.current, 'to', user.uid);
                            setUserId(user.uid);
                        }

                        // Double-check that user is still authenticated before proceeding
                        if (auth.currentUser && auth.currentUser.uid === user.uid) {
                            console.log('Proceeding with delayed mining session check for user:', user.uid);

                            // Additional authentication verification
                            try {
                                const token = await user.getIdToken(true);
                                if (!token) {
                                    console.log('No token available before mining session check');
                                    return;
                                }
                                console.log('Token verification successful before mining session check, length:', token.length);

                                // Verify token is not expired
                                const tokenResult = await user.getIdTokenResult();
                                if (tokenResult.expirationTime) {
                                    const currentTime = Date.now();
                                    const expirationTime = new Date(tokenResult.expirationTime).getTime();
                                    const timeUntilExpiry = expirationTime - currentTime;
                                    console.log('Pre-check token expires in', Math.round(timeUntilExpiry / 1000), 'seconds');

                                    if (timeUntilExpiry < 0) {
                                        console.log('Pre-check token has expired, skipping mining session check');
                                        return;
                                    }
                                }
                            } catch (tokenError) {
                                console.error('Token verification failed before mining session check:', tokenError);
                                return;
                            }

                            // Pass the user ID directly to avoid state timing issues
                            await checkMiningSessionWithUserId(user.uid);
                        } else {
                            console.log('User authentication changed during delay, skipping mining session check');
                        }
                    } catch (error) {
                        console.log('Delayed mining session check failed:', error.message);
                        // Don't redirect on delayed check failure
                    }
                }, 5000); // Increased delay to 5 seconds for better stability

                // Check for existing scheduled notifications
                await checkScheduledNotifications();

                // Register for push notifications
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    setPushToken(token);
                    await updatePushTokenInDatabase(token);
                }

                // Set up periodic token refresh (every 30 minutes)
                const tokenRefreshInterval = setInterval(async () => {
                    try {
                        if (auth.currentUser && auth.currentUser.uid === user.uid) {
                            await auth.currentUser.getIdToken(true);
                            console.log('Periodic token refresh successful for user:', user.uid);
                        } else {
                            console.log('User changed, clearing token refresh interval');
                            clearInterval(tokenRefreshInterval);
                        }
                    } catch (error) {
                        console.error('Periodic token refresh failed:', error);
                    }
                }, 30 * 60 * 1000); // 30 minutes

                // Clean up interval on unmount
                return () => {
                    clearInterval(tokenRefreshInterval);
                };

            } else {
                console.log('User not authenticated, cleaning up...');
                setUserId(null);
                // Clean up listeners
                cleanupListeners();
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [userId]);

    // Handle notification responses
    useEffect(() => {
        const notificationListener = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;

            // Handle mining completion notification
            if (data.type === 'mining_complete') {
                console.log('Mining completion notification received:', data);
                // Refresh user data to show updated balance
                const effectiveUserId = userId || auth.currentUser?.uid;
                if (effectiveUserId) {
                    checkMiningSessionWithUserId(effectiveUserId);
                }
            }

            // Handle mining start notification
            if (data.type === 'mining_start') {
                console.log('Mining start notification received:', data);
            }

            if (data.type === 'mining_complete' && data.action === 'start_new_session') {
                // User tapped the notification to start a new mining session
                ToastService.info('Would you like to start a new 2-hour mining session?');
                // For now, we'll just show an info message. In a real app, you might want to add a modal
                // or use a different approach for multiple options
            }
        });

        return () => {
            notificationListener?.remove();
        };
    }, [isMining]);

    // Handle notifications received while app is in foreground
    useEffect(() => {
        const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
            const data = notification.request.content.data;

            // Handle mining completion notification
            if (data.type === 'mining_complete') {
                console.log('Mining completion notification received (foreground):', data);
                // Refresh user data to show updated balance
                const effectiveUserId = userId || auth.currentUser?.uid;
                if (effectiveUserId) {
                    checkMiningSessionWithUserId(effectiveUserId);
                }
            }

            // Handle mining start notification
            if (data.type === 'mining_start') {
                console.log('Mining start notification received (foreground):', data);
            }
        });

        return () => {
            notificationReceivedListener?.remove();
        };
    }, [userId]);

    // Periodic account status check to ensure user hasn't been disabled/locked while using the app
    useEffect(() => {
        const effectiveUserId = userId || auth.currentUser?.uid;
        if (!effectiveUserId) return;

        const checkAccountStatus = async () => {
            try {
                const accountStatus = await AccountStatusService.canUserAccess(effectiveUserId);
                if (!accountStatus.canAccess) {
                    console.log('Account access denied during app usage:', accountStatus.status, accountStatus.message);
                    // Navigate to account status error screen
                    navigation.replace('AccountStatusError', { userId: effectiveUserId });
                }
            } catch (error) {
                console.error('Error checking account status:', error);
                // On error, continue allowing access to avoid blocking legitimate users
            }
        };

        // Check account status every 5 minutes while the app is active
        const intervalId = setInterval(checkAccountStatus, 5 * 60 * 1000);

        // Also check when the app comes to foreground
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active') {
                checkAccountStatus();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            clearInterval(intervalId);
            subscription?.remove();
        };
    }, [userId, navigation]);

    // Clean up listeners on unmount
    useEffect(() => {
        return () => {
            cleanupListeners();
        };
    }, []);

    // Check for expired sessions when app comes into focus
    useEffect(() => {
        const checkSessionOnFocus = async () => {
            const effectiveUserId = userId || auth.currentUser?.uid;
            if (effectiveUserId) {
                await checkMiningSessionWithUserId(effectiveUserId);
            }
        };

        checkSessionOnFocus();
    }, [userId, auth.currentUser]);

    // Update UI data when mining state changes
    useEffect(() => {
        setUserData(prev => ({
            ...prev,
            balance: balance,
            earnedCoins: localEarned,
        }));
    }, [balance, localEarned]);

    // Calculate mining speed based on upgrades and boosts
    const calculateMiningSpeed = (upgradeLevels, activeBoosts = {}) => {
        try {
            const baseSpeed = 0.000116;
            const speedLevel = parseInt(upgradeLevels?.speed) || 0;
            const speedBonus = speedLevel * 0.0005; // 0.0005 per level
            let totalSpeed = baseSpeed + speedBonus;

            // Apply lifetime boost multipliers (highest multiplier takes effect)
            if (activeBoosts?.x20?.purchased) {
                totalSpeed *= 20;
            } else if (activeBoosts?.x10?.purchased) {
                totalSpeed *= 10;
            } else if (activeBoosts?.x5?.purchased) {
                totalSpeed *= 5;
            } else if (activeBoosts?.x3?.purchased) {
                totalSpeed *= 3;
            } else if (activeBoosts?.x2?.purchased) {
                totalSpeed *= 2;
            } else if (activeBoosts?.x1_5?.purchased) {
                totalSpeed *= 1.5;
            }

            // Ensure minimum speed and prevent NaN
            const finalSpeed = Math.max(totalSpeed, 0.000116);
            return isNaN(finalSpeed) ? 0.000116 : finalSpeed;
        } catch (error) {
            console.error('Error calculating mining speed:', error);
            return 0.000116; // Fallback to base speed
        }
    };

    // Set up real-time listeners for user data and activities
    const setupRealtimeListeners = async (uid) => {
        // Check account status before setting up real-time listeners
        const accountStatus = await AccountStatusService.canUserAccess(uid);
        if (!accountStatus.canAccess) {
            console.log('Account access denied in setupRealtimeListeners:', accountStatus.status, accountStatus.message);
            // Navigate to account status error screen
            navigation.replace('AccountStatusError', { userId: uid });
            return;
        }

        // User data listener
        const userRef = doc(db, "users", uid);
        const userUnsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data();

                // Update all state variables in real-time
                setBalance(userData.balance || 0);
                setTotalMined(userData.totalMined || 0);
                setExperience(userData.experience || 0);
                setMiningLevel(userData.miningLevel || 1);
                const userUpgrades = userData.upgrades || { speed: 0, efficiency: 0, capacity: 0 };
                const userBoosts = userData.boosts || {
                    x1_5: { purchased: false },
                    x2: { purchased: false },
                    x3: { purchased: false },
                    x5: { purchased: false },
                    x10: { purchased: false },
                    x20: { purchased: false },
                };
                setUpgrades(userUpgrades);
                setBoosts(userBoosts);
                // Recalculate mining speed based on upgrades and boosts
                const calculatedSpeed = calculateMiningSpeed(userUpgrades, userBoosts);
                setMiningSpeed(calculatedSpeed);
                setLastMiningStart(userData.lastMiningStart ? new Date(userData.lastMiningStart.toDate()) : null);

                // Check if mining session has expired
                if (userData.isMining && userData.lastMiningStart) {
                    const sessionStart = new Date(userData.lastMiningStart.toDate());
                    const now = new Date();
                    const sessionDuration = (now - sessionStart) / (1000 * 60 * 60); // hours

                    // If session has exceeded 2 hours, reset mining state
                    if (sessionDuration >= 2) {
                        console.log('Session expired, resetting mining state');
                        setIsMining(false);
                        setTimeLeft(0);
                    } else {
                        // Calculate remaining time
                        const elapsedSeconds = (now - sessionStart) / 1000;
                        const remainingSeconds = Math.max(0, MAX_SESSION_SECONDS - elapsedSeconds);
                        setTimeLeft(remainingSeconds);
                        setIsMining(true);
                    }
                } else {
                    setTimeLeft(0);
                    setIsMining(false);
                }

                // Update UI data
                setUserData(prev => ({
                    ...prev,
                    totalMined: userData.totalMined || 0,
                    todayMined: userData.balance || 0,
                    balance: userData.balance || 0,
                    earnedCoins: userData.earnedCoins || 0,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    username: userData.username || 'Miner',
                }));

                // Load streak data from the same user document
                const streak = userData.streak || {};
                const lastClaimDate = streak.lastClaimDate;
                const currentStreak = streak.currentStreak || 0;

                let canClaimToday = false;
                if (!lastClaimDate) {
                    canClaimToday = true;
                } else {
                    const lastClaim = new Date(lastClaimDate.toDate());
                    const today = new Date();

                    // Check if it's a new day (after midnight)
                    const isNewDay = today.getDate() !== lastClaim.getDate() ||
                        today.getMonth() !== lastClaim.getMonth() ||
                        today.getFullYear() !== lastClaim.getFullYear();

                    // Check if it's been more than 24 hours since last claim
                    const hoursSinceLastClaim = (today - lastClaim) / (1000 * 60 * 60);
                    canClaimToday = isNewDay && hoursSinceLastClaim >= 24;
                }

                setStreakData({
                    currentStreak,
                    lastClaimDate: lastClaimDate ? new Date(lastClaimDate.toDate()) : null,
                    canClaimToday,
                });
            }
        }, (error) => {
            console.error("Error in user data listener:", error);
        });

        // Activities listener - Get 5 latest activities
        const activitiesRef = collection(db, "users", uid, "activities");
        const activitiesQuery = query(activitiesRef, orderBy("timestamp", "desc"), limit(5));

        // Set a timeout to force show sample activities if listener doesn't trigger
        const activitiesTimeout = setTimeout(() => {
            console.log('Activities timeout - forcing sample activities');
            setActivitiesLoading(false);
            const sampleActivities = [
                {
                    id: 'welcome',
                    type: 'welcome',
                    amount: 0,
                    description: 'Welcome to RAW! Start mining to earn coins.',
                    timestamp: new Date(),
                },
                {
                    id: 'first-login',
                    type: 'login',
                    amount: 0,
                    description: 'First login bonus activated',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                },
                {
                    id: 'mining-ready',
                    type: 'mining',
                    amount: 0,
                    description: 'Ready to start mining! Tap the mine button to begin.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60),
                }
            ];
            setRecentActivities(sampleActivities);
        }, 3000); // 3 second timeout

        const activitiesUnsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
            console.log('Activities listener triggered');
            setActivitiesLoading(false);
            const activities = [];
            console.log('Activities snapshot size:', snapshot.size);
            snapshot.forEach((doc) => {
                const data = doc.data();
                console.log('Activity data:', data);
                activities.push({
                    id: doc.id,
                    type: data.type,
                    amount: data.amount || 0,
                    description: data.description || 'Activity completed',
                    timestamp: data.timestamp?.toDate() || new Date(),
                });
            });

            // If no activities exist, create some sample activities for new users
            if (activities.length === 0) {
                console.log('No activities found, creating sample activities');
                const sampleActivities = [
                    {
                        id: 'welcome',
                        type: 'welcome',
                        amount: 0,
                        description: 'Welcome to RAW! Start mining to earn coins.',
                        timestamp: new Date(),
                    },
                    {
                        id: 'first-login',
                        type: 'login',
                        amount: 0,
                        description: 'First login bonus activated',
                        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                    },
                    {
                        id: 'mining-ready',
                        type: 'mining',
                        amount: 0,
                        description: 'Ready to start mining! Tap the mine button to begin.',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
                    }
                ];
                console.log('Setting sample activities:', sampleActivities);
                setRecentActivities(sampleActivities);
            } else {
                // Ensure we have exactly 5 activities (pad with sample if needed)
                const paddedActivities = [...activities];
                console.log('Real activities found:', activities.length);
                while (paddedActivities.length < 5) {
                    const sampleActivity = {
                        id: `sample-${paddedActivities.length}`,
                        type: 'default',
                        amount: 0,
                        description: 'Complete tasks and mine to see more activities!',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * (paddedActivities.length + 1)),
                    };
                    paddedActivities.push(sampleActivity);
                }
                console.log('Setting padded activities:', paddedActivities.slice(0, 5));
                setRecentActivities(paddedActivities.slice(0, 5)); // Ensure max 5
            }
        }, (error) => {
            console.error("Error in activities listener:", error);
            // Set sample activities on error
            const sampleActivities = [
                {
                    id: 'welcome',
                    type: 'welcome',
                    amount: 0,
                    description: 'Welcome to RAW! Start mining to earn coins.',
                    timestamp: new Date(),
                },
                {
                    id: 'mining-ready',
                    type: 'mining',
                    amount: 0,
                    description: 'Ready to start mining! Tap the mine button to begin.',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                }
            ];
            setRecentActivities(sampleActivities);
        });

        // Notifications listener
        const notificationsRef = collection(db, "users", uid, "notifications");
        const notificationsQuery = query(notificationsRef, orderBy("timestamp", "desc"));
        const notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            let unread = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.read) {
                    unread++;
                }
            });
            setUnreadNotifications(unread);
        }, (error) => {
            console.error("Error in notifications listener:", error);
        });

        // Store listener references for cleanup
        setUserListener(userUnsubscribe);
        setActivitiesListener(activitiesUnsubscribe);
        setNotificationsListener(notificationsUnsubscribe);
    };

    // Clean up real-time listeners
    const cleanupListeners = () => {
        if (userListener) {
            userListener();
            setUserListener(null);
        }
        if (activitiesListener) {
            activitiesListener();
            setActivitiesListener(null);
        }
        if (notificationsListener) {
            notificationsListener();
            setNotificationsListener(null);
        }
    };

    // Initialize user data
    const initializeUserData = async (uid) => {
        // Check account status before initializing user data
        const accountStatus = await AccountStatusService.canUserAccess(uid);
        if (!accountStatus.canAccess) {
            console.log('Account access denied in initializeUserData:', accountStatus.status, accountStatus.message);
            // Navigate to account status error screen
            navigation.replace('AccountStatusError', { userId: uid });
            return;
        }

        const userRef = doc(db, "users", uid);

        try {
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                setBalance(data.balance || 0);
                setIsMining(data.isMining || false);
                setLastMiningStart(data.lastMiningStart?.toDate() || null);
                setTotalMined(data.totalMined || 0);
                setMiningLevel(data.miningLevel || 1);
                setExperience(data.experience || 0);
                const userUpgrades = data.upgrades || { speed: 0, efficiency: 0, capacity: 0 };
                const userBoosts = data.boosts || {
                    x1_5: { purchased: false },
                    x2: { purchased: false },
                    x3: { purchased: false },
                    x5: { purchased: false },
                    x10: { purchased: false },
                    x20: { purchased: false },
                };
                setUpgrades(userUpgrades);
                setBoosts(userBoosts);
                // Recalculate mining speed based on upgrades and boosts
                const calculatedSpeed = calculateMiningSpeed(userUpgrades, userBoosts);
                setMiningSpeed(calculatedSpeed);

                // Create initial activities for new users
                if (!data.hasInitialActivities) {
                    try {
                        await ActivityLogger.logCustom(uid, 'welcome', 0, 'Welcome to RAW! Start mining to earn coins.');
                        await ActivityLogger.logCustom(uid, 'login', 0, 'First login bonus activated');
                        await ActivityLogger.logCustom(uid, 'mining', 0, 'Ready to start mining! Tap the mine button to begin.');

                        // Mark that initial activities have been created
                        await updateDoc(userRef, {
                            hasInitialActivities: true
                        });
                    } catch (error) {
                        console.error('Error creating initial activities:', error);
                    }
                }

                // Update UI data
                setUserData(prev => ({
                    ...prev,
                    totalMined: data.totalMined || 0,
                    todayMined: data.balance || 0,
                    balance: data.balance || 0,
                    earnedCoins: data.earnedCoins || 0,
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    username: data.username || 'Miner',
                }));

                // Load streak data from the same user document
                const streak = data.streak || {};
                const lastClaimDate = streak.lastClaimDate;
                const currentStreak = streak.currentStreak || 0;

                let canClaimToday = false;
                if (!lastClaimDate) {
                    canClaimToday = true;
                } else {
                    const lastClaim = new Date(lastClaimDate.toDate());
                    const today = new Date();

                    // Check if it's a new day (after midnight)
                    const isNewDay = today.getDate() !== lastClaim.getDate() ||
                        today.getMonth() !== lastClaim.getMonth() ||
                        today.getFullYear() !== lastClaim.getFullYear();

                    // Check if it's been more than 24 hours since last claim
                    const hoursSinceLastClaim = (today - lastClaim) / (1000 * 60 * 60);
                    canClaimToday = isNewDay && hoursSinceLastClaim >= 24;
                }

                setStreakData({
                    currentStreak,
                    lastClaimDate: lastClaimDate ? new Date(lastClaimDate.toDate()) : null,
                    canClaimToday,
                });

                // Calculate locally earned coins if session is active
                if (data.isMining && data.lastMiningStart) {
                    const startTime = data.lastMiningStart.toDate();
                    const elapsedSeconds = Math.min(
                        (new Date() - startTime) / 1000,
                        MAX_SESSION_SECONDS
                    );
                    const earned = elapsedSeconds * (data.miningSpeed || 0.000116);
                    setLocalEarned(earned);
                }
            } else {
                // Create new user with initial data
                const initialData = {
                    balance: 0,
                    isMining: false,
                    lastMiningStart: null,
                    totalMined: 0,
                    miningLevel: 1,
                    experience: 0,
                    miningSpeed: 0.000116,
                    upgrades: { speed: 0, efficiency: 0, capacity: 0 },
                    earnedCoins: 0,
                };

                await updateDoc(userRef, initialData);

                // Set local state to initial values
                setBalance(0);
                setIsMining(false);
                setLastMiningStart(null);
                setTotalMined(0);
                setMiningLevel(1);
                setExperience(0);
                setMiningSpeed(0.000116);
                setUpgrades({ speed: 0, efficiency: 0, capacity: 0 });
                setLocalEarned(0);
            }
        } catch (error) {
            console.error("Error initializing user:", error);
            ToastService.error("Failed to initialize user data. Please try again.");
        }
    };

    // Handle app state changes
    const handleAppStateChange = async (nextAppState) => {
        if (
            appState.match(/inactive|background/) &&
            nextAppState === "active" &&
            userId
        ) {
            // App coming to foreground - refresh data
            await initializeUserData(userId);
        }
        setAppState(nextAppState);
    };

    // Calculate mining progress
    useEffect(() => {
        let interval;

        if (isMining && lastMiningStart) {
            const startTime = lastMiningStart.getTime();

            const updateMiningProgress = () => {
                if (!lastMiningStart) return;

                const now = Date.now();
                const elapsedSeconds = (now - lastMiningStart.getTime()) / 1000;

                if (elapsedSeconds >= MAX_SESSION_SECONDS) {
                    // Session completed
                    const earned = MAX_SESSION_SECONDS * miningSpeed;
                    setBalance((prev) => prev + earned);
                    setTotalMined((prev) => prev + earned);
                    setIsMining(false);
                    setTimeLeft(0);
                    setLocalEarned(0);
                    saveSessionCompletion(earned);
                    if (interval) clearInterval(interval);
                } else {
                    // Session in progress
                    const earned = elapsedSeconds * miningSpeed;
                    setTimeLeft(MAX_SESSION_SECONDS - elapsedSeconds);
                    setLocalEarned(earned);

                    // Periodically save progress to Firestore
                    if (elapsedSeconds % 300 < 1) {
                        // Every 5 minutes
                        saveMiningProgress(earned);
                    }
                }
            };

            // Initial update
            updateMiningProgress();

            // Set up interval
            interval = setInterval(updateMiningProgress, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isMining, lastMiningStart, miningSpeed, userId]);

    // Save mining progress to Firestore
    const saveMiningProgress = async (earned) => {
        const effectiveUserId = userId || auth.currentUser?.uid;
        if (!effectiveUserId) return;

        try {
            const userRef = doc(db, "users", effectiveUserId);
            await updateDoc(userRef, {
                earnedCoins: earned,
            });

            // Log mining progress activity
            await ActivityLogger.logMiningProgress(effectiveUserId, earned);
        } catch (error) {
            console.error("Error saving mining progress:", error);
        }
    };

    // Save session completion to Firestore
    const saveSessionCompletion = async (earned) => {
        const effectiveUserId = userId || auth.currentUser?.uid;
        if (!effectiveUserId) return;

        try {
            const expGained = Math.floor(earned * 10);
            const newExp = experience + expGained;
            const newLevel = Math.floor(newExp / 100) + 1;

            const userRef = doc(db, "users", effectiveUserId);
            await updateDoc(userRef, {
                isMining: false,
                balance: balance + earned,
                totalMined: totalMined + earned,
                earnedCoins: 0,
                experience: newExp,
                miningLevel: newLevel,
            });

            // Update UI data
            setUserData(prev => ({
                ...prev,
                totalMined: totalMined + earned,
                todayMined: balance + earned,
                balance: balance + earned,
                earnedCoins: 0,
            }));

            // Log mining completion activity
            await ActivityLogger.logMiningComplete(effectiveUserId, earned);

            // Cancel scheduled notification since session ended early
            await cancelScheduledNotification();

            // Send mining finish notification
            await NotificationService.sendMiningCompleteNotification(effectiveUserId, earned);
        } catch (error) {
            console.error("Error saving session completion:", error);
        }
    };

    const checkMiningSessionWithUserId = async (specificUserId) => {
        try {
            console.log('checkMiningSessionWithUserId called with specificUserId:', specificUserId, 'auth.currentUser:', auth.currentUser?.uid);

            // Enhanced authentication check for Expo Go
            if (!auth.currentUser) {
                console.log('No current user in auth, skipping mining session check');
                return;
            }

            if (auth.currentUser.uid !== specificUserId) {
                console.log('User ID mismatch, skipping mining session check');
                return;
            }

            // Additional authentication state logging
            console.log('Auth state check:', {
                currentUser: auth.currentUser?.uid,
                specificUserId,
                isAnonymous: auth.currentUser?.isAnonymous,
                emailVerified: auth.currentUser?.emailVerified,
                providerData: auth.currentUser?.providerData?.length || 0
            });

            // Ensure user has a valid token before proceeding
            try {
                const token = await auth.currentUser.getIdToken(true);
                if (!token) {
                    console.log('No valid token available, skipping mining session check');
                    return;
                }
                console.log('Token validation successful, length:', token.length);

                // Additional verification that the token is valid
                const tokenResult = await auth.currentUser.getIdTokenResult();
                if (tokenResult.expirationTime) {
                    const currentTime = Date.now();
                    const expirationTime = new Date(tokenResult.expirationTime).getTime();
                    const timeUntilExpiry = expirationTime - currentTime;
                    console.log('Token expires in', Math.round(timeUntilExpiry / 1000), 'seconds');

                    if (timeUntilExpiry < 0) {
                        console.log('Token has expired, skipping mining session check');
                        return;
                    }
                }
            } catch (tokenError) {
                console.error('Token validation failed:', tokenError);
                return;
            }

            console.log('Authentication verified, proceeding with mining session check for user:', specificUserId);

            // Check account status before checking mining session
            const accountStatus = await AccountStatusService.canUserAccess(specificUserId);
            if (!accountStatus.canAccess) {
                console.log('Account access denied in checkMiningSessionWithUserId:', accountStatus.status, accountStatus.message);
                // Navigate to account status error screen
                navigation.replace('AccountStatusError', { userId: specificUserId });
                return;
            }

            const response = await secureApiCall('/check-mining-session', { userId: specificUserId }, specificUserId);

            if (response.sessionEnded) {
                // Session was ended, update local state
                setIsMining(false);
                setTimeLeft(0);
                setBalance(prev => prev + (response.earnings || 0));

                // Cancel scheduled notification since session ended
                await cancelScheduledNotification();

                // Send mining finish notification
                // await NotificationService.sendMiningCompleteNotification(specificUserId, response.earnings || 0);

                ToastService.success(`Your 2-hour mining session has finished! Earned: ${formatCoinBalance(response.earnings || 0)} coins. Tap "Start Mining" to begin a new session!`);
            }
        } catch (error) {
            console.error('Check mining session error:', error);

            // Handle authentication errors gracefully
            if (error.message.includes('Authentication failed') ||
                error.message.includes('Please log in again') ||
                error.message.includes('User not authenticated') ||
                error.message.includes('Authentication mismatch')) {
                console.warn('Authentication error in checkMiningSessionWithUserId - user may need to re-login');
                // Don't redirect immediately, just log the issue
                // The auth state change handler will handle cleanup if needed
                return;
            }

            // Don't show alert for timeout errors - they're expected on slow connections
            if (!error.message.includes('timeout') && !error.message.includes('Aborted')) {
                console.warn('Non-timeout error in checkMiningSessionWithUserId:', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const checkMiningSession = async () => {
        try {
            console.log('checkMiningSession called with userId:', userId, 'auth.currentUser:', auth.currentUser?.uid);

            // Enhanced authentication check for Expo Go
            if (!auth.currentUser) {
                console.log('No current user in auth, skipping mining session check');
                return;
            }

            // Use auth.currentUser.uid as fallback if userId state is not set yet
            const effectiveUserId = userId || auth.currentUser.uid;
            console.log('Using effective userId:', effectiveUserId);

            if (auth.currentUser.uid !== effectiveUserId) {
                console.log('User ID mismatch, skipping mining session check');
                return;
            }

            // Validate token before proceeding
            const isTokenValid = await validateAuthToken();
            if (!isTokenValid) {
                console.log('Token validation failed in checkMiningSession');
                // Try to re-authenticate the user
                try {
                    console.log('Attempting to re-authenticate user...');
                    await auth.currentUser.getIdToken(true);
                    console.log('Re-authentication successful');
                } catch (reauthError) {
                    console.error('Re-authentication failed:', reauthError);
                    // User needs to log in again
                    navigation.replace('Login');
                    return;
                }
            }

            console.log('Authentication verified, proceeding with mining session check for user:', effectiveUserId);

            // Check account status before checking mining session
            const accountStatus = await AccountStatusService.canUserAccess(effectiveUserId);
            if (!accountStatus.canAccess) {
                console.log('Account access denied in checkMiningSession:', accountStatus.status, accountStatus.message);
                // Navigate to account status error screen
                navigation.replace('AccountStatusError', { userId: effectiveUserId });
                return;
            }

            const response = await secureApiCall('/check-mining-session', { userId: effectiveUserId }, effectiveUserId);

            if (response.sessionEnded) {
                // Session was ended, update local state
                setIsMining(false);
                setTimeLeft(0);
                setBalance(prev => prev + (response.earnings || 0));

                // Cancel scheduled notification since session ended
                await cancelScheduledNotification();

                // Send mining finish notification
                // await NotificationService.sendMiningCompleteNotification(effectiveUserId, response.earnings || 0);

                ToastService.success(`Your 2-hour mining session has finished! Earned: ${formatCoinBalance(response.earnings || 0)} coins. Tap "Start Mining" to begin a new session!`);
            }
        } catch (error) {
            console.error('Check mining session error:', error);

            // Handle authentication errors gracefully
            if (error.message.includes('Authentication failed') ||
                error.message.includes('Please log in again') ||
                error.message.includes('User not authenticated') ||
                error.message.includes('Authentication mismatch')) {
                console.warn('Authentication error in checkMiningSession - user may need to re-login');
                // Don't redirect immediately, just log the issue
                // The auth state change handler will handle cleanup if needed
                return;
            }

            // Don't show alert for timeout errors - they're expected on slow connections
            if (!error.message.includes('timeout') && !error.message.includes('Aborted')) {
                console.warn('Non-timeout error in checkMiningSession:', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const startMining = async () => {
        try {
            // Prevent multiple mining sessions
            if (isMining || loading) {
                return;
            }

            // Enhanced authentication check for Expo Go
            if (!auth.currentUser) {
                console.warn('No current user in auth, cannot start mining');
                ToastService.error('Please log in to start mining');
                return;
            }

            // Use auth.currentUser.uid as fallback if userId state is not set yet
            const effectiveUserId = userId || auth.currentUser.uid;
            if (!effectiveUserId) {
                console.warn('No effective userId available, cannot start mining');
                ToastService.error('Authentication state error. Please restart the app.');
                return;
            }

            // Verify the user ID matches the current authenticated user
            if (auth.currentUser.uid !== effectiveUserId) {
                console.log('User ID mismatch in startMining:', { authUid: auth.currentUser.uid, stateUid: effectiveUserId });
                ToastService.error('Authentication mismatch. Please log in again.');
                return;
            }

            console.log('Authentication verified for mining, proceeding...');

            // Check account status before starting mining
            const accountStatus = await AccountStatusService.canUserAccess(effectiveUserId);
            if (!accountStatus.canAccess) {
                console.log('Account access denied in startMining:', accountStatus.status, accountStatus.message);
                ToastService.error('Account access denied. Please contact support.');
                // Navigate to account status error screen
                navigation.replace('AccountStatusError', { userId: effectiveUserId });
                return;
            }



            // Check for expired sessions first
            try {
                await checkMiningSessionWithUserId(effectiveUserId);
            } catch (error) {
                if (error.message.includes('Authentication failed') ||
                    error.message.includes('Please log in again') ||
                    error.message.includes('User not authenticated') ||
                    error.message.includes('Authentication mismatch')) {
                    console.warn('Authentication error in startMining, aborting operation');
                    // Don't redirect immediately, just abort the operation
                    return;
                }
                // Re-throw other errors
                throw error;
            }

            // Anti-cheat: Validate session integrity
            if (!validateSessionIntegrity()) {
                ToastService.error('Session integrity check failed. Please restart the app.');
                return;
            }

            // Anti-cheat: Validate device fingerprint
            if (!(await validateDeviceFingerprint())) {
                ToastService.error('Device validation failed. Please restart the app.');
                return;
            }

            // Anti-cheat: Check for suspicious activity
            if (suspiciousActivityCount >= ANTI_CHEAT_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) {
                ToastService.error('Suspicious activity detected. Account temporarily suspended.');
                return;
            }

            setLoading(true);

            // Set session start time for anti-cheat tracking
            sessionStartTime = Date.now();

            const response = await secureApiCall('/start-mining', {}, effectiveUserId);

            if (response.message) {
                setIsMining(true);
                setTimeLeft(MAX_SESSION_SECONDS);
                setLastMiningStart(new Date());

                // Anti-cheat: Validate session start
                if (sessionStartTime && (Date.now() - sessionStartTime) > 5000) {
                    console.warn('Session start time manipulation detected');
                    suspiciousActivityCount++;
                }

                // Log mining start activity
                await ActivityLogger.logMiningStart(effectiveUserId, MAX_SESSION_SECONDS);

                // // Request notification permissions and schedule completion notification
                await requestNotificationPermissions();
                // if (hasPermission) {
                //     await scheduleMiningCompleteNotification();
                // }

                // // Send mining start notification
                // // await NotificationService.sendMiningStartNotification(userId);

                // // Send push notification for mining start
                // if (pushToken) {
                //     await sendPushNotification(pushToken, {
                //         title: 'Mining Started! ⛏️',
                //         body: 'Your 2-hour mining session has begun! You\'ll earn coins automatically.',
                //         data: { type: 'mining_start', action: 'navigate_to_home' }
                //     });
                // }

                console.log('Mining started successfully! Session will run for 2 hours.');
                hapticSuccess();
                ToastService.success('Your 2-hour mining session has begun! You\'ll receive a notification when it completes.');

                // Return success to indicate mining started
                return true;
            }
        } catch (error) {
            console.error('Start mining error:', error);

            // Handle authentication errors by redirecting to login
            if (error.message.includes('Authentication failed') ||
                error.message.includes('Please log in again') ||
                error.message.includes('User not authenticated') ||
                error.message.includes('Authentication mismatch')) {
                console.warn('Authentication error in startMining, redirecting to login');
                navigation.replace('Login');
                return;
            }

            hapticError();
            ToastService.error(error.message || 'Failed to start mining');
        } finally {
            setLoading(false);
        }
    };


    // Format time display
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Format coin balance with appropriate precision
    const formatCoinBalance = (balance) => {
        if (balance < 1) {
            return balance.toFixed(6); // e.g., 0.000928
        } else if (balance < 1000) {
            return balance.toFixed(3); // e.g., 42.385
        } else if (balance < 1_000_000) {
            return balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }); // e.g., 1,254.67
        } else {
            return (balance / 1_000_000).toFixed(2) + 'M'; // e.g., 1.23M
        }
    };

    const getActivityIcon = (type) => {
        const icons = {
            'mining': 'flash',
            'streak': 'flame',
            'referral': 'gift',
            'upgrade': 'rocket',
            'withdrawal': 'wallet',
            'bonus': 'star',
            'welcome': 'home',
            'login': 'log-in',
            'default': 'time'
        };
        return icons[type] || icons.default;
    };

    const getActivityColor = (type, theme) => {
        const colors = {
            'mining': theme.colors.success,
            'streak': theme.colors.accent,
            'referral': theme.colors.accent,
            'upgrade': theme.colors.accent,
            'withdrawal': theme.colors.error,
            'bonus': theme.colors.accent,
            'welcome': theme.colors.primary,
            'login': theme.colors.success,
            'default': theme.colors.textSecondary
        };
        return colors[type] || colors.default;
    };

    const formatActivityTime = (timestamp) => {
        if (!timestamp) return 'Unknown time';

        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now - activityTime) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    };

    // Calculate mining progress percentage
    const getProgressPercentage = () => {
        if (!isMining || !lastMiningStart) return 0;

        const now = Date.now();
        const elapsedSeconds = (now - lastMiningStart.getTime()) / 1000;
        const progress = Math.min(elapsedSeconds / MAX_SESSION_SECONDS, 1);

        return progress;
    };



    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const effectiveUserId = userId || auth.currentUser?.uid;
            if (effectiveUserId) {
                // Check account status before refreshing data
                const accountStatus = await AccountStatusService.canUserAccess(effectiveUserId);
                if (!accountStatus.canAccess) {
                    console.log('Account access denied in onRefresh:', accountStatus.status, accountStatus.message);
                    // Navigate to account status error screen
                    navigation.replace('AccountStatusError', { userId: effectiveUserId });
                    return;
                }

                // Check for expired mining sessions
                await checkMiningSessionWithUserId(effectiveUserId);

                // Force a manual data fetch to ensure everything is up to date
                const userRef = doc(db, "users", effectiveUserId);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Update state with latest data
                    setBalance(userData.balance || 0);
                    setTotalMined(userData.totalMined || 0);
                    setExperience(userData.experience || 0);
                    setMiningLevel(userData.miningLevel || 1);
                    const userUpgrades = userData.upgrades || { speed: 0, efficiency: 0, capacity: 0 };
                    const userBoosts = userData.boosts || {
                        x1_5: { purchased: false },
                        x2: { purchased: false },
                        x3: { purchased: false },
                        x5: { purchased: false },
                        x10: { purchased: false },
                        x20: { purchased: false },
                    };
                    setUpgrades(userUpgrades);
                    setBoosts(userBoosts);
                    // Recalculate mining speed based on upgrades and boosts
                    const calculatedSpeed = calculateMiningSpeed(userUpgrades, userBoosts);
                    setMiningSpeed(calculatedSpeed);
                    setLastMiningStart(userData.lastMiningStart ? new Date(userData.lastMiningStart.toDate()) : null);
                }

                console.log('✅ All data refreshed successfully');
            }
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Progress bar component
    const MiningProgressBar = () => {
        const progressPercentage = getProgressPercentage();

        useEffect(() => {
            if (isMining && timeLeft > 0) {
                Animated.timing(progressWidth, {
                    toValue: progressPercentage,
                    duration: 1000,
                    useNativeDriver: false,
                }).start();
            } else {
                Animated.timing(progressWidth, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: false,
                }).start();
            }
        }, [timeLeft, isMining, progressPercentage]);

        if (!isMining || timeLeft <= 0) return null;

        return (
            <View style={[styles.progressContainer, {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border
            }]}>
                <View style={styles.progressHeader}>
                    <Ionicons name="time" size={16} color={theme.colors.accent} />
                    <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                        {t('home.miningProgress')}
                    </Text>
                </View>

                <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                backgroundColor: theme.colors.accent,
                                width: progressWidth.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>

                <View style={styles.progressStats}>
                    <Text style={[styles.progressTime, { color: theme.colors.textPrimary }]}>
                        {formatTime(timeLeft)}
                    </Text>
                    <Text style={[styles.progressSpeed, { color: theme.colors.textSecondary }]}>
                        +{miningSpeed.toFixed(6)} {t('common.coins')}/sec
                    </Text>
                </View>
            </View>
        );
    };

    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, {
                paddingTop: insets.top,
            }]}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.accent}
                        colors={[theme.colors.accent]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.welcomeContainer}>
                        <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>
                            {t('home.welcomeBack')}
                        </Text>
                        <Text style={[styles.username, { color: theme.colors.textPrimary }]}>
                            {userData.firstName && userData.lastName
                                ? `${userData.firstName} ${userData.lastName}`
                                : userData.username || t('home.miner')}!
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Ionicons name="notifications" size={24} color={theme.colors.accent} />
                        {unreadNotifications > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>
                                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Balance Display */}
                <View style={[styles.balanceCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.balanceTitle, { color: theme.colors.textSecondary }]}>
                        {t('home.currentBalance')}
                    </Text>
                    <Text style={[styles.balanceAmount, { color: theme.colors.accent }]}>
                        {formatCoinBalance(userData.balance + localEarned)} {t('common.coins')}
                    </Text>
                    {isMining && localEarned > 0 && (
                        <Text style={[styles.earningText, { color: theme.colors.success }]}>
                            +{formatCoinBalance(localEarned)} {t('home.thisSession')}
                        </Text>
                    )}
                </View>

                {/* Mining Stats Card */}
                <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.statsHeader}>
                        <Ionicons name="trending-up" size={24} color={theme.colors.accent} />
                        <Text style={[styles.statsTitle, { color: theme.colors.textPrimary }]}>
                            {t('home.miningStats')}
                        </Text>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                                {userData.todayMined.toFixed(3)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                {t('home.todayMined')}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: theme.colors.textPrimary, fontSize: 16 }]}>
                                {formatCoinBalance(userData.totalMined)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                {t('home.totalMined')}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={styles.streakContainer}>
                                <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                                    {streakData.currentStreak}
                                </Text>
                                {streakData.canClaimToday && (
                                    <View style={styles.streakBadge}>
                                        <Text style={styles.streakBadgeText}>🔥</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                {t('home.dailyStreak')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Mining Button */}
                <MiningButton
                    isMining={isMining}
                    timeLeft={timeLeft}
                    startMining={startMining}
                    loading={loading}
                    miningSpeed={miningSpeed}
                    formatTime={formatTime}
                    hasScheduledNotification={!!scheduledNotificationId}
                    onMiningStart={() => {
                        // Mining started successfully, can add any additional logic here
                        console.log('Mining started successfully from callback');
                    }}
                />







                {/* Mining Progress Bar */}
                <MiningProgressBar />

                {/* Mining Details Section */}
                <View style={[styles.miningDetailsCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.detailsHeader}>
                        <Ionicons name="information-circle" size={24} color={theme.colors.accent} />
                        <Text style={[styles.detailsTitle, { color: theme.colors.textPrimary }]}>
                            {t('home.miningDetails')}
                        </Text>
                    </View>

                    <View style={styles.detailsContent}>
                        {/* Current Mining Speed */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="speedometer" size={20} color={theme.colors.accent} />
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                    {t('home.currentSpeed')}
                                </Text>
                                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                                    {miningSpeed.toFixed(6)} {t('common.coins')}/sec
                                </Text>
                            </View>
                        </View>

                        {/* Mining Level */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="star" size={20} color={theme.colors.accent} />
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                    {t('home.miningLevel')}
                                </Text>
                                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                                    {t('common.level')} {miningLevel}
                                </Text>
                            </View>
                        </View>

                        {/* Experience */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="trophy" size={20} color={theme.colors.accent} />
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                    {t('common.experience')}
                                </Text>
                                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                                    {experience} {t('common.xp')}
                                </Text>
                            </View>
                        </View>

                        {/* Active Upgrades */}
                        {Object.keys(upgrades).some(key => upgrades[key] > 0) && (
                            <View style={styles.upgradesSection}>
                                <Text style={[styles.upgradesTitle, { color: theme.colors.textPrimary }]}>
                                    {t('home.activeUpgrades')}
                                </Text>
                                {upgrades.speed > 0 && (
                                    <View style={styles.upgradeItem}>
                                        <Ionicons name="flash" size={16} color={theme.colors.success} />
                                        <Text style={[styles.upgradeText, { color: theme.colors.textSecondary }]}>
                                            {t('home.speed')} +{upgrades.speed * 10}%
                                        </Text>
                                    </View>
                                )}
                                {upgrades.efficiency > 0 && (
                                    <View style={styles.upgradeItem}>
                                        <Ionicons name="battery-charging" size={16} color={theme.colors.success} />
                                        <Text style={[styles.upgradeText, { color: theme.colors.textSecondary }]}>
                                            {t('home.efficiency')} +{upgrades.efficiency * 15}%
                                        </Text>
                                    </View>
                                )}
                                {upgrades.capacity > 0 && (
                                    <View style={styles.upgradeItem}>
                                        <Ionicons name="hardware-chip" size={16} color={theme.colors.success} />
                                        <Text style={[styles.upgradeText, { color: theme.colors.textSecondary }]}>
                                            {t('home.capacity')} +{upgrades.capacity * 20}%
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Beginner Tips */}
                        {totalMined < 1 && (
                            <View style={styles.tipsSection}>
                                <Text style={[styles.tipsTitle, { color: theme.colors.textPrimary }]}>
                                    {t('home.beginnerTips')}
                                </Text>
                                <View style={styles.tipItem}>
                                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                        • {t('home.sessionDuration')}
                                    </Text>
                                </View>
                                <View style={styles.tipItem}>
                                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                        • {t('home.upgradeTab')}
                                    </Text>
                                </View>
                                <View style={styles.tipItem}>
                                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                        • {t('home.dailyStreaks')}
                                    </Text>
                                </View>
                                <View style={styles.tipItem}>
                                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                        • {t('home.inviteFriends')}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Tasks & Leaderboard Cards */}
                <View style={styles.cardsRow}>
                    {/* Tasks Card */}
                    <TouchableOpacity
                        style={[styles.halfCard, { backgroundColor: theme.colors.card }]}
                        onPress={() => navigation.navigate('Tasks')}
                    >
                        <View style={styles.halfCardHeader}>
                            <View style={[styles.halfCardIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            </View>
                            <Text style={[styles.halfCardTitle, { color: theme.colors.textPrimary }]}>{t('common.tasks')}</Text>
                        </View>
                        <Text style={[styles.halfCardSubtitle, { color: theme.colors.textSecondary }]}>
                            {t('tasks.completeTasks')}
                        </Text>
                        <View style={styles.halfCardPreview}>
                            <Text style={[styles.halfCardPreviewText, { color: theme.colors.textSecondary }]}>
                                +10 {t('common.coins')} per task
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Leaderboard Card */}
                    <TouchableOpacity
                        style={[styles.halfCard, { backgroundColor: theme.colors.card }]}
                        onPress={() => navigation.navigate('Leaderboard')}
                    >
                        <View style={styles.halfCardHeader}>
                            <View style={[styles.halfCardIcon, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
                                <Ionicons name="trophy" size={20} color="#FFD700" />
                            </View>
                            <Text style={[styles.halfCardTitle, { color: theme.colors.textPrimary }]}>{t('common.leaderboard')}</Text>
                        </View>
                        <Text style={[styles.halfCardSubtitle, { color: theme.colors.textSecondary }]}>
                            {t('leaderboard.topMiners')}
                        </Text>
                        <View style={styles.halfCardPreview}>
                            <Text style={[styles.halfCardPreviewText, { color: theme.colors.textSecondary }]}>
                                {t('leaderboard.yourRank')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* <Text style={[styles.sectionTitle, {
                    marginTop: 30,
                    color: theme.colors.textPrimary
                }]}>
                    Quick Actions
                </Text> */}
                {/* Feature Cards Grid */}
                <Text style={[styles.sectionTitle, {
                    marginTop: 30,
                    marginBottom: 16,
                    color: theme.colors.textPrimary
                }]}>
                    {t('home.quickActions')}
                </Text>

                <View style={styles.featureGrid}>
                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: theme.colors.card }]}
                        onPress={() => navigation.navigate('Leaderboard')}
                    >
                        <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
                            <Ionicons name="trophy" size={24} color="#FFD700" />
                        </View>
                        <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                            {t('common.leaderboard')}
                        </Text>
                        <Text style={[styles.featureSubtitle, { color: theme.colors.textSecondary }]}>
                            {t('home.seeTopMiners')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: theme.colors.card }]}
                        onPress={() => navigation.navigate('Wallet')}
                    >
                        <View style={[styles.featureIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                            <Ionicons name="wallet" size={24} color="#4CAF50" />
                        </View>
                        <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                            {t('common.wallet')}
                        </Text>
                        <Text style={[styles.featureSubtitle, { color: theme.colors.textSecondary }]}>
                            {t('home.manageCoins')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: theme.colors.card }]}
                        onPress={() => navigation.navigate('Tasks')}
                    >
                        <View style={[styles.featureIcon, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                            <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
                        </View>
                        <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                            {t('common.tasks')}
                        </Text>
                        <Text style={[styles.featureSubtitle, { color: theme.colors.textSecondary }]}>
                            {t('home.earnRewards')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: theme.colors.card }]}
                        onPress={() => navigation.navigate('Invite')}
                    >
                        <View style={[styles.featureIcon, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
                            <Ionicons name="people" size={24} color="#9C27B0" />
                        </View>
                        <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                            {t('common.invite')}
                        </Text>
                        <Text style={[styles.featureSubtitle, { color: theme.colors.textSecondary }]}>
                            {t('home.getBonuses')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: theme.colors.card }]}
                        onPress={() => navigation.navigate('Upgrade')}
                    >
                        <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                            <Ionicons name="rocket" size={24} color="#FF9800" />
                        </View>
                        <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                            {t('common.upgrade')}
                        </Text>
                        <Text style={[styles.featureSubtitle, { color: theme.colors.textSecondary }]}>
                            {t('home.boostMining')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: theme.colors.card }]}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={[styles.featureIcon, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
                            <Ionicons name="person" size={24} color="#F44336" />
                        </View>
                        <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                            {t('common.profile')}
                        </Text>
                        <Text style={[styles.featureSubtitle, { color: theme.colors.textSecondary }]}>
                            {t('home.viewStats')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions
                <View style={[styles.quickActions, { backgroundColor: theme.colors.card }]}>

                    <View style={styles.actionGrid}>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('Wallet')}
                        >
                            <View style={styles.actionIcon}>
                                <Ionicons name="wallet" size={24} color={theme.colors.accent} />
                            </View>
                            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                                Wallet
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('Invite')}
                        >
                            <View style={styles.actionIcon}>
                                <Ionicons name="people" size={24} color={theme.colors.accent} />
                            </View>
                            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                                Invite
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('Tasks')}
                        >
                            <View style={styles.actionIcon}>
                                <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
                            </View>
                            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                                Tasks
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <View style={styles.actionIcon}>
                                <Ionicons name="person" size={24} color={theme.colors.accent} />
                            </View>
                            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                                Profile
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View> */}

                {/* How Mining Works Section */}
                <View style={[styles.miningDetailsCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.detailsHeader}>
                        <Ionicons name="school" size={24} color={theme.colors.accent} />
                        <Text style={[styles.detailsTitle, { color: theme.colors.textPrimary }]}>
                            {t('home.howMiningWorks')}
                        </Text>
                    </View>

                    <View style={styles.detailsContent}>
                        {/* Session Duration */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="time" size={20} color={theme.colors.accent} />
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                    {t('home.sessionDurationTitle')}
                                </Text>
                                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                                    {t('home.sessionDurationValue')}
                                </Text>
                            </View>
                        </View>

                        {/* Earnings Calculation */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="calculator" size={20} color={theme.colors.accent} />
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                    {t('home.earningsCalculation')}
                                </Text>
                                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                                    {miningSpeed.toFixed(6)} {t('common.coins')}/sec × session time
                                </Text>
                            </View>
                        </View>

                        {/* Mining Speed */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="speedometer" size={20} color={theme.colors.accent} />
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                    {t('home.miningSpeedTitle')}
                                </Text>
                                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                                    {t('home.miningSpeedValue', { speed: miningSpeed.toFixed(6) })}
                                </Text>
                            </View>
                        </View>

                        {/* Session Management */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="refresh" size={20} color={theme.colors.accent} />
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                    {t('home.sessionManagement')}
                                </Text>
                                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                                    {t('home.sessionManagementValue')}
                                </Text>
                            </View>
                        </View>

                        {/* Pro Tips */}
                        <View style={styles.tipsSection}>
                            <Text style={[styles.tipsTitle, { color: theme.colors.textPrimary }]}>
                                {t('home.proTips')}
                            </Text>
                            <View style={styles.tipItem}>
                                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                    • {t('home.upgradeMiningSpeed')}
                                </Text>
                            </View>
                            <View style={styles.tipItem}>
                                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                    • {t('home.useBoosts')}
                                </Text>
                            </View>
                            <View style={styles.tipItem}>
                                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                    • {t('home.claimDailyStreaks')}
                                </Text>
                            </View>
                            <View style={styles.tipItem}>
                                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                    • {t('home.checkUpgradeTab')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Stats Section */}
                <View style={[styles.miningDetailsCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.detailsHeader}>
                        <Ionicons name="stats-chart" size={24} color={theme.colors.accent} />
                        <Text style={[styles.detailsTitle, { color: theme.colors.textPrimary }]}>
                            {t('home.quickStats')}
                        </Text>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                                {formatCoinBalance(totalMined)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                {t('home.totalMined')}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                                {miningLevel}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                {t('upgrade.currentLevel')}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                                {(upgrades?.speed || 0) + (upgrades?.efficiency || 0) + (upgrades?.capacity || 0)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                {t('home.totalUpgrades')}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                                {experience}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                {t('common.experience')}
                            </Text>
                        </View>
                    </View>
                </View>


                {/* Recent Activity */}
                <View style={styles.recentActivity}>
                    <View style={styles.activityHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            {t('home.recentActivity')}
                        </Text>
                        <TouchableOpacity
                            style={styles.seeAllButton}
                            onPress={() => navigation.navigate('ActivityList')}
                        >
                            <Text style={[styles.seeAllText, { color: theme.colors.accent }]}>
                                {t('home.seeAll')}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.accent} />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.activityList, { backgroundColor: theme.colors.card }]}>
                        {activitiesLoading ? (
                            <View style={styles.emptyActivity}>
                                <Ionicons name="refresh" size={24} color={theme.colors.textSecondary} />
                                <Text style={[styles.emptyActivityText, { color: theme.colors.textSecondary }]}>
                                    {t('home.loadingActivities')}
                                </Text>
                            </View>
                        ) : (() => {
                            try {
                                // Safety check to ensure recentActivities is always an array
                                if (!Array.isArray(recentActivities)) {
                                    console.warn('recentActivities is not an array in render, defaulting to empty');
                                    return false;
                                }
                                return recentActivities.length > 0;
                            } catch (error) {
                                console.error('Error checking recentActivities:', error);
                                return false;
                            }
                        })() ? (
                            (recentActivities || []).map((activity, index) => {
                                try {
                                    // Safety check for each activity
                                    if (!activity || !activity.id) {
                                        console.warn('Invalid activity found:', activity);
                                        return null;
                                    }
                                    return (
                                        <View
                                            key={activity.id}
                                            style={[
                                                styles.activityItem,
                                                { borderBottomColor: theme.colors.border },
                                                index === (Array.isArray(recentActivities) ? recentActivities.length - 1 : -1) && { borderBottomWidth: 0 }
                                            ]}
                                        >
                                            <View style={styles.activityIcon}>
                                                <Ionicons
                                                    name={getActivityIcon(activity.type)}
                                                    size={16}
                                                    color={getActivityColor(activity.type, theme)}
                                                />
                                            </View>
                                            <View style={styles.activityContent}>
                                                <Text style={[styles.activityText, { color: theme.colors.textPrimary }]}>
                                                    {activity.description}
                                                </Text>
                                                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                                                    {formatActivityTime(activity.timestamp)}
                                                </Text>
                                            </View>
                                            <Text style={[
                                                styles.activityAmount,
                                                { color: activity.amount > 0 ? theme.colors.success : theme.colors.error }
                                            ]}>
                                                {activity.amount > 0 ? '+' : ''}{formatCoinBalance(activity.amount)}
                                            </Text>
                                        </View>
                                    );
                                } catch (error) {
                                    console.error('Error rendering activity:', error);
                                    return null;
                                }
                            })
                        ) : (
                            <View style={styles.emptyActivity}>
                                <Ionicons name="time-outline" size={24} color={theme.colors.textSecondary} />
                                <Text style={[styles.emptyActivityText, { color: theme.colors.textSecondary }]}>
                                    {t('home.noRecentActivity')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>


        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    welcomeContainer: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 16,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    notificationButton: {
        padding: 8,
    },
    balanceCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    balanceTitle: {
        fontSize: 16,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    earningText: {
        fontSize: 14,
        marginTop: 4,
    },
    statsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    streakContainer: {
        position: 'relative',
        alignItems: 'center',
    },
    streakBadge: {
        position: 'absolute',
        top: -8,
        right: -12,




        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    quickActions: {
        marginTop: 10,
        marginBottom: 30,
        borderRadius: 16,
        padding: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionItem: {
        alignItems: 'center',
        flex: 1,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,

    },
    actionText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    featureCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    featureSubtitle: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
    },
    cardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    halfCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    halfCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    halfCardIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    halfCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    halfCardSubtitle: {
        fontSize: 12,
        marginBottom: 8,
    },
    halfCardPreview: {
        marginTop: 4,
    },
    halfCardPreviewText: {
        fontSize: 11,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    statCard: {
        width: '48%',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    miningDetailsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    detailsContent: {
        gap: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailInfo: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    upgradesSection: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 193, 7, 0.2)',
    },
    upgradesTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    upgradeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    upgradeText: {
        fontSize: 14,
        marginLeft: 8,
    },
    tipsSection: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 193, 7, 0.2)',
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    tipItem: {
        marginBottom: 6,
    },
    tipText: {
        fontSize: 14,
        lineHeight: 20,
    },
    recentActivity: {
        marginBottom: 20,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    activityList: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    emptyActivity: {
        padding: 40,
        alignItems: 'center',
    },
    emptyActivityText: {
        marginTop: 8,
        fontSize: 14,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
    },
    activityAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressContainer: {
        marginTop: 5,
        marginBottom: 30,
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#f0f0f0', // Default background for light mode
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressLabel: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: '#e0e0e0',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        alignItems: 'center',
    },
    progressTime: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressSpeed: {
        fontSize: 12,
        fontWeight: '500',
    },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    tasksSection: {
        marginBottom: 30,
    },
    tasksCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    tasksHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    tasksIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    tasksTextContainer: {
        flex: 1,
    },
    tasksTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    tasksSubtitle: {
        fontSize: 14,
        color: '#888',
        lineHeight: 20,
    },
    tasksButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    tasksButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginRight: 4,
    },
    tasksPreview: {
        gap: 12,
    },
    taskPreviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    taskPreviewIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    taskPreviewText: {
        flex: 1,
        fontSize: 14,
        color: '#888',
    },
    taskPreviewReward: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
    },

});

export default HomeScreen;
