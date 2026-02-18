# Production Deployment Checklist

## 🚀 Pre-Deployment

### Environment Setup
- [ ] Generate JWT secret: `openssl rand -base64 64`
- [ ] Generate MongoDB password: `openssl rand -base64 32`
- [ ] Generate Redis password: `openssl rand -base64 32`
- [ ] Set up TURN server (Twilio or coturn)
- [ ] Create MongoDB database (Atlas or self-hosted)
- [ ] Set up Redis instance (optional but recommended)

### Configuration Files
- [ ] Copy `backend/.env.production` to `backend/.env`
- [ ] Copy `frontend/.env.production` to `frontend/.env`
- [ ] Fill in all required environment variables
- [ ] Update CORS_ORIGIN with actual frontend domain
- [ ] Add TURN server credentials
- [ ] Verify MongoDB connection string

### Code Updates
- [ ] Replace `backend/index.js` with `backend/index.production.js`
- [ ] Replace `frontend/src/hooks/useWebRTC.js` with production version
- [ ] Update imports if necessary
- [ ] Run `npm install` in both backend and frontend

---

## 🔒 Security

- [ ] HTTPS enabled on all domains
- [ ] CORS configured with specific origins (no wildcards)
- [ ] Rate limiting enabled (100 req/15min)
- [ ] Helmet security headers applied
- [ ] JWT secret is strong (64+ characters)
- [ ] MongoDB authentication enabled
- [ ] Redis password protected
- [ ] Firewall configured (ports 80, 443, 3478 only)
- [ ] Environment variables not in Git
- [ ] Run `npm audit` and fix vulnerabilities

---

## 🐳 Docker Deployment

- [ ] Build backend image: `docker build -t webrtc-backend ./backend`
- [ ] Build frontend image: `docker build -t webrtc-frontend ./frontend`
- [ ] Test locally: `docker-compose -f docker-compose.production.yml up`
- [ ] Verify health checks pass
- [ ] Check logs for errors
- [ ] Test video call between two browsers

---

## 🌐 Domain & SSL

- [ ] Register domain name
- [ ] Set up DNS records:
  - [ ] `app.your-domain.com` → Frontend
  - [ ] `api.your-domain.com` → Backend
- [ ] Generate SSL certificate (Let's Encrypt or Cloudflare)
- [ ] Configure SSL in nginx/reverse proxy
- [ ] Test HTTPS access
- [ ] Enable HSTS headers

---

## 📊 Monitoring

- [ ] Set up Winston logging (already configured)
- [ ] Configure log rotation (PM2 or logrotate)
- [ ] Set up error tracking (Sentry recommended)
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up performance monitoring (optional)
- [ ] Create alerts for critical errors
- [ ] Test health endpoints: `/health`, `/api/status`

---

## 🧪 Testing

### Functional Testing
- [ ] Test signup/login flow
- [ ] Test room creation
- [ ] Test room joining
- [ ] Test video/audio connection
- [ ] Test mute/unmute
- [ ] Test camera on/off
- [ ] Test call end
- [ ] Test reconnection (disconnect network mid-call)

### Cross-Browser Testing
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Edge (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (iOS)

### Network Testing
- [ ] Same network (WiFi)
- [ ] Different networks (4G/5G)
- [ ] Behind corporate firewall
- [ ] High latency network (VPN)
- [ ] Low bandwidth (throttle to 3G)

### Load Testing
- [ ] Run Artillery load test
- [ ] Test 10 concurrent calls
- [ ] Test 50 concurrent calls
- [ ] Monitor CPU/memory usage
- [ ] Check for memory leaks

---

## 🔄 TURN Server Verification

- [ ] TURN server accessible from internet
- [ ] Test with: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- [ ] Verify credentials work
- [ ] Test from different networks
- [ ] Check TURN server logs
- [ ] Verify firewall allows UDP 49152-65535

---

## 💾 Database

- [ ] MongoDB connection tested
- [ ] Database indexes created
- [ ] Backup strategy configured
- [ ] Backup tested (restore test)
- [ ] Connection pooling configured
- [ ] Monitor connection count

---

## 📈 Scaling Preparation

- [ ] Redis configured (for horizontal scaling)
- [ ] Test with multiple backend instances
- [ ] Load balancer configured (if applicable)
- [ ] Auto-scaling rules defined (if using K8s/ECS)
- [ ] CDN configured for frontend (optional)

---

## 📝 Documentation

- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document rollback procedure
- [ ] Update API documentation
- [ ] Create user guide

---

## 🚨 Incident Response

- [ ] Define on-call rotation
- [ ] Set up alerting (PagerDuty, Slack)
- [ ] Create incident response plan
- [ ] Document escalation procedures
- [ ] Test alert system

---

## 🎯 Go-Live

### Final Checks (1 hour before)
- [ ] All tests passing
- [ ] No critical errors in logs
- [ ] Health checks green
- [ ] SSL certificates valid
- [ ] Monitoring active
- [ ] Team notified

### Launch
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify health checks
- [ ] Test end-to-end flow
- [ ] Monitor logs for 1 hour
- [ ] Announce launch

### Post-Launch (24 hours)
- [ ] Monitor error rates
- [ ] Check server resources (CPU, memory)
- [ ] Review user feedback
- [ ] Check connection success rate
- [ ] Verify TURN server usage
- [ ] Review logs for issues

---

## 🔧 Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Check connection success rate

### Weekly
- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Review security logs
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Rotate TURN credentials
- [ ] Review and optimize database
- [ ] Update SSL certificates (if needed)
- [ ] Security audit
- [ ] Performance review

---

## 🆘 Rollback Plan

If issues occur:

1. **Immediate Actions**
   - [ ] Revert to previous version
   - [ ] Notify team
   - [ ] Check logs for root cause

2. **Rollback Steps**
   ```bash
   # Docker
   docker-compose -f docker-compose.production.yml down
   git checkout <previous-commit>
   docker-compose -f docker-compose.production.yml up -d
   
   # Vercel
   vercel rollback
   
   # Railway
   railway rollback
   ```

3. **Post-Rollback**
   - [ ] Verify service restored
   - [ ] Investigate issue
   - [ ] Fix and re-deploy

---

## ✅ Success Criteria

Your deployment is successful when:

- ✅ Health checks return 200 OK
- ✅ Users can create and join rooms
- ✅ Video/audio connection works >95% of the time
- ✅ No critical errors in logs
- ✅ Response time <500ms
- ✅ Uptime >99.9%
- ✅ TURN server working (test from mobile network)

---

## 📞 Emergency Contacts

- **DevOps Lead**: [Name] - [Phone] - [Email]
- **Backend Lead**: [Name] - [Phone] - [Email]
- **TURN Provider**: [Support URL/Phone]
- **MongoDB Support**: [Support URL]
- **Hosting Provider**: [Support URL/Phone]

---

**Last Updated**: 2026-02-10  
**Deployment Date**: ___________  
**Deployed By**: ___________  
**Version**: ___________
