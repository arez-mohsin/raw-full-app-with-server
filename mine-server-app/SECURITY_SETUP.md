# Security Setup Guide

## Critical Security Issues Fixed

### 1. Firebase Service Account Security
**Issue**: Firebase service account JSON file was committed to repository
**Fix**: 
- Use environment variable `FIREBASE_SERVICE_ACCOUNT` instead
- Add `*.json` to .gitignore (except package.json files)
- Remove the service account file from repository

### 2. API Keys Security
**Issue**: Hardcoded API keys in both client and server
**Fix**:
- Server: Use environment variables for API keys
- Client: Use `EXPO_PUBLIC_*` environment variables
- Generate random keys on server startup if not provided

### 3. Memory Leaks
**Issue**: Missing cleanup in useEffect hooks
**Fix**: Added proper cleanup functions for auth listeners and app state listeners

## Environment Variables Required

Create a `.env` file in the server directory with:

```env
# Server Configuration
PORT=5000

# Security Keys (Generate these securely in production)
API_KEY=your-secure-api-key-here
REQUEST_SECRET=your-secure-request-secret-here
ENCRYPTION_KEY=your-secure-encryption-key-here

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"your-private-key","client_email":"your-client-email","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"your-cert-url"}

# IP Whitelist (comma-separated)
IP_WHITELIST=192.168.1.8,127.0.0.1

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=30
MAX_REQUESTS_PER_HOUR=1000
```

## Client Environment Variables

Create a `.env` file in the app root with:

```env
EXPO_PUBLIC_API_KEY=your-secure-api-key-here
EXPO_PUBLIC_REQUEST_SECRET=your-secure-request-secret-here
```

## Security Recommendations

1. **Never commit sensitive files** to version control
2. **Use environment variables** for all secrets
3. **Generate random keys** for production
4. **Rotate keys regularly** in production
5. **Use HTTPS** in production
6. **Implement proper logging** for security events
7. **Monitor rate limiting** and suspicious activity
8. **Regular security audits** of the codebase

## Production Checklist

- [ ] Remove Firebase service account file from repository
- [ ] Set up environment variables
- [ ] Use HTTPS in production
- [ ] Implement proper logging
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Backup and disaster recovery plan 