import { useState, useEffect } from 'react';
import adMobService from '../services/AdMobService';

export const useAdMob = () => {
    const [isAdMobInitialized, setIsAdMobInitialized] = useState(false);
    const [isRewardedAdReady, setIsRewardedAdReady] = useState(false);
    const [isBannerAdReady, setIsBannerAdReady] = useState(false);

    useEffect(() => {
        const initializeAdMob = async () => {
            try {
                const success = await adMobService.initialize();
                setIsAdMobInitialized(success);
            } catch (error) {
                console.error('Failed to initialize AdMob in hook:', error);
                setIsAdMobInitialized(false);
            }
        };

        initializeAdMob();
    }, []);

    useEffect(() => {
        const checkAdStatus = () => {
            setIsRewardedAdReady(adMobService.isRewardedAdReady());
            setIsBannerAdReady(adMobService.isBannerAdReady());
        };

        // Check ad status periodically
        const interval = setInterval(checkAdStatus, 5000);

        // Initial check
        checkAdStatus();

        return () => clearInterval(interval);
    }, []);

    const showRewardedAd = async () => {
        if (!isRewardedAdReady) {
            return { success: false, reason: 'Ad not ready' };
        }
        return await adMobService.showRewardedAd();
    };



    return {
        isAdMobInitialized,
        isRewardedAdReady,
        isBannerAdReady,
        showRewardedAd,
    };
};
