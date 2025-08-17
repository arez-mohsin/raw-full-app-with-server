import {
    BannerAd,
    BannerAdSize,
    TestIds,
    RewardedAd,
    RewardedAdEventType,
    AdEventType,
    mobileAds,
} from 'react-native-google-mobile-ads';

import { getAdUnitId, getTestAdUnitId, USE_TEST_ADS } from '../config/admobConfig';

console.log('AdMob components imported successfully');
console.log('Components loaded:', {
    BannerAd: typeof BannerAd,
    BannerAdSize: typeof BannerAdSize,
    RewardedAd: typeof RewardedAd,
    RewardedAdEventType: typeof RewardedAdEventType,
    AdEventType: typeof AdEventType,
    mobileAds: typeof mobileAds
});

// Debug the actual values

console.log('RewardedAd:', RewardedAd);
console.log('AdEventType:', AdEventType);
console.log('RewardedAdEventType:', RewardedAdEventType);

class AdMobService {
    constructor() {
        this.rewardedAd = null;
        this.isRewardedAdLoaded = false;
        this.retryAttempt = 0;
        this.maxRetryAttempts = 3;
        this.rewardEarned = false;
    }

    // Initialize AdMob
    async initialize() {
        try {
            // Try to initialize mobileAds if available
            if (mobileAds && typeof mobileAds === 'function') {
                console.log('mobileAds available, initializing...');
                await mobileAds().initialize();
                console.log('AdMob SDK initialized successfully');
            } else {
                console.log('mobileAds not available, trying to load ads directly...');
            }

            // Load rewarded ad
            this.loadRewardedAd();

            return true;
        } catch (error) {
            console.error('Failed to initialize AdMob:', error);
            // Continue anyway - ads might still work
            this.loadRewardedAd();
            return false;
        }
    }





    // Load Rewarded Ad
    async loadRewardedAd() {
        try {
            if (!RewardedAd) {
                console.error('RewardedAd is not available');
                return;
            }

            const adUnitId = USE_TEST_ADS ? getTestAdUnitId('reward') : getAdUnitId('reward');
            console.log('Loading rewarded ad with unit ID:', adUnitId);

            this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
                requestNonPersonalizedAdsOnly: true,
                keywords: ['mining', 'crypto', 'gaming', 'finance'],
            });

            if (!RewardedAdEventType) {
                console.error('RewardedAdEventType is not available');
                return;
            }

            console.log('Setting up rewarded ad event listeners...');
            console.log('RewardedAd object:', this.rewardedAd);
            console.log('RewardedAdEventType.LOADED:', RewardedAdEventType.LOADED);

            this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
                console.log('Rewarded ad loaded');
                this.isRewardedAdLoaded = true;
                this.retryAttempt = 0;
            });

            this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
                console.error('Rewarded ad failed to load:', error);
                this.isRewardedAdLoaded = false;
                this.retryAttempt++;

                // Retry loading after delay
                if (this.retryAttempt < this.maxRetryAttempts) {
                    setTimeout(() => {
                        this.loadRewardedAd();
                    }, 5000 * this.retryAttempt);
                }
            });

            this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
                console.log('Rewarded ad closed');
                this.isRewardedAdLoaded = false;

                // Load the next ad
                this.loadRewardedAd();
            });

            // Listen for reward earned
            this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
                console.log('User earned reward:', reward);
                this.rewardEarned = true;
            });

            await this.rewardedAd.load();
        } catch (error) {
            console.error('Error loading rewarded ad:', error);
        }
    }

    // Show Rewarded Ad
    async showRewardedAd() {
        return new Promise((resolve) => {
            try {
                if (!this.isRewardedAdLoaded || !this.rewardedAd) {
                    console.log('Rewarded ad not ready');
                    resolve({ success: false, reason: 'Ad not ready' });
                    return;
                }

                let rewardEarned = false;

                if (!RewardedAdEventType) {
                    console.error('RewardedAdEventType is not available');
                    resolve({ success: false, reason: 'Event types not available' });
                    return;
                }

                this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
                    console.log('User earned reward:', reward);
                    rewardEarned = true;
                });

                this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
                    console.log('Rewarded ad closed');
                    this.isRewardedAdLoaded = false;

                    // Load the next ad
                    this.loadRewardedAd();

                    resolve({ success: true, rewardEarned });
                });

                this.rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
                    console.log('Rewarded ad failed to show');
                    resolve({ success: false, reason: 'Failed to show' });
                });

                this.rewardedAd.show();
            } catch (error) {
                console.error('Error showing rewarded ad:', error);
                resolve({ success: false, reason: 'Error showing ad' });
            }
        });
    }

    // Check if rewarded ad is ready
    isRewardedAdReady() {
        return this.isRewardedAdLoaded;
    }



    // Check if banner ad is ready
    isBannerAdReady() {
        // Banner ads are always ready to load
        return true;
    }

    // Get banner ad size
    getBannerAdSize() {
        if (!BannerAdSize) {
            console.error('BannerAdSize is not available');
            return null;
        }
        return BannerAdSize.BANNER;
    }

    // Get banner ad unit ID
    getBannerAdUnitId() {
        return USE_TEST_ADS ? getTestAdUnitId('banner') : getAdUnitId('banner');
    }

    // Cleanup
    cleanup() {
        if (this.rewardedAd) {
            this.rewardedAd.destroy();
            this.rewardedAd = null;
        }
        this.isRewardedAdLoaded = false;
    }
}

// Create singleton instance
const adMobService = new AdMobService();
export default adMobService;
