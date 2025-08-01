# AdMob Setup Guide

This guide explains how to set up AdMob in your React Native app for both development and production.

## 🚀 Features Implemented

- **Rewarded Ads**: Show when clicking "Start Mine" and "Claim" buttons
- **Banner Ads**: Displayed at the bottom of the app above the navigation
- **Test Ads**: Configured for development with Google's test ad units
- **Bonus Rewards**: Users earn extra coins for watching ads

## 📱 AdMob Configuration

### Development (Test Ads)
The app is currently configured with Google's test ad units for development:

- **Android App ID**: `ca-app-pub-3940256099942544~3347511713`
- **iOS App ID**: `ca-app-pub-3940256099942544~1458002511`
- **Banner Ad Unit ID**: `ca-app-pub-3940256099942544/6300978111`
- **Rewarded Ad Unit ID**: `ca-app-pub-3940256099942544/5224354917`
- **Interstitial Ad Unit ID**: `ca-app-pub-3940256099942544/1033173712`

### Production Setup

To use real ads in production, you need to:

1. **Create AdMob Account**: Go to [AdMob Console](https://admob.google.com/)
2. **Create App**: Add your app to AdMob
3. **Create Ad Units**: Create banner, rewarded, and interstitial ad units
4. **Update Configuration**: Replace test IDs with your real ad unit IDs

#### Update AdMobService.js
Replace the test IDs in `src/services/AdMobService.js`:

```javascript
const ADMOB_CONFIG = {
  APP_ID: __DEV__ 
    ? 'ca-app-pub-3940256099942544~3347511713' // Test App ID
    : 'YOUR_ACTUAL_APP_ID_HERE', // Your real App ID
  
  BANNER_AD_UNIT_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/6300978111' // Test Banner Ad Unit ID
    : 'YOUR_ACTUAL_BANNER_AD_UNIT_ID', // Your real Banner Ad Unit ID
  
  REWARDED_AD_UNIT_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917' // Test Rewarded Ad Unit ID
    : 'YOUR_ACTUAL_REWARDED_AD_UNIT_ID', // Your real Rewarded Ad Unit ID
  
  INTERSTITIAL_AD_UNIT_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712' // Test Interstitial Ad Unit ID
    : 'YOUR_ACTUAL_INTERSTITIAL_AD_UNIT_ID', // Your real Interstitial Ad Unit ID
};
```

#### Update BannerAd.js
Replace the test ID in `src/components/BannerAd.js`:

```javascript
const BANNER_AD_UNIT_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/6300978111' // Test Banner Ad Unit ID
  : 'YOUR_ACTUAL_BANNER_AD_UNIT_ID'; // Your real Banner Ad Unit ID
```

#### Update app.json
Replace the test App IDs in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "android": {
            "appId": "YOUR_ANDROID_APP_ID"
          },
          "ios": {
            "appId": "YOUR_IOS_APP_ID"
          }
        }
      ]
    ]
  }
}
```

#### Update AndroidManifest.xml
Replace the test App ID in `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data 
  android:name="com.google.android.gms.ads.APPLICATION_ID" 
  android:value="YOUR_ANDROID_APP_ID"/>
```

## 🎯 Ad Integration Points

### 1. Start Mining (HomeScreen)
- **Location**: `src/Screens/HomeScreen.js`
- **Function**: `startMining()`
- **Behavior**: Shows rewarded ad before starting mining
- **Reward**: 5 bonus coins for watching ad

### 2. Daily Streak Claim (DailyStreakScreen)
- **Location**: `src/Screens/DailyStreakScreen.js`
- **Function**: `handleDailyClaim()`
- **Behavior**: Shows rewarded ad before claiming daily reward
- **Reward**: 3 bonus coins for watching ad

### 3. Banner Ad (Bottom Navigation)
- **Location**: `App.js` in `TabNavigator`
- **Component**: `BannerAd`
- **Position**: Above bottom navigation
- **Behavior**: Always visible banner ad

## 🔧 AdMob Service Features

The `AdMobService` class provides:

- **Initialization**: Automatic AdMob setup
- **Rewarded Ads**: Load and show rewarded ads
- **Interstitial Ads**: Load and show interstitial ads
- **Banner Ads**: Get banner ad component
- **Preloading**: Preload ads for better performance
- **Error Handling**: Graceful error handling
- **Cleanup**: Proper cleanup on app exit

## 📊 Ad Performance Monitoring

### Test Device Setup
For development, the app is configured with test device IDs:

```javascript
await setTestDeviceIDAsync('EMULATOR');
```

### Production Monitoring
In production, you can monitor ad performance through:
- AdMob Console
- Firebase Analytics (if integrated)
- Custom analytics events

## 🚨 Important Notes

### Development
- Test ads will always show in development mode
- No real revenue is generated
- Perfect for testing ad integration

### Production
- Replace all test IDs with real ad unit IDs
- Test thoroughly before release
- Monitor ad performance and user experience
- Ensure compliance with AdMob policies

### User Experience
- Ads are non-intrusive and provide value
- Users earn bonus rewards for watching ads
- Banner ads are positioned to not interfere with navigation
- Graceful fallback if ads fail to load

## 🔄 Building for Production

After updating the ad unit IDs:

1. **Clean Build**:
   ```bash
   npx expo run:android --clear
   ```

2. **Test Thoroughly**:
   - Test all ad types
   - Verify ad loading
   - Check user experience

3. **Release**:
   ```bash
   eas build --platform android --profile production
   ```

## 📱 Testing

### Test Ads
- Use the provided test ad unit IDs
- Test on both Android and iOS
- Verify ad loading and user interaction

### Real Ads
- Create real ad units in AdMob Console
- Test with real ad unit IDs
- Monitor ad performance

## 🛠️ Troubleshooting

### Common Issues

1. **Ads Not Loading**:
   - Check internet connection
   - Verify ad unit IDs
   - Check AdMob Console for errors

2. **Build Errors**:
   - Clean and rebuild project
   - Check plugin configuration
   - Verify AndroidManifest.xml

3. **Performance Issues**:
   - Preload ads for better performance
   - Monitor ad loading times
   - Optimize ad placement

### Debug Mode
Enable debug logging by checking console output for:
- Ad loading status
- Error messages
- Performance metrics

## 📈 Revenue Optimization

### Best Practices
- Place ads strategically without disrupting UX
- Use rewarded ads for high-value actions
- Monitor user engagement with ads
- A/B test ad placements

### Analytics
Track ad performance with:
- AdMob Console metrics
- User engagement data
- Revenue per user (RPU)
- Ad view-through rates

## 🔒 Privacy & Compliance

### GDPR Compliance
- Request user consent for personalized ads
- Provide opt-out mechanisms
- Handle user data responsibly

### COPPA Compliance
- Set appropriate content ratings
- Handle child-directed content properly
- Follow AdMob policies for child apps

## 📞 Support

For issues with AdMob integration:
1. Check AdMob Console for errors
2. Review AdMob documentation
3. Test with different ad unit types
4. Monitor app performance

---

**Note**: This setup uses Google's test ad units for development. Replace with real ad unit IDs for production use. 