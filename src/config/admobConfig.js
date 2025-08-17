import { Platform } from 'react-native';

// AdMob App IDs
export const ADMOB_APP_IDS = {
    android: 'ca-app-pub-9377740349827204~4973194220',
    ios: 'ca-app-pub-9377740349827204~8796495958',
};

// AdMob Unit IDs
export const ADMOB_UNIT_IDS = {
    android: {
        banner: 'ca-app-pub-9377740349827204/9871147742',
        reward: 'ca-app-pub-9377740349827204/6722240221',
    },
    ios: {
        banner: 'ca-app-pub-9377740349827204/8772730635',
        reward: 'ca-app-pub-9377740349827204/8740655633',
    },
};

// Get current platform ad unit ID
export const getAdUnitId = (adType) => {
    const platform = Platform.OS;
    return ADMOB_UNIT_IDS[platform][adType];
};

// Get current platform app ID
export const getAppId = () => {
    const platform = Platform.OS;
    return ADMOB_APP_IDS[platform];
};

// Test ad unit IDs for development
export const TEST_AD_UNIT_IDS = {
    android: {
        banner: 'ca-app-pub-3940256099942544/6300978111',
        reward: 'ca-app-pub-3940256099942544/5224354917',
    },
    ios: {
        banner: 'ca-app-pub-3940256099942544/2934735716',
        reward: 'ca-app-pub-3940256099942544/1712485313',
    },
};

// Get test ad unit ID for current platform
export const getTestAdUnitId = (adType) => {
    const platform = Platform.OS;
    return TEST_AD_UNIT_IDS[platform][adType];
};

// Check if we should use test ads (for development)
// Temporarily force test ads to debug the integration
export const USE_TEST_ADS = true;
