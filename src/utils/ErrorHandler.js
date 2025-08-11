import * as Haptics from 'expo-haptics';
import ToastService from './ToastService';

class ErrorHandler {
    static firebaseAuthErrorKeys = {
        'auth/user-not-found': 'errors.firebase.userNotFound',
        'auth/wrong-password': 'errors.firebase.wrongPassword',
        'auth/email-already-in-use': 'errors.firebase.emailInUse',
        'auth/weak-password': 'errors.firebase.weakPassword',
        'auth/invalid-email': 'errors.firebase.invalidEmail',
        'auth/user-disabled': 'errors.firebase.userDisabled',
        'auth/too-many-requests': 'errors.firebase.tooManyRequests',
        'auth/network-request-failed': 'errors.firebase.networkFailed',
        'auth/operation-not-allowed': 'errors.firebase.operationNotAllowed',
        'auth/invalid-credential': 'errors.firebase.invalidCredential',
        'auth/account-exists-with-different-credential': 'errors.firebase.accountExists',
        'auth/requires-recent-login': 'errors.firebase.requiresRecentLogin',
        'auth/invalid-verification-code': 'errors.firebase.invalidVerificationCode',
        'auth/invalid-verification-id': 'errors.firebase.invalidVerificationId',
        'auth/quota-exceeded': 'errors.firebase.quotaExceeded',
        'auth/credential-already-in-use': 'errors.firebase.credentialInUse',
        'auth/timeout': 'errors.firebase.timeout',
        'auth/cancelled-popup-request': 'errors.firebase.cancelledPopup',
        'auth/popup-closed-by-user': 'errors.firebase.popupClosed',
        'auth/popup-blocked': 'errors.firebase.popupBlocked',
        'auth/unauthorized-domain': 'errors.firebase.unauthorizedDomain',
        'auth/unsupported-persistence-type': 'errors.firebase.unsupportedPersistence',
        'auth/invalid-persistence-type': 'errors.firebase.invalidPersistence',
        'auth/invalid-tenant-id': 'errors.firebase.invalidTenantId',
        'auth/unsupported-tenant-operation': 'errors.firebase.unsupportedTenantOperation',
        'auth/invalid-dynamic-link-domain': 'errors.firebase.invalidDynamicLink',
        'auth/duplicate-credential': 'errors.firebase.duplicateCredential',
        'auth/maximum-second-factor-count-exceeded': 'errors.firebase.maxSecondFactors',
        'auth/second-factor-already-in-use': 'errors.firebase.secondFactorInUse',
        'auth/tenant-id-mismatch': 'errors.firebase.tenantIdMismatch',
        'auth/unsupported-first-factor': 'errors.firebase.unsupportedFirstFactor',
        'auth/email-change-needs-verification': 'errors.firebase.emailChangeVerification',
        'auth/missing-or-invalid-nonce': 'errors.firebase.invalidNonce',
        'auth/invalid-app-credential': 'errors.firebase.invalidAppCredential',
        'auth/invalid-app-id': 'errors.firebase.invalidAppId',
        'auth/invalid-user-token': 'errors.firebase.invalidUserToken',
        'auth/not-authorized': 'errors.firebase.notAuthorized',
        'auth/argument-error': 'errors.firebase.argumentError',
        'auth/invalid-api-key': 'errors.firebase.invalidApiKey',
    };

    static networkErrorKeys = {
        NETWORK_ERROR: 'errors.network.general',
        TIMEOUT_ERROR: 'errors.network.timeout',
        SERVER_ERROR: 'errors.network.server',
        CONNECTION_ERROR: 'errors.network.connection',
    };

    static validationErrorKeys = {
        INVALID_EMAIL: 'errors.validation.invalidEmail',
        INVALID_PASSWORD: 'errors.validation.invalidPassword',
        PASSWORD_MISMATCH: 'errors.validation.passwordMismatch',
        EMPTY_FIELDS: 'errors.validation.emptyFields',
        USERNAME_TAKEN: 'errors.validation.usernameTaken',
        EMAIL_EXISTS: 'errors.validation.emailExists',
        WEAK_PASSWORD: 'errors.validation.weakPassword',
        INVALID_USERNAME: 'errors.validation.invalidUsername',
        INVALID_PHONE: 'errors.validation.invalidPhone',
        INVALID_DATE: 'errors.validation.invalidDate',
        INVALID_AMOUNT: 'errors.validation.invalidAmount',
        INVALID_URL: 'errors.validation.invalidUrl',
    };

    static securityErrorKeys = {
        SECURITY_ERROR: 'errors.security.general',
        ACCOUNT_ERROR: 'errors.security.account',
        ACCESS_DENIED: 'errors.security.accessDenied',
        UNAUTHORIZED_ACCESS: 'errors.security.unauthorized',
        SUSPICIOUS_ACTIVITY: 'errors.security.suspiciousActivity',
        ACCOUNT_COMPROMISED: 'errors.security.accountCompromised',
        SECURITY_VIOLATION: 'errors.security.violation',
        MULTIPLE_FAILED_ATTEMPTS: 'errors.security.multipleAttempts',
        DEVICE_NOT_RECOGNIZED: 'errors.security.deviceNotRecognized',
        LOCATION_MISMATCH: 'errors.security.locationMismatch',
        TIME_MANIPULATION: 'errors.security.timeManipulation',
        ACCOUNT_TEMPORARILY_LOCKED: 'errors.security.accountLocked',
    };

    // Static utility for quick email validation where i18n is not needed
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(String(email || '').trim());
    }

    constructor(t) {
        this.t = t || (key => key);
    }

    getErrorMessage(error) {
        // Handle errors with translation keys first
        if (error.key) {
            return this.t(error.key, error.params);
        }

        // Firebase errors
        if (error.code && ErrorHandler.firebaseAuthErrorKeys[error.code]) {
            return this.t(ErrorHandler.firebaseAuthErrorKeys[error.code]);
        }

        // Network errors
        if (error.type && ErrorHandler.networkErrorKeys[error.type]) {
            return this.t(ErrorHandler.networkErrorKeys[error.type]);
        }

        // Validation errors
        if (error.type && ErrorHandler.validationErrorKeys[error.type]) {
            return this.t(ErrorHandler.validationErrorKeys[error.type]);
        }

        // Security errors
        if (error.type && ErrorHandler.securityErrorKeys[error.type]) {
            return this.t(ErrorHandler.securityErrorKeys[error.type]);
        }

        // Generic errors
        if (error.message) {
            return error.message;
        }

        return this.t('errors.generic');
    }

    createError(key, type = 'GENERIC', code = null, params = {}) {
        const error = new Error(key);
        error.key = key;
        error.type = type;
        error.code = code;
        error.params = params;
        return error;
    }

    async showError(error, title = 'common.error') {
        const message = this.getErrorMessage(error);
        const translatedTitle = this.t(title);

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        ToastService.error(message);
        return message;
    }

    async showSuccess(messageKey, titleKey = 'common.success', params = {}) {
        const message = this.t(messageKey, params);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        ToastService.success(message);
    }

    async showWarning(messageKey, titleKey = 'common.warning', params = {}) {
        const message = this.t(messageKey, params);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        ToastService.warning(message);
    }

    async showInfo(messageKey, titleKey = 'common.information', params = {}) {
        const message = this.t(messageKey, params);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        ToastService.info(message);
    }

    async handleAsync(operation, errorTitle = 'common.error') {
        try {
            return await operation();
        } catch (error) {
            console.error('Operation failed:', error);
            await this.showError(error, errorTitle);
            throw error;
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                isValid: false,
                message: this.t('errors.validation.invalidEmail')
            };
        }
        return { isValid: true };
    }

    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];

        if (password.length < minLength) errors.push(this.t('errors.password.atLeast8Chars'));
        if (!hasUpperCase) errors.push(this.t('errors.password.oneUppercase'));
        if (!hasLowerCase) errors.push(this.t('errors.password.oneLowercase'));
        if (!hasNumbers) errors.push(this.t('errors.password.oneNumber'));
        if (!hasSpecialChar) errors.push(this.t('errors.password.oneSpecialChar'));

        if (errors.length > 0) {
            return {
                isValid: false,
                errors,
                message: this.t('errors.password.mustContain', { requirements: errors.join(', ') })
            };
        }

        return {
            isValid: true,
            message: this.t('errors.password.isStrong')
        };
    }

    validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return {
                isValid: false,
                message: this.t('errors.username.requirements')
            };
        }
        return {
            isValid: true,
            message: this.t('errors.username.isValid')
        };
    }

    validatePhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(phone)) {
            return {
                isValid: false,
                message: this.t('errors.validation.invalidPhone')
            };
        }
        return {
            isValid: true,
            message: this.t('errors.validation.validPhone')
        };
    }

    validateRequiredFields(fields) {
        const errors = [];
        const fieldNames = {
            email: this.t('common.email'),
            password: this.t('common.password'),
            username: this.t('common.username'),
            firstName: this.t('common.firstName'),
            lastName: this.t('common.lastName'),
        };

        Object.keys(fields).forEach(fieldName => {
            const value = fields[fieldName];
            const displayName = fieldNames[fieldName] || fieldName;

            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors.push(this.t('errors.validation.requiredField', { field: displayName }));
            }
        });

        if (errors.length > 0) {
            return {
                isValid: false,
                errors,
                message: errors.join('\n')
            };
        }

        return {
            isValid: true,
            message: this.t('errors.validation.allFieldsValid')
        };
    }

    logError(error, context = '') {
        console.error(`[${new Date().toISOString()}] Error in ${context}:`, {
            message: error.message,
            key: error.key,
            type: error.type,
            code: error.code,
            params: error.params,
            stack: error.stack,
        });
    }
}

export default ErrorHandler;