# Production Deployment Guide

## 🚀 Overview

This guide covers deploying the WebRTC video calling application to production with enterprise-grade reliability, security, and scalability.

---

## 📋 Prerequisites

### Required Services
- **TURN Server** (Required for 95%+ connection success)
  - Recommended: [Twilio TURN](https://www.twilio.com/stun-turn) or [Xirsys](https://xirsys.com/)
  - Self-hosted: [coturn](https://github.com/coturn/coturn)
- **MongoDB Atlas** or self-hosted MongoDB
- **Redis** (Optional but recommended for horizontal scaling)
- **SSL Certificate** (Let's Encrypt recommended)

### Domain Requirements
- Frontend domain: `app.your-domain.com`
- Backend domain: `api.your-domain.com`
- TURN server domain: `turn.your-domain.com` (if self-hosted)

---

## 🔧 Setup Instructions

### 1. Environment Configuration

#### Backend (.env.production)
```bash
# Copy example and fill in values
cp backend/.env.production backend/.env

# Required variables:
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/webrtc_prod
JWT_SECRET=<generate-with-openssl-rand-base64-64>
CORS_ORIGIN=https://app.your-domain.com
REDIS_URL=redis://user:pass@redis-host:6379
TURN_URL=turn:turn.your-domain.com:3478
TURN_USERNAME=your_turn_user
TURN_PASSWORD=your_turn_pass
```

#### Frontend (.env.production)
```bash
# Copy example and fill in values
cp frontend/.env.production frontend/.env

# Required variables:
VITE_APP_SIGNALING_SERVER=https://api.your-domain.com
VITE_TURN_URL=turn:turn.your-domain.com:3478
VITE_TURN_USERNAME=your_turn_user
VITE_TURN_PASSWORD=your_turn_pass
```

### 2. Generate Secrets

```bash
# JWT Secret (64 characters)
openssl rand -base64 64

# MongoDB password
openssl rand -base64 32

# Redis password
openssl rand -base64 32
```

---

## 🐳 Docker Deployment (Recommended)

### Option A: Docker Compose (Single Server)

```bash
# 1. Set environment variables
export MONGO_ROOT_USER=admin
export MONGO_ROOT_PASSWORD=<your-mongo-password>
export REDIS_PASSWORD=<your-redis-password>
export JWT_SECRET=<your-jwt-secret>
export CORS_ORIGIN=https://app.your-domain.com

# 2. Build and start services
docker-compose -f docker-compose.production.yml up -d

# 3. Check logs
docker-compose -f docker-compose.production.yml logs -f

# 4. Check health
curl http://localhost:5000/health
curl http://localhost:3000/health
```

### Option B: Kubernetes (Multi-Server)

```bash
# 1. Create namespace
kubectl create namespace webrtc-prod

# 2. Create secrets
kubectl create secret generic webrtc-secrets \
  --from-literal=mongo-uri='mongodb+srv://...' \
  --from-literal=jwt-secret='...' \
  --from-literal=redis-url='redis://...' \
  -n webrtc-prod

# 3. Apply configurations
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# 4. Check status
kubectl get pods -n webrtc-prod
kubectl get services -n webrtc-prod
```

---

## ☁️ Cloud Platform Deployment

### Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd frontend
vercel --prod

# 3. Set environment variables in Vercel dashboard
VITE_APP_SIGNALING_SERVER=https://your-backend.railway.app
VITE_TURN_URL=turn:turn.your-domain.com:3478
VITE_TURN_USERNAME=your_user
VITE_TURN_PASSWORD=your_pass
```

#### Backend on Railway
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and init
railway login
cd backend
railway init

# 3. Set environment variables
railway variables set NODE_ENV=production
railway variables set MONGO_URI=mongodb+srv://...
railway variables set JWT_SECRET=...
railway variables set CORS_ORIGIN=https://your-app.vercel.app

# 4. Deploy
railway up
```

### AWS (Full Stack)

#### Backend on EC2 + ECS
```bash
# 1. Build Docker image
cd backend
docker build -t webrtc-backend:latest .

# 2. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag webrtc-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/webrtc-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/webrtc-backend:latest

# 3. Deploy to ECS (use AWS Console or Terraform)
```

#### Frontend on S3 + CloudFront
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## 🔒 SSL/TLS Setup

### Let's Encrypt (Free)

```bash
# 1. Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 2. Generate certificate
sudo certbot --nginx -d api.your-domain.com -d app.your-domain.com

# 3. Auto-renewal (cron job)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Set DNS records:
   - `app.your-domain.com` → Frontend IP/CNAME
   - `api.your-domain.com` → Backend IP/CNAME
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"

---

## 🔄 TURN Server Setup

### Option 1: Twilio (Easiest)
```bash
# 1. Sign up at https://www.twilio.com/stun-turn
# 2. Get credentials from dashboard
# 3. Add to .env:
TURN_URL=turn:global.turn.twilio.com:3478?transport=tcp
TURN_USERNAME=<from-twilio>
TURN_PASSWORD=<from-twilio>
```

### Option 2: Self-Hosted (coturn)
```bash
# 1. Install coturn
sudo apt-get install coturn

# 2. Configure /etc/turnserver.conf
listening-port=3478
fingerprint
lt-cred-mech
user=username:password
realm=turn.your-domain.com
external-ip=YOUR_PUBLIC_IP

# 3. Start service
sudo systemctl enable coturn
sudo systemctl start coturn

# 4. Open firewall
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 49152:65535/udp
```

---

## 📊 Monitoring & Logging

### PM2 (Process Management)
```bash
# 1. Install PM2
npm install -g pm2

# 2. Start with ecosystem file
cd backend
pm2 start ecosystem.config.js --env production

# 3. Setup monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# 4. Save and auto-start
pm2 save
pm2 startup
```

### Winston Logs
```bash
# Logs location: backend/logs/
# - combined.log: All logs
# - error.log: Errors only

# View logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Log rotation (automatic with pm2-logrotate)
```

### Prometheus + Grafana (Advanced)
```bash
# 1. Install Prometheus
docker run -d -p 9090:9090 -v prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus

# 2. Install Grafana
docker run -d -p 3001:3000 grafana/grafana

# 3. Add metrics endpoint to backend
# (Requires prom-client package)
```

---

## 🧪 Testing Production Setup

### Health Checks
```bash
# Backend health
curl https://api.your-domain.com/health

# Frontend health
curl https://app.your-domain.com/health

# WebSocket connection
wscat -c wss://api.your-domain.com
```

### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 https://api.your-domain.com/health

# WebSocket load test
artillery run load-test.yml
```

### WebRTC Testing
1. Open two browsers in incognito mode
2. Navigate to `https://app.your-domain.com`
3. Create a room in one browser
4. Join with the room ID in the second browser
5. Verify video/audio connection

---

## 🔐 Security Checklist

- [ ] HTTPS enabled on all domains
- [ ] CORS configured with specific origins (no wildcards)
- [ ] Rate limiting enabled
- [ ] Helmet security headers applied
- [ ] JWT secrets are strong (64+ characters)
- [ ] MongoDB authentication enabled
- [ ] Redis password protected
- [ ] Firewall configured (only ports 80, 443, 3478 open)
- [ ] TURN server credentials rotated regularly
- [ ] Environment variables not committed to Git
- [ ] Dependencies updated (npm audit)
- [ ] Error messages don't leak sensitive info

---

## 📈 Scaling Strategies

### Horizontal Scaling (Multiple Backend Servers)

1. **Enable Redis** (required for shared state)
```bash
# In backend/.env
REDIS_URL=redis://user:pass@redis-cluster:6379
```

2. **Load Balancer Setup** (NGINX)
```nginx
upstream backend {
    least_conn;
    server backend1.your-domain.com:5000;
    server backend2.your-domain.com:5000;
    server backend3.your-domain.com:5000;
}

server {
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

3. **Auto-Scaling** (Kubernetes HPA)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 🐛 Troubleshooting

### Issue: WebSocket Connection Fails
```bash
# Check CORS settings
# Verify SSL certificate
# Check firewall rules
# Test with: wscat -c wss://api.your-domain.com
```

### Issue: Video Not Connecting
```bash
# Verify TURN server is accessible
# Check TURN credentials
# Test with: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
```

### Issue: High Latency
```bash
# Check server location (should be near users)
# Verify TURN server is not being used unnecessarily
# Monitor with: backend/logs/combined.log
```

---

## 📞 Support & Resources

- **Documentation**: See `/docs` folder
- **GitHub Issues**: Report bugs and feature requests
- **WebRTC Testing**: https://test.webrtc.org/
- **TURN Testing**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

---

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] TURN server tested and working
- [ ] SSL certificates installed
- [ ] MongoDB backups configured
- [ ] Monitoring and alerting setup
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Rollback plan prepared
- [ ] Team trained on deployment process

---

**Congratulations! Your WebRTC application is now production-ready! 🚀**
