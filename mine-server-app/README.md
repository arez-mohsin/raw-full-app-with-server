# Mine App Server

A scalable Node.js server for the Mine App with comprehensive security, anti-cheat protection, and clustering support for handling 10,000+ users.

## Features

- ✅ **Multi-core clustering** - Utilizes all CPU cores
- ✅ **Comprehensive logging** - Async file and console logging
- ✅ **Security features** - Rate limiting, device fingerprinting, anti-cheat
- ✅ **Firebase integration** - Real-time database operations
- ✅ **Performance monitoring** - Built-in metrics tracking
- ✅ **Production ready** - Optimized for 10,000+ daily users

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server (single-threaded)
npm run dev

# Start clustered server (recommended for production)
npm run dev:clustered
```

### Production Deployment

```bash
# Start clustered server
npm run start:clustered

# Start performance monitor
node performance-monitor.js
```

## Deployment to Render

### 1. Prepare Your Repository

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add clustered server for production"
   git push origin main
   ```

2. **Ensure these files are included**:
   - `server-clustered.js` - Clustered server
   - `render.yaml` - Render configuration
   - `package.json` - Dependencies
   - `.gitignore` - Excludes sensitive files

### 2. Deploy to Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `mine-app-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:clustered`
   - **Plan**: `Starter` (or higher for production)

### 3. Environment Variables

Set these in Render Dashboard → Environment:

```bash
# Required
NODE_ENV=production
PORT=10000
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Optional (auto-generated if not set)
ENCRYPTION_KEY=your-secret-key
MAX_WORKERS=8
LOG_LEVEL=info
```

### 4. Firebase Service Account

1. **Get your Firebase service account JSON**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Copy the entire JSON content

2. **Add to Render**:
   - Go to your service → Environment
   - Add variable: `FIREBASE_SERVICE_ACCOUNT`
   - Paste the entire JSON as the value

### 5. Health Check

The server includes a health check endpoint at `/health` that Render will use to monitor the service.

## API Endpoints

### Health & Monitoring
- `GET /health` - Health check
- `GET /test` - Test endpoint

### Mining Operations
- `POST /start-mining` - Start mining session
- `POST /check-mining-session` - Check session status

### User Actions
- `POST /upgrade` - Purchase upgrades
- `POST /claim-daily` - Claim daily rewards

## Performance

### Capacity
- **Concurrent Users**: 1,000-2,000
- **Requests/Second**: 50-100 RPS
- **Response Time**: < 200ms
- **Uptime**: > 99.9%

### Monitoring
- **Performance Monitor**: `node performance-monitor.js`
- **Log Files**: `logs/` directory
- **Health Check**: `/health` endpoint

## Security Features

- **Rate Limiting**: Per-IP and per-user limits
- **Device Fingerprinting**: Anti-bot protection
- **Anti-Cheat**: Session validation and time manipulation detection
- **Authentication**: Firebase token verification
- **CORS**: Configured for mobile apps

## File Structure

```
mine-server-app/
├── server.js                 # Single-threaded server
├── server-clustered.js       # Multi-core clustered server
├── performance-monitor.js    # Performance monitoring
├── render.yaml              # Render deployment config
├── package.json             # Dependencies
├── logs/                    # Log files (auto-created)
│   ├── info-*.log
│   ├── error-*.log
│   ├── security-*.log
│   └── mining-*.log
└── README.md               # This file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase credentials | Required |
| `ENCRYPTION_KEY` | Security key | Auto-generated |
| `MAX_WORKERS` | Number of worker processes | CPU count |
| `LOG_LEVEL` | Logging level | `info` |

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Check what's using the port
   netstat -ano | findstr :5000
   ```

2. **Firebase connection issues**:
   - Verify service account JSON is correct
   - Check Firebase project permissions

3. **High memory usage**:
   - Monitor with `node performance-monitor.js`
   - Check log file sizes in `logs/` directory

### Logs

- **Application logs**: `logs/info-*.log`
- **Error logs**: `logs/error-*.log`
- **Security events**: `logs/security-*.log`
- **Mining operations**: `logs/mining-*.log`

## Support

For deployment issues:
1. Check Render logs in the dashboard
2. Verify environment variables are set correctly
3. Test locally with `npm run start:clustered`
4. Monitor performance with the built-in monitor

## License

MIT License - see LICENSE file for details. 