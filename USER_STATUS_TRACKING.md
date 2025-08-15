# User Status Tracking Feature

This feature automatically tracks when users open and close the app by updating their Firestore document status fields.

## How It Works

The app uses React Native's `AppState` API to detect when the app moves between different states:
- **Active**: App is in the foreground and user is actively using it
- **Background**: App is minimized or in the background
- **Inactive**: App is transitioning between states

## Implementation Details

### 1. UserStatusService (`src/services/UserStatusService.js`)

This service handles all user status updates:

- **`setUserOnline()`**: Updates user document when app becomes active
- **`setUserOffline()`**: Updates user document when app goes to background
- **`handleAppStateChange()`**: Responds to app state changes
- **`handleUserLogin()`**: Sets user online when they log in
- **`handleUserLogout()`**: Sets user offline when they log out
- **`handleAppBecameActive()`**: Handles app coming to foreground
- **`handleAppWentToBackground()`**: Handles app going to background
- **Retry Mechanisms**: Automatic retry for failed status updates

### 2. Custom Hook (`src/hooks/useAppState.js`)

A custom React hook that:
- Listens to app state changes
- Automatically calls appropriate UserStatusService methods
- Handles cleanup when component unmounts

### 3. Integration in App.js

The main App component:
- Initializes UserStatusService when user logs in
- Sets user online immediately after login
- Sets user offline when user logs out
- Uses the custom hook for app state management

## Firestore Document Updates

When the app state changes, the following fields are updated in the user's document:

### Online Status:
```javascript
{
  isOnline: true,
  status: 'online',
  appState: 'active',
  lastSeen: serverTimestamp(),
  lastActive: serverTimestamp()
}
```

### Offline Status:
```javascript
{
  isOnline: false,
  status: 'offline',
  appState: 'background',
  lastSeen: serverTimestamp(),
  lastActive: serverTimestamp()
}
```

## Scenarios Covered

1. **App Opening**: User opens app → Status set to `online`
2. **App Minimizing**: User switches to another app → Status set to `offline`
3. **App Returning**: User returns to app → Status set to `online`
4. **App Closing**: User completely closes app → Status set to `offline`
5. **User Login**: User logs in → Status set to `online`
6. **User Logout**: User logs out → Status set to `offline`

## Benefits

- **Real-time Status**: Admins can see who is currently using the app
- **User Analytics**: Track user engagement patterns
- **Support**: Identify when users were last active for troubleshooting
- **Security**: Monitor suspicious login patterns
- **Performance**: Automatic retry mechanisms ensure status updates are reliable
- **Compatibility**: Works seamlessly with existing user document structure

## Error Handling

The service includes comprehensive error handling:
- Gracefully handles cases where user is not authenticated
- Logs errors for debugging
- Continues to function even if individual status updates fail
- Automatic retry mechanism for failed updates
- Fallback handling for network issues

## Performance Considerations

- Status updates are asynchronous and don't block the UI
- Uses Firestore's `serverTimestamp()` for accurate timing
- Minimal impact on app performance
- Efficient cleanup when components unmount

## Testing

To test this feature:
1. Open the app and check Firestore for `isOnline: true`
2. Minimize the app and check for `isOnline: false`
3. Return to the app and verify status changes back to `online`
4. Close the app completely and verify status remains `offline`
