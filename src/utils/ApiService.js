import { auth } from '../firebase';
import networkService from './NetworkService';

class ApiService {
    constructor() {
        this.baseUrl = 'https://raw-full-app-with-server.onrender.com';
        this.defaultTimeout = 10000; // 10 seconds
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    // Enhanced secure API call with comprehensive error handling and retry
    async secureApiCall(endpoint, data, userId, options = {}) {
        const {
            timeout = this.defaultTimeout,
            maxRetries = this.maxRetries,
            retryDelay = this.retryDelay,
            skipAuth = false,
            skipRetry = false,
            customTimestamp = null
        } = options;

        // Check network connectivity first
        const networkHealth = await networkService.performNetworkHealthCheck();
        if (!networkHealth.healthy) {
            throw new Error(`Network unavailable: ${networkHealth.message}`);
        }

        // Check authentication if not skipped
        if (!skipAuth) {
            if (!auth.currentUser) {
                throw new Error('User not authenticated. Please log in again.');
            }

            if (auth.currentUser.uid !== userId) {
                throw new Error('Authentication mismatch. Please log in again.');
            }
        }

        // Create the API call operation
        const apiCall = async (attempt = 0) => {
            try {
                // Get fresh token if needed
                let token = null;
                if (!skipAuth) {
                    // Use custom token if provided, otherwise get fresh token
                    if (options.customToken) {
                        token = options.customToken;
                        console.log('Using custom token for API call, length:', token ? token.length : 0);
                    } else {
                        token = await this.getFreshToken();
                        console.log('Using fresh token from getFreshToken, length:', token ? token.length : 0);
                    }
                }

                // Prepare request data with device fingerprint
                const requestData = {
                    ...data,
                    userId,
                    timestamp: Date.now().toString(),
                    attempt: attempt + 1,
                    deviceFingerprint: options.deviceFingerprint || 'no-fingerprint'
                };

                // Make the request
                const response = await this.makeRequest(endpoint, requestData, token, timeout, options.deviceFingerprint, options.customTimestamp);
                return response;

            } catch (error) {
                console.error(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);

                // Don't retry on certain errors
                if (this.shouldNotRetry(error)) {
                    throw error;
                }

                // Retry logic
                if (attempt < maxRetries && !skipRetry) {
                    const delay = retryDelay * Math.pow(2, attempt);
                    console.log(`Retrying in ${delay}ms...`);
                    await networkService.delay(delay);
                    return apiCall(attempt + 1);
                }

                throw error;
            }
        };

        // Execute with retry mechanism, but respect shouldNotRetry logic
        try {
            return await apiCall();
        } catch (error) {
            // If this is an error that shouldn't be retried, throw it immediately
            if (this.shouldNotRetry(error)) {
                throw error;
            }

            // For other errors, use the retry mechanism
            return networkService.retryWithBackoff(
                () => apiCall(),
                maxRetries,
                retryDelay
            );
        }
    }

    // Make the actual HTTP request
    async makeRequest(endpoint, data, token, timeout, deviceFingerprint, customTimestamp = null) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Generate current timestamp and validate it's reasonable
            const currentTimestamp = customTimestamp || Date.now();
            const timestampString = currentTimestamp.toString();

            // Log timestamp for debugging
            console.log('Timestamp validation:', {
                currentTimestamp,
                timestampString,
                date: new Date(currentTimestamp).toISOString(),
                serverTimeWindow: '5 minutes (both production and development)',
                isCustomTimestamp: !!customTimestamp
            });

            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'RAWApp/1.0',
                'X-Timestamp': timestampString,
                'X-Request-ID': this.generateRequestId(),
                'X-Device-ID': deviceFingerprint || 'unknown-device'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('Authorization header set with token, length:', token.length);
            } else {
                console.log('No token available for request');
            }

            console.log('Request headers being sent:', {
                'Content-Type': headers['Content-Type'],
                'User-Agent': headers['User-Agent'],
                'X-Timestamp': headers['X-Timestamp'],
                'X-Device-ID': headers['X-Device-ID'],
                'Authorization': headers['Authorization'] ? `Bearer ${token ? token.substring(0, 20) + '...' : 'none'}` : 'none'
            });

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);

            return await this.handleResponse(response);
        } catch (error) {
            clearTimeout(timeoutId);
            throw this.handleRequestError(error);
        }
    }

    // Handle HTTP response
    async handleResponse(response) {
        const responseText = await response.text();

        try {
            const responseData = JSON.parse(responseText);

            if (!response.ok) {
                throw this.createHttpError(response.status, responseData, responseText);
            }

            return responseData;
        } catch (parseError) {
            if (!response.ok) {
                throw this.createHttpError(response.status, null, responseText);
            }
            throw new Error('Invalid server response format');
        }
    }

    // Handle request errors
    handleRequestError(error) {
        if (error.name === 'AbortError') {
            return new Error('Request timeout. Please check your connection.');
        }

        if (error.message.includes('Network request failed')) {
            return new Error('Network request failed. Please check your internet connection.');
        }

        if (error.message.includes('Failed to fetch')) {
            return new Error('Failed to connect to server. Please try again.');
        }

        return error;
    }

    // Create HTTP error with proper context
    createHttpError(status, data, responseText) {
        const errorMessages = {
            400: 'Bad request. Please check your input.',
            401: data?.error === 'Request timestamp expired' ? 'Request timestamp expired. Please check your system time.' : 'Authentication failed. Please log in again.',
            403: 'Access denied. Your account may be suspended.',
            404: 'Service not found. Please try again later.',
            429: 'Too many requests. Please wait before trying again.',
            500: 'Server error. Please try again later.',
            502: 'Bad gateway. Server is temporarily unavailable.',
            503: 'Service temporarily unavailable. Please try again later.',
            504: 'Gateway timeout. Server is taking too long to respond.'
        };

        const message = data?.error || errorMessages[status] || `Server error: ${status}`;
        const error = new Error(message);
        error.status = status;
        error.responseData = data;
        error.responseText = responseText;

        return error;
    }

    // Get fresh Firebase token with better error handling
    async getFreshToken() {
        try {
            // Check if user is still authenticated
            if (!auth.currentUser) {
                throw new Error('User not authenticated. Please log in again.');
            }

            // Check if user is anonymous
            if (auth.currentUser.isAnonymous) {
                throw new Error('Anonymous users cannot access secure endpoints. Please log in.');
            }

            try {
                const tokenResult = await auth.currentUser.getIdTokenResult();

                if (tokenResult.expirationTime) {
                    const expirationTime = new Date(tokenResult.expirationTime).getTime();
                    const currentTime = Date.now();
                    const timeUntilExpiry = expirationTime - currentTime;

                    // If token expires in less than 10 minutes, force refresh
                    if (timeUntilExpiry < 600000) {
                        console.log('Token expiring soon, forcing refresh');
                        const freshToken = await auth.currentUser.getIdToken(true);
                        if (!freshToken) {
                            throw new Error('Failed to refresh token');
                        }
                        return freshToken;
                    }
                }

                const token = await auth.currentUser.getIdToken();
                if (!token) {
                    throw new Error('Failed to get valid token');
                }
                return token;
            } catch (tokenError) {
                console.log('Token operation failed, attempting force refresh:', tokenError.message);

                // Try to force refresh the token
                try {
                    const freshToken = await auth.currentUser.getIdToken(true);
                    if (freshToken) {
                        console.log('Token force refresh successful');
                        return freshToken;
                    }
                } catch (refreshError) {
                    console.log('Token force refresh failed:', refreshError.message);
                }

                throw tokenError;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            throw new Error('Authentication token unavailable. Please log in again.');
        }
    }

    // Check if error should not be retried
    shouldNotRetry(error) {
        // Don't retry authentication errors
        if (error.message.includes('Authentication failed') ||
            error.message.includes('Please log in again') ||
            error.message.includes('User not authenticated') ||
            error.message.includes('Authentication mismatch') ||
            error.message.includes('Authentication token unavailable')) {
            return true;
        }

        // Don't retry client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
            return true;
        }

        // Don't retry on network unavailability
        if (error.message.includes('Network unavailable')) {
            return true;
        }

        // Don't retry on token refresh failures
        if (error.message.includes('Token refresh error') ||
            error.message.includes('Failed to get fresh token')) {
            return true;
        }

        return false;
    }

    // Generate unique request ID
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Queue API calls when offline
    async queueApiCall(endpoint, data, userId, options = {}) {
        const queuedCall = {
            id: this.generateRequestId(),
            endpoint,
            data,
            userId,
            options,
            timestamp: Date.now(),
            retryCount: 0
        };

        this.requestQueue.push(queuedCall);
        console.log(`API call queued: ${endpoint} (${this.requestQueue.length} in queue)`);

        // Process queue when network becomes available
        if (!this.isProcessingQueue) {
            this.processQueue();
        }

        return queuedCall.id;
    }

    // Process queued API calls
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        console.log(`Processing ${this.requestQueue.length} queued API calls...`);

        while (this.requestQueue.length > 0) {
            const queuedCall = this.requestQueue.shift();

            try {
                // Check if network is available
                const networkHealth = await networkService.performNetworkHealthCheck();
                if (!networkHealth.healthy) {
                    // Put back in queue and wait
                    this.requestQueue.unshift(queuedCall);
                    await networkService.delay(5000); // Wait 5 seconds
                    continue;
                }

                // Execute the queued call
                await this.secureApiCall(
                    queuedCall.endpoint,
                    queuedCall.data,
                    queuedCall.userId,
                    queuedCall.options
                );

                console.log(`Queued API call executed successfully: ${queuedCall.endpoint}`);
            } catch (error) {
                console.error(`Queued API call failed: ${queuedCall.endpoint}`, error);

                // Retry logic for queued calls
                if (queuedCall.retryCount < 3) {
                    queuedCall.retryCount++;
                    queuedCall.timestamp = Date.now();
                    this.requestQueue.push(queuedCall);
                    console.log(`Queued call will retry: ${queuedCall.endpoint} (${queuedCall.retryCount}/3)`);
                } else {
                    console.log(`Queued call failed permanently: ${queuedCall.endpoint}`);
                }
            }
        }

        this.isProcessingQueue = false;
        console.log('API call queue processing completed');
    }

    // Get queue status
    getQueueStatus() {
        return {
            queueLength: this.requestQueue.length,
            isProcessing: this.isProcessingQueue,
            oldestCall: this.requestQueue[0]?.timestamp || null
        };
    }

    // Clear queue
    clearQueue() {
        this.requestQueue = [];
        console.log('API call queue cleared');
    }

    // Health check for the API service
    async healthCheck() {
        try {
            const networkHealth = await networkService.performNetworkHealthCheck();
            const queueStatus = this.getQueueStatus();

            return {
                network: networkHealth,
                queue: queueStatus,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                network: { healthy: false, error: error.message },
                queue: this.getQueueStatus(),
                timestamp: Date.now()
            };
        }
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
