# AdMob Integration for RAW App

This document describes the AdMob integration implemented in the RAW app using the `react-native-google-mobile-ads` package.

## Overview

The AdMob integration includes:
- **Banner Ads**: Displayed at the bottom of the bottom navigation
- **Rewarded Ads**: Shown before starting mining and claiming streak rewards

## Configuration

### AdMob App IDs
- **Android**: `ca-app-pub-9377740349827204~4973194220`
- **iOS**: `ca-app-pub-9377740349827204~8796495958`

### Ad Unit IDs

#### Android
- Banner: `ca-app-pub-9377740349827204/9871147742`
- Reward: `ca-app-pub-9377740349827204/6722240221`

#### iOS
- Banner: `ca-app-pub-9377740349827204/8772730635`
- Reward: `ca-app-pub-9377740349827204/8740655633`

## Implementation Details

### 1. AdMob Configuration (`src/config/admobConfig.js`)
- Centralized configuration for all ad unit IDs
- Platform-specific ad unit selection
- Test ad unit IDs for development
- Automatic test ad usage in development mode

### 2. AdMob Service (`src/services/AdMobService.js`)
- Singleton service managing all ad operations
- Rewarded ad management with event handling
- Automatic ad reloading and retry logic
- Error handling and fallback mechanisms

### 3. Banner Ad Component (`src/components/BannerAdComponent.js`)
- Reusable banner ad component
- Positioned at the bottom of the bottom navigation
- Error handling for failed ad loads
- Responsive design integration

### 4. AdMob Hook (`src/hooks/useAdMob.js`)
- React hook for managing AdMob state
- Automatic initialization and status monitoring
- Periodic ad status checks
- Clean interface for rewarded ad operations

## Ad Logic Implementation



### Banner Ads
- **Location**: Bottom of the bottom navigation
- **Display**: Always visible when ads are loaded
- **Fallback**: Hidden if ad fails to load
- **Positioning**: Above the bottom navigation tabs

### Rewarded Ads

#### Mining Start
- **Trigger**: User clicks "Start Mining" button
- **Flow**: 
  1. Show reward ad
  2. If user completes ad → Start mining
  3. If ad fails → Show fallback message
  4. If error → Start mining without ad (fallback)

#### Streak Claim
- **Trigger**: User clicks "Claim Streak" button
- **Flow**:
  1. Show reward ad
  2. If user completes ad → Process streak claim
  3. If ad fails → Show warning message, don't process claim
  4. **No fallback** - user must watch ad to claim

## Setup Instructions

### 1. Install Dependencies
```bash
npm install react-native-google-mobile-ads
```

### 2. Update app.json
The plugin configuration is already added to `app.json`:
```json
[
  "react-native-google-mobile-ads",
  {
    "android": {
      "appId": "ca-app-pub-9377740349827204~4973194220"
    },
    "ios": {
      "appId": "ca-app-pub-9377740349827204~8796495958"
    }
  }
]
```

### 3. Android Configuration
The Android manifest already includes the necessary AdMob configuration:
```xml
<meta-data 
  android:name="com.google.android.gms.ads.APPLICATION_ID" 
  android:value="ca-app-pub-9377740349827204~4973194220" 
  tools:replace="android:value"/>
```

### 4. iOS Configuration
iOS configuration will be handled automatically by Expo when building for iOS.

## Usage Examples

### Using the AdMob Hook
```javascript
import { useAdMob } from '../hooks/useAdMob';

function MyComponent() {
  const { showRewardedAd, isRewardedAdReady } = useAdMob();
  
  const handleAction = async () => {
    if (isRewardedAdReady) {
      const result = await showRewardedAd();
      if (result.success && result.rewardEarned) {
        // Proceed with action
      }
    }
  };
}
```

### Using the AdMob Service Directly
```javascript
import adMobService from '../services/AdMobService';

const result = await adMobService.showRewardedAd();
if (result.success && result.rewardEarned) {
  // User earned reward
}
```

## Testing

### Development Mode
- Test ads are automatically used when `__DEV__` is true
- Test ad unit IDs are configured for both platforms
- No real ads are shown during development

### Production Mode
- Real ads are shown using production ad unit IDs
- Ensure ad unit IDs are correct and approved
- Test thoroughly before release

## Error Handling

### Ad Load Failures
- Automatic retry with exponential backoff
- Maximum 3 retry attempts
- Graceful degradation when ads fail

### User Experience
- Ads don't block app functionality
- Fallback mechanisms for critical features
- Clear feedback when ads are required

## Performance Considerations

### Ad Loading
- Ads are preloaded in the background
- No blocking operations during ad display
- Efficient memory management

### Battery and Data
- Ads are optimized for minimal battery impact
- Data usage is reasonable and user-controlled
- Network requests are optimized

## Compliance and Privacy

### GDPR Compliance
- Non-personalized ads are requested by default
- User consent mechanisms can be added if needed
- Privacy-friendly ad targeting

### COPPA Compliance
- App is not specifically targeted at children
- Ad content is appropriate for general audience
- No sensitive data collection through ads

## Troubleshooting

### Common Issues

1. **Ads not loading**
   - Check internet connection
   - Verify ad unit IDs are correct
   - Ensure AdMob account is active

2. **Test ads not showing**
   - Verify `__DEV__` is true
   - Check test ad unit IDs
   - Ensure package is properly installed

3. **Production ads not showing**
   - Verify ad unit IDs are approved
   - Check AdMob account status
   - Ensure app is published

### Debug Information
- Check console logs for ad loading status
- Monitor ad events in the service
- Use AdMob console for detailed analytics

## Future Enhancements

### Potential Improvements
- Interstitial ads for additional monetization
- Native ads for better user experience
- Advanced targeting and personalization
- A/B testing for ad performance optimization

### Analytics Integration
- Ad performance tracking
- User engagement metrics
- Revenue optimization insights

## Support

For technical issues:
1. Check the console logs for error messages
2. Verify configuration in `admobConfig.js`
3. Test with different ad unit IDs
4. Consult AdMob documentation for platform-specific issues

For AdMob account issues:
1. Contact AdMob support
2. Verify account verification status
3. Check payment and billing information
