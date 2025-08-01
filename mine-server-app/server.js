const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Enhanced logging system
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

// Push notification function
const sendPushNotification = async (token, notification) => {
  try {
    const message = {
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    logger.debug('Push notification sent', { token, result });
    return result;
  } catch (error) {
    logger.error('Error sending push notification', { error: error.message, token });
    throw error;
  }
};

// Log server startup
logger.info('Server starting up', {
  port: process.env.PORT || 5000,
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version,
  platform: process.platform
});

// Load Firebase service account from environment variable or file
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  logger.info('Firebase service account loaded from environment variable');
} else {
  try {
    serviceAccount = require('./mine-coin-e3872-firebase-adminsdk-fbsvc-f9af427562.json');
    logger.info('Firebase service account loaded from local file');
  } catch (error) {
    logger.error('Firebase service account not found', {
      error: error.message,
      stack: error.stack
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
  SUSPICIOUS_ACTIVITY_THRESHOLD: 10, // Increased from 3 to 10
  IP_WHITELIST: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  MIN_REQUEST_DELAY: 300, // Minimum delay between requests (ms)
  MAX_REQUEST_DELAY: 1000, // Maximum delay between requests (ms)
  LOADING_STATE_TIMEOUT: 5000, // Maximum loading state duration (ms)
  MAX_SESSIONS_PER_DAY: 8, // Maximum mining sessions per day
  MIN_SESSION_INTERVAL: 60000, // Minimum 1 minute between sessions
  MAX_CONCURRENT_SESSIONS: 1, // Only one session per user
  ANTI_BOT_DELAY: 500, // Random delay to prevent bot attacks
  DEVICE_FINGERPRINT_REQUIRED: true,
  GEO_BLOCKING: false, // Enable to block specific countries
  BLOCKED_COUNTRIES: ['XX'], // Add country codes to block
  MAX_DAILY_EARNINGS: 50, // Maximum coins per day
  SUSPICIOUS_PATTERNS: {
    RAPID_REQUESTS: 5, // Max requests in 10 seconds
    UNUSUAL_TIMING: 0.5, // Suspicious if session < 30 minutes
    MULTIPLE_DEVICES: 2 // Max devices per user
  }
};

// Anti-cheat configuration
const ANTI_CHEAT_CONFIG = {
  MAX_SESSION_DURATION: 7200, // 2 hours in seconds
  MIN_SESSION_DURATION: 1800, // 30 minutes minimum
  MAX_EARNINGS_PER_SESSION: 10, // Maximum coins per session
  MAX_EARNINGS_PER_HOUR: 5, // Maximum coins per hour
  SUSPICIOUS_TIME_THRESHOLD: 0.5, // Increased to 30 minutes buffer for 2-hour sessions
  MAX_DEVICE_CHANGES_PER_DAY: 4, // Increased from 2 to 4
  MAX_IP_CHANGES_PER_DAY: 6, // Increased from 3 to 6
  MIN_REQUEST_INTERVAL: 500, // Reduced from 1000 to 500ms
  MAX_RAPID_REQUESTS: 6, // Increased from 3 to 6
  CHEAT_DETECTION: {
    TIME_MANIPULATION: true,
    MULTIPLE_SESSIONS: true,
    RAPID_EARNINGS: true,
    DEVICE_SPOOFING: true,
    IP_SPOOFING: true,
    SESSION_REPLAY: true
  }
};

// Anti-cheat utilities
const detectTimeManipulation = (startTime, endTime) => {
  const sessionDuration = (endTime - startTime) / (1000 * 60 * 60); // hours
  const expectedDuration = 2; // 2 hours

  if (Math.abs(sessionDuration - expectedDuration) > ANTI_CHEAT_CONFIG.SUSPICIOUS_TIME_THRESHOLD) {
    console.warn(`Time manipulation detected: ${sessionDuration}h vs expected ${expectedDuration}h`);
    return true;
  }
  return false;
};

const validateSessionIntegrity = (userId, startTime, deviceFingerprint, ipAddress) => {
  // Check for multiple active sessions
  // Check for device fingerprint consistency
  // Check for IP address consistency
  // Check for session replay attacks
  return true; // Placeholder for now
};

const calculateLegitimateEarnings = (sessionDuration, miningSpeed, efficiency) => {
  const baseEarnings = miningSpeed * efficiency * sessionDuration;
  return Math.min(baseEarnings, ANTI_CHEAT_CONFIG.MAX_EARNINGS_PER_SESSION);
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

logger.info('Firebase Admin initialized successfully', {
  projectId: serviceAccount.project_id,
  clientEmail: serviceAccount.client_email
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
    // Allow requests with no origin (mobile apps, etc.)
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

app.use(express.json({ limit: '1mb' })); // Reduced limit for security

// Enhanced rate limiting with stricter limits
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.ip + ':' + (req.headers['x-device-id'] || 'unknown');
  },
  handler: (req, res) => {
    logger.security('Rate limit exceeded', {
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method
    });
    console.warn(`Rate limit exceeded for IP: ${req.ip}, Device: ${req.headers['x-device-id']}`);
    res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
  }
});

const miningLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 mining requests per 5 minutes
  message: { error: 'Too many mining requests, please try again later' },
  keyGenerator: (req) => {
    return req.ip + ':' + (req.headers['x-device-id'] || 'unknown');
  },
  handler: (req, res) => {
    logger.mining('Mining rate limit exceeded', {
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method
    });
    console.warn(`Mining rate limit exceeded for IP: ${req.ip}, Device: ${req.headers['x-device-id']}`);
    res.status(429).json({ error: 'Mining rate limit exceeded. Please wait before starting another session.' });
  }
});

const upgradeLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 3, // Limit each IP to 3 upgrade requests per 2 minutes
  message: { error: 'Too many upgrade requests, please try again later' },
  keyGenerator: (req) => {
    return req.ip + ':' + (req.headers['x-device-id'] || 'unknown');
  },
  handler: (req, res) => {
    logger.warn('Upgrade rate limit exceeded', {
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method
    });
    console.warn(`Upgrade rate limit exceeded for IP: ${req.ip}, Device: ${req.headers['x-device-id']}`);
    res.status(429).json({ error: 'Upgrade rate limit exceeded. Please wait before upgrading again.' });
  }
});

// Hourly rate limit
const hourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: SECURITY_CONFIG.MAX_REQUESTS_PER_HOUR,
  message: { error: 'Hourly request limit exceeded' },
  keyGenerator: (req) => {
    return req.ip + ':' + (req.headers['x-device-id'] || 'unknown');
  },
  handler: (req, res) => {
    logger.security('Hourly rate limit exceeded', {
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method
    });
    console.warn(`Hourly rate limit exceeded for IP: ${req.ip}, Device: ${req.headers['x-device-id']}`);
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
      method: req.method
    });
    console.warn(`Invalid device fingerprint from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Invalid device identification' });
  }

  // More lenient device fingerprint validation
  if (deviceFingerprint.length < 6) { // Reduced from 10 to 6
    logger.security('Suspicious device fingerprint length', {
      ip: req.ip,
      deviceFingerprint,
      length: deviceFingerprint.length,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method
    });
    console.warn(`Suspicious device fingerprint from IP: ${req.ip}: ${deviceFingerprint}`);
    return res.status(401).json({ error: 'Suspicious device pattern detected' });
  }

  // Check for common suspicious patterns
  const suspiciousPatterns = [
    '00000000',
    'ffffffff',
    'deadbeef',
    'cafebabe',
    'unknown',
    'test',
    'fake'
  ];

  const lowerFingerprint = deviceFingerprint.toLowerCase();
  if (suspiciousPatterns.some(pattern => lowerFingerprint.includes(pattern))) {
    logger.security('Suspicious device pattern detected', {
      ip: req.ip,
      deviceFingerprint,
      pattern: suspiciousPatterns.find(pattern => lowerFingerprint.includes(pattern)),
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method
    });
    console.warn(`Suspicious device pattern detected from IP: ${req.ip}: ${deviceFingerprint}`);
    return res.status(401).json({ error: 'Suspicious device pattern detected' });
  }

  next();
};

// Advanced security utilities
const encryptData = (data) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', SECURITY_CONFIG.ENCRYPTION_KEY);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), data: encrypted };
};

const decryptData = (encryptedData) => {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', SECURITY_CONFIG.ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Invalid encrypted data');
  }
};

// Enhanced authentication middleware with additional security
const authenticateToken = async (req, res, next) => {
  try {
    // Check device ID
    const deviceId = req.headers['x-device-id'];
    if (!deviceId) {
      logger.security('Missing device ID in authentication', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Device ID required' });
    }

    // Check timestamp (prevent replay attacks)
    const timestamp = req.headers['x-timestamp'];
    if (!timestamp) {
      logger.security('Missing timestamp in authentication', {
        ip: req.ip,
        deviceId: req.headers['x-device-id'],
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Timestamp required' });
    }

    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    if (Math.abs(currentTime - requestTime) > 300000) { // 5 minutes
      logger.security('Request timestamp expired', {
        ip: req.ip,
        deviceId: req.headers['x-device-id'],
        requestTime,
        currentTime,
        difference: Math.abs(currentTime - requestTime),
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Request timestamp expired' });
    }

    // Verify Firebase token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.security('Missing access token', {
        ip: req.ip,
        deviceId: req.headers['x-device-id'],
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
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
      method: req.method
    });

    // Additional security: Check for suspicious activity
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
          method: req.method
        });
        console.warn(`Suspicious activity detected for user ${decodedToken.uid}`);
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
      method: req.method
    });
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Input validation middleware
const validateUserId = (req, res, next) => {
  const { userId } = req.body;

  if (!userId || typeof userId !== 'string' || userId.length < 10) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Ensure userId matches authenticated user
  if (userId !== req.userId) {
    return res.status(403).json({ error: 'User ID mismatch' });
  }

  next();
};

// Create or get user document with enhanced security
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
      miningSpeed: 0.000116,
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
      },
      pushToken: null
    });
  }

  return userRef;
};

// Anti-cheat validation
const validateMiningSession = async (userId, startTime) => {
  const userRef = await getUserDoc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  const now = new Date();
  const sessionStart = new Date(startTime);

  // Check for time manipulation
  if (sessionStart > now) {
    console.warn(`Time manipulation detected for user ${userId}`);
    return { valid: false, error: 'Invalid session start time' };
  }

  // Check for unrealistic session duration
  const sessionDuration = (now - sessionStart) / (1000 * 60 * 60); // hours
  if (sessionDuration > 2.1) { // Allow 6 minutes buffer
    console.warn(`Unrealistic session duration for user ${userId}: ${sessionDuration}h`);
    return { valid: false, error: 'Session duration too long' };
  }

  // Check for rapid session starts
  if (userData.lastMiningStart) {
    const timeSinceLastSession = (now - userData.lastMiningStart.toDate()) / (1000 * 60); // minutes
    if (timeSinceLastSession < 1) {
      console.warn(`Rapid session start detected for user ${userId}`);
      return { valid: false, error: 'Too many rapid session starts' };
    }
  }

  return { valid: true };
};

// Request delay middleware to prevent rapid requests
const requestDelayMiddleware = (req, res, next) => {
  const delay = Math.random() * (SECURITY_CONFIG.MAX_REQUEST_DELAY - SECURITY_CONFIG.MIN_REQUEST_DELAY) + SECURITY_CONFIG.MIN_REQUEST_DELAY;
  setTimeout(next, delay);
};

// Apply global rate limiting to all routes
app.use(globalLimiter);
app.use(hourlyLimiter);
app.use(antiBotMiddleware);
app.use(validateDeviceFingerprint);
app.use(requestDelayMiddleware);

// Test endpoint for debugging
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Check and end expired mining sessions
app.post('/check-mining-session', authenticateToken, validateUserId, async (req, res) => {
  const { userId } = req.body;

  logger.mining('Checking mining session', {
    userId,
    deviceId: req.deviceId,
    ip: req.ip
  });

  try {
    const userRef = await getUserDoc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (!userData) {
      logger.warn('User data not found during session check', {
        userId,
        deviceId: req.deviceId,
        ip: req.ip
      });
      return res.status(400).json({ error: 'User data not found' });
    }

    // Check if user is mining and session has expired
    if (userData.isMining && userData.lastMiningStart) {
      const sessionStart = userData.lastMiningStart.toDate();
      const now = new Date();
      const sessionDuration = (now - sessionStart) / (1000 * 60 * 60); // hours

      // If session has exceeded 2 hours, end it
      if (sessionDuration >= 2) {
        logger.mining('Ending expired mining session', {
          userId,
          sessionDuration,
          miningSpeed: userData.miningSpeed || 0.000116,
          efficiency: userData.efficiency || 1,
          deviceId: req.deviceId,
          ip: req.ip
        });
        console.log(`Ending expired mining session for user ${userId}: ${sessionDuration}h`);

        // Calculate earnings for the 2-hour session
        const miningSpeed = userData.miningSpeed || 0.000116;
        const efficiency = userData.efficiency || 1;
        const sessionEarnings = Math.min(
          miningSpeed * efficiency * 2, // 2 hours
          ANTI_CHEAT_CONFIG.MAX_EARNINGS_PER_SESSION
        );

        // Update user data
        await userRef.update({
          isMining: false,
          balance: admin.firestore.FieldValue.increment(sessionEarnings),
          totalMined: admin.firestore.FieldValue.increment(sessionEarnings),
          todayMined: admin.firestore.FieldValue.increment(sessionEarnings),
          lastMiningEnd: admin.firestore.FieldValue.serverTimestamp(),
          'security.lastActivity': admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.mining('Mining session ended successfully', {
          userId,
          sessionEarnings,
          sessionDuration,
          newBalance: (userData.balance || 0) + sessionEarnings,
          deviceId: req.deviceId,
          ip: req.ip
        });

        // Send push notification for mining completion
        if (userData.pushToken) {
          try {
            await sendPushNotification(userData.pushToken, {
              title: 'Mining Complete! 🎉',
              body: `Congratulations! You've earned ${sessionEarnings.toFixed(6)} coins from your mining session.`,
              data: {
                type: 'mining_complete',
                action: 'navigate_to_home',
                earnings: sessionEarnings
              }
            });
            logger.mining('Push notification sent for mining completion', {
              userId,
              pushToken: userData.pushToken,
              earnings: sessionEarnings
            });
          } catch (error) {
            logger.error('Failed to send push notification', {
              userId,
              error: error.message,
              pushToken: userData.pushToken
            });
          }
        }

        return res.status(200).json({
          message: 'Mining session ended',
          sessionEnded: true,
          earnings: sessionEarnings,
          sessionDuration: sessionDuration
        });
      }
    }

    logger.mining('Session check completed', {
      userId,
      isMining: userData.isMining || false,
      sessionEnded: false,
      deviceId: req.deviceId,
      ip: req.ip
    });

    return res.status(200).json({
      message: 'Session check completed',
      sessionEnded: false,
      isMining: userData.isMining || false
    });

  } catch (error) {
    logger.error('Check mining session error', {
      userId,
      error: error.message,
      stack: error.stack,
      deviceId: req.deviceId,
      ip: req.ip
    });
    console.error('Check mining session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced start mining endpoint with comprehensive anti-cheat
app.post('/start-mining', authenticateToken, validateUserId, miningLimiter, async (req, res) => {
  const { userId, deviceFingerprint } = req.body;

  logger.mining('Start mining request received', {
    userId,
    deviceFingerprint,
    deviceId: req.deviceId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  try {
    const userRef = await getUserDoc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Security: Check if user data is loaded
    if (!userData) {
      logger.warn('User data not found during start mining', {
        userId,
        deviceId: req.deviceId,
        ip: req.ip
      });
      return res.status(400).json({ error: 'User data not found. Please try again.' });
    }

    // Check for expired sessions first
    if (userData.isMining && userData.lastMiningStart) {
      const sessionStart = userData.lastMiningStart.toDate();
      const now = new Date();
      const sessionDuration = (now - sessionStart) / (1000 * 60 * 60); // hours

      // If session has exceeded 2 hours, end it and allow new session
      if (sessionDuration >= 2) {
        console.log(`Ending expired mining session for user ${userId}: ${sessionDuration}h`);

        // Calculate earnings for the 2-hour session
        const miningSpeed = userData.miningSpeed || 0.000116;
        const efficiency = userData.efficiency || 1;
        const sessionEarnings = Math.min(
          miningSpeed * efficiency * 2, // 2 hours
          ANTI_CHEAT_CONFIG.MAX_EARNINGS_PER_SESSION
        );

        // Update user data to end the session
        await userRef.update({
          isMining: false,
          balance: admin.firestore.FieldValue.increment(sessionEarnings),
          totalMined: admin.firestore.FieldValue.increment(sessionEarnings),
          todayMined: admin.firestore.FieldValue.increment(sessionEarnings),
          lastMiningEnd: admin.firestore.FieldValue.serverTimestamp(),
          'security.lastActivity': admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Anti-cheat: Check for multiple active sessions
    if (userData.isMining) {
      logger.mining('Multiple session attempt detected', {
        userId,
        deviceId: req.deviceId,
        ip: req.ip,
        currentBalance: userData.balance || 0,
        miningSpeed: userData.miningSpeed || 0.000116
      });
      console.warn(`Multiple session attempt detected for user ${userId}`);
      return res.status(400).json({ error: 'Mining session already active' });
    }

    // Anti-cheat: Check for rapid session starts
    if (userData.lastMiningStart) {
      const timeSinceLastSession = Date.now() - userData.lastMiningStart.toDate().getTime();
      if (timeSinceLastSession < ANTI_CHEAT_CONFIG.MIN_REQUEST_INTERVAL) {
        logger.mining('Rapid session start detected', {
          userId,
          timeSinceLastSession,
          minInterval: ANTI_CHEAT_CONFIG.MIN_REQUEST_INTERVAL,
          deviceId: req.deviceId,
          ip: req.ip
        });
        console.warn(`Rapid session start detected for user ${userId}: ${timeSinceLastSession}ms`);
        return res.status(429).json({ error: 'Please wait before starting another session' });
      }
    }

    // Anti-cheat: Check daily session limit
    const today = new Date().toDateString();
    const lastSessionDate = userData.lastSessionDate ? userData.lastSessionDate.toDate().toDateString() : null;

    if (lastSessionDate === today && userData.totalSessions >= SECURITY_CONFIG.MAX_SESSIONS_PER_DAY) {
      logger.mining('Daily session limit exceeded', {
        userId,
        totalSessions: userData.totalSessions,
        maxSessions: SECURITY_CONFIG.MAX_SESSIONS_PER_DAY,
        deviceId: req.deviceId,
        ip: req.ip
      });
      console.warn(`Daily session limit exceeded for user ${userId}`);
      return res.status(429).json({ error: 'Daily session limit reached' });
    }

    // Anti-cheat: Check minimum interval between sessions
    if (userData.lastMiningStart) {
      const timeSinceLastSession = Date.now() - userData.lastMiningStart.toDate().getTime();
      if (timeSinceLastSession < SECURITY_CONFIG.MIN_SESSION_INTERVAL) {
        logger.mining('Session interval violation', {
          userId,
          timeSinceLastSession,
          minInterval: SECURITY_CONFIG.MIN_SESSION_INTERVAL,
          deviceId: req.deviceId,
          ip: req.ip
        });
        console.warn(`Session interval violation for user ${userId}: ${timeSinceLastSession}ms`);
        return res.status(429).json({ error: 'Please wait before starting another session' });
      }
    }

    // Anti-cheat: Check daily earnings limit
    const todayMined = userData.todayMined || 0;
    if (todayMined >= SECURITY_CONFIG.MAX_DAILY_EARNINGS) {
      logger.mining('Daily earnings limit exceeded', {
        userId,
        todayMined,
        maxEarnings: SECURITY_CONFIG.MAX_DAILY_EARNINGS,
        deviceId: req.deviceId,
        ip: req.ip
      });
      console.warn(`Daily earnings limit exceeded for user ${userId}: ${todayMined} coins`);
      return res.status(429).json({ error: 'Daily earnings limit reached' });
    }

    // Anti-cheat: Validate device fingerprint
    if (SECURITY_CONFIG.DEVICE_FINGERPRINT_REQUIRED && (!deviceFingerprint || deviceFingerprint === 'unknown')) {
      logger.security('Invalid device fingerprint during mining start', {
        userId,
        deviceFingerprint,
        deviceId: req.deviceId,
        ip: req.ip
      });
      console.warn(`Invalid device fingerprint for user ${userId}: ${deviceFingerprint}`);
      return res.status(401).json({ error: 'Invalid device identification' });
    }

    // Anti-cheat: Check for device fingerprint consistency (more lenient)
    const lastDeviceFingerprint = userData.security?.deviceFingerprint;
    if (lastDeviceFingerprint && lastDeviceFingerprint !== deviceFingerprint) {
      console.warn(`Device fingerprint changed for user ${userId}: ${lastDeviceFingerprint} -> ${deviceFingerprint}`);

      // More lenient device change tracking
      const deviceChanges = userData.security?.deviceChanges || 0;
      const today = new Date().toDateString();
      const lastDeviceChangeDate = userData.security?.lastDeviceChangeDate ?
        userData.security.lastDeviceChangeDate.toDate().toDateString() : null;

      // Reset device changes if it's a new day
      const currentDeviceChanges = lastDeviceChangeDate === today ? deviceChanges : 0;

      if (currentDeviceChanges >= ANTI_CHEAT_CONFIG.MAX_DEVICE_CHANGES_PER_DAY * 2) { // Doubled the limit
        console.warn(`Too many device changes for user ${userId}: ${currentDeviceChanges} changes`);
        return res.status(403).json({ error: 'Too many device changes detected' });
      }

      // Update device change tracking
      await userRef.update({
        'security.deviceChanges': currentDeviceChanges + 1,
        'security.lastDeviceChangeDate': admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Anti-cheat: Check for suspicious activity patterns
    const suspiciousActivity = userData.security?.suspiciousActivity || 0;
    if (suspiciousActivity >= SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) {
      console.warn(`Suspicious activity detected for user ${userId}: ${suspiciousActivity} violations`);
      return res.status(403).json({ error: 'Account temporarily suspended due to suspicious activity' });
    }

    // Security: Add server-side delay to prevent timing attacks
    const serverDelay = Math.random() * 400 + 200;
    await new Promise(resolve => setTimeout(resolve, serverDelay));

    // Start new mining session with server timestamp
    const startTime = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update({
      isMining: true,
      lastMiningStart: startTime,
      earnedCoins: 0,
      'security.lastActivity': startTime,
      'security.deviceFingerprint': deviceFingerprint || null,
      'security.lastIP': req.ip,
      'security.sessionStartTime': startTime,
      updatedAt: startTime
    });

    logger.mining('Mining session started successfully', {
      userId,
      deviceFingerprint,
      deviceId: req.deviceId,
      ip: req.ip,
      miningSpeed: userData.miningSpeed || 0.000116,
      efficiency: userData.efficiency || 1,
      level: userData.miningLevel || 1,
      balance: userData.balance || 0
    });

    // Send push notification for mining start
    if (userData.pushToken) {
      try {
        await sendPushNotification(userData.pushToken, {
          title: '⛏️ Mining Started!',
          body: 'Your 2-hour mining session has begun! You\'ll receive a notification when it completes.',
          data: {
            type: 'mining_start',
            action: 'navigate_to_home',
            sessionDuration: 7200 // 2 hours in seconds
          }
        });
        logger.mining('Push notification sent for mining start', {
          userId,
          pushToken: userData.pushToken,
          sessionStartTime: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to send push notification for mining start', {
          userId,
          error: error.message,
          pushToken: userData.pushToken
        });
      }
    }

    res.status(200).json({
      message: 'Mining started successfully!',
      startTime: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Start mining error', {
      userId,
      error: error.message,
      stack: error.stack,
      deviceId: req.deviceId,
      ip: req.ip
    });
    console.error('Start mining error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generic upgrade endpoint
app.post('/upgrade', authenticateToken, validateUserId, upgradeLimiter, async (req, res) => {
  const { userId, upgradeId, category } = req.body;

  logger.info('Upgrade request received', {
    userId,
    upgradeId,
    category,
    deviceId: req.deviceId,
    ip: req.ip
  });

  try {
    const userRef = await getUserDoc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Security: Check if user data is loaded
    if (!userData) {
      logger.warn('User data not found during upgrade', {
        userId,
        upgradeId,
        deviceId: req.deviceId,
        ip: req.ip
      });
      return res.status(400).json({ error: 'User data not found. Please try again.' });
    }

    // Define upgrade configurations
    const upgradeConfigs = {
      speed: {
        name: 'Mining Speed',
        baseCost: 10,
        costMultiplier: 1.5,
        maxLevel: 50,
        levelRequirement: 1,
        effect: 'miningSpeed',
        effectValue: 0.0005
      },
      efficiency: {
        name: 'Mining Efficiency',
        baseCost: 15,
        costMultiplier: 2,
        maxLevel: 30,
        levelRequirement: 5,
        effect: 'efficiency',
        effectValue: 0.1
      },
      capacity: {
        name: 'Mining Capacity',
        baseCost: 20,
        costMultiplier: 2.5,
        maxLevel: 20,
        levelRequirement: 10,
        effect: 'capacity',
        effectValue: 0.3
      }
    };

    const upgrade = upgradeConfigs[upgradeId];
    if (!upgrade) {
      logger.warn('Invalid upgrade type requested', {
        userId,
        upgradeId,
        deviceId: req.deviceId,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Invalid upgrade type' });
    }

    // Check level requirement
    if (userData.miningLevel < upgrade.levelRequirement) {
      return res.status(400).json({
        error: `Level ${upgrade.levelRequirement} required for ${upgrade.name}`
      });
    }

    const currentLevel = userData.upgrades?.[upgradeId] || 0;

    // Check max level
    if (upgrade.maxLevel && currentLevel >= upgrade.maxLevel) {
      return res.status(400).json({ error: 'Upgrade already at maximum level' });
    }

    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));

    if (userData.balance < cost) {
      logger.warn('Insufficient balance for upgrade', {
        userId,
        upgradeId,
        currentBalance: userData.balance,
        requiredCost: cost,
        deviceId: req.deviceId,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Security: Add server-side delay to prevent timing attacks
    const serverDelay = Math.random() * 400 + 200;
    await new Promise(resolve => setTimeout(resolve, serverDelay));

    // Apply upgrade
    const newLevel = currentLevel + 1;
    const updates = {
      balance: admin.firestore.FieldValue.increment(-cost),
      [`upgrades.${upgradeId}`]: newLevel,
      'security.lastActivity': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Apply effect
    if (upgrade.effect === 'miningSpeed') {
      updates.miningSpeed = 0.000116 + newLevel * upgrade.effectValue;
    }

    await userRef.update(updates);

    logger.info('Upgrade completed successfully', {
      userId,
      upgradeId,
      upgradeName: upgrade.name,
      newLevel,
      cost,
      oldBalance: userData.balance,
      newBalance: userData.balance - cost,
      deviceId: req.deviceId,
      ip: req.ip
    });

    res.status(200).json({
      message: `${upgrade.name} upgraded successfully!`,
      newLevel,
      newBalance: userData.balance - cost,
      cost
    });
  } catch (error) {
    logger.error('Upgrade error', {
      userId,
      upgradeId,
      error: error.message,
      stack: error.stack,
      deviceId: req.deviceId,
      ip: req.ip
    });
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Boost activation endpoint
app.post('/activate-boost', authenticateToken, validateUserId, upgradeLimiter, async (req, res) => {
  const { userId, boostId } = req.body;

  try {
    const userRef = await getUserDoc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Define boost configurations
    const boostConfigs = {
      double_xp: {
        name: 'Double XP Boost',
        cost: 50,
        duration: 3600, // 1 hour
        cooldown: 7200, // 2 hours
        levelRequirement: 3,
        effect: 'double_xp'
      },
      double_coins: {
        name: 'Double Coins Boost',
        cost: 100,
        duration: 1800, // 30 minutes
        cooldown: 3600, // 1 hour
        levelRequirement: 8,
        effect: 'double_coins'
      },
      instant_mining: {
        name: 'Instant Mining',
        cost: 200,
        duration: 0, // Instant
        cooldown: 14400, // 4 hours
        levelRequirement: 15,
        effect: 'instant_mining'
      }
    };

    const boost = boostConfigs[boostId];
    if (!boost) {
      return res.status(400).json({ error: 'Invalid boost type' });
    }

    // Check level requirement
    if (userData.miningLevel < boost.levelRequirement) {
      return res.status(400).json({
        error: `Level ${boost.levelRequirement} required for ${boost.name}`
      });
    }

    // Check cooldown
    const lastUsed = userData.boosts?.[boostId]?.lastUsed;
    if (lastUsed) {
      const cooldownEnd = lastUsed + (boost.cooldown * 1000);
      if (Date.now() < cooldownEnd) {
        const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
        return res.status(400).json({
          error: `Boost on cooldown. ${Math.floor(remaining / 60)}m ${remaining % 60}s remaining`
        });
      }
    }

    if (userData.balance < boost.cost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Activate boost
    const now = Date.now();
    await userRef.update({
      balance: admin.firestore.FieldValue.increment(-boost.cost),
      [`boosts.${boostId}`]: {
        active: true,
        activatedAt: now,
        duration: boost.duration * 1000,
        lastUsed: now
      },
      'security.lastActivity': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      message: `${boost.name} activated successfully!`,
      newBalance: userData.balance - boost.cost,
      duration: boost.duration
    });
  } catch (error) {
    console.error('Boost activation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Daily streak claim endpoint with XP rewards
app.post('/claim-daily', authenticateToken, validateUserId, async (req, res) => {
  const { userId } = req.body;

  logger.info('Daily claim request received', {
    userId,
    deviceId: req.deviceId,
    ip: req.ip
  });

  try {
    const userRef = await getUserDoc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Security: Check if user data is loaded
    if (!userData) {
      return res.status(400).json({ error: 'User data not found. Please try again.' });
    }

    const now = new Date();
    const today = now.toDateString();
    const lastClaimDate = userData.lastDailyClaim ? userData.lastDailyClaim.toDate().toDateString() : null;

    if (lastClaimDate === today) {
      logger.warn('Daily reward already claimed today', {
        userId,
        lastClaimDate,
        today,
        deviceId: req.deviceId,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Daily reward already claimed today' });
    }

    // Security: Add server-side delay to prevent timing attacks
    const serverDelay = Math.random() * 600 + 300;
    await new Promise(resolve => setTimeout(resolve, serverDelay));

    // Calculate reward based on streak
    const currentStreak = userData.dailyStreak || 0;
    const newStreak = lastClaimDate === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString()
      ? currentStreak + 1
      : 1;

    const coinReward = Math.min(5 + (newStreak - 1) * 3, 100); // Cap at 100 coins
    const xpReward = Math.min(10 + (newStreak - 1) * 5, 200); // Cap at 200 XP

    // Calculate new level
    const currentExp = userData.experience || 0;
    const newExp = currentExp + xpReward;
    const newLevel = Math.floor(newExp / 100) + 1;

    await userRef.update({
      balance: admin.firestore.FieldValue.increment(coinReward),
      experience: newExp,
      miningLevel: newLevel,
      dailyStreak: newStreak,
      lastDailyClaim: admin.firestore.FieldValue.serverTimestamp(),
      'security.lastActivity': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info('Daily reward claimed successfully', {
      userId,
      coinReward,
      xpReward,
      newStreak,
      newLevel,
      oldBalance: userData.balance,
      newBalance: userData.balance + coinReward,
      oldExperience: userData.experience || 0,
      newExperience: newExp,
      deviceId: req.deviceId,
      ip: req.ip
    });

    res.status(200).json({
      message: 'Daily reward claimed successfully!',
      coinReward,
      xpReward,
      newStreak,
      newLevel,
      newBalance: userData.balance + coinReward,
      newExperience: newExp
    });
  } catch (error) {
    logger.error('Claim daily error', {
      userId,
      error: error.message,
      stack: error.stack,
      deviceId: req.deviceId,
      ip: req.ip
    });
    console.error('Claim daily error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced session completion checker with comprehensive anti-cheat
setInterval(async () => {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('isMining', '==', true).get();
    const now = new Date();

    logger.mining('Session completion check started', {
      activeSessions: snapshot.size,
      timestamp: now.toISOString()
    });

    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const user = doc.data();
      if (!user.lastMiningStart) continue;

      const startTime = user.lastMiningStart.toDate();
      const elapsedHours = (now - startTime) / (1000 * 60 * 60);

      if (elapsedHours >= 2) {
        // Anti-cheat: Validate session duration
        if (elapsedHours > ANTI_CHEAT_CONFIG.MAX_SESSION_DURATION / 3600) {
          logger.mining('Suspicious session duration detected', {
            userId: doc.id,
            elapsedHours,
            maxDuration: ANTI_CHEAT_CONFIG.MAX_SESSION_DURATION / 3600,
            startTime: startTime.toISOString(),
            endTime: now.toISOString()
          });
          console.warn(`Suspicious session duration for user ${doc.id}: ${elapsedHours}h`);
          // Mark as suspicious but still process
          batch.update(doc.ref, {
            'security.suspiciousActivity': admin.firestore.FieldValue.increment(1)
          });
        }

        // Anti-cheat: Detect time manipulation
        if (ANTI_CHEAT_CONFIG.CHEAT_DETECTION.TIME_MANIPULATION) {
          const timeManipulation = detectTimeManipulation(startTime.getTime(), now.getTime());
          if (timeManipulation) {
            logger.security('Time manipulation detected', {
              userId: doc.id,
              startTime: startTime.toISOString(),
              endTime: now.toISOString(),
              sessionDuration: elapsedHours
            });
            console.warn(`Time manipulation detected for user ${doc.id}`);
            batch.update(doc.ref, {
              'security.suspiciousActivity': admin.firestore.FieldValue.increment(2),
              'security.timeManipulationDetected': true
            });
          }
        }

        // Anti-cheat: Calculate legitimate earnings with server-side validation
        const baseSpeed = user.miningSpeed || 0.000116;
        const efficiencyBonus = 1 + (user.upgrades?.efficiency || 0) * 0.1;
        const sessionDuration = elapsedHours * 3600; // Convert to seconds

        // Calculate legitimate earnings based on actual session duration
        const legitimateEarnings = calculateLegitimateEarnings(sessionDuration, baseSpeed, efficiencyBonus);

        // Anti-cheat: Cap earnings to prevent exploitation
        const finalEarnings = Math.min(legitimateEarnings, ANTI_CHEAT_CONFIG.MAX_EARNINGS_PER_SESSION);

        // Anti-cheat: Check for unrealistic earnings
        if (finalEarnings > ANTI_CHEAT_CONFIG.MAX_EARNINGS_PER_SESSION) {
          logger.mining('Unrealistic earnings detected', {
            userId: doc.id,
            finalEarnings,
            maxEarnings: ANTI_CHEAT_CONFIG.MAX_EARNINGS_PER_SESSION,
            baseSpeed: baseSpeed,
            efficiencyBonus: efficiencyBonus,
            sessionDuration: sessionDuration
          });
          console.warn(`Unrealistic earnings detected for user ${doc.id}: ${finalEarnings} coins`);
          batch.update(doc.ref, {
            'security.suspiciousActivity': admin.firestore.FieldValue.increment(1),
            'security.excessiveEarningsDetected': true
          });
        }

        // Calculate experience with anti-cheat validation
        const expGained = Math.floor(finalEarnings * 10);
        const currentExp = user.experience || 0;
        const newExp = currentExp + expGained;
        const newLevel = Math.floor(newExp / 100) + 1;

        // Anti-cheat: Update session stats with validation
        const today = now.toDateString();
        const lastSessionDate = user.lastSessionDate ? user.lastSessionDate.toDate().toDateString() : null;
        const isNewDay = lastSessionDate !== today;

        batch.update(doc.ref, {
          isMining: false,
          balance: admin.firestore.FieldValue.increment(finalEarnings),
          totalMined: admin.firestore.FieldValue.increment(finalEarnings),
          earnedCoins: 0,
          experience: newExp,
          miningLevel: newLevel,
          totalSessions: admin.firestore.FieldValue.increment(1),
          bestSession: Math.max(user.bestSession || 0, finalEarnings),
          todayMined: isNewDay ? finalEarnings : admin.firestore.FieldValue.increment(finalEarnings),
          lastSessionDate: admin.firestore.FieldValue.serverTimestamp(),
          'security.lastActivity': admin.firestore.FieldValue.serverTimestamp(),
          'security.sessionEndTime': admin.firestore.FieldValue.serverTimestamp(),
          'security.lastSessionEarnings': finalEarnings,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.mining('Session completed and earnings calculated', {
          userId: doc.id,
          sessionDuration: elapsedHours,
          finalEarnings,
          expGained,
          newLevel,
          isNewDay,
          oldBalance: user.balance || 0,
          newBalance: (user.balance || 0) + finalEarnings,
          oldExperience: user.experience || 0,
          newExperience: newExp
        });

        // Send push notification for mining completion
        if (user.pushToken) {
          try {
            await sendPushNotification(user.pushToken, {
              title: 'Mining Complete! 🎉',
              body: `Congratulations! You've earned ${finalEarnings.toFixed(6)} coins from your mining session.`,
              data: {
                type: 'mining_complete',
                action: 'navigate_to_home',
                earnings: finalEarnings
              }
            });
            logger.mining('Push notification sent for mining completion (scheduled task)', {
              userId: doc.id,
              pushToken: user.pushToken,
              earnings: finalEarnings
            });
          } catch (error) {
            logger.error('Failed to send push notification (scheduled task)', {
              userId: doc.id,
              error: error.message,
              pushToken: user.pushToken
            });
          }
        }
      }
    }

    await batch.commit();

    logger.mining('Session completion check finished', {
      processedSessions: snapshot.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Session completion check error', {
      error: error.message,
      stack: error.stack
    });
    console.error('Session completion check error:', error);
  }
}, 600000); // Check every 10 minutes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Test notification endpoint (for debugging)
app.post('/test-notification', authenticateToken, validateUserId, async (req, res) => {
  const { userId } = req.body;

  try {
    const userRef = await getUserDoc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (!userData || !userData.pushToken) {
      return res.status(400).json({
        error: 'User not found or no push token available',
        hasPushToken: !!userData?.pushToken
      });
    }

    // Send test notification
    await sendPushNotification(userData.pushToken, {
      title: 'Test Notification 🔔',
      body: 'This is a test notification to verify the notification system is working.',
      data: {
        type: 'test_notification',
        action: 'test',
        timestamp: Date.now()
      }
    });

    logger.info('Test notification sent successfully', {
      userId,
      pushToken: userData.pushToken
    });

    res.status(200).json({
      message: 'Test notification sent successfully',
      pushToken: userData.pushToken
    });
  } catch (error) {
    logger.error('Test notification failed', {
      userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to send test notification',
      details: error.message
    });
  }
});

// Username availability check endpoint
app.post('/check-username-availability', async (req, res) => {
  const { username } = req.body;

  logger.info('Username availability check requested', {
    username,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  try {
    if (!username || typeof username !== 'string' || username.length < 3) {
      return res.status(400).json({
        error: 'Invalid username',
        available: false
      });
    }

    // Check if username exists in Firestore
    const usersRef = db.collection('users');
    const query = usersRef.where('username', '==', username.toLowerCase());
    const snapshot = await query.limit(1).get();

    const isAvailable = snapshot.empty;

    logger.info('Username availability check completed', {
      username,
      isAvailable,
      ip: req.ip
    });

    res.status(200).json({
      available: isAvailable,
      username: username
    });
  } catch (error) {
    logger.error('Username availability check error', {
      username,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    console.error('Username availability check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      available: false
    });
  }
});

// Email availability check endpoint
app.post('/check-email-availability', async (req, res) => {
  const { email } = req.body;

  logger.info('Email availability check requested', {
    email: email ? email.toLowerCase() : null,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  try {
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        error: 'Invalid email',
        available: false
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        available: false
      });
    }

    // Check if email exists in Firestore
    const usersRef = db.collection('users');
    const query = usersRef.where('email', '==', email.toLowerCase());
    const snapshot = await query.limit(1).get();

    const isAvailable = snapshot.empty;

    logger.info('Email availability check completed', {
      email: email.toLowerCase(),
      isAvailable,
      ip: req.ip
    });

    res.status(200).json({
      available: isAvailable,
      email: email.toLowerCase()
    });
  } catch (error) {
    logger.error('Email availability check error', {
      email: email ? email.toLowerCase() : null,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    console.error('Email availability check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      available: false
    });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Server is running correctly',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/health`,
    testEndpoint: `http://localhost:${PORT}/test`
  });
  console.log(`Mine Server App running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
});