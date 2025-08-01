# Server Logging System

## Overview

The server now includes a comprehensive logging system that tracks all operations including mining activities, security events, user actions, and system events. The logging system provides both console output and file-based logging with automatic categorization.

## Features

### Log Levels
- **INFO**: General information and successful operations
- **WARN**: Warning messages and potential issues
- **ERROR**: Error messages and exceptions
- **SECURITY**: Security-related events and violations
- **MINING**: Mining-specific operations and events
- **DEBUG**: Debug information (when needed)

### Log Categories
The system automatically categorizes logs into different files:

1. **Daily Logs**: `{level}-{date}.log` (e.g., `info-2024-01-15.log`)
2. **Error Logs**: `errors.log` (all error messages)
3. **Security Logs**: `security.log` (all security events)
4. **Mining Logs**: `mining.log` (all mining operations)

### Log Format
Each log entry includes:
- **Timestamp**: ISO 8601 format
- **Level**: Log level (INFO, WARN, ERROR, etc.)
- **Message**: Human-readable message
- **Data**: Structured data object with relevant information
- **PID**: Process ID for tracking

## Logged Operations

### Mining Operations
- ✅ Start mining requests
- ✅ Mining session checks
- ✅ Session completion and earnings calculation
- ✅ Anti-cheat violations
- ✅ Rate limiting events
- ✅ Session duration monitoring

### Security Events
- ✅ Authentication attempts
- ✅ Device fingerprint validation
- ✅ Suspicious activity detection
- ✅ Time manipulation detection
- ✅ Rate limit violations
- ✅ Invalid requests

### User Actions
- ✅ Upgrade purchases
- ✅ Daily reward claims
- ✅ Session management
- ✅ Balance changes
- ✅ Experience and level progression

### System Events
- ✅ Server startup
- ✅ Firebase initialization
- ✅ Configuration loading
- ✅ Error handling
- ✅ Performance monitoring

## File Structure

```
mine-server-app/
├── logs/
│   ├── info-2024-01-15.log
│   ├── warn-2024-01-15.log
│   ├── error-2024-01-15.log
│   ├── security-2024-01-15.log
│   ├── mining-2024-01-15.log
│   ├── errors.log
│   ├── security.log
│   └── mining.log
├── server.js
├── test-logging.js
└── LOGGING_README.md
```

## Usage

### Testing the Logging System
```bash
cd mine-server-app
node test-logging.js
```

### Viewing Logs
```bash
# View all errors
cat logs/errors.log

# View security events
cat logs/security.log

# View mining operations
cat logs/mining.log

# View today's info logs
cat logs/info-$(date +%Y-%m-%d).log
```

### Log Analysis
The logs are in JSON format, making them easy to parse and analyze:

```javascript
// Example log entry
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "mining",
  "message": "Mining session started successfully",
  "data": {
    "userId": "user123",
    "deviceFingerprint": "abc123",
    "deviceId": "device456",
    "ip": "192.168.1.100",
    "miningSpeed": 0.000116,
    "efficiency": 1,
    "level": 5,
    "balance": 100
  },
  "pid": 12345
}
```

## Key Logged Events

### Mining Events
- **Start Mining**: When a user starts a mining session
- **Session Check**: Periodic checks for expired sessions
- **Session Completion**: When a session ends and earnings are calculated
- **Anti-cheat Violations**: Suspicious activity detection
- **Rate Limiting**: When users exceed request limits

### Security Events
- **Authentication**: Login attempts and failures
- **Device Validation**: Device fingerprint checks
- **Suspicious Activity**: Potential security violations
- **Time Manipulation**: Detected time-based cheating
- **Rate Limit Exceeded**: Too many requests

### User Actions
- **Upgrades**: Purchase of mining upgrades
- **Daily Claims**: Daily reward collection
- **Balance Changes**: All balance modifications
- **Experience Gains**: Level progression

## Monitoring and Alerts

The logging system can be integrated with monitoring tools:

1. **Error Monitoring**: Track all errors in `errors.log`
2. **Security Monitoring**: Monitor `security.log` for threats
3. **Performance Monitoring**: Track mining operations in `mining.log`
4. **User Activity**: Monitor user actions and patterns

## Configuration

The logging system is automatically configured when the server starts. Log files are created in the `logs/` directory with automatic date-based naming.

## Best Practices

1. **Regular Monitoring**: Check logs daily for issues
2. **Error Tracking**: Monitor `errors.log` for system problems
3. **Security Monitoring**: Review `security.log` for threats
4. **Performance Analysis**: Use `mining.log` to track user activity
5. **Log Rotation**: Consider implementing log rotation for production

## Troubleshooting

### Common Issues
1. **Permission Errors**: Ensure write permissions to `logs/` directory
2. **Disk Space**: Monitor log file sizes
3. **Performance**: Large log files may impact performance

### Debugging
- Use `test-logging.js` to verify logging functionality
- Check console output for immediate feedback
- Review log files for detailed information

## Integration

The logging system is fully integrated into the server and requires no additional setup. All endpoints and operations automatically log their activities with relevant context and data. 