# 🚀 Quick Start - Production Deployment

Get your WebRTC app production-ready in 30 minutes!

---

## ⚡ 5-Minute Local Test

```bash
# 1. Copy production files
cp backend/index.production.js backend/index.js
cp frontend/src/hooks/useWebRTC.production.js frontend/src/hooks/useWebRTC.js

# 2. Install dependencies (if not already)
cd backend && npm install
cd ../frontend && npm install

# 3. Set basic environment variables
cd ../backend
cat > .env << EOF
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/webrtc_app
JWT_SECRET=$(openssl rand -base64 64)
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
EOF

cd ../frontend
cat > .env << EOF
VITE_APP_SIGNALING_SERVER=http://localhost:5000
EOF

# 4. Start backend
cd ../backend
npm start

# 5. Start frontend (new terminal)
cd frontend
npm run dev

# 6. Test at http://localhost:5173
```

---

## 🐳 10-Minute Docker Deployment

```bash
# 1. Set environment variables
export MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)
export JWT_SECRET=$(openssl rand -base64 64)
export CORS_ORIGIN=http://localhost:3000

# 2. Start all services
docker-compose -f docker-compose.production.yml up -d

# 3. Check health
curl http://localhost:5000/health
curl http://localhost:3000/health

# 4. Test at http://localhost:3000
```

---

## ☁️ 30-Minute Cloud Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Backend on Railway
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and deploy
cd backend
railway login
railway init
railway up

# 3. Add environment variables in Railway dashboard
MONGO_URI=mongodb+srv://...
JWT_SECRET=<your-secret>
CORS_ORIGIN=https://your-app.vercel.app
NODE_ENV=production

# 4. Note your Railway URL: https://your-app.railway.app
```

#### Frontend on Vercel
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd frontend
vercel --prod

# 3. Add environment variables in Vercel dashboard
VITE_APP_SIGNALING_SERVER=https://your-backend.railway.app

# 4. Your app is live at: https://your-app.vercel.app
```

### Option 2: Render (Full Stack)

#### Backend
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Set:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node index.production.js`
   - **Environment**: Add all variables from `.env.production`
5. Click "Create Web Service"

#### Frontend
1. Click "New +" → "Static Site"
2. Connect your GitHub repo
3. Set:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment**: Add `VITE_APP_SIGNALING_SERVER`
4. Click "Create Static Site"

---

## 🔑 Essential Configuration

### 1. Get TURN Server (Required for Production)

**Option A: Twilio (Easiest)**
```bash
# 1. Sign up at https://www.twilio.com/console/voice/runtime/turn-credentials
# 2. Get credentials
# 3. Add to frontend/.env:
VITE_TURN_URL=turn:global.turn.twilio.com:3478?transport=tcp
VITE_TURN_USERNAME=<from-twilio>
VITE_TURN_PASSWORD=<from-twilio>
```

**Option B: Xirsys (Free Tier)**
```bash
# 1. Sign up at https://xirsys.com
# 2. Create channel
# 3. Get ICE servers
# 4. Add to frontend/.env
```

### 2. MongoDB Setup

**Option A: MongoDB Atlas (Free)**
```bash
# 1. Sign up at https://www.mongodb.com/cloud/atlas
# 2. Create free cluster
# 3. Get connection string
# 4. Add to backend/.env:
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/webrtc_prod
```

**Option B: Local MongoDB**
```bash
# Install MongoDB
# Ubuntu/Debian:
sudo apt-get install mongodb

# macOS:
brew install mongodb-community

# Start service
sudo systemctl start mongodb

# Use in .env:
MONGO_URI=mongodb://localhost:27017/webrtc_app
```

### 3. Generate Secrets

```bash
# JWT Secret (required)
openssl rand -base64 64

# MongoDB password (if self-hosting)
openssl rand -base64 32

# Redis password (if using Redis)
openssl rand -base64 32
```

---

## 🧪 Quick Test

### Test 1: Health Check
```bash
# Backend
curl https://your-backend-url.com/health
# Expected: {"uptime":123,"message":"OK","timestamp":...}

# Frontend
curl https://your-frontend-url.com/health
# Expected: healthy
```

### Test 2: Video Call
1. Open your app in Chrome: `https://your-app.com`
2. Click "Create New Meeting"
3. Copy the room ID
4. Open incognito window
5. Paste room ID and click "Join"
6. Verify video/audio works

### Test 3: Cross-Network
1. Open app on desktop (WiFi)
2. Open app on mobile (4G/5G)
3. Join same room
4. Verify connection works (this tests TURN server)

---

## 🐛 Common Issues

### Issue: "Camera access denied"
**Solution**: Use HTTPS (not HTTP). Browsers block camera on HTTP.

### Issue: "Connection failed"
**Solution**: 
1. Check TURN server credentials
2. Verify CORS_ORIGIN matches frontend URL
3. Check firewall allows WebSocket connections

### Issue: "MongoDB connection error"
**Solution**:
1. Verify MONGO_URI is correct
2. Check MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
3. Verify username/password

### Issue: "One-way video"
**Solution**: TURN server not configured. Add TURN credentials.

---

## 📊 Verify Production Readiness

Run this checklist:

```bash
# 1. Security headers
curl -I https://your-backend.com/health | grep -i "x-frame-options"
# Should see security headers

# 2. HTTPS
curl -I https://your-app.com | grep -i "strict-transport-security"
# Should see HSTS header

# 3. Rate limiting
for i in {1..10}; do curl https://your-backend.com/api/status; done
# Should eventually get 429 Too Many Requests

# 4. TURN server
# Test at: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
# Add your TURN credentials, should see "relay" candidates
```

---

## 🎯 Next Steps

### Immediate
1. [ ] Configure TURN server
2. [ ] Set up MongoDB
3. [ ] Deploy to cloud
4. [ ] Test from mobile network
5. [ ] Enable HTTPS

### This Week
1. [ ] Set up monitoring (Sentry)
2. [ ] Configure backups
3. [ ] Add custom domain
4. [ ] Load testing
5. [ ] Documentation

### This Month
1. [ ] Set up CI/CD
2. [ ] Add analytics
3. [ ] Implement recording
4. [ ] Add screen sharing
5. [ ] Scale to multiple servers

---

## 📚 Resources

- **Full Deployment Guide**: `docs/PRODUCTION_DEPLOYMENT.md`
- **Upgrade Summary**: `docs/PRODUCTION_UPGRADE_SUMMARY.md`
- **Deployment Checklist**: `docs/DEPLOYMENT_CHECKLIST.md`
- **Interview Guide**: `docs/INTERVIEW_GUIDE.md`

---

## 🆘 Need Help?

1. **Check logs**:
   ```bash
   # Docker
   docker-compose logs -f backend
   
   # Railway
   railway logs
   
   # Render
   Check dashboard logs
   ```

2. **Test TURN**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

3. **Test WebRTC**: https://test.webrtc.org/

4. **MongoDB connection**: https://www.mongodb.com/docs/atlas/troubleshoot-connection/

---

## ✅ Success!

If you can:
- ✅ Create a room
- ✅ Join from another device
- ✅ See video/audio
- ✅ Works on mobile network (4G/5G)

**Congratulations! Your app is production-ready! 🎉**

---

**Estimated Time**: 30 minutes  
**Difficulty**: Beginner-friendly  
**Cost**: Free tier available on all platforms
