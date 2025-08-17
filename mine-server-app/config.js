// Configuration file for environment-specific settings
const config = {
    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Server settings
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || '0.0.0.0',

    // Security settings
    TIMESTAMP_VALIDATION: {
        // Production: 5 minutes (300000ms)
        // Development: 24 hours (86400000ms)
        MAX_TIME_DIFFERENCE: process.env.NODE_ENV === 'production' ? 300000 : 86400000
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
