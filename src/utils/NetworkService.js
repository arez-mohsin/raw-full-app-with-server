import * as Network from 'expo-network';
import { Platform } from 'react-native';

class NetworkService {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 2000; // 2 seconds
        this.isOnline = false;
        this.networkState = null;
        this.listeners = [];
    }

    // Check network connectivity with retry mechanism
    async checkNetworkConnectivity(retryCount = 0) {
        try {
            const networkState = await Network.getNetworkStateAsync();
            this.networkState = networkState;
            this.isOnline = networkState.isConnected && networkState.isInternetReachable;

            console.log('Network state:', {
                isConnected: networkState.isConnected,
                isInternetReachable: networkState.isInternetReachable,
                type: networkState.type,
                isOnline: this.isOnline
            });

            return {
                isConnected: networkState.isConnected,
                isInternetReachable: networkState.isInternetReachable,
                type: networkState.type,
                isOnline: this.isOnline
            };
        } catch (error) {
            console.error('Network connectivity check failed:', error);

            if (retryCount < this.retryAttempts) {
                console.log(`Retrying network check (${retryCount + 1}/${this.retryAttempts})...`);
                await this.delay(this.retryDelay);
                return this.checkNetworkConnectivity(retryCount + 1);
            }

            // If all retries failed, assume offline
            this.isOnline = false;
            return {
                isConnected: false,
                isInternetReachable: false,
                type: 'UNKNOWN',
                isOnline: false
            };
        }
    }

    // Test internet connectivity by making a lightweight request
    async testInternetConnectivity(url = 'https://www.google.com', timeout = 5000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.log('Internet connectivity test failed:', error.message);
            return false;
        }
    }

    // Comprehensive network health check
    async performNetworkHealthCheck() {
        try {
            // First check basic network state
            const networkState = await this.checkNetworkConnectivity();

            if (!networkState.isConnected) {
                return {
                    healthy: false,
                    reason: 'NO_NETWORK_CONNECTION',
                    message: 'No network connection available',
                    networkState
                };
            }

            if (!networkState.isInternetReachable) {
                return {
                    healthy: false,
                    reason: 'NO_INTERNET_ACCESS',
                    message: 'Network connected but no internet access',
                    networkState
                };
            }

            // Test actual internet connectivity
            const hasInternet = await this.testInternetConnectivity();
            if (!hasInternet) {
                return {
                    healthy: false,
                    reason: 'INTERNET_TEST_FAILED',
                    message: 'Internet connectivity test failed',
                    networkState
                };
            }

            return {
                healthy: true,
                reason: 'HEALTHY',
                message: 'Network is healthy and internet is accessible',
                networkState
            };
        } catch (error) {
            console.error('Network health check failed:', error);
            return {
                healthy: false,
                reason: 'HEALTH_CHECK_ERROR',
                message: 'Network health check failed',
                networkState: null,
                error: error.message
            };
        }
    }

    // Wait for network to become available
    async waitForNetwork(maxWaitTime = 30000) { // 30 seconds max
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            const health = await this.performNetworkHealthCheck();

            if (health.healthy) {
                console.log('Network became available');
                return health;
            }

            console.log('Waiting for network...', health.message);
            await this.delay(2000); // Wait 2 seconds before checking again
        }

        throw new Error('Network did not become available within timeout');
    }

    // Retry function with exponential backoff
    async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries) {
                    throw error;
                }

                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                await this.delay(delay);
            }
        }

        throw lastError;
    }

    // Add network state change listener
    addNetworkListener(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Notify all listeners of network state change
    notifyListeners(networkState) {
        this.listeners.forEach(callback => {
            try {
                callback(networkState);
            } catch (error) {
                console.error('Error in network listener callback:', error);
            }
        });
    }

    // Get current network state
    getCurrentNetworkState() {
        return {
            isOnline: this.isOnline,
            networkState: this.networkState
        };
    }

    // Check if device is online
    isDeviceOnline() {
        return this.isOnline;
    }

    // Utility function to delay execution
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get network type description
    getNetworkTypeDescription() {
        if (!this.networkState) return 'Unknown';

        switch (this.networkState.type) {
            case Network.NetworkStateType.WIFI:
                return 'WiFi';
            case Network.NetworkStateType.CELLULAR:
                return 'Cellular';
            case Network.NetworkStateType.NONE:
                return 'No Connection';
            default:
                return 'Unknown';
        }
    }

    // Check if network is stable (useful for mining operations)
    async isNetworkStable(sampleCount = 3, interval = 1000) {
        const results = [];

        for (let i = 0; i < sampleCount; i++) {
            const health = await this.performNetworkHealthCheck();
            results.push(health.healthy);

            if (i < sampleCount - 1) {
                await this.delay(interval);
            }
        }

        // Network is stable if all samples are healthy
        return results.every(result => result === true);
    }
}

// Create singleton instance
const networkService = new NetworkService();

export default networkService;
