import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BannerAd as RNMBannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import adMobService from '../services/AdMobService';

const BannerAd = ({ containerStyle }) => {
    const [adFailed, setAdFailed] = useState(false);
    const bannerUnitId = adMobService.getBannerAdUnitId();

    console.log('BannerAd rendering with unit ID:', bannerUnitId);

    if (adFailed) {
        return (
            <View style={[styles.bannerContainer, containerStyle, styles.fallbackContainer]}>
                <Text style={styles.fallbackText}>Ad Space</Text>
            </View>
        );
    }

    return (
        <View style={[styles.bannerContainer, containerStyle]}>
            <RNMBannerAd
                unitId={bannerUnitId}
                size={BannerAdSize.BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => {
                    console.log('Banner ad loaded successfully');
                    setAdFailed(false);
                }}
                onAdFailedToLoad={(error) => {
                    console.warn('Banner ad failed to load:', error);
                    setAdFailed(true);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        height: 50,
    },
    fallbackContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    fallbackText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default BannerAd; 