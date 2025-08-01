# User Document Structure Guide

## Overview
This document outlines the comprehensive user document structure created when users authenticate with Apple or Google, including security measures, tracking fields, and data organization.

## 📋 User Document Structure

### Basic User Information
```javascript
{
    // Unique identifier from Firebase Auth
    uid: "firebase-user-id",
    
    // User profile information
    username: "john_doe",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    photoURL: "https://example.com/photo.jpg",
    bannerURL: "",
    
    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    lastSeen: serverTimestamp(),
    
    // Authentication provider
    authProvider: "google", // or "apple"
    isVerified: true, // Social login users are pre-verified
    
    // User role and status
    role: "user",
    isActive: true,
}
```

### Security Settings
```javascript
{
    securitySettings: {
        // Two-factor authentication
        twoFactorEnabled: false,
        twoFactorMethod: null, // "sms", "email", "authenticator"
        
        // Password management (for email users)
        lastPasswordChange: serverTimestamp(),
        passwordHistory: [],
        
        // Login attempt tracking
        loginAttempts: 0,
        lastFailedLogin: null,
        accountLocked: false,
        lockoutUntil: null,
        
        // Social login settings
        socialLoginEnabled: true,
        allowedSocialProviders: ["google", "apple"],
        
        // Security preferences
        requireEmailVerification: false, // Social users are pre-verified
        allowMultipleDevices: true,
        sessionTimeout: 3600, // seconds
        
        // Privacy settings
        shareProfileData: true,
        allowAnalytics: true,
        allowMarketing: false,
    }
}
```

### Device History and Tracking
```javascript
{
    deviceHistory: [
        {
            // Device identification
            deviceId: "iPhone14-Pro-iOS17.0-com.example.app",
            deviceName: "iPhone 14 Pro",
            deviceType: "phone",
            
            // Operating system
            osName: "iOS",
            osVersion: "17.0",
            osBuildId: "21A329",
            osInternalBuildId: "21A329",
            
            // Hardware information
            deviceYearClass: 2022,
            totalMemory: 6144, // MB
            supportedCpuArchitectures: ["arm64"],
            brand: "Apple",
            manufacturer: "Apple Inc.",
            modelName: "iPhone 14 Pro",
            modelId: "iPhone15,2",
            
            // App information
            appVersion: "1.0.0",
            appBuildVersion: "1",
            bundleIdentifier: "com.example.app",
            appName: "Crypto Mining App",
            
            // Network information
            networkType: "wifi",
            isConnected: true,
            isInternetReachable: true,
            
            // Location information (if permission granted)
            location: {
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 5.0,
                altitude: 10.0,
                heading: 180.0,
                speed: 0.0,
            },
            
            // Timestamp
            timestamp: "2024-01-15T10:30:00.000Z",
            
            // Login type
            type: "social_login", // or "email_login", "biometric_login"
        }
    ],
    
    // Current device information
    lastLoginDevice: {
        // Same structure as deviceHistory entries
        deviceId: "iPhone14-Pro-iOS17.0-com.example.app",
        deviceName: "iPhone 14 Pro",
        // ... other device info
    }
}
```

### Social Login History
```javascript
{
    socialLoginHistory: [
        {
            // Provider information
            provider: "google", // or "apple"
            providerUserId: "google-user-id",
            
            // Authentication details
            accessToken: "encrypted-access-token",
            refreshToken: "encrypted-refresh-token",
            tokenExpiry: "2024-02-15T10:30:00.000Z",
            
            // Device information
            deviceInfo: {
                deviceId: "iPhone14-Pro-iOS17.0-com.example.app",
                deviceName: "iPhone 14 Pro",
                // ... other device info
            },
            
            // Timestamp
            timestamp: "2024-01-15T10:30:00.000Z",
            
            // Success/failure status
            success: true,
            errorMessage: null,
            
            // Security metadata
            ipAddress: "192.168.1.100",
            userAgent: "CryptoMiningApp/1.0.0",
            sessionId: "session-uuid",
        }
    ],
    
    // Social login statistics
    socialLoginStats: {
        totalLogins: 15,
        googleLogins: 10,
        appleLogins: 5,
        lastGoogleLogin: "2024-01-15T10:30:00.000Z",
        lastAppleLogin: "2024-01-10T14:20:00.000Z",
        failedAttempts: 2,
        lastFailedAttempt: "2024-01-12T09:15:00.000Z",
    }
}
```

### Crypto Mining Profile
```javascript
{
    // Mining statistics
    balance: 150.50,
    miningPower: 1000,
    totalMined: 500.25,
    miningEfficiency: 0.85,
    
    // Mining history
    miningHistory: [
        {
            sessionId: "mining-session-uuid",
            startTime: "2024-01-15T10:30:00.000Z",
            endTime: "2024-01-15T11:30:00.000Z",
            duration: 3600, // seconds
            coinsEarned: 5.25,
            miningPower: 1000,
            efficiency: 0.85,
            deviceInfo: {
                deviceId: "iPhone14-Pro-iOS17.0-com.example.app",
                // ... device info
            }
        }
    ],
    
    // Mining settings
    miningSettings: {
        autoMining: true,
        miningIntensity: "medium", // "low", "medium", "high"
        notificationsEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
    }
}
```

### Referral System
```javascript
{
    // Referral information
    referredBy: "referrer-user-id", // null if no referrer
    inviteCode: "ABC12345",
    
    // Referral statistics
    totalReferrals: 5,
    totalReferralEarnings: 250.00,
    referralLevel: 1,
    
    // Referral history
    referralHistory: [
        {
            referredUserId: "referred-user-id",
            referredUserEmail: "referred@example.com",
            referralDate: "2024-01-10T14:20:00.000Z",
            bonusEarned: 50.00,
            status: "completed", // "pending", "completed", "cancelled"
        }
    ]
}
```

### Activity and Analytics
```javascript
{
    // Activity tracking
    totalLogins: 25,
    loginHistory: [
        {
            timestamp: "2024-01-15T10:30:00.000Z",
            method: "social_login", // "email_login", "biometric_login"
            provider: "google",
            deviceInfo: {
                deviceId: "iPhone14-Pro-iOS17.0-com.example.app",
                // ... device info
            },
            success: true,
            sessionDuration: 3600, // seconds
        }
    ],
    
    // User behavior analytics
    analytics: {
        averageSessionDuration: 1800, // seconds
        mostActiveTime: "18:00-22:00",
        preferredDevice: "iPhone 14 Pro",
        loginFrequency: "daily",
        miningSessions: 50,
        totalMiningTime: 72000, // seconds
    }
}
```

### Privacy and Compliance
```javascript
{
    // Privacy settings
    privacySettings: {
        dataSharing: {
            analytics: true,
            marketing: false,
            thirdParty: false,
        },
        visibility: {
            profile: "public", // "public", "friends", "private"
            miningStats: "public",
            balance: "private",
        },
        notifications: {
            email: true,
            push: true,
            sms: false,
        }
    },
    
    // Compliance tracking
    compliance: {
        gdprConsent: true,
        gdprConsentDate: "2024-01-15T10:30:00.000Z",
        termsAccepted: true,
        termsAcceptedDate: "2024-01-15T10:30:00.000Z",
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedDate: "2024-01-15T10:30:00.000Z",
        ageVerification: true,
        ageVerificationDate: "2024-01-15T10:30:00.000Z",
    }
}
```

## 🔐 Security Features

### Data Encryption
- **Sensitive Data**: Access tokens, refresh tokens, and personal information are encrypted
- **Device Fingerprinting**: Unique device identification for security tracking
- **Session Management**: Secure session handling with timeout mechanisms

### Access Control
- **Role-based Access**: Different permission levels for different user roles
- **Device Verification**: Multi-device login tracking and verification
- **Geographic Tracking**: Location-based security monitoring

### Audit Trail
- **Comprehensive Logging**: All user actions are logged with timestamps
- **Security Events**: Failed login attempts, suspicious activity tracking
- **Activity History**: Complete user activity history for analysis

## 📊 Data Management

### Data Retention
- **User Data**: Retained for account lifetime
- **Activity Logs**: Retained for 2 years
- **Security Events**: Retained for 5 years
- **Analytics Data**: Retained for 1 year

### Data Deletion
- **Account Deletion**: Complete data removal on account deletion
- **Data Export**: User can export their data
- **Right to be Forgotten**: GDPR compliance for data deletion

### Data Backup
- **Automatic Backup**: Daily automated backups
- **Disaster Recovery**: Multi-region backup storage
- **Data Integrity**: Checksums and validation

## 🚀 Performance Optimization

### Indexing Strategy
```javascript
// Firestore indexes for optimal performance
{
    // User queries
    "users": {
        "email": "ASC",
        "username": "ASC",
        "createdAt": "DESC"
    },
    
    // Security events
    "securityEvents": {
        "userId": "ASC",
        "timestamp": "DESC",
        "eventType": "ASC"
    },
    
    // Activity logs
    "activityLogs": {
        "userId": "ASC",
        "timestamp": "DESC",
        "activityType": "ASC"
    }
}
```

### Query Optimization
- **Pagination**: Implemented for large datasets
- **Caching**: Frequently accessed data cached
- **Lazy Loading**: Load data on demand
- **Compression**: Data compression for storage efficiency

## 📈 Monitoring and Analytics

### Key Metrics
- **User Engagement**: Login frequency, session duration
- **Security Metrics**: Failed login attempts, suspicious activity
- **Performance Metrics**: Query response times, storage usage
- **Business Metrics**: Mining activity, referral conversions

### Alerting
- **Security Alerts**: Failed authentication attempts
- **Performance Alerts**: Slow queries, high storage usage
- **Business Alerts**: Unusual user activity patterns

## 🔧 Implementation Notes

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        (resource.data.securitySettings.socialLoginEnabled == true || 
         request.auth.token.provider == 'google' || 
         request.auth.token.provider == 'apple');
    }
    
    // Security events
    match /securityEvents/{eventId} {
      allow read, write: if request.auth != null;
    }
    
    // Activity logs
    match /activityLogs/{logId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Data Validation
- **Input Sanitization**: All user inputs are sanitized
- **Type Checking**: Strict type validation for all fields
- **Range Validation**: Numeric values within acceptable ranges
- **Format Validation**: Email, date, and other format validation

### Error Handling
- **Graceful Degradation**: App continues to function with partial data
- **User Feedback**: Clear error messages for users
- **Logging**: Comprehensive error logging for debugging
- **Recovery**: Automatic retry mechanisms for failed operations

---

**Note**: This user document structure provides comprehensive user management with enterprise-level security and privacy protection. Regular audits and updates ensure data integrity and compliance with privacy regulations. 