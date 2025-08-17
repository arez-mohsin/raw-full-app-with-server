# Production Setup Guide

## Overview
This guide helps you set up and test your server in production mode to ensure all security features work correctly before deployment.

## Production Mode Features

### Security Features
- **Strict Timestamp Validation**: 5 minutes (300000ms)
- **Strict Rate Limiting**: 100 requests per 15 minutes
- **Enhanced Authentication**: Token validation and refresh
- **Device Fingerprinting**: Anti-cheat protection
- **Request Validation**: Comprehensive input sanitization

### Performance Features
- **Clustering**: Multi-process support for high load
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Error Handling**: Graceful degradation and logging
- **Monitoring**: Health checks and performance metrics

## Testing Production Mode

### 1. Quick Production Test
```bash
# Test production mode with single server
npm run test:prod

# Test production mode with clustered server
npm run test:prod:clustered
```

### 2. Manual Production Testing
```bash
# Set production environment
export NODE_ENV=production

# Start production server
npm start

# Or start clustered production server
npm run start:clustered
```

## Production Configuration

### Environment Variables
```bash
# Required for production
export NODE_ENV=production
export PORT=5000
export HOST=0.0.0.0

# Optional security settings
export API_KEY=your_secure_api_key
export ENCRYPTION_KEY=your_encryption_key
export REQUEST_SECRET=your_request_secret
```

### Configuration File
The `config.js` file automatically adjusts settings based on `NODE_ENV`:

```javascript
// Production settings (NODE_ENV=production)
TIMESTAMP_VALIDATION: {
    MAX_TIME_DIFFERENCE: 300000  // 5 minutes
},
RATE_LIMIT: {
    MAX_REQUESTS: 100  // Strict rate limiting
}

// Development settings (NODE_ENV=development)
TIMESTAMP_VALIDATION: {
    MAX_TIME_DIFFERENCE: 86400000  // 24 hours
},
RATE_LIMIT: {
    MAX_REQUESTS: 1000  // Lenient rate limiting
}
```

## Testing Checklist

### Authentication Testing
- [ ] User login works correctly
- [ ] Token refresh works automatically
- [ ] Expired tokens are rejected
- [ ] Device fingerprint validation works

### Security Testing
- [ ] Timestamp validation is strict (5 minutes)
- [ ] Rate limiting is enforced
- [ ] Device fingerprint changes are detected
- [ ] Suspicious activity is logged

### API Testing
- [ ] Start mining endpoint works
- [ ] Check mining session endpoint works
- [ ] Error handling is graceful
- [ ] Logging is comprehensive

### Performance Testing
- [ ] Server handles multiple concurrent requests
- [ ] Response times are acceptable
- [ ] Memory usage is stable
- [ ] CPU usage is reasonable

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass in production mode
- [ ] Environment variables are set correctly
- [ ] Firebase configuration is production-ready
- [ ] SSL certificates are configured (if using HTTPS)

### Deployment
- [ ] Use production npm scripts: `npm start` or `npm run start:clustered`
- [ ] Monitor server logs for errors
- [ ] Verify health check endpoint: `/health`
- [ ] Test all critical endpoints

### Post-Deployment
- [ ] Monitor server performance
- [ ] Check error logs regularly
- [ ] Verify security features are working
- [ ] Monitor rate limiting effectiveness

## Troubleshooting

### Common Production Issues

#### 1. Timestamp Validation Too Strict
**Problem**: Users get "Request timestamp expired" errors
**Solution**: Verify `NODE_ENV=production` is set correctly

#### 2. Rate Limiting Too Aggressive
**Problem**: Legitimate users hit rate limits
**Solution**: Adjust `MAX_REQUESTS` in config.js for production

#### 3. Authentication Failures
**Problem**: Users can't authenticate
**Solution**: Check Firebase configuration and token validation

#### 4. Performance Issues
**Problem**: Server is slow or unresponsive
**Solution**: Use clustered mode and monitor resource usage

### Debug Commands
```bash
# Check environment
echo $NODE_ENV

# Check server status
curl http://localhost:5000/health

# Check server logs
tail -f logs/error.log
tail -f logs/security.log
```

## Security Best Practices

### 1. Environment Variables
- Never commit sensitive values to version control
- Use strong, unique keys for production
- Rotate keys regularly

### 2. Network Security
- Use HTTPS in production
- Configure firewall rules
- Monitor network traffic

### 3. Monitoring
- Set up log aggregation
- Monitor authentication failures
- Track suspicious activity patterns

### 4. Updates
- Keep dependencies updated
- Monitor security advisories
- Test updates in staging first

## Support

For issues in production:
1. Check the logs in the `logs/` directory
2. Verify environment configuration
3. Test with the production testing script
4. Check Firebase console for authentication issues
5. Monitor server health endpoints
