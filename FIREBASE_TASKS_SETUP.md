# Firebase Tasks Collection Setup

## Overview
The TasksScreen now dynamically fetches tasks from a Firebase collection instead of using hardcoded tasks. This allows admins to add, modify, or disable tasks without updating the app code.

## Collection Structure

### Collection Name: `tasks`

### Document Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `title` | string | ✅ | Task title | "Follow us on Twitter" |
| `description` | string | ✅ | Task description | "Follow our Twitter account to earn rewards" |
| `reward` | number | ✅ | Coins reward | 15 |
| `xp` | number | ✅ | Experience points | 35 |
| `icon` | string | ❌ | Ionicons icon name | "logo-twitter" |
| `color` | string | ❌ | Task accent color | "#1DA1F2" |
| `url` | string | ❌ | External URL for social tasks | "https://twitter.com/youraccount" |
| `type` | string | ❌ | Task type | "social", "daily", "action" |
| `isActive` | boolean | ❌ | Whether task is available | true |
| `order` | number | ❌ | Display order (ascending) | 1 |

### Task Types
- **`social`**: Tasks that require external action (follow, like, subscribe)
- **`daily`**: Tasks that can be completed daily (login, check-in)
- **`action`**: Tasks that require app interaction (share, invite)

## Sample Task Documents

### Social Media Task
```json
{
  "title": "Follow us on Twitter",
  "description": "Follow our Twitter account to stay updated and earn rewards",
  "reward": 15,
  "xp": 35,
  "icon": "logo-twitter",
  "color": "#1DA1F2",
  "url": "https://twitter.com/youraccount",
  "type": "social",
  "isActive": true,
  "order": 1
}
```

### Daily Task
```json
{
  "title": "Daily Login",
  "description": "Log in to the app today to earn your daily bonus",
  "reward": 5,
  "xp": 15,
  "icon": "calendar",
  "color": "#4CAF50",
  "type": "daily",
  "isActive": true,
  "order": 2
}
```

### Action Task
```json
{
  "title": "Share the App",
  "description": "Share this app with your friends and earn bonus rewards",
  "reward": 50,
  "xp": 120,
  "icon": "share-social",
  "color": "#FF6B35",
  "type": "action",
  "isActive": true,
  "order": 3
}
```

## Firebase Security Rules

### Basic Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tasks collection - readable by all authenticated users
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can modify (via admin panel)
    }
    
    // Task completions - users can only read/write their own
    match /taskCompletions/{completionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### Advanced Rules (with admin role)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Task completions
    match /taskCompletions/{completionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## Admin Panel Integration

### Adding New Tasks
1. Navigate to Firebase Console > Firestore Database
2. Go to the `tasks` collection
3. Click "Add Document"
4. Fill in the required fields
5. Set `isActive: true` to make it visible
6. Set `order` to control display position

### Modifying Existing Tasks
1. Find the task document in the `tasks` collection
2. Click on the document to edit
3. Modify fields as needed
4. Save changes

### Disabling Tasks
1. Set `isActive: false` for the task
2. The task will no longer appear in the app
3. Users can still see completion history

## Benefits

1. **Dynamic Content**: Tasks can be updated without app updates
2. **A/B Testing**: Test different task configurations
3. **Seasonal Events**: Add temporary tasks for holidays/events
4. **User Engagement**: Modify rewards based on user behavior
5. **Analytics**: Track task completion patterns
6. **Flexibility**: Easy to add new task types

## Fallback Behavior

If the Firebase collection is unavailable or empty, the app will show a fallback task:
- **Daily Login**: Basic task to ensure users always have something to do
- **Error Handling**: Graceful degradation with user-friendly messages

## Performance Considerations

- Tasks are fetched once per session
- Pull-to-refresh updates tasks
- Tasks are cached locally during the session
- Minimal impact on app performance
