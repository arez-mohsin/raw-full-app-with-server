# Development Setup Guide

## Environment Configuration

The server now supports different timestamp validation rules for development and production environments.

### Development Mode (Default)
- **Timestamp Validation**: 24 hours (86400000ms)
- **Rate Limiting**: More lenient (1000 requests per 15 minutes)
- **Logging**: Debug level

### Production Mode
- **Timestamp Validation**: 5 minutes (300000ms)
- **Rate Limiting**: Strict (100 requests per 15 minutes)
- **Logging**: Info level

## Running the Server

### Development Mode
```bash
# Using nodemon for auto-restart
npm run dev

# Or clustered development
npm run dev:clustered
```

### Production Mode
```bash
# Production mode
npm start

# Or clustered production
npm run start:clustered
```

## Environment Variables

You can set the following environment variables:

```bash
# Set environment (development/production)
export NODE_ENV=development

# Set port
export PORT=3000

# Set log level
export LOG_LEVEL=debug
```

## Configuration File

The `config.js` file contains all environment-specific settings:

```javascript
const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    TIMESTAMP_VALIDATION: {
        MAX_TIME_DIFFERENCE: process.env.NODE_ENV === 'production' ? 300000 : 86400000
    },
    // ... other settings
};
```

## Troubleshooting

### Timestamp Expired Error
If you get "Request timestamp expired" errors in development:
1. Make sure you're running in development mode: `npm run dev`
2. Check that `NODE_ENV` is set to `development`
3. The server will now allow requests with timestamps up to 24 hours old

### Security in Development
- Development mode is more lenient for testing purposes
- Always use production mode in production environments
- The 5-minute timestamp validation is enforced in production for security
