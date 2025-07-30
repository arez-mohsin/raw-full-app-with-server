class InputSanitizer {
    // Sanitize text input
    static sanitizeText(input) {
        if (typeof input !== 'string') return '';

        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .substring(0, 1000); // Limit length
    }

    // Sanitize email
    static sanitizeEmail(email) {
        if (typeof email !== 'string') return '';

        return email
            .trim()
            .toLowerCase()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 254); // Email max length
    }

    // Sanitize username
    static sanitizeUsername(username) {
        if (typeof username !== 'string') return '';

        return username
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
            .substring(0, 20); // Limit length
    }

    // Sanitize numeric input
    static sanitizeNumber(input) {
        const num = parseFloat(input);
        return isNaN(num) ? 0 : num;
    }

    // Validate and sanitize invite code
    static sanitizeInviteCode(code) {
        if (typeof code !== 'string') return '';

        return code
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '') // Only allow uppercase letters and numbers
            .substring(0, 8); // Limit to 8 characters
    }

    // Sanitize object properties
    static sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) return {};

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeText(value);
            } else if (typeof value === 'number') {
                sanitized[key] = this.sanitizeNumber(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    // Validate input length
    static validateLength(input, minLength = 0, maxLength = 1000) {
        if (typeof input !== 'string') return false;
        return input.length >= minLength && input.length <= maxLength;
    }

    // Validate email format
    static validateEmail(email) {
        if (typeof email !== 'string') return false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim().toLowerCase());
    }

    // Validate username format
    static validateUsername(username) {
        if (typeof username !== 'string') return false;

        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        return usernameRegex.test(username);
    }

    // Validate password strength
    static validatePassword(password) {
        if (typeof password !== 'string') return false;

        // At least 6 characters, can include letters, numbers, and special characters
        return password.length >= 6 && password.length <= 128;
    }

    // Check for suspicious patterns
    static detectSuspiciousPatterns(input) {
        if (typeof input !== 'string') return false;

        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+=/i,
            /eval\(/i,
            /document\./i,
            /window\./i,
            /alert\(/i,
            /confirm\(/i,
            /prompt\(/i,
        ];

        return suspiciousPatterns.some(pattern => pattern.test(input));
    }
}

export default InputSanitizer; 