# Enhanced Account Status Check Feature

## Overview
This enhanced feature adds comprehensive account status checking with multiple layers of security to prevent disabled or locked users from accessing the app. It includes:

- **Account Status Fields**: `isDisabled` and `isLocked` for administrator control
- **Consecutive Attempt Locking**: Locks account after 5 consecutive failed login attempts (15-minute lockout)
- **Hourly Rate Limiting**: Locks account after 5 failed attempts within 1 hour (1-hour lockout)
- **Spam Protection**: Prevents abuse of "Check Again" button (5 attempts per hour)

## Implementation Details

### 1. AccountStatusService (`src/services/AccountStatusService.js`)
A comprehensive service that handles all account status checks and security measures:

#### Core Methods:
- **`checkAccountStatus(userId)`**: Checks if a user account is disabled or locked
- **`canUserAccess(userId)`**: Determines if a user can access the app
- **`getAccountStatusDetails(userId)`**: Gets formatted status information for display

#### Security Methods:
- **`recordFailedLoginAttempt(userId, attemptInfo)`**: Records failed login attempts with device info
- **`lockAccountForFailedAttempts(userId, failedAttempts)`**: Locks account for consecutive failures
- **`lockAccountForHourlyLimit(userId, attemptsInCurrentHour)`**: Locks account for hourly rate limit
- **`resetFailedLoginAttempts(userId)`**: Resets counters on successful login
- **`getLockoutStatus(userId)`**: Gets detailed lockout information

#### Spam Protection Methods:
- **`recordCheckAgainAttempt(userId)`**: Tracks "Check Again" button usage
- **`canCheckAgain(userId)`**: Checks if button should be disabled

### 2. AccountStatusErrorScreen (`src/Screens/Errors/AccountStatusErrorScreen.js`)
Enhanced error screen with real-time countdown timers and spam protection:

- Shows appropriate error messages based on account status
- Real-time countdown for lockout duration
- Spam-protected "Check Again" button with rate limiting
- Provides options to contact support, check status again, or sign out

### 3. Integration Points
The account status check is integrated into all authentication flows:

- **SplashScreen**: Checks account status during app initialization
- **LoginScreen**: Checks account status after successful login (password, biometric, social)
- **EmailVerificationScreen**: Checks account status after email verification
- **KYCScreen**: Checks account status after KYC submission
- **ForgotPasswordScreen**: Checks account status for authenticated users

## User Document Structure

To use this feature, ensure your user documents in Firestore include these fields:

```javascript
{
  uid: "user-id",
  // ... other user fields
  
  // Account status fields
  isDisabled: false,  // Set to true to disable account
  isLocked: false,    // Set to true to lock account
  
  // Failed attempt tracking (automatically managed)
  failedLoginAttempts: 0,        // Current count of consecutive failed attempts
  maxFailedAttempts: 5,          // Maximum consecutive attempts before auto-lock (default: 5)
  lockoutDuration: 900000,       // Lockout duration in milliseconds (default: 15 minutes)
  lastFailedAttempt: null,       // Timestamp of last failed attempt
  lastFailedLoginInfo: {         // Details of last failed attempt
    timestamp: "2024-01-01T00:00:00.000Z",
    deviceInfo: {},
    ipAddress: "192.168.1.1",
    userAgent: "React Native App"
  },
  
  // Hourly rate limiting (automatically managed)
  hourlyAttempts: [],            // Array of timestamps for failed attempts in last hour
  lockoutType: null,             // Type of lockout: 'consecutive_attempts' or 'hourly_rate_limit'
  lockoutExpiresAt: null,        // When the lockout expires
  
  // Spam protection for "Check Again" button
  checkAgainAttempts: [],        // Array of timestamps for check again attempts in last hour
  
  // ... other fields
}
```

## Security Features

### 1. Consecutive Attempt Locking
- **Trigger**: 5 consecutive failed login attempts
- **Duration**: 15 minutes (configurable)
- **Reset**: On successful login
- **Purpose**: Prevents brute force attacks

### 2. Hourly Rate Limiting
- **Trigger**: 5 failed attempts within 1 hour (rolling window)
- **Duration**: Until next hour boundary
- **Reset**: Automatically at hour boundary
- **Purpose**: Prevents distributed attacks over time

### 3. Spam Protection
- **Trigger**: 5 "Check Again" button clicks within 1 hour
- **Duration**: 1 hour from first attempt
- **Reset**: Automatically at hour boundary
- **Purpose**: Prevents abuse of status checking

## Admin Usage

### Disable an Account
```javascript
// In Firestore or admin panel
await updateDoc(doc(db, 'users', userId), {
  isDisabled: true,
  disabledAt: serverTimestamp(),
  disabledReason: 'Violation of terms of service'
});
```

### Lock an Account
```javascript
// In Firestore or admin panel
await updateDoc(doc(db, 'users', userId), {
  isLocked: true,
  lockedAt: serverTimestamp(),
  lockedReason: 'Suspicious activity detected'
});
```

### Configure Security Settings
```javascript
// Customize security thresholds
await updateDoc(doc(db, 'users', userId), {
  maxFailedAttempts: 3,           // Lock after 3 consecutive attempts
  lockoutDuration: 30 * 60 * 1000, // 30 minute lockout
});
```

### View Security Information
```javascript
// Get comprehensive security status
const userDoc = await getDoc(doc(db, 'users', userId));
const userData = userDoc.data();

console.log('Consecutive attempts:', userData.failedLoginAttempts);
console.log('Hourly attempts:', userData.hourlyAttempts?.length || 0);
console.log('Check again attempts:', userData.checkAgainAttempts?.length || 0);
console.log('Lockout type:', userData.lockoutType);
console.log('Lockout expires:', userData.lockoutExpiresAt);
```

### Re-enable an Account
```javascript
// In Firestore or admin panel
await updateDoc(doc(db, 'users', userId), {
  isDisabled: false,
  isLocked: false,
  failedLoginAttempts: 0,
  hourlyAttempts: [],
  checkAgainAttempts: [],
  reEnabledAt: serverTimestamp(),
  reEnabledReason: 'Issue resolved'
});
```

## User Experience Features

### 1. Real-time Countdown Timers
- **Lockout Timer**: Shows remaining time until account unlocks
- **Check Again Timer**: Shows remaining time until button re-enables
- **Format**: MM:SS display with automatic updates

### 2. Clear Status Messages
- **Disabled Account**: "Account has been disabled by administrator"
- **Consecutive Lock**: "Account temporarily locked due to X consecutive failed login attempts"
- **Hourly Lock**: "Account locked due to 5 failed attempts within 1 hour"
- **Spam Protection**: "Rate Limited - Try again in XX:XX"

### 3. Progressive Button States
- **Normal**: "Check Again (X left)" - shows remaining attempts
- **Disabled**: "Rate Limited - Try again in XX:XX" - shows countdown
- **Visual**: Button changes color and opacity when disabled

## Error Handling

The feature includes comprehensive error handling:

- Network errors fall back to account status error screen
- Firestore errors are logged and handled gracefully
- Users can retry status checks (with rate limiting)
- Fallback navigation ensures users don't get stuck
- Automatic recovery when lockout periods expire

## Testing

To test the enhanced feature:

### 1. Basic Account Status
- **Test Disabled Account**: Set `isDisabled: true` in a user document
- **Test Locked Account**: Set `isLocked: true` in a user document
- **Test Normal Account**: Ensure `isDisabled: false` and `isLocked: false`

### 2. Consecutive Attempt Locking
- Try logging in with wrong password 5 times
- Verify account locks for 15 minutes
- Check countdown timer shows remaining time
- Verify account unlocks automatically

### 3. Hourly Rate Limiting
- Try logging in with wrong password multiple times over an hour
- Verify account locks after 5 attempts within the hour
- Check countdown timer shows time until next hour
- Verify account unlocks at hour boundary

### 4. Spam Protection
- Click "Check Again" button 5 times
- Verify button becomes disabled
- Check countdown timer shows remaining time
- Verify button re-enables after 1 hour

### 5. Error Cases
- Temporarily break Firestore connection
- Test with invalid user IDs
- Test with missing user documents

## Performance Considerations

- Account status checks are lightweight Firestore reads
- Checks are only performed during authentication flows
- No continuous polling or background checks
- Timestamp arrays are automatically cleaned (older than 1 hour removed)
- Caching could be added for frequently accessed users

## Future Enhancements

Potential improvements:

- **Account Status Change Notifications**: Push notifications when status changes
- **Automatic Account Unlocking**: Time-based or condition-based unlocking
- **Admin Dashboard**: Web interface for managing account statuses
- **Bulk Operations**: Mass enable/disable/lock operations
- **Status History Tracking**: Complete audit trail of status changes
- **Integration with Security Systems**: SIEM, threat intelligence feeds
- **Machine Learning**: Adaptive thresholds based on user behavior
- **Geographic Restrictions**: Location-based access controls
- **Device Fingerprinting**: Enhanced device identification
- **Risk Scoring**: Dynamic risk assessment and response

## Security Best Practices

1. **Regular Monitoring**: Monitor failed attempt patterns and lockout events
2. **Threshold Tuning**: Adjust thresholds based on your security requirements
3. **User Communication**: Inform users about security measures and lockout policies
4. **Admin Training**: Ensure administrators understand the locking mechanisms
5. **Audit Logging**: Keep comprehensive logs of all security events
6. **Incident Response**: Have procedures for handling security incidents
7. **User Education**: Teach users about account security best practices

## Compliance and Legal

- **Data Retention**: Ensure lockout data retention complies with regulations
- **User Consent**: Inform users about monitoring and rate limiting
- **Access Rights**: Users should have right to appeal account locks
- **Documentation**: Maintain clear documentation of security policies
- **Regular Review**: Periodically review and update security measures
