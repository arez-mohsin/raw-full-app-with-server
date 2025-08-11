import mobileAds, {
    AppOpenAd,
    RewardedAd,
    RewardedAdEventType,
    AdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';

const AD_UNIT_IDS = {
    APP_OPEN: {
        android: 'ca-app-pub-9377740349827204/9850966448',
        ios: 'YOUR_IOS_APP_OPEN_AD_UNIT_ID'
    },
    REWARDED: {
        android: 'ca-app-pub-5747462093069885/8345478934',
        ios: 'YOUR_IOS_REWARDED_AD_UNIT_ID'
    },
    BANNER: {
        android: 'ca-app-pub-9377740349827204/9871147742',
        ios: 'YOUR_IOS_BANNER_AD_UNIT_ID'
    }
};

class AdMobService {
    constructor() {
        this.isInitialized = false;
        this.rewardedAd = null;
        this.rewardedLoaded = false;
        this.appOpenAd = null;
        this.appOpenLoaded = false;
        this.hasShownAppOpenThisLaunch = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            console.log('Initializing AdMob...');
            console.log('Using production ad unit IDs');

            await mobileAds().setRequestConfiguration({
                // Only example options; adjust as needed
                tagForChildDirectedTreatment: false,
                tagForUnderAgeOfConsent: false,
                maxAdContentRating: 'PG',
            });
            await mobileAds().initialize();
            this.isInitialized = true;
            console.log('AdMob initialized successfully');

            // Preload initial ads with a small delay
            setTimeout(() => {
                this.prepareRewarded();
                this.prepareAppOpen();
            }, 1000);
        } catch (error) {
            console.error('AdMob initialize error:', error);
        }
    }

    // Rewarded
    prepareRewarded() {
        try {
            // Clean up existing ad if any
            if (this.rewardedAd) {
                try {
                    this.rewardedAd.destroy();
                } catch (e) {
                    // Ignore destroy errors
                }
            }

            this.rewardedAd = RewardedAd.createForAdRequest(this.getRewardedAdUnitId(), {
                requestNonPersonalizedAdsOnly: true,
                keywords: ['mining', 'game', 'rewards'],
            });
            this.rewardedLoaded = false;

            // Debug: Log available event types
            console.log('Available RewardedAdEventType constants:', {
                LOADED: RewardedAdEventType.LOADED,
                FAILED_TO_LOAD: RewardedAdEventType.FAILED_TO_LOAD,
                CLOSED: RewardedAdEventType.CLOSED,
                EARNED_REWARD: RewardedAdEventType.EARNED_REWARD
            });

            // Add event listeners with proper error handling
            try {
                // Use the actual RewardedAdEventType constants with fallbacks
                const LOADED_EVENT = RewardedAdEventType.LOADED || 'loaded';
                const FAILED_EVENT = RewardedAdEventType.FAILED_TO_LOAD || 'failed_to_load';
                const CLOSED_EVENT = RewardedAdEventType.CLOSED || 'closed';

                console.log('Using event types:', { LOADED_EVENT, FAILED_EVENT, CLOSED_EVENT });

                const unsubscribeLoaded = this.rewardedAd.addAdEventListener(LOADED_EVENT, () => {
                    console.log('Rewarded ad loaded successfully');
                    this.rewardedLoaded = true;
                });

                const unsubscribeFailed = this.rewardedAd.addAdEventListener(FAILED_EVENT, (error) => {
                    console.warn('Rewarded ad failed to load:', error);
                    this.rewardedLoaded = false;
                });

                const unsubscribeClosed = this.rewardedAd.addAdEventListener(CLOSED_EVENT, () => {
                    console.log('Rewarded ad closed, preparing next one');
                    this.rewardedLoaded = false;
                    // Clean up listeners
                    unsubscribeLoaded();
                    unsubscribeFailed();
                    unsubscribeClosed();
                    // Reload next time
                    setTimeout(() => this.prepareRewarded(), 1000);
                });

                console.log('Loading rewarded ad...');
                this.rewardedAd.load();
            } catch (listenerError) {
                console.warn('Error setting up rewarded ad listeners:', listenerError);
                // Try to load the ad anyway
                this.rewardedAd.load();
            }
        } catch (e) {
            console.warn('prepareRewarded error:', e);
            this.rewardedLoaded = false;
        }
    }

    async showRewardedAdSafely(contextTag = 'general') {
        try {
            if (!this.isInitialized) {
                console.log('AdMob not initialized, initializing now...');
                await this.initialize();
            }

            if (!this.rewardedAd) {
                console.log('No rewarded ad instance, preparing one...');
                this.prepareRewarded();
            }

            // Wait for the ad to load with a timeout
            let attempts = 0;
            const maxAttempts = 10; // 5 seconds total (500ms * 10)

            while (!this.rewardedLoaded && attempts < maxAttempts) {
                console.log(`Waiting for rewarded ad to load... attempt ${attempts + 1}/${maxAttempts}`);
                await new Promise((resolve) => setTimeout(resolve, 500));
                attempts++;
            }

            // If still not loaded, try to reload once
            if (!this.rewardedLoaded) {
                console.log('Rewarded ad not loaded, attempting to reload...');
                this.prepareRewarded();
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            // Final check - if still not loaded, return false
            if (!this.rewardedLoaded) {
                console.warn('Rewarded ad failed to load after retry');
                // Try one more time with a fresh instance
                this.prepareRewarded();
                return false;
            }

            console.log('Rewarded ad is ready, showing now...');
            return await new Promise((resolve) => {
                let earned = false;
                let listeners = [];

                try {
                    // Debug: Log event types being used
                    console.log('Setting up event listeners with types:', {
                        EARNED_REWARD: RewardedAdEventType.EARNED_REWARD,
                        CLOSED: RewardedAdEventType.CLOSED
                    });

                    // Use the actual RewardedAdEventType constants with fallbacks
                    const EARNED_REWARD_EVENT = RewardedAdEventType.EARNED_REWARD || 'earned_reward';
                    const CLOSED_EVENT = RewardedAdEventType.CLOSED || 'closed';

                    console.log('Using event types for showing:', { EARNED_REWARD_EVENT, CLOSED_EVENT });

                    // Add earned reward listener
                    const onEarned = this.rewardedAd?.addAdEventListener(
                        EARNED_REWARD_EVENT,
                        (reward) => {
                            console.log('User earned reward:', reward);
                            earned = true;
                        }
                    );
                    if (onEarned) listeners.push(onEarned);

                    // Add closed listener
                    const onClosed = this.rewardedAd?.addAdEventListener(
                        CLOSED_EVENT,
                        () => {
                            console.log('Rewarded ad closed, reward earned:', earned);
                            // Clean up listeners
                            listeners.forEach(unsubscribe => {
                                try {
                                    if (typeof unsubscribe === 'function') unsubscribe();
                                } catch (e) {
                                    console.warn('Error unsubscribing listener:', e);
                                }
                            });
                            resolve(earned);
                        }
                    );
                    if (onClosed) listeners.push(onClosed);

                    // Show the ad
                    this.rewardedAd?.show();
                } catch (e) {
                    console.warn('showRewardedAdSafely failed, continuing:', e?.message || e);
                    // Clean up listeners
                    listeners.forEach(unsubscribe => {
                        try {
                            if (typeof unsubscribe === 'function') unsubscribe();
                        } catch (cleanupError) {
                            console.warn('Error cleaning up listener:', cleanupError);
                        }
                    });
                    resolve(false);
                }
            });
        } catch (error) {
            console.warn('showRewardedAdSafely error:', error);
            return false;
        }
    }

    // App Open
    prepareAppOpen() {
        try {
            this.appOpenAd = AppOpenAd.createForAdRequest(this.getAppOpenAdUnitId(), {
                requestNonPersonalizedAdsOnly: true,
            });
            this.appOpenLoaded = false;

            // Use the actual AdEventType constants with fallbacks
            const LOADED_EVENT = AdEventType.LOADED || 'loaded';
            const CLOSED_EVENT = AdEventType.CLOSED || 'closed';

            console.log('App Open using event types:', { LOADED_EVENT, CLOSED_EVENT });

            const unsubscribeLoaded = this.appOpenAd.addAdEventListener(LOADED_EVENT, () => {
                this.appOpenLoaded = true;
            });

            const unsubscribeClosed = this.appOpenAd.addAdEventListener(CLOSED_EVENT, () => {
                // Clean up listeners
                unsubscribeLoaded();
                unsubscribeClosed();
                // Reload for next foreground event
                this.prepareAppOpen();
            });

            this.appOpenAd.load();
        } catch (e) {
            console.warn('prepareAppOpen error:', e);
        }
    }

    async maybeShowAppOpenAd() {
        try {
            if (!this.isInitialized) await this.initialize();
            if (!this.appOpenAd) this.prepareAppOpen();

            if (this.appOpenLoaded) {
                try {
                    await this.appOpenAd.show();
                    return true;
                } catch (e) {
                    console.warn('AppOpen show failed:', e?.message || e);
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.warn('maybeShowAppOpenAd error:', error);
            return false;
        }
    }

    enableAppOpenOnForeground(AppStateModule) {
        if (!AppStateModule) return;
        let lastState = AppStateModule.currentState;
        const listener = AppStateModule.addEventListener('change', async (nextState) => {
            if (lastState?.match(/background|inactive/) && nextState === 'active') {
                await this.maybeShowAppOpenAd();
            }
            lastState = nextState;
        });
        return () => listener?.remove?.();
    }

    // Check if rewarded ad is ready to show
    isRewardedAdReady() {
        return this.isInitialized && this.rewardedLoaded && this.rewardedAd;
    }

    // Preload ads proactively
    async preloadAds() {
        if (!this.isInitialized) {
            console.log('Cannot preload ads - AdMob not initialized');
            return;
        }

        console.log('Preloading ads...');
        this.prepareRewarded();
        this.prepareAppOpen();
    }

    // Reload rewarded ad
    async reloadRewardedAd() {
        this.prepareRewarded();
    }

    // Get current ad status
    getAdStatus() {
        return {
            isInitialized: this.isInitialized,
            rewardedLoaded: this.rewardedLoaded,
            appOpenLoaded: this.appOpenLoaded,
            hasRewardedAd: !!this.rewardedAd,
            hasAppOpenAd: !!this.appOpenAd,
        };
    }

    // Debug ad status
    debugAdStatus() {
        const status = this.getAdStatus();
        console.log('AdMob Service Status:', status);
        return status;
    }

    // Check ad availability and reload if needed
    async checkAdAvailability() {
        console.log('Checking ad availability...');
        const status = this.getAdStatus();

        if (!status.rewardedLoaded) {
            console.log('Rewarded ad not loaded, reloading...');
            this.prepareRewarded();
        }

        if (!status.appOpenLoaded) {
            console.log('App open ad not loaded, reloading...');
            this.prepareAppOpen();
        }

        return status;
    }

    // Force reload all ads
    async forceReloadAds() {
        console.log('Force reloading all ads...');

        if (this.rewardedAd) {
            try {
                // Remove all event listeners
                this.rewardedAd.removeAllListeners();
                this.rewardedAd.destroy();
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        if (this.appOpenAd) {
            try {
                // Remove all event listeners
                this.appOpenAd.removeAllListeners();
                this.appOpenAd.destroy();
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        this.rewardedLoaded = false;
        this.appOpenLoaded = false;

        setTimeout(() => {
            this.prepareRewarded();
            this.prepareAppOpen();
        }, 500);
    }

    // Check if we should skip ads (for debugging or testing)
    shouldSkipAds() {
        return false; // Set to true to skip ads during testing
    }

    // Get comprehensive ad health summary
    getAdHealthSummary() {
        const status = this.getAdStatus();
        const health = {
            ...status,
            timestamp: new Date().toISOString(),
            canShowRewarded: status.rewardedLoaded && status.hasRewardedAd,
            canShowAppOpen: status.appOpenLoaded && status.hasAppOpenAd,
        };

        console.log('Ad Health Summary:', health);
        return health;
    }

    // Retry loading ads with exponential backoff
    async retryLoadAds(maxRetries = 3) {
        console.log(`Retrying ad load with ${maxRetries} attempts...`);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt}/${maxRetries}`);

                if (attempt === 1) {
                    // First attempt: normal load
                    this.prepareRewarded();
                    this.prepareAppOpen();
                } else {
                    // Subsequent attempts: force reload
                    await this.forceReloadAds();
                }

                // Wait for ads to load
                const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
                console.log(`Waiting ${delay}ms for ads to load...`);
                await new Promise(resolve => setTimeout(resolve, delay));

                // Check if ads loaded successfully
                const status = this.getAdStatus();
                if (status.rewardedLoaded && status.appOpenLoaded) {
                    console.log('Ads loaded successfully on retry attempt', attempt);
                    return true;
                }

            } catch (error) {
                console.warn(`Retry attempt ${attempt} failed:`, error);
            }
        }

        console.warn('All retry attempts failed');
        return false;
    }

    // Platform-specific ad unit ID getters
    getBannerAdUnitId() {
        const { Platform } = require('react-native');

        return Platform.OS === 'android'
            ? AD_UNIT_IDS.BANNER.android
            : AD_UNIT_IDS.BANNER.ios;
    }

    getAppOpenAdUnitId() {
        const { Platform } = require('react-native');

        return Platform.OS === 'android'
            ? AD_UNIT_IDS.APP_OPEN.android
            : AD_UNIT_IDS.APP_OPEN.ios;
    }

    getRewardedAdUnitId() {
        const { Platform } = require('react-native');

        return Platform.OS === 'android'
            ? AD_UNIT_IDS.REWARDED.android
            : AD_UNIT_IDS.REWARDED.ios;
    }
}

const adMobService = new AdMobService();
export default adMobService;