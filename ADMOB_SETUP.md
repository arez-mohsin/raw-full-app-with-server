# AdMob Setup Guide

This guide covers the setup and configuration of Google AdMob in your React Native app using `react-native-google-mobile-ads`.

## Prerequisites

- Google AdMob account
- AdMob app created
- Ad units created for each ad type

## Installation

The `react-native-google-mobile-ads` package is already installed in your project.

## Configuration

### 1. app.json Setup

Your `app.json` is already configured with the AdMob plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "android": {
            "appId": "ca-app-pub-5747462093069885~2145471472"
          },
          "ios": {
            "appId": "ca-app-pub-5747462093069885~6593381748"
          }
        }
      ]
    ]
  }
}
```

### 2. Ad Unit IDs

Update the `AD_UNIT_IDS` in `src/services/AdMobService.js` with your actual ad unit IDs:

```javascript
const AD_UNIT_IDS = {
    APP_OPEN: {
        android: 'YOUR_ANDROID_APP_OPEN_AD_UNIT_ID',
        ios: 'YOUR_IOS_APP_OPEN_AD_UNIT_ID'
    },
    REWARDED: {
        android: 'ca-app-pub-5747462093069885/8345478934', // Already set
        ios: 'YOUR_IOS_REWARDED_AD_UNIT_ID'
    },
    BANNER: {
        android: 'ca-app-pub-5747462093069885/1094461297', // Already set
        ios: 'YOUR_IOS_BANNER_AD_UNIT_ID'
    }
};
```

## Creating Ad Units in AdMob Console

### 1. App Open Ads
- Go to AdMob Console → Apps → Your App → Ad Units
- Click "Create Ad Unit"
- Select "App Open"
- Choose platform (Android/iOS)
- Copy the Ad Unit ID

### 2. Rewarded Ads
- Create Ad Unit → Rewarded
- Choose platform (Android/iOS)
- Copy the Ad Unit ID

### 3. Banner Ads
- Create Ad Unit → Banner
- Choose platform (Android/iOS)
- Copy the Ad Unit ID

## Features

### App Open Ads
- Displayed when app is opened or brought to foreground
- Automatically managed by the service
- Reloads after each display

### Rewarded Ads
- Used for mining and daily streak claims
- Provides bonus coins (+3 for mining, +2 for streak)
- Waits for ad to load before proceeding
- Fallback handling if ad fails to load

### Banner Ads
- Displayed at the bottom of the app
- Platform-specific ad unit IDs
- Non-personalized ads for compliance

## Usage

The AdMob service is automatically initialized in your app. Ads are preloaded and managed automatically.

### Manual Ad Control

```javascript
import adMobService from '../services/AdMobService';

// Check if rewarded ad is ready
if (adMobService.isRewardedAdReady()) {
    const earned = await adMobService.showRewardedAdSafely('mining');
    if (earned) {
        // Grant bonus coins
    }
}

// Force reload ads
await adMobService.forceReloadAds();

// Check ad status
const status = adMobService.getAdStatus();
```

## Testing

- Use test ad unit IDs during development
- Replace with production IDs before release
- Test on both Android and iOS devices

## Troubleshooting

### Common Issues

1. **Ads not loading**: Check internet connection and ad unit IDs
2. **Ad display errors**: Ensure proper initialization and permissions
3. **Performance issues**: Monitor ad loading times and implement timeouts

### Debug Mode

Enable debug logging by calling:
```javascript
adMobService.debugAdStatus();
adMobService.getAdHealthSummary();
```

## Best Practices

- Always check if ads are ready before showing
- Implement proper error handling and fallbacks
- Monitor ad performance and user experience
- Follow AdMob policies and guidelines
- Test thoroughly on both platforms

## Support

- [AdMob Documentation](https://developers.google.com/admob)
- [react-native-google-mobile-ads](https://github.com/react-native-admob/admob)
- [Expo Plugin Documentation](https://docs.expo.dev/versions/latest/sdk/ads-admob/) 