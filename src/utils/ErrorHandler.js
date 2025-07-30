import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

class ErrorHandler {
    // Firebase Auth Error Codes and their user-friendly messages
    static firebaseAuthErrors = {
        'auth/user-not-found': 'No account found with this email address',
        'auth/wrong-password': 'Incorrect password. Please try again',
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/weak-password': 'Password is too weak. Please choose a stronger password',
        'auth/invalid-email': 'Invalid email address format',
        'auth/user-disabled': 'This account has been disabled',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/operation-not-allowed': 'This operation is not allowed',
        'auth/invalid-credential': 'Invalid login credentials',
        'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials',
        'auth/requires-recent-login': 'This operation requires recent authentication. Please log in again',
        'auth/invalid-verification-code': 'Invalid verification code',
        'auth/invalid-verification-id': 'Invalid verification ID',
        'auth/quota-exceeded': 'Service quota exceeded. Please try again later',
        'auth/credential-already-in-use': 'This credential is already associated with a different user account',
        'auth/timeout': 'Request timed out. Please try again',
        'auth/cancelled-popup-request': 'Sign-in was cancelled',
        'auth/popup-closed-by-user': 'Sign-in popup was closed before completion',
        'auth/popup-blocked': 'Sign-in popup was blocked by the browser',
        'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations',
        'auth/unsupported-persistence-type': 'The specified persistence type is not supported',
        'auth/invalid-persistence-type': 'The specified persistence type is invalid',
        'auth/invalid-tenant-id': 'The tenant ID is invalid',
        'auth/unsupported-tenant-operation': 'This operation is not supported in a multi-tenant context',
        'auth/invalid-dynamic-link-domain': 'The dynamic link domain is not configured or authorized',
        'auth/duplicate-credential': 'This credential is already associated with a different user account',
        'auth/maximum-second-factor-count-exceeded': 'The maximum allowed number of second factors on a user has been exceeded',
        'auth/second-factor-already-in-use': 'The second factor is already enrolled on this account',
        'auth/tenant-id-mismatch': 'The tenant ID in the JWT does not match the tenant ID in the request',
        'auth/unsupported-first-factor': 'The first factor is not supported',
        'auth/email-change-needs-verification': 'Email change requires verification',
        'auth/missing-or-invalid-nonce': 'Missing or invalid nonce',
        'auth/invalid-app-credential': 'Invalid app credential',
        'auth/invalid-app-id': 'Invalid app ID',
        'auth/invalid-user-token': 'Invalid user token',
        'auth/invalid-tenant-id': 'Invalid tenant ID',
        'auth/not-authorized': 'Not authorized to perform this operation',
        'auth/argument-error': 'Invalid argument provided',
        'auth/invalid-api-key': 'Invalid API key',
        'auth/invalid-user-token': 'Invalid user token',
        'auth/invalid-tenant-id': 'Invalid tenant ID',
        'auth/not-authorized': 'Not authorized to perform this operation',
        'auth/argument-error': 'Invalid argument provided',
        'auth/invalid-api-key': 'Invalid API key',
    };

    // Network Error Messages
    static networkErrors = {
        'NETWORK_ERROR': 'Network connection error. Please check your internet connection',
        'TIMEOUT_ERROR': 'Request timed out. Please try again',
        'SERVER_ERROR': 'Server error. Please try again later',
        'CONNECTION_ERROR': 'Unable to connect to the server',
    };

    // Validation Error Messages
    static validationErrors = {
        'INVALID_EMAIL': 'Please enter a valid email address',
        'INVALID_PASSWORD': 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        'PASSWORD_MISMATCH': 'Passwords do not match',
        'EMPTY_FIELDS': 'Please fill in all required fields',
        'USERNAME_TAKEN': 'Username is already taken',
        'EMAIL_EXISTS': 'Email is already registered',
        'WEAK_PASSWORD': 'Password is too weak. Please choose a stronger password',
        'INVALID_USERNAME': 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        'INVALID_PHONE': 'Please enter a valid phone number',
        'INVALID_DATE': 'Please enter a valid date',
        'INVALID_AMOUNT': 'Please enter a valid amount',
        'INVALID_URL': 'Please enter a valid URL',
    };

    // Get user-friendly error message
    static getErrorMessage(error) {
        // Handle Firebase Auth errors
        if (error.code && this.firebaseAuthErrors[error.code]) {
            return this.firebaseAuthErrors[error.code];
        }

        // Handle network errors
        if (error.message && error.message.includes('network')) {
            return this.networkErrors.NETWORK_ERROR;
        }

        // Handle timeout errors
        if (error.message && error.message.includes('timeout')) {
            return this.networkErrors.TIMEOUT_ERROR;
        }

        // Handle custom validation errors
        if (error.type && this.validationErrors[error.type]) {
            return this.validationErrors[error.type];
        }

        // Handle generic errors
        if (error.message) {
            return error.message;
        }

        // Default error message
        return 'An unexpected error occurred. Please try again.';
    }

    // Show error with haptic feedback
    static async showError(error, title = 'Error') {
        const message = this.getErrorMessage(error);

        // Trigger error haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Show alert
        Alert.alert(title, message, [{ text: 'OK' }]);

        return message;
    }

    // Show success with haptic feedback
    static async showSuccess(message, title = 'Success') {
        // Trigger success haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show alert
        Alert.alert(title, message, [{ text: 'OK' }]);
    }

    // Show warning with haptic feedback
    static async showWarning(message, title = 'Warning') {
        // Trigger warning haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Show alert
        Alert.alert(title, message, [{ text: 'OK' }]);
    }

    // Show info with haptic feedback
    static async showInfo(message, title = 'Information') {
        // Trigger light haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Show alert
        Alert.alert(title, message, [{ text: 'OK' }]);
    }

    // Handle async operations with error handling
    static async handleAsync(operation, errorTitle = 'Error') {
        try {
            return await operation();
        } catch (error) {
            console.error('Operation failed:', error);
            await this.showError(error, errorTitle);
            throw error;
        }
    }

    // Validate email format
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    static validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];

        if (password.length < minLength) {
            errors.push('At least 8 characters');
        }
        if (!hasUpperCase) {
            errors.push('One uppercase letter');
        }
        if (!hasLowerCase) {
            errors.push('One lowercase letter');
        }
        if (!hasNumbers) {
            errors.push('One number');
        }
        if (!hasSpecialChar) {
            errors.push('One special character');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            message: errors.length > 0 ? `Password must contain: ${errors.join(', ')}` : 'Password is strong'
        };
    }

    // Validate username
    static validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return {
            isValid: usernameRegex.test(username),
            message: usernameRegex.test(username) ? 'Username is valid' : 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
        };
    }

    // Validate phone number
    static validatePhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return {
            isValid: phoneRegex.test(phone),
            message: phoneRegex.test(phone) ? 'Phone number is valid' : 'Please enter a valid phone number'
        };
    }

    // Validate required fields
    static validateRequiredFields(fields) {
        const errors = [];

        Object.keys(fields).forEach(fieldName => {
            const value = fields[fieldName];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors.push(`${fieldName} is required`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors,
            message: errors.length > 0 ? errors.join(', ') : 'All fields are valid'
        };
    }

    // Log error for debugging
    static logError(error, context = '') {
        console.error(`Error in ${context}:`, {
            message: error.message,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });
    }

    // Create custom error
    static createError(message, type = 'GENERIC', code = null) {
        const error = new Error(message);
        error.type = type;
        error.code = code;
        return error;
    }
}

export default ErrorHandler; 