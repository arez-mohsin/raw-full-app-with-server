class PerformanceMonitor {
    static metrics = {
        apiCalls: 0,
        apiErrors: 0,
        slowOperations: 0,
        memoryUsage: [],
        renderTimes: [],
        errors: []
    };

    static startTime = Date.now();

    // Track API call performance
    static trackApiCall(endpoint, startTime) {
        const duration = Date.now() - startTime;
        this.metrics.apiCalls++;

        if (duration > 5000) { // 5 seconds threshold
            this.metrics.slowOperations++;
            console.warn(`Slow API call detected: ${endpoint} took ${duration}ms`);
        }

        return duration;
    }

    // Track API errors
    static trackApiError(endpoint, error) {
        this.metrics.apiErrors++;
        this.metrics.errors.push({
            type: 'api_error',
            endpoint,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Track render performance
    static trackRenderTime(componentName, renderTime) {
        this.metrics.renderTimes.push({
            component: componentName,
            time: renderTime,
            timestamp: new Date().toISOString()
        });

        if (renderTime > 100) { // 100ms threshold
            console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
        }
    }

    // Track memory usage
    static trackMemoryUsage() {
        if (global.performance && global.performance.memory) {
            const memory = global.performance.memory;
            this.metrics.memoryUsage.push({
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Track general errors
    static trackError(error, context = '') {
        this.metrics.errors.push({
            type: 'general_error',
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
    }

    // Get performance summary
    static getPerformanceSummary() {
        const uptime = Date.now() - this.startTime;
        const avgRenderTime = this.metrics.renderTimes.length > 0
            ? this.metrics.renderTimes.reduce((sum, item) => sum + item.time, 0) / this.metrics.renderTimes.length
            : 0;

        return {
            uptime: Math.floor(uptime / 1000), // seconds
            apiCalls: this.metrics.apiCalls,
            apiErrors: this.metrics.apiErrors,
            errorRate: this.metrics.apiCalls > 0 ? (this.metrics.apiErrors / this.metrics.apiCalls * 100).toFixed(2) : 0,
            slowOperations: this.metrics.slowOperations,
            avgRenderTime: avgRenderTime.toFixed(2),
            totalErrors: this.metrics.errors.length,
            memoryUsageCount: this.metrics.memoryUsage.length
        };
    }

    // Clear old metrics (keep last 100 entries)
    static cleanup() {
        if (this.metrics.renderTimes.length > 100) {
            this.metrics.renderTimes = this.metrics.renderTimes.slice(-100);
        }
        if (this.metrics.memoryUsage.length > 100) {
            this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
        }
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }
    }

    // Start monitoring
    static startMonitoring() {
        // Track memory usage every 30 seconds
        setInterval(() => {
            this.trackMemoryUsage();
            this.cleanup();
        }, 30000);

        // Log performance summary every 5 minutes
        setInterval(() => {
            const summary = this.getPerformanceSummary();
            console.log('Performance Summary:', summary);
        }, 300000);
    }

    // Check for performance issues
    static checkForIssues() {
        const issues = [];

        // Check error rate
        if (this.metrics.apiCalls > 10 && this.metrics.apiErrors / this.metrics.apiCalls > 0.1) {
            issues.push('High API error rate detected');
        }

        // Check for too many slow operations
        if (this.metrics.slowOperations > 5) {
            issues.push('Multiple slow operations detected');
        }

        // Check for too many errors
        if (this.metrics.errors.length > 20) {
            issues.push('High error count detected');
        }

        return issues;
    }
}

export default PerformanceMonitor; 