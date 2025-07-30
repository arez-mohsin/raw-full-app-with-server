const fs = require('fs');
const path = require('path');

// Enhanced logging system (same as in server.js)
class Logger {
    constructor() {
        this.logDir = path.join(__dirname, 'logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatLog(level, message, data = {}) {
        return {
            timestamp: this.getTimestamp(),
            level,
            message,
            data,
            pid: process.pid
        };
    }

    writeToFile(filename, logEntry) {
        const logPath = path.join(this.logDir, filename);
        const logLine = JSON.stringify(logEntry) + '\n';

        fs.appendFileSync(logPath, logLine);
    }

    log(level, message, data = {}) {
        const logEntry = this.formatLog(level, message, data);

        // Console output
        console.log(`[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`, data);

        // File output
        const date = new Date().toISOString().split('T')[0];
        this.writeToFile(`${level}-${date}.log`, logEntry);

        // Special handling for errors
        if (level === 'error') {
            this.writeToFile('errors.log', logEntry);
        }

        // Special handling for security events
        if (level === 'security') {
            this.writeToFile('security.log', logEntry);
        }

        // Special handling for mining events
        if (level === 'mining') {
            this.writeToFile('mining.log', logEntry);
        }
    }

    info(message, data = {}) {
        this.log('info', message, data);
    }

    warn(message, data = {}) {
        this.log('warn', message, data);
    }

    error(message, data = {}) {
        this.log('error', message, data);
    }

    security(message, data = {}) {
        this.log('security', message, data);
    }

    mining(message, data = {}) {
        this.log('mining', message, data);
    }

    debug(message, data = {}) {
        this.log('debug', message, data);
    }
}

// Initialize logger
const logger = new Logger();

console.log('Testing logging system...\n');

// Test different log levels
logger.info('Test info message', { test: 'data', number: 123 });
logger.warn('Test warning message', { warning: 'test', level: 'warning' });
logger.error('Test error message', { error: 'test error', code: 500 });
logger.security('Test security event', { userId: 'test123', ip: '192.168.1.1', event: 'login_attempt' });
logger.mining('Test mining event', { userId: 'test123', action: 'start_mining', earnings: 5.5 });
logger.debug('Test debug message', { debug: 'info', timestamp: Date.now() });

console.log('\nLogging test completed!');
console.log('Check the logs directory for generated log files.'); 