import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

class BiometricService {
    constructor() {
        this.isAvailable = false;
        this.supportedTypes = [];
        this.isEnrolled = false;
    }

    // Check if biometric authentication is available on the device
    async checkBiometricAvailability() {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

            this.isAvailable = hasHardware && isEnrolled;
            this.isEnrolled = isEnrolled;
            this.supportedTypes = supportedTypes;

            return {
                isAvailable: this.isAvailable,
                isEnrolled: this.isEnrolled,
                supportedTypes: this.supportedTypes,
                hasHardware
            };
        } catch (error) {
            console.error('Error checking biometric availability:', error);
            return {
                isAvailable: false,
                isEnrolled: false,
                supportedTypes: [],
                hasHardware: false
            };
        }
    }

    // Get biometric type name
    getBiometricTypeName(type) {
        switch (type) {
            case LocalAuthentication.AuthenticationType.FINGERPRINT:
                return 'Fingerprint';
            case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
                return 'Face ID';
            case LocalAuthentication.AuthenticationType.IRIS:
                return 'Iris';
            default:
                return 'Biometric';
        }
    }

    // Get available biometric types as readable names
    getAvailableBiometricTypes() {
        return this.supportedTypes.map(type => this.getBiometricTypeName(type));
    }

    // Check if biometric is enabled for the current user
    async isBiometricEnabled(userId) {
        try {
            const key = `biometric_enabled_${userId}`;
            const enabled = await AsyncStorage.getItem(key);
            return enabled === 'true';
        } catch (error) {
            console.error('Error checking biometric status:', error);
            return false;
        }
    }

    // Enable biometric authentication for the current user
    async enableBiometric(userId) {
        try {
            // First authenticate with biometric to ensure it's working
            const result = await this.authenticateWithBiometric('Enable biometric login');

            if (result.success) {
                // Store the enabled state
                const key = `biometric_enabled_${userId}`;
                await AsyncStorage.setItem(key, 'true');

                // Update user document in Firestore
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, {
                    'security.biometricEnabled': true,
                    'security.biometricEnabledAt': new Date(),
                    'security.lastSecurityUpdate': new Date()
                });

                return { success: true, message: 'Biometric authentication enabled successfully' };
            } else {
                return { success: false, message: result.error || 'Biometric authentication failed' };
            }
        } catch (error) {
            console.error('Error enabling biometric:', error);
            return { success: false, message: 'Failed to enable biometric authentication' };
        }
    }

    // Disable biometric authentication for the current user
    async disableBiometric(userId) {
        try {
            // Store the disabled state
            const key = `biometric_enabled_${userId}`;
            await AsyncStorage.setItem(key, 'false');

            // Update user document in Firestore
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                'security.biometricEnabled': false,
                'security.biometricDisabledAt': new Date(),
                'security.lastSecurityUpdate': new Date()
            });

            return { success: true, message: 'Biometric authentication disabled successfully' };
        } catch (error) {
            console.error('Error disabling biometric:', error);
            return { success: false, message: 'Failed to disable biometric authentication' };
        }
    }

    // Authenticate user with biometric
    async authenticateWithBiometric(reason = 'Please authenticate to continue') {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: reason,
                fallbackLabel: 'Use passcode',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });

            return {
                success: result.success,
                error: result.success ? null : 'Authentication failed',
                errorCode: result.error
            };
        } catch (error) {
            console.error('Biometric authentication error:', error);
            return {
                success: false,
                error: 'Biometric authentication failed',
                errorCode: 'UNKNOWN_ERROR'
            };
        }
    }

    // Get user's biometric settings from Firestore
    async getUserBiometricSettings(userId) {
        try {
            if (!userId) {
                console.warn('No userId provided to getUserBiometricSettings');
                return this.getDefaultBiometricSettings();
            }

            if (!db) {
                console.error('Firebase db is not initialized');
                return this.getDefaultBiometricSettings();
            }

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                    biometricEnabled: userData.security?.biometricEnabled || false,
                    biometricEnabledAt: userData.security?.biometricEnabledAt,
                    biometricDisabledAt: userData.security?.biometricDisabledAt,
                    lastSecurityUpdate: userData.security?.lastSecurityUpdate
                };
            }

            return this.getDefaultBiometricSettings();
        } catch (error) {
            console.error('Error getting user biometric settings:', error);
            return this.getDefaultBiometricSettings();
        }
    }

    // Get default biometric settings
    getDefaultBiometricSettings() {
        return {
            biometricEnabled: false,
            biometricEnabledAt: null,
            biometricDisabledAt: null,
            lastSecurityUpdate: null
        };
    }

    // Sync biometric settings between local storage and Firestore
    async syncBiometricSettings(userId) {
        try {
            const localEnabled = await this.isBiometricEnabled(userId);
            const firestoreSettings = await this.getUserBiometricSettings(userId);

            // If there's a mismatch, update Firestore to match local storage
            if (localEnabled !== firestoreSettings.biometricEnabled) {
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, {
                    'security.biometricEnabled': localEnabled,
                    'security.lastSecurityUpdate': new Date()
                });
            }

            return localEnabled;
        } catch (error) {
            console.error('Error syncing biometric settings:', error);
            return false;
        }
    }

    // Get comprehensive biometric status
    async getBiometricStatus(userId) {
        try {
            const availability = await this.checkBiometricAvailability();
            const isEnabled = await this.isBiometricEnabled(userId);
            const settings = await this.getUserBiometricSettings(userId);

            return {
                ...availability,
                isEnabled,
                settings,
                canEnable: availability.isAvailable && !isEnabled,
                canDisable: isEnabled
            };
        } catch (error) {
            console.error('Error getting biometric status:', error);
            return {
                isAvailable: false,
                isEnrolled: false,
                supportedTypes: [],
                hasHardware: false,
                isEnabled: false,
                settings: {},
                canEnable: false,
                canDisable: false
            };
        }
    }

    // Clear stored credentials for a user
    async clearStoredCredentials(email) {
        try {
            await AsyncStorage.removeItem(`credentials_${email}`);
            await AsyncStorage.removeItem('lastLoginEmail');
            return { success: true, message: 'Stored credentials cleared successfully' };
        } catch (error) {
            console.error('Error clearing stored credentials:', error);
            return { success: false, message: 'Failed to clear stored credentials' };
        }
    }
}

export default new BiometricService(); 