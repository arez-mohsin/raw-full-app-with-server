const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Enhanced logging system with async file operations
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
            pid: process.pid,
            workerId: cluster.isWorker ? cluster.worker.id : 'master'
        };
    }

    // ASYNC file writing to prevent blocking
    writeToFile(filename, logEntry) {
        const logPath = path.join(this.logDir, filename);
        const logLine = JSON.stringify(logEntry) + '\n';

        fs.appendFile(logPath, logLine, (err) => {
            if (err) {
                console.error('Log write error:', err);
            }
        });
    }

    log(level, message, data = {}) {
        const logEntry = this.formatLog(level, message, data);

        // Console output
        console.log(`[${logEntry.timestamp}] [${level.toUpperCase()}] [Worker:${logEntry.workerId}] ${message}`, data);

        // File output (async)
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

if (cluster.isMaster) {
    // Master process - fork workers
    logger.info('Master process starting', {
        numCPUs,
        pid: process.pid
    });

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.warn('Worker died, restarting', {
            workerId: worker.id,
            code,
            signal
        });
        cluster.fork();
    });

    cluster.on('online', (worker) => {
        logger.info('Worker started', {
            workerId: worker.id,
            pid: worker.process.pid
        });
    });

} else {
    // Worker process - run the server
    const workerId = cluster.worker.id;

    logger.info('Worker process starting', {
        workerId,
        pid: process.pid
    });

    // Load Firebase service account from environment variable or file
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        logger.info('Firebase service account loaded from environment variable', { workerId });
    } else {
        try {
            serviceAccount = require('./mine-coin-e3872-firebase-adminsdk-fbsvc-f9af427562.json');
            logger.info('Firebase service account loaded from local file', { workerId });
        } catch (error) {
            logger.error('Firebase service account not found', {
                error: error.message,
                stack: error.stack,
                workerId
            });
            console.error('Firebase service account not found. Please set FIREBASE_SERVICE_ACCOUNT environment variable.');
            process.exit(1);
        }
    }

    // Enhanced security configuration
    const SECURITY_CONFIG = {
        MAX_REQUESTS_PER_MINUTE: 20,
        MAX_REQUESTS_PER_HOUR: 500,
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
        SUSPICIOUS_ACTIVITY_THRESHOLD: 10,
        IP_WHITELIST: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
        MIN_REQUEST_DELAY: 300,
        MAX_REQUEST_DELAY: 1000,
        LOADING_STATE_TIMEOUT: 5000,
        MAX_SESSIONS_PER_DAY: 8,
        MIN_SESSION_INTERVAL: 60000,
        MAX_CONCURRENT_SESSIONS: 1,
        ANTI_BOT_DELAY: 500,
        DEVICE_FINGERPRINT_REQUIRED: true,
        GEO_BLOCKING: false,
        BLOCKED_COUNTRIES: ['XX'],
        MAX_DAILY_EARNINGS: 50,
        SUSPICIOUS_PATTERNS: {
            RAPID_REQUESTS: 5,
            UNUSUAL_TIMING: 0.5,
            MULTIPLE_DEVICES: 2
        }
    };

    // Anti-cheat configuration
    const ANTI_CHEAT_CONFIG = {
        MAX_SESSION_DURATION: 7200,
        MIN_SESSION_DURATION: 1800,
        MAX_EARNINGS_PER_SESSION: 10,
        MAX_EARNINGS_PER_HOUR: 5,
        SUSPICIOUS_TIME_THRESHOLD: 0.5,
        MAX_DEVICE_CHANGES_PER_DAY: 4,
        MAX_IP_CHANGES_PER_DAY: 6,
        MIN_REQUEST_INTERVAL: 500,
        MAX_RAPID_REQUESTS: 6,
        CHEAT_DETECTION: {
            TIME_MANIPULATION: true,
            MULTIPLE_SESSIONS: true,
            RAPID_EARNINGS: true,
            DEVICE_SPOOFING: true,
            IP_SPOOFING: true,
            SESSION_REPLAY: true
        }
    };

    // Initialize Firebase Admin
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();
    const auth = admin.auth();

    logger.info('Firebase Admin initialized successfully', {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        workerId
    });

    const app = express();
    const PORT = process.env.PORT || 5000;

    // Enhanced security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        noSniff: true,
        xssFilter: true,
        frameguard: {
            action: 'deny'
        }
    }));

    // Enhanced CORS with IP restrictions
    app.use(cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);

            const allowedOrigins = [
                'http://localhost:3000',
                'http://10.0.2.2:3000',
                'http://192.168.1.8:3000',
                'https://your-app-domain.com'
            ];

            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-Signature', 'X-Device-ID']
    }));

    app.use(express.json({ limit: '1mb' }));

    // Rate limiting with worker-specific keys
    const globalLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE,
        message: { error: 'Too many requests, please try again later' },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        keyGenerator: (req) => {
            return req.ip + ':' + (req.headers['x-device-id'] || 'unknown') + ':worker:' + workerId;
        },
        handler: (req, res) => {
            logger.security('Rate limit exceeded', {
                ip: req.ip,
                deviceId: req.headers['x-device-id'],
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method,
                workerId
            });
            res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
        }
    });

    const miningLimiter = rateLimit({
        windowMs: 5 * 60 * 1000,
        max: 5,
        keyGenerator: (req) => {
            return req.ip + ':' + (req.headers['x-device-id'] || 'unknown') + ':worker:' + workerId;
        },
        handler: (req, res) => {
            logger.mining('Mining rate limit exceeded', {
                ip: req.ip,
                deviceId: req.headers['x-device-id'],
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method,
                workerId
            });
            res.status(429).json({ error: 'Mining rate limit exceeded. Please wait before starting another session.' });
        }
    });

    const upgradeLimiter = rateLimit({
        windowMs: 2 * 60 * 1000,
        max: 3,
        keyGenerator: (req) => {
            return req.ip + ':' + (req.headers['x-device-id'] || 'unknown') + ':worker:' + workerId;
        },
        handler: (req, res) => {
            logger.warn('Upgrade rate limit exceeded', {
                ip: req.ip,
                deviceId: req.headers['x-device-id'],
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method,
                workerId
            });
            res.status(429).json({ error: 'Upgrade rate limit exceeded. Please wait before upgrading again.' });
        }
    });

    const hourlyLimiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        max: SECURITY_CONFIG.MAX_REQUESTS_PER_HOUR,
        keyGenerator: (req) => {
            return req.ip + ':' + (req.headers['x-device-id'] || 'unknown') + ':worker:' + workerId;
        },
        handler: (req, res) => {
            logger.security('Hourly rate limit exceeded', {
                ip: req.ip,
                deviceId: req.headers['x-device-id'],
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method,
                workerId
            });
            res.status(429).json({ error: 'Hourly limit exceeded. Please try again later.' });
        }
    });

    // Anti-bot middleware
    const antiBotMiddleware = (req, res, next) => {
        const delay = Math.random() * SECURITY_CONFIG.ANTI_BOT_DELAY;
        setTimeout(next, delay);
    };

    // Device fingerprint validation
    const validateDeviceFingerprint = (req, res, next) => {
        const deviceFingerprint = req.headers['x-device-id'];

        if (!deviceFingerprint || deviceFingerprint === 'unknown') {
            logger.security('Invalid device fingerprint', {
                ip: req.ip,
                deviceFingerprint,
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method,
                workerId
            });
            return res.status(401).json({ error: 'Invalid device identification' });
        }

        if (deviceFingerprint.length < 6) {
            logger.security('Suspicious device fingerprint length', {
                ip: req.ip,
                deviceFingerprint,
                length: deviceFingerprint.length,
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method,
                workerId
            });
            return res.status(401).json({ error: 'Suspicious device pattern detected' });
        }

        const suspiciousPatterns = [
            '00000000', 'ffffffff', 'deadbeef', 'cafebabe', 'unknown', 'test', 'fake'
        ];

        const lowerFingerprint = deviceFingerprint.toLowerCase();
        if (suspiciousPatterns.some(pattern => lowerFingerprint.includes(pattern))) {
            logger.security('Suspicious device pattern detected', {
                ip: req.ip,
                deviceFingerprint,
                pattern: suspiciousPatterns.find(pattern => lowerFingerprint.includes(pattern)),
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method,
                workerId
            });
            return res.status(401).json({ error: 'Suspicious device pattern detected' });
        }

        next();
    };

    // Request delay middleware
    const requestDelayMiddleware = (req, res, next) => {
        const delay = Math.random() * (SECURITY_CONFIG.MAX_REQUEST_DELAY - SECURITY_CONFIG.MIN_REQUEST_DELAY) + SECURITY_CONFIG.MIN_REQUEST_DELAY;
        setTimeout(next, delay);
    };

    // Apply middleware
    app.use(globalLimiter);
    app.use(hourlyLimiter);
    app.use(antiBotMiddleware);
    app.use(validateDeviceFingerprint);
    app.use(requestDelayMiddleware);

    // Authentication middleware
    const authenticateToken = async (req, res, next) => {
        try {
            const deviceId = req.headers['x-device-id'];
            if (!deviceId) {
                logger.security('Missing device ID in authentication', {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    path: req.path,
                    method: req.method,
                    workerId
                });
                return res.status(401).json({ error: 'Device ID required' });
            }

            const timestamp = req.headers['x-timestamp'];
            if (!timestamp) {
                logger.security('Missing timestamp in authentication', {
                    ip: req.ip,
                    deviceId: req.headers['x-device-id'],
                    userAgent: req.headers['user-agent'],
                    path: req.path,
                    method: req.method,
                    workerId
                });
                return res.status(401).json({ error: 'Timestamp required' });
            }

            const requestTime = parseInt(timestamp);
            const currentTime = Date.now();
            if (Math.abs(currentTime - requestTime) > 300000) {
                logger.security('Request timestamp expired', {
                    ip: req.ip,
                    deviceId: req.headers['x-device-id'],
                    requestTime,
                    currentTime,
                    difference: Math.abs(currentTime - requestTime),
                    userAgent: req.headers['user-agent'],
                    path: req.path,
                    method: req.method,
                    workerId
                });
                return res.status(401).json({ error: 'Request timestamp expired' });
            }

            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                logger.security('Missing access token', {
                    ip: req.ip,
                    deviceId: req.headers['x-device-id'],
                    userAgent: req.headers['user-agent'],
                    path: req.path,
                    method: req.method,
                    workerId
                });
                return res.status(401).json({ error: 'Access token required' });
            }

            const decodedToken = await auth.verifyIdToken(token);
            req.user = decodedToken;
            req.userId = decodedToken.uid;
            req.deviceId = deviceId;

            logger.info('User authenticated successfully', {
                userId: decodedToken.uid,
                email: decodedToken.email,
                deviceId,
                ip: req.ip,
                path: req.path,
                method: req.method,
                workerId
            });

            const userRef = db.collection('users').doc(decodedToken.uid);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                const suspiciousActivity = userData.security?.suspiciousActivity || 0;

                if (suspiciousActivity >= SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) {
                    logger.security('Account suspended due to suspicious activity', {
                        userId: decodedToken.uid,
                        suspiciousActivity,
                        threshold: SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD,
                        deviceId,
                        ip: req.ip,
                        path: req.path,
                        method: req.method,
                        workerId
                    });
                    return res.status(403).json({ error: 'Account temporarily suspended due to suspicious activity' });
                }
            }

            next();
        } catch (error) {
            logger.error('Authentication error', {
                error: error.message,
                stack: error.stack,
                ip: req.ip,
                deviceId: req.headers['x-device-id'],
                userAgent: req.headers['user-agent'],
                path: req.path,
                method: req.method,
                workerId
            });
            return res.status(401).json({ error: 'Authentication failed' });
        }
    };

    // Input validation middleware
    const validateUserId = (req, res, next) => {
        const { userId } = req.body;

        if (!userId || typeof userId !== 'string' || userId.length < 10) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        if (userId !== req.userId) {
            return res.status(403).json({ error: 'User ID mismatch' });
        }

        next();
    };

    // Create or get user document
    const getUserDoc = async (userId) => {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            const now = admin.firestore.FieldValue.serverTimestamp();
            await userRef.set({
                balance: 0,
                lastMiningStart: null,
                isMining: false,
                earnedCoins: 0,
                totalMined: 0,
                miningLevel: 1,
                experience: 0,
                miningSpeed: 0.001,
                upgrades: {
                    speed: 0,
                    efficiency: 0,
                    capacity: 0
                },
                dailyStreak: 0,
                lastDailyClaim: null,
                totalSessions: 0,
                bestSession: 0,
                todayMined: 0,
                lastSessionDate: null,
                createdAt: now,
                updatedAt: now,
                security: {
                    lastActivity: now,
                    suspiciousActivity: 0,
                    deviceFingerprint: null
                }
            });
        }

        return userRef;
    };

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            workerId,
            pid: process.pid
        });
    });

    // Test endpoint
    app.get('/test', (req, res) => {
        res.status(200).json({
            message: 'Server is running correctly',
            timestamp: new Date().toISOString(),
            workerId,
            pid: process.pid
        });
    });

    // Start server
    app.listen(PORT, () => {
        logger.info('Worker server started successfully', {
            port: PORT,
            environment: process.env.NODE_ENV || 'development',
            workerId,
            pid: process.pid,
            healthCheck: `http://localhost:${PORT}/health`,
            testEndpoint: `http://localhost:${PORT}/test`
        });
        console.log(`Worker ${workerId} running on port ${PORT}`);
    });
} 