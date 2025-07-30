// Security Configuration for Mine Server App
// IMPORTANT: Keep this file secure and never commit it to version control

const crypto = require('crypto');

module.exports = {
    // Generate these keys and keep them secret
    API_KEY: process.env.API_KEY || crypto.randomBytes(32).toString('hex'),
    REQUEST_SECRET: process.env.REQUEST_SECRET || crypto.randomBytes(64).toString('hex'),
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),

    // Rate limiting
    MAX_REQUESTS_PER_MINUTE: 30,
    MAX_REQUESTS_PER_HOUR: 1000,

    // Session timeout
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes

    // Anti-cheat thresholds
    SUSPICIOUS_ACTIVITY_THRESHOLD: 5,

    // IP whitelist (optional)
    IP_WHITELIST: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],

    // Request timeout
    REQUEST_TIMEOUT: 300000, // 5 minutes

    // Logging
    LOG_SUSPICIOUS_ACTIVITY: true,
    LOG_ALL_REQUESTS: false,

    // Encryption settings
    ENCRYPTION_ALGORITHM: 'aes-256-cbc',
    HASH_ALGORITHM: 'sha256'
}; 