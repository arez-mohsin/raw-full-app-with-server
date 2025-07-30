# Deployment Guide for 10,000 Users

## Quick Start for Production

### 1. **Immediate Deployment (Critical Fixes Applied)**

```bash
# Use the clustered server for better performance
npm run start:clustered

# Or for development with clustering
npm run dev:clustered
```

### 2. **Server Requirements for 10,000 Users**

#### **Minimum Requirements**
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: 100GB+ SSD
- **Network**: 100Mbps+ bandwidth

#### **Recommended Cloud Setup**
```bash
# AWS EC2 (t3.xlarge or better)
# Google Cloud (e2-standard-4 or better)
# DigitalOcean (8GB RAM droplet)
```

### 3. **Environment Variables**

Create `.env` file:
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Security
ENCRYPTION_KEY=your-secret-key-here
IP_WHITELIST=your-allowed-ips

# Performance
MAX_WORKERS=8
LOG_LEVEL=info
```

## Performance Optimizations

### 1. **Database Optimization**

#### **Firebase Firestore Indexes**
Create these composite indexes in Firebase Console:
```
Collection: users
Indexes:
- isMining (Ascending) + lastMiningStart (Ascending)
- lastSessionDate (Ascending) + totalSessions (Ascending)
- miningLevel (Descending) + experience (Descending)
- balance (Descending) + totalMined (Descending)
```

#### **Firebase Rules Optimization**
```javascript
// Optimize Firestore rules for performance
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Add indexes for queries
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 2. **Caching Strategy**

#### **Redis Setup (Recommended)**
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis for caching
sudo nano /etc/redis/redis.conf
```

Add to Redis config:
```conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### **Memory Caching (Alternative)**
```javascript
// Simple in-memory cache
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Cache user data
const getUserDoc = async (userId) => {
  const cached = cache.get(`user:${userId}`);
  if (cached) return cached;
  
  const userData = await fetchFromFirebase(userId);
  cache.set(`user:${userId}`, userData, 300);
  return userData;
};
```

### 3. **Load Balancing**

#### **Nginx Configuration**
```nginx
upstream mine_app {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    server 127.0.0.1:5003;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://mine_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **PM2 Process Management**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server-clustered.js --name "mine-app" --instances max

# Monitor
pm2 monit

# Logs
pm2 logs mine-app
```

## Monitoring Setup

### 1. **Performance Monitoring**

#### **Start Performance Monitor**
```bash
# Run performance monitor
node performance-monitor.js

# Or integrate with server
const PerformanceMonitor = require('./performance-monitor');
const monitor = new PerformanceMonitor();
```

#### **Key Metrics to Watch**
- Response time < 200ms
- Error rate < 1%
- Memory usage < 80%
- CPU usage < 70%

### 2. **Log Monitoring**

#### **Log Rotation Setup**
```bash
# Install logrotate
sudo apt-get install logrotate

# Configure log rotation
sudo nano /etc/logrotate.d/mine-app
```

Add configuration:
```
/path/to/mine-server-app/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        pm2 reload mine-app
    endscript
}
```

### 3. **Alerting Setup**

#### **Simple Alert Script**
```javascript
// alert-monitor.js
const fs = require('fs');
const path = require('path');

function checkAlerts() {
  const logPath = path.join(__dirname, 'logs', 'errors.log');
  const errorLog = fs.readFileSync(logPath, 'utf8');
  const errorCount = errorLog.split('\n').length - 1;
  
  if (errorCount > 100) {
    console.log('ALERT: High error rate detected!');
    // Send notification (email, Slack, etc.)
  }
}

setInterval(checkAlerts, 60000); // Check every minute
```

## Scaling Strategies

### 1. **Horizontal Scaling**

#### **Multiple Server Instances**
```bash
# Server 1 (Primary)
PORT=5000 npm run start:clustered

# Server 2 (Secondary)
PORT=5001 npm run start:clustered

# Server 3 (Tertiary)
PORT=5002 npm run start:clustered
```

#### **Load Balancer Configuration**
```nginx
# Round-robin load balancing
upstream mine_app {
    server server1.your-domain.com:5000;
    server server2.your-domain.com:5000;
    server server3.your-domain.com:5000;
}
```

### 2. **Database Scaling**

#### **Firebase Scaling Options**
1. **Firestore**: Automatic scaling (recommended)
2. **Cloud SQL**: For complex queries
3. **Redis**: For session storage

#### **Database Connection Pooling**
```javascript
// Optimize Firebase connections
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'your-project-id',
  databaseURL: 'https://your-project-id.firebaseio.com'
});

// Configure connection pooling
const db = admin.firestore();
db.settings({
  ignoreUndefinedProperties: true,
  cacheSizeBytes: admin.firestore.CACHE_SIZE_UNLIMITED
});
```

### 3. **CDN Setup**

#### **Static Assets**
```javascript
// Serve static files through CDN
app.use('/static', express.static('public', {
  maxAge: '1d',
  etag: true
}));
```

#### **API Caching**
```javascript
// Cache API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  next();
});
```

## Cost Optimization

### 1. **Firebase Cost Management**

#### **Free Tier Limits**
- **Reads**: 50,000/day
- **Writes**: 20,000/day
- **Deletes**: 20,000/day

#### **Cost Optimization Strategies**
```javascript
// Batch operations to reduce costs
const batch = db.batch();

// Batch multiple operations
users.forEach(user => {
  const userRef = db.collection('users').doc(user.id);
  batch.update(userRef, { lastActivity: admin.firestore.FieldValue.serverTimestamp() });
});

await batch.commit(); // Single network request
```

### 2. **Server Cost Optimization**

#### **Auto-scaling Rules**
```javascript
// Scale based on load
const os = require('os');
const loadAvg = os.loadavg()[0];
const cpuCount = os.cpus().length;

if (loadAvg > cpuCount * 0.8) {
  // Scale up
  console.log('High load detected, scaling up...');
} else if (loadAvg < cpuCount * 0.3) {
  // Scale down
  console.log('Low load detected, scaling down...');
}
```

## Security Hardening

### 1. **Rate Limiting Optimization**
```javascript
// Adaptive rate limiting
const adaptiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: (req) => {
    // Adjust limits based on user behavior
    const userLevel = req.user?.miningLevel || 1;
    return Math.min(20 + userLevel * 5, 100);
  },
  keyGenerator: (req) => req.ip + ':' + req.userId
});
```

### 2. **DDoS Protection**
```javascript
// Basic DDoS protection
const ddosProtection = (req, res, next) => {
  const clientIP = req.ip;
  const requestCount = requestCounts.get(clientIP) || 0;
  
  if (requestCount > 1000) { // 1000 requests per minute
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  requestCounts.set(clientIP, requestCount + 1);
  setTimeout(() => {
    const current = requestCounts.get(clientIP);
    if (current > 1) {
      requestCounts.set(clientIP, current - 1);
    } else {
      requestCounts.delete(clientIP);
    }
  }, 60000);
  
  next();
};
```

## Deployment Checklist

### ✅ **Pre-Deployment**
- [ ] Test clustered server locally
- [ ] Set up monitoring
- [ ] Configure environment variables
- [ ] Set up log rotation
- [ ] Configure Firebase indexes

### ✅ **Deployment**
- [ ] Deploy clustered server
- [ ] Set up load balancer
- [ ] Configure CDN
- [ ] Set up monitoring alerts
- [ ] Test all endpoints

### ✅ **Post-Deployment**
- [ ] Monitor performance metrics
- [ ] Check error rates
- [ ] Verify database performance
- [ ] Test under load
- [ ] Set up backups

## Emergency Procedures

### 1. **Server Overload**
```bash
# Quick restart
pm2 restart mine-app

# Scale up immediately
pm2 scale mine-app +2

# Check logs
pm2 logs mine-app --lines 100
```

### 2. **Database Issues**
```bash
# Check Firebase quotas
# Monitor Firestore usage in Firebase Console

# If hitting limits, implement caching immediately
```

### 3. **Performance Issues**
```bash
# Check system resources
htop
df -h
free -h

# Restart with more workers
pm2 restart mine-app --max-memory-restart 1G
```

## Success Metrics

### **Target Performance for 10,000 Users**
- ✅ Response time: < 200ms
- ✅ Error rate: < 1%
- ✅ Uptime: > 99.9%
- ✅ Concurrent users: 1,000+
- ✅ Requests/second: 100+

### **Monitoring Dashboard**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const metrics = monitor.getMetrics();
  res.json({
    status: 'healthy',
    metrics,
    timestamp: new Date().toISOString()
  });
});
```

This deployment guide ensures your app can handle 10,000 users with proper monitoring, scaling, and optimization strategies. 