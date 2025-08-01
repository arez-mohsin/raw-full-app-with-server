# Push Notification Setup for Mining

This document explains how the push notification system works for mining notifications in the app.

## Overview

The app now supports push notifications for mining activities using Expo's push notification service. Users will receive notifications when:
1. Mining session starts
2. Mining session completes

## Features

### 1. Push Token Registration
- Automatically registers for push notifications when user logs in
- Stores push token in user document (`pushToken` field)
- Handles permission requests automatically

### 2. Mining Start Notifications
- Sends immediate push notification when mining starts
- Notification includes session duration information
- Uses Expo's push notification service

### 3. Mining Completion Notifications
- Server automatically sends notification when mining session expires (2 hours)
- Includes earned coins information
- Sent from server-side when session check detects completion

## Technical Implementation

### Client-Side (HomeScreen.js)

#### Push Token Registration
```javascript
const registerForPushNotificationsAsync = async () => {
    // Requests permissions and gets Expo push token
    // Stores token in user document
};

const updatePushTokenInDatabase = async (token) => {
    // Updates user document with push token
};
```

#### Notification Sending
```javascript
const sendPushNotification = async (token, notification) => {
    // Sends notification via Expo's push service
    // Used for mining start notifications
};
```

#### Notification Handling
```javascript
// Handles notification taps
useEffect(() => {
    const notificationListener = Notifications.addNotificationResponseReceivedListener(response => {
        // Handles mining completion and start notifications
    });
}, []);

// Handles foreground notifications
useEffect(() => {
    const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
        // Handles notifications when app is in foreground
    });
}, []);
```

### Server-Side (server.js)

#### Push Notification Function
```javascript
const sendPushNotification = async (token, notification) => {
    // Sends notification via Expo's HTTP API
    // Used for mining completion notifications
};
```

#### Mining Completion Notification
```javascript
// In check-mining-session endpoint
if (userData.pushToken) {
    await sendPushNotification(userData.pushToken, {
        title: 'Mining Complete! 🎉',
        body: `Congratulations! You've earned ${sessionEarnings.toFixed(6)} coins from your mining session.`,
        data: { 
            type: 'mining_complete', 
            action: 'navigate_to_home',
            earnings: sessionEarnings
        }
    });
}
```

## User Document Structure

The user document now includes a `pushToken` field:
```javascript
{
    // ... existing fields
    pushToken: "ExponentPushToken[...]", // Expo push token
    // ... other fields
}
```

## Notification Types

### Mining Start Notification
- **Title**: "Mining Started! ⛏️"
- **Body**: "Your 2-hour mining session has begun! You'll earn coins automatically."
- **Data**: `{ type: 'mining_start', action: 'navigate_to_home' }`

### Mining Completion Notification
- **Title**: "Mining Complete! 🎉"
- **Body**: "Congratulations! You've earned X.XXXXXX coins from your mining session."
- **Data**: `{ type: 'mining_complete', action: 'navigate_to_home', earnings: X.XXXXXX }`

## Setup Requirements

### Expo Project Configuration
1. Ensure you have an Expo project ID
2. Update the `projectId` in `registerForPushNotificationsAsync()` function
3. Configure push notifications in your Expo project settings

### Server Configuration
1. The server automatically handles push notifications
2. No additional configuration required
3. Uses Expo's free push notification service

## Testing

### Local Testing
1. Use Expo Go app for testing
2. Push notifications work on physical devices only
3. Simulator/emulator cannot receive push notifications

### Production Testing
1. Deploy to app stores for full testing
2. Ensure proper Expo project configuration
3. Test on multiple devices

## Troubleshooting

### Common Issues
1. **No notifications received**: Check device permissions and Expo project configuration
2. **Token not saved**: Verify Firebase connection and user authentication
3. **Server errors**: Check server logs for push notification errors

### Debug Information
- Push tokens are logged to console
- Server logs include push notification success/failure
- Notification data is logged for debugging

## Security Considerations

1. **Token Storage**: Push tokens are stored securely in Firebase
2. **Permission Handling**: App requests notification permissions properly
3. **Error Handling**: Failed notifications are logged but don't break functionality
4. **Rate Limiting**: Expo handles rate limiting automatically

## Future Enhancements

1. **Custom Notification Sounds**: Add custom sounds for different notification types
2. **Rich Notifications**: Include images or additional data in notifications
3. **Notification Preferences**: Allow users to customize notification settings
4. **Batch Notifications**: Send notifications to multiple users efficiently 