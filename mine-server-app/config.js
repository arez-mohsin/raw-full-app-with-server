// Configuration file for environment-specific settings
const config = {
    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Server settings
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || '0.0.0.0',

    // Security settings
    TIMESTAMP_VALIDATION: {
        // Both production and development: 5 minutes (300000ms)
        // This ensures consistent behavior and catches timestamp issues early
        // Previously: Production used 5 minutes, Development used 24 hours
        // Now: Both use 5 minutes for consistent testing and security
        MAX_TIME_DIFFERENCE: 300000
    },

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',

    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: process.env.NODE_ENV === 'production' ? 100 : 1000
    }
};

module.exports = config;
