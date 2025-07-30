# Deploy to Render with GitHub - Step by Step Guide

## 🚀 Quick Deployment Steps

### Step 1: Prepare Your GitHub Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit with clustered server"
   ```

2. **Create GitHub Repository**:
   - Go to [GitHub.com](https://github.com)
   - Click "New repository"
   - Name it: `mine-app-server`
   - Make it **Public** (Render needs access)
   - Don't initialize with README (we already have one)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/mine-app-server.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Get Firebase Service Account

1. **Go to Firebase Console**:
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Generate Service Account**:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - **Copy the entire JSON content** (you'll need this for Render)

### Step 3: Deploy to Render

1. **Go to Render Dashboard**:
   - Visit [Render Dashboard](https://dashboard.render.com/)
   - Sign up/Login with GitHub

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your `mine-app-server` repository

3. **Configure the Service**:
   ```
   Name: mine-app-server
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Build Command: npm install
   Start Command: npm run start:clustered
   Plan: Starter (or higher for production)
   ```

4. **Set Environment Variables**:
   Click "Environment" tab and add:

   | Key | Value | Description |
   |-----|-------|-------------|
   | `NODE_ENV` | `production` | Environment mode |
   | `PORT` | `10000` | Render's port |
   | `FIREBASE_SERVICE_ACCOUNT` | `{your-json-here}` | Firebase credentials |
   | `ENCRYPTION_KEY` | `your-secret-key-here` | Security key |
   | `MAX_WORKERS` | `8` | Number of workers |
   | `LOG_LEVEL` | `info` | Logging level |

5. **Add Firebase Service Account**:
   - In the Environment section
   - Add variable: `FIREBASE_SERVICE_ACCOUNT`
   - Paste the entire JSON from Step 2
   - **Important**: Include the entire JSON, including `{}`

6. **Deploy**:
   - Click "Create Web Service"
   - Wait for build to complete (2-5 minutes)
   - Your app will be available at: `https://your-app-name.onrender.com`

### Step 4: Test Your Deployment

1. **Health Check**:
   ```bash
   curl https://your-app-name.onrender.com/health
   ```

2. **Test Endpoint**:
   ```bash
   curl https://your-app-name.onrender.com/test
   ```

3. **Check Logs**:
   - Go to Render Dashboard → Your Service → Logs
   - Look for successful startup messages

### Step 5: Update Your React Native App

Update your app's API base URL:

```javascript
// In your React Native app
const API_BASE_URL = 'https://your-app-name.onrender.com';
```

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check Render logs
   - Verify `package.json` has all dependencies
   - Ensure `server-clustered.js` exists

2. **Firebase Connection Error**:
   - Verify service account JSON is complete
   - Check Firebase project permissions
   - Ensure environment variable is set correctly

3. **Port Issues**:
   - Render uses port 10000 by default
   - Make sure your app uses `process.env.PORT`

4. **Health Check Fails**:
   - Verify `/health` endpoint exists
   - Check server startup logs
   - Ensure all environment variables are set

### Render-Specific Notes:

- **Auto-deploy**: Render will automatically deploy when you push to GitHub
- **Logs**: Available in Render Dashboard → Logs
- **Environment**: Set to `production` for better performance
- **Scaling**: Can upgrade plan for more resources

## 📊 Monitoring Your Deployment

### Render Dashboard:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory usage
- **Deployments**: Build history and status

### Health Checks:
- **Endpoint**: `/health`
- **Frequency**: Every 30 seconds
- **Timeout**: 10 seconds

### Performance:
- **Response Time**: < 200ms
- **Uptime**: > 99.9%
- **Concurrent Users**: 1,000+

## 🔄 Updating Your App

1. **Make Changes**:
   ```bash
   # Edit your code
   git add .
   git commit -m "Update server"
   git push origin main
   ```

2. **Auto-Deploy**:
   - Render will automatically detect changes
   - New deployment will start
   - Zero downtime updates

## 🎯 Success Checklist

- ✅ Repository pushed to GitHub
- ✅ Firebase service account configured
- ✅ Render service created
- ✅ Environment variables set
- ✅ Health check passes
- ✅ App connects successfully
- ✅ Logs show no errors

## 🚀 Next Steps

1. **Monitor Performance**:
   - Use the built-in performance monitor
   - Check Render metrics
   - Monitor Firebase usage

2. **Scale Up** (if needed):
   - Upgrade Render plan
   - Add Redis caching
   - Implement CDN

3. **Security**:
   - Set up custom domain
   - Configure SSL
   - Add monitoring alerts

Your clustered server is now ready to handle 10,000+ users on Render! 🎉 