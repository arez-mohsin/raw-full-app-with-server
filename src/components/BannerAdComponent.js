import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import adMobService from '../services/AdMobService';

// Check if BannerAd is available
const isBannerAdAvailable = BannerAd && typeof BannerAd === 'function';

const BannerAdComponent = ({ style, onAdLoaded, onAdFailedToLoad }) => {
    const [adLoaded, setAdLoaded] = useState(false);
    const [adError, setAdError] = useState(null);

    useEffect(() => {
        // Check if ad is ready when component mounts
        const checkAdStatus = () => {
            if (adMobService.isBannerAdReady()) {
                setAdLoaded(true);
            }
        };

        checkAdStatus();
    }, []);

    const handleAdLoaded = () => {
        console.log('Banner ad loaded successfully');
        setAdLoaded(true);
        setAdError(null);
        if (onAdLoaded) {
            onAdLoaded();
        }
    };

    const handleAdFailedToLoad = (error) => {
        console.error('Banner ad failed to load:', error);
        setAdLoaded(false);
        setAdError(error);
        if (onAdFailedToLoad) {
            onAdFailedToLoad(error);
        }
    };

    // Don't render if ad failed to load
    if (adError) {
        return null;
    }

    // Don't render if BannerAd is not available
    if (!isBannerAdAvailable) {
        return (
            <View style={[styles.container, style]}>
                <Text style={styles.fallbackText}>Ad not available</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <BannerAd
                unitId={adMobService.getBannerAdUnitId()}
                size={adMobService.getBannerAdSize()}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                    keywords: ['mining', 'crypto', 'gaming', 'finance'],
                }}
                onAdLoaded={handleAdLoaded}
                onAdFailedToLoad={handleAdFailedToLoad}
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
    fallbackText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        padding: 10,
    },
});

export default BannerAdComponent;
