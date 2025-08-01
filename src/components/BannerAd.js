import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AdMobBanner } from 'react-native-google-mobile-ads';
import { useTheme } from '../context/ThemeContext';

const BannerAd = ({ style, containerStyle }) => {
    const { theme } = useTheme();

    // Test Ad Unit ID - Replace with your actual Banner Ad Unit ID for production
    const BANNER_AD_UNIT_ID = __DEV__
        ? 'ca-app-pub-3940256099942544/6300978111' // Test Banner Ad Unit ID
        : 'YOUR_ACTUAL_BANNER_AD_UNIT_ID'; // Replace with your actual Banner Ad Unit ID

    return (
        <View style={[styles.container, containerStyle]}>
            <AdMobBanner
                unitId={BANNER_AD_UNIT_ID}
                size="BANNER"
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                    keywords: ['mining', 'game', 'rewards'],
                }}
                onAdLoaded={() => console.log('Banner ad loaded successfully')}
                onAdFailedToLoad={(error) => console.error('Banner ad failed to load:', error)}
                style={[styles.banner, style]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    banner: {
        alignSelf: 'center',
    },
});

export default BannerAd; 