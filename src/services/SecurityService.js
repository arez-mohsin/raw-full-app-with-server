import { auth, db } from '../firebase';
import {
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signOut
} from 'firebase/auth';
import { doc, updateDoc, getDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

class SecurityService {
    constructor() {
        this.currentUser = null;
    }

    // Get current user
    getCurrentUser() {
        return auth.currentUser;
    }

    // Get current user ID
    getCurrentUserId() {
        return auth.currentUser?.uid;
    }

    // Get current device info
    async getCurrentDeviceInfo() {
        try {
            const deviceId = `${Device.deviceName || 'unknown'}-${Device.osName || 'unknown'}-${Device.modelName || 'unknown'}-${Application.applicationId || 'unknown'}`;

            return {
                deviceId: deviceId,
                deviceName: Device.deviceName || 'Unknown Device',
                osName: Device.osName || 'Unknown OS',
                osVersion: Device.osVersion || 'Unknown',
                modelName: Device.modelName || 'Unknown Model',
                appVersion: Application.nativeApplicationVersion || '1.0.0',
                timestamp: new Date().toISOString(),
                isCurrentDevice: true
            };
        } catch (error) {
            console.error('Error getting device info:', error);
            return {
                deviceId: 'unknown',
                timestamp: new Date().toISOString(),
                isCurrentDevice: true
            };
        }
    }

    // Check if current device should be logged out
    async shouldLogoutCurrentDevice() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return false;

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) return false;

            const userData = userDoc.data();
            const securityData = userData.security || {};

            // Check if logout all devices was triggered
            if (!securityData.logoutAllDevices) return false;

            const currentDeviceInfo = await this.getCurrentDeviceInfo();
            const currentDeviceId = currentDeviceInfo.deviceId;
            const allowedDeviceId = securityData.currentDeviceId;

            // If current device is not the allowed device, logout
            return currentDeviceId !== allowedDeviceId;
        } catch (error) {
            console.error('Error checking if device should logout:', error);
            return false;
        }
    }

    // Logout current device
    async logoutCurrentDevice() {
        try {
            await signOut(auth);
            await AsyncStorage.clear();
            return { success: true, message: 'Device logged out successfully' };
        } catch (error) {
            console.error('Error logging out device:', error);
            return { success: false, message: 'Failed to logout device' };
        }
    }

    // Logout all other devices (keep current device)
    async logoutAllOtherDevices(userId) {
        try {
            const currentDeviceInfo = await this.getCurrentDeviceInfo();
            const userRef = doc(db, 'users', userId);

            // Update user document to mark all other devices as logged out
            await updateDoc(userRef, {
                'security.lastPasswordChange': serverTimestamp(),
                'security.passwordChangeDevice': currentDeviceInfo,
                'security.logoutAllDevices': true,
                'security.logoutTimestamp': serverTimestamp(),
                'security.currentDeviceId': currentDeviceInfo.deviceId,
                'security.devices': arrayUnion({
                    ...currentDeviceInfo,
                    action: 'password_change_keep_current',
                    timestamp: new Date().toISOString()
                })
            });

            // Log security event
            await this.logSecurityEvent('logout_all_devices', {
                deviceInfo: currentDeviceInfo,
                reason: 'password_change'
            });

            return { success: true, message: 'All other devices logged out successfully' };
        } catch (error) {
            console.error('Error logging out other devices:', error);
            return { success: false, message: 'Failed to logout other devices' };
        }
    }

    // Change user password
    async changePassword(currentPassword, newPassword) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('No authenticated user found');
            }

            // Re-authenticate user before changing password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            // Log password change in Firestore
            await this.logSecurityEvent('password_changed', {
                timestamp: new Date(),
                deviceInfo: await this.getCurrentDeviceInfo()
            });

            return {
                success: true,
                message: 'Password changed successfully'
            };
        } catch (error) {
            console.error('Password change error:', error);

            let errorMessage = 'Failed to change password';
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Current password is incorrect';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'New password is too weak. Please choose a stronger password';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Please log in again to change your password';
            }

            return {
                success: false,
                message: errorMessage,
                errorCode: error.code
            };
        }
    }

    // Get user security settings
    async getUserSecuritySettings(userId) {
        try {
            if (!userId) {
                console.warn('No userId provided to getUserSecuritySettings');
                return this.getDefaultSecuritySettings();
            }

            if (!db) {
                console.error('Firebase db is not initialized');
                return this.getDefaultSecuritySettings();
            }

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                    emailNotifications: userData.security?.emailNotifications ?? true,
                    loginAlerts: userData.security?.loginAlerts ?? true,
                    lastPasswordChange: userData.security?.lastPasswordChange,
                    lastSecurityUpdate: userData.security?.lastSecurityUpdate,
                    securityEvents: userData.security?.events || [],
                    suspiciousActivity: userData.security?.suspiciousActivity || 0,
                    logoutAllDevices: userData.security?.logoutAllDevices || false,
                    currentDeviceId: userData.security?.currentDeviceId || null
                };
            }

            return this.getDefaultSecuritySettings();
        } catch (error) {
            console.error('Error getting user security settings:', error);
            return this.getDefaultSecuritySettings();
        }
    }

    // Get default security settings
    getDefaultSecuritySettings() {
        return {
            emailNotifications: true,
            loginAlerts: true,
            lastPasswordChange: null,
            lastSecurityUpdate: null,
            securityEvents: [],
            suspiciousActivity: 0,
            logoutAllDevices: false,
            currentDeviceId: null
        };
    }

    // Update security notification settings
    async updateSecurityNotifications(userId, settings) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                'security.emailNotifications': settings.emailNotifications,
                'security.loginAlerts': settings.loginAlerts,
                'security.lastSecurityUpdate': serverTimestamp()
            });

            return {
                success: true,
                message: 'Security settings updated successfully'
            };
        } catch (error) {
            console.error('Error updating security notifications:', error);
            return {
                success: false,
                message: 'Failed to update security settings'
            };
        }
    }

    // Log security events
    async logSecurityEvent(eventType, eventData) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return;

            const userRef = doc(db, 'users', userId);
            const event = {
                type: eventType,
                timestamp: new Date(),
                ...eventData
            };

            // Get current events array and append new event
            const userDoc = await getDoc(userRef);
            const currentEvents = userDoc.exists() ? userDoc.data().security?.events || [] : [];
            const updatedEvents = [...currentEvents, event];

            await updateDoc(userRef, {
                'security.events': updatedEvents,
                'security.lastSecurityUpdate': serverTimestamp()
            });

            // Also store in local storage for offline access
            await this.storeSecurityEventLocally(event);
        } catch (error) {
            console.error('Error logging security event:', error);
        }
    }

    // Store security event locally
    async storeSecurityEventLocally(event) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return;

            const key = `security_events_${userId}`;
            const existingEvents = await AsyncStorage.getItem(key);
            const events = existingEvents ? JSON.parse(existingEvents) : [];

            events.push({
                ...event,
                timestamp: new Date().toISOString()
            });

            // Keep only last 50 events
            if (events.length > 50) {
                events.splice(0, events.length - 50);
            }

            await AsyncStorage.setItem(key, JSON.stringify(events));
        } catch (error) {
            console.error('Error storing security event locally:', error);
        }
    }

    // Get local security events
    async getLocalSecurityEvents() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return [];

            const key = `security_events_${userId}`;
            const events = await AsyncStorage.getItem(key);
            return events ? JSON.parse(events) : [];
        } catch (error) {
            console.error('Error getting local security events:', error);
            return [];
        }
    }

    // Get device information
    async getDeviceInfo() {
        try {
            const deviceInfo = {
                userAgent: navigator?.userAgent || 'React Native',
                platform: 'mobile',
                timestamp: new Date().toISOString()
            };

            return deviceInfo;
        } catch (error) {
            console.error('Error getting device info:', error);
            return {
                userAgent: 'Unknown',
                platform: 'mobile',
                timestamp: new Date().toISOString()
            };
        }
    }

    // Validate password strength
    validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const strength = {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
            score: 0,
            feedback: []
        };

        if (password.length >= minLength) strength.score += 1;
        if (hasUpperCase) strength.score += 1;
        if (hasLowerCase) strength.score += 1;
        if (hasNumbers) strength.score += 1;
        if (hasSpecialChar) strength.score += 1;

        if (password.length < minLength) {
            strength.feedback.push(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUpperCase) {
            strength.feedback.push('Include at least one uppercase letter');
        }
        if (!hasLowerCase) {
            strength.feedback.push('Include at least one lowercase letter');
        }
        if (!hasNumbers) {
            strength.feedback.push('Include at least one number');
        }
        if (!hasSpecialChar) {
            strength.feedback.push('Include at least one special character');
        }

        return strength;
    }

    // Get security tips
    getSecurityTips() {
        return [
            'Use a strong, unique password for your account',
            'Enable biometric login for quick and secure access',
            'Never share your login credentials with anyone',
            'Keep your app updated to the latest version',
            'Be cautious of phishing attempts and suspicious links',
            'Log out from devices you no longer use',
            'Enable login alerts to monitor account activity',
            'Use different passwords for different accounts'
        ];
    }

    // Check if user has recent security activity
    async hasRecentSecurityActivity(hours = 24) {
        try {
            const events = await this.getLocalSecurityEvents();
            const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

            return events.some(event => {
                const eventTime = new Date(event.timestamp);
                return eventTime > cutoffTime;
            });
        } catch (error) {
            console.error('Error checking recent security activity:', error);
            return false;
        }
    }
}

export default new SecurityService(); 