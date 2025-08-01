# Social Authentication Setup Guide

## Overview
This guide provides step-by-step instructions for setting up Apple and Google authentication in your React Native Expo app with comprehensive security measures.

## 📋 Prerequisites

### Required Accounts
- [ ] Apple Developer Account ($99/year)
- [ ] Google Cloud Console Account (Free)
- [ ] Firebase Project
- [ ] Expo Account

### Required Tools
- [ ] Xcode (for iOS development)
- [ ] Android Studio (for Android development)
- [ ] Expo CLI
- [ ] Node.js and npm

## 🔧 Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API and Google Sign-In API

### 1.2 Configure OAuth Consent Screen
1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - App name: "Your Crypto Mining App"
   - User support email: your-email@domain.com
   - Developer contact information: your-email@domain.com
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (your email addresses)

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Create credentials for each platform:

#### Web Application
- Application type: Web application
- Name: "Web Client"
- Authorized JavaScript origins: `https://your-app-domain.com`
- Authorized redirect URIs: `https://your-app-domain.com/auth/callback`

#### iOS Application
- Application type: iOS
- Name: "iOS Client"
- Bundle ID: `com.yourcompany.yourapp`

#### Android Application
- Application type: Android
- Name: "Android Client"
- Package name: `com.yourcompany.yourapp`
- SHA-1 certificate fingerprint: (Get from your keystore)

### 1.4 Get SHA-1 Certificate Fingerprint
```bash
# For debug keystore (default)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

## 🍎 Step 2: Apple Developer Setup

### 2.1 Configure App ID
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Go to "Identifiers" > "App IDs"
4. Create new App ID or edit existing one
5. Enable "Sign In with Apple" capability
6. Configure domains and redirect URLs

### 2.2 Create Service ID
1. Go to "Identifiers" > "Services IDs"
2. Create new Service ID
3. Enable "Sign In with Apple"
4. Configure domains and redirect URLs
5. Note the Service ID for Firebase configuration

### 2.3 Create Private Key
1. Go to "Keys" section
2. Create new key with "Sign In with Apple" enabled
3. Download the private key (.p8 file)
4. Note the Key ID and Team ID

## 🔥 Step 3: Firebase Configuration

### 3.1 Enable Authentication Providers
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Authentication" > "Sign-in method"
4. Enable "Google" provider
5. Enable "Apple" provider

### 3.2 Configure Google Provider
1. Click on "Google" provider
2. Enable "Enable" toggle
3. Add your Google Cloud OAuth 2.0 client IDs
4. Save configuration

### 3.3 Configure Apple Provider
1. Click on "Apple" provider
2. Enable "Enable" toggle
3. Add your Apple Service ID
4. Upload your private key (.p8 file)
5. Enter Key ID and Team ID
6. Save configuration

## 📱 Step 4: Expo Configuration

### 4.1 Install Dependencies
```bash
npm install expo-apple-authentication expo-auth-session expo-crypto expo-web-browser @react-native-google-signin/google-signin
```

### 4.2 Configure app.json
```json
{
  "expo": {
    "name": "Your Crypto Mining App",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.yourapp",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLName": "google",
            "CFBundleURLSchemes": [
              "com.googleusercontent.apps.YOUR_CLIENT_ID"
            ]
          }
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.yourapp",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

### 4.3 Configure Google Services
1. Download `google-services.json` from Firebase Console
2. Place it in your project root
3. For iOS, download `GoogleService-Info.plist` and add to Xcode project

## 🔐 Step 5: Security Configuration

### 5.1 Update SocialAuthService.js
Replace the placeholder client IDs in `src/services/SocialAuthService.js`:

```javascript
GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    offlineAccess: true,
    hostedDomain: '',
    forceCodeForRefreshToken: true,
});
```

### 5.2 Configure Firebase Security Rules
```javascript
// firestore.rules
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

## 🧪 Step 6: Testing

### 6.1 Test Google Sign-In
```javascript
// Test Google authentication
try {
    const result = await SocialAuthService.signInWithGoogle();
    console.log('Google sign-in successful:', result);
} catch (error) {
    console.error('Google sign-in failed:', error);
}
```

### 6.2 Test Apple Sign-In
```javascript
// Test Apple authentication
try {
    const result = await SocialAuthService.signInWithApple();
    console.log('Apple sign-in successful:', result);
} catch (error) {
    console.error('Apple sign-in failed:', error);
}
```

### 6.3 Test User Document Creation
```javascript
// Verify user document creation
const userRef = doc(db, 'users', user.uid);
const userDoc = await getDoc(userRef);
console.log('User document:', userDoc.data());
```

## 🔍 Step 7: Monitoring and Debugging

### 7.1 Enable Debug Logging
```javascript
// Add to your app initialization
if (__DEV__) {
    console.log('Social Auth Service initialized');
    SocialAuthService.checkSocialLoginAvailability().then(availability => {
        console.log('Social login availability:', availability);
    });
}
```

### 7.2 Monitor Security Events
```javascript
// Check security events in Firebase Console
// Go to Firestore > securityEvents collection
```

### 7.3 Test Error Handling
```javascript
// Test various error scenarios
- Network connectivity issues
- Invalid credentials
- Cancelled authentication
- Device compatibility issues
```

## 🚨 Troubleshooting

### Common Issues

#### Google Sign-In Issues
1. **"DEVELOPER_ERROR"**: Check client ID configuration
2. **"SIGN_IN_CANCELLED"**: User cancelled the sign-in
3. **"NETWORK_ERROR"**: Check internet connectivity
4. **"INVALID_ACCOUNT"**: Check OAuth consent screen configuration

#### Apple Sign-In Issues
1. **"ERR_CANCELED"**: User cancelled the sign-in
2. **"ERR_INVALID_RESPONSE"**: Check Apple Developer configuration
3. **"ERR_NOT_AVAILABLE"**: Apple Sign-In not available on device
4. **"ERR_REQUEST_FAILED"**: Check network connectivity

#### Firebase Issues
1. **"auth/operation-not-allowed"**: Enable provider in Firebase Console
2. **"auth/invalid-credential"**: Check token validation
3. **"auth/user-disabled"**: User account disabled
4. **"auth/too-many-requests"**: Rate limiting applied

### Debug Steps
1. Check console logs for detailed error messages
2. Verify all client IDs are correct
3. Test on different devices and platforms
4. Check Firebase Console for authentication logs
5. Verify network connectivity
6. Test with different user accounts

## 📊 Security Checklist

### Pre-Launch
- [ ] All client IDs configured correctly
- [ ] Firebase security rules implemented
- [ ] Error handling tested
- [ ] Rate limiting configured
- [ ] Security event logging enabled
- [ ] User document creation tested
- [ ] Device tracking implemented
- [ ] Input sanitization verified

### Post-Launch
- [ ] Monitor authentication success rates
- [ ] Track security events
- [ ] Monitor user activity patterns
- [ ] Review error logs regularly
- [ ] Update security measures as needed
- [ ] Conduct regular security audits

## 📞 Support

### Documentation
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google Sign-In React Native](https://github.com/react-native-google-signin/google-signin)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

### Community Support
- [Expo Discord](https://discord.gg/expo)
- [React Native Community](https://github.com/react-native-community)
- [Firebase Support](https://firebase.google.com/support)

---

**Note**: This setup provides enterprise-level security for social authentication. Regular security audits and updates are essential for maintaining protection. 