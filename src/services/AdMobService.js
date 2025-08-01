import {
    AdMobBanner,
    AdMobInterstitial,
    AdMobRewarded,
    setTestDeviceIDAsync,
    setAdMobConfig,
} from 'react-native-google-mobile-ads';

// AdMob Configuration
const ADMOB_CONFIG = {
    // Test App ID - Replace with your actual App ID for production
    APP_ID: __DEV__
        ? 'ca-app-pub-3940256099942544~3347511713' // Test App ID for Android
        : 'YOUR_ACTUAL_APP_ID_HERE', // Replace with your actual App ID

    // Test Ad Unit IDs - Replace with your actual Ad Unit IDs for production
    BANNER_AD_UNIT_ID: __DEV__
        ? 'ca-app-pub-3940256099942544/6300978111' // Test Banner Ad Unit ID
        : 'YOUR_ACTUAL_BANNER_AD_UNIT_ID',

    REWARDED_AD_UNIT_ID: __DEV__
        ? 'ca-app-pub-3940256099942544/5224354917' // Test Rewarded Ad Unit ID
        : 'YOUR_ACTUAL_REWARDED_AD_UNIT_ID',

    INTERSTITIAL_AD_UNIT_ID: __DEV__
        ? 'ca-app-pub-3940256099942544/1033173712' // Test Interstitial Ad Unit ID
        : 'YOUR_ACTUAL_INTERSTITIAL_AD_UNIT_ID',
};

class AdMobService {
    constructor() {
        this.isInitialized = false;
        this.rewardedAd = null;
        this.interstitialAd = null;
    }

    // Initialize AdMob
    async initialize() {
        try {
            if (this.isInitialized) return;

            // Set test device ID for development
            if (__DEV__) {
                await setTestDeviceIDAsync('EMULATOR');
            }

            // Configure AdMob
            await setAdMobConfig({
                testDeviceIdentifiers: ['EMULATOR'],
                maxAdContentRating: 'PG',
                tagForChildDirectedTreatment: false,
                tagForUnderAgeOfConsent: false,
            });

            this.isInitialized = true;
            console.log('AdMob initialized successfully');
        } catch (error) {
            console.error('Error initializing AdMob:', error);
        }
    }

    // Load Rewarded Ad
    async loadRewardedAd() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            this.rewardedAd = AdMobRewarded.createForAdRequest(ADMOB_CONFIG.REWARDED_AD_UNIT_ID, {
                requestNonPersonalizedAdsOnly: true,
                keywords: ['mining', 'game', 'rewards'],
            });

            await this.rewardedAd.load();
            console.log('Rewarded ad loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading rewarded ad:', error);
            return false;
        }
    }

    // Show Rewarded Ad
    async showRewardedAd() {
        try {
            if (!this.rewardedAd) {
                const loaded = await this.loadRewardedAd();
                if (!loaded) {
                    throw new Error('Failed to load rewarded ad');
                }
            }

            return new Promise((resolve, reject) => {
                const unsubscribeLoaded = this.rewardedAd.addAdEventListener('loaded', () => {
                    console.log('Rewarded ad loaded');
                });

                const unsubscribeEarned = this.rewardedAd.addAdEventListener('earned_reward', (reward) => {
                    console.log('User earned reward:', reward);
                    unsubscribeLoaded();
                    unsubscribeEarned();
                    unsubscribeClosed();
                    resolve(reward);
                });

                const unsubscribeClosed = this.rewardedAd.addAdEventListener('closed', () => {
                    console.log('Rewarded ad closed');
                    unsubscribeLoaded();
                    unsubscribeEarned();
                    unsubscribeClosed();
                    resolve(null);
                });

                const unsubscribeError = this.rewardedAd.addAdEventListener('error', (error) => {
                    console.error('Rewarded ad error:', error);
                    unsubscribeLoaded();
                    unsubscribeEarned();
                    unsubscribeClosed();
                    unsubscribeError();
                    reject(error);
                });

                this.rewardedAd.show();
            });
        } catch (error) {
            console.error('Error showing rewarded ad:', error);
            throw error;
        }
    }

    // Load Interstitial Ad
    async loadInterstitialAd() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            this.interstitialAd = AdMobInterstitial.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID, {
                requestNonPersonalizedAdsOnly: true,
                keywords: ['mining', 'game', 'rewards'],
            });

            await this.interstitialAd.load();
            console.log('Interstitial ad loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading interstitial ad:', error);
            return false;
        }
    }

    // Show Interstitial Ad
    async showInterstitialAd() {
        try {
            if (!this.interstitialAd) {
                const loaded = await this.loadInterstitialAd();
                if (!loaded) {
                    throw new Error('Failed to load interstitial ad');
                }
            }

            await this.interstitialAd.show();
            console.log('Interstitial ad shown successfully');
            return true;
        } catch (error) {
            console.error('Error showing interstitial ad:', error);
            return false;
        }
    }

    // Get Banner Ad Component
    getBannerAdComponent() {
        return (
            <AdMobBanner
                unitId={ADMOB_CONFIG.BANNER_AD_UNIT_ID}
                size="BANNER"
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                    keywords: ['mining', 'game', 'rewards'],
                }}
                onAdLoaded={() => console.log('Banner ad loaded')}
                onAdFailedToLoad={(error) => console.error('Banner ad failed to load:', error)}
            />
        );
    }

    // Preload ads for better performance
    async preloadAds() {
        try {
            await Promise.all([
                this.loadRewardedAd(),
                this.loadInterstitialAd(),
            ]);
            console.log('Ads preloaded successfully');
        } catch (error) {
            console.error('Error preloading ads:', error);
        }
    }

    // Cleanup
    cleanup() {
        if (this.rewardedAd) {
            this.rewardedAd.destroy();
            this.rewardedAd = null;
        }
        if (this.interstitialAd) {
            this.interstitialAd.destroy();
            this.interstitialAd = null;
        }
    }
}

// Create singleton instance
const adMobService = new AdMobService();

export default adMobService; 