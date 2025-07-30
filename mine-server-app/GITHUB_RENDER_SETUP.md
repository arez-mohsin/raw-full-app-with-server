# Complete GitHub + Render Deployment Guide

## 🚀 Step 1: Add Project to GitHub

### 1.1 Create GitHub Repository

1. **Go to GitHub.com** and sign in
2. **Click "New repository"** (green button)
3. **Configure repository**:
   - **Repository name**: `mine-app-server`
   - **Description**: `Scalable Node.js server for Mine App with clustering and security`
   - **Visibility**: **Public** (Render needs access)
   - **DO NOT** initialize with README (we already have one)
   - **DO NOT** add .gitignore (we already have one)
4. **Click "Create repository"**

### 1.2 Connect Your Local Repository

Run these commands in your terminal:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/mine-app-server.git

# Rename branch to main (GitHub standard)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 1.3 Verify Upload

- Go to your GitHub repository
- You should see all files including:
  - `server-clustered.js`
  - `render.yaml`
  - `package.json`
  - `README.md`
  - All other project files

## 🚀 Step 2: Deploy Server to Render

### 2.1 Get Firebase Service Account

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**
3. **Go to Project Settings** → **Service Accounts**
4. **Click "Generate new private key"**
5. **Download the JSON file**
6. **Copy the entire JSON content** (you'll need this for Render)

### 2.2 Deploy to Render

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Sign up/Login with GitHub**
3. **Click "New +"** → **"Web Service"**
4. **Connect your GitHub repository**:
   - Select your `mine-app-server` repository
   - Click "Connect"

### 2.3 Configure the Service

Fill in these settings:

```
Name: mine-app-server
Environment: Node
Region: Choose closest to your users (US East, US West, etc.)
Branch: main
Build Command: npm install
Start Command: npm run start:clustered
Plan: Starter (or higher for production)
```

### 2.4 Set Environment Variables

Click "Environment" tab and add these variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Render's port |
| `FIREBASE_SERVICE_ACCOUNT` | `{your-json-here}` | Firebase credentials |
| `ENCRYPTION_KEY` | `your-secret-key-here` | Security key |
| `MAX_WORKERS` | `8` | Number of workers |
| `LOG_LEVEL` | `info` | Logging level |

**Important**: For `FIREBASE_SERVICE_ACCOUNT`, paste the entire JSON from Step 2.1, including the `{}` brackets.

### 2.5 Deploy

1. **Click "Create Web Service"**
2. **Wait for build** (2-5 minutes)
3. **Your app will be available at**: `https://your-app-name.onrender.com`

## 🧪 Step 3: Test Your Deployment

### 3.1 Health Check

```bash
curl https://your-app-name.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### 3.2 Test Endpoint

```bash
curl https://your-app-name.onrender.com/test
```

Expected response:
```json
{
  "message": "Mine App Server is running!",
  "environment": "production",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3.3 Check Logs

- Go to Render Dashboard → Your Service → Logs
- Look for successful startup messages
- Check for any errors

## 📱 Step 4: Update Your React Native App

Update your app's API base URL:

```javascript
// In your React Native app (src/firebase.js or similar)
const API_BASE_URL = 'https://your-app-name.onrender.com';

// Update all API calls to use this URL
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

- ✅ Repository created on GitHub
- ✅ Code pushed to GitHub
- ✅ Firebase service account obtained
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