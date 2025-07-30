const os = require('os');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            startTime: Date.now(),
            requests: 0,
            errors: 0,
            responseTimes: [],
            memoryUsage: [],
            cpuUsage: []
        };

        this.startMonitoring();
    }

    startMonitoring() {
        // Monitor every 30 seconds
        setInterval(() => {
            this.collectMetrics();
        }, 30000);

        // Log metrics every 5 minutes
        setInterval(() => {
            this.logMetrics();
        }, 300000);
    }

    collectMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = os.loadavg();

        this.metrics.memoryUsage.push({
            timestamp: Date.now(),
            rss: memUsage.rss,
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external
        });

        this.metrics.cpuUsage.push({
            timestamp: Date.now(),
            load1: cpuUsage[0],
            load5: cpuUsage[1],
            load15: cpuUsage[2]
        });

        // Keep only last 100 entries
        if (this.metrics.memoryUsage.length > 100) {
            this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
        }
        if (this.metrics.cpuUsage.length > 100) {
            this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-100);
        }
    }

    logMetrics() {
        const uptime = Date.now() - this.metrics.startTime;
        const avgResponseTime = this.metrics.responseTimes.length > 0
            ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
            : 0;

        const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        const latestCPU = this.metrics.cpuUsage[this.metrics.cpuUsage.length - 1];

        const metrics = {
            timestamp: new Date().toISOString(),
            uptime: uptime,
            requests: this.metrics.requests,
            errors: this.metrics.errors,
            errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0,
            avgResponseTime: avgResponseTime.toFixed(2),
            memory: {
                rss: latestMemory ? (latestMemory.rss / 1024 / 1024).toFixed(2) : 0,
                heapUsed: latestMemory ? (latestMemory.heapUsed / 1024 / 1024).toFixed(2) : 0,
                heapTotal: latestMemory ? (latestMemory.heapTotal / 1024 / 1024).toFixed(2) : 0
            },
            cpu: {
                load1: latestCPU ? latestCPU.load1.toFixed(2) : 0,
                load5: latestCPU ? latestCPU.load5.toFixed(2) : 0,
                load15: latestCPU ? latestCPU.load15.toFixed(2) : 0
            },
            system: {
                totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
                freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
                cpuCount: os.cpus().length
            }
        };

        console.log('=== PERFORMANCE METRICS ===');
        console.log(`Uptime: ${(uptime / 1000 / 60).toFixed(2)} minutes`);
        console.log(`Requests: ${metrics.requests}`);
        console.log(`Errors: ${metrics.errors} (${metrics.errorRate}%)`);
        console.log(`Avg Response Time: ${metrics.avgResponseTime}ms`);
        console.log(`Memory Usage: ${metrics.memory.heapUsed}MB / ${metrics.memory.heapTotal}MB`);
        console.log(`CPU Load: ${metrics.cpu.load1} (1min), ${metrics.cpu.load5} (5min), ${metrics.cpu.load15} (15min)`);
        console.log(`System Memory: ${metrics.system.freeMemory}GB free / ${metrics.system.totalMemory}GB total`);
        console.log('==========================');

        // Save to file
        this.saveMetrics(metrics);
    }

    saveMetrics(metrics) {
        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logPath = path.join(logDir, 'performance.log');
        const logEntry = JSON.stringify(metrics) + '\n';

        fs.appendFile(logPath, logEntry, (err) => {
            if (err) console.error('Failed to write performance metrics:', err);
        });
    }

    recordRequest(responseTime) {
        this.metrics.requests++;
        this.metrics.responseTimes.push(responseTime);

        // Keep only last 1000 response times
        if (this.metrics.responseTimes.length > 1000) {
            this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
        }
    }

    recordError() {
        this.metrics.errors++;
    }

    getMetrics() {
        return this.metrics;
    }
}

// Export for use in server
module.exports = PerformanceMonitor;

// If run directly, start monitoring
if (require.main === module) {
    console.log('Starting performance monitor...');
    const monitor = new PerformanceMonitor();

    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\nStopping performance monitor...');
        process.exit(0);
    });
} 