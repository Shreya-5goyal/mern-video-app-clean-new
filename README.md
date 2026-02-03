# HireNest Meet - Professional 1:1 Video Calls

HireNest Meet is a production-ready, zero-latency video calling application built with WebRTC, Socket.IO, and React. It features a professional Zoom-like interface, bidirectional HD video, and ultra-responsive design.

## 🚀 Features

- **HD Video/Audio**: High-bitrate P2P streaming.
- **Zoom-style UI**: Side-by-side grid for 1:1 calls.
- **Smart Controls**: Mute, Camera Toggle, and Remote Audio override.
- **Instant Invite**: Shareable room links (`?room=ID`).
- **Call Timer**: Real-time duration tracking.
- **Highly Responsive**: Optimized for Desktop, Mobile (Portrait & Landscape), and Tablets.
- **Production-Ready Security**: Helmet, Rate Limiting, and hardened CORS.

## 📦 Installation

### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm start`

### Frontend
1. `cd frontend`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm run dev` (or `npm run build` for production)

## 🌐 Deployment

1. **Frontend**: Deploy to Vercel, Netlify, or AWS Amplify. Ensure `VITE_APP_SIGNALING_SERVER` points to your backend.
2. **Backend**: Deploy to Render, Railway, or Heroku. Set `CORS_ORIGIN` to your frontend URL.
3. **STUN/TURN**: For reliable calls over restrictive networks (4G/LTE/Corporate Firewalls), update `backend/index.js` with your own TURN credentials.

## 🛠️ Debugging
- Press **Shift + D** inside a meeting to toggle technical diagnostics.
