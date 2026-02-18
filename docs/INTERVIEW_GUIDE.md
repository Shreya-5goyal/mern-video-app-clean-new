# WebRTC Video Calling Project - FAANG Interview Guide

## 1. HIGH-LEVEL SYSTEM DESIGN

### Problem Solved
Real-time 1-to-1 video calling with **ultra-low latency** (100-300ms) using **peer-to-peer** connections.

### Why WebRTC Over Media Servers?
**Traditional (Zoom-style)**: User A → Server (processes) → User B = 500-2000ms latency  
**WebRTC P2P**: User A ↔ Direct Connection ↔ User B = 100-300ms latency

**Benefits**:
- Zero server processing latency
- Bandwidth efficient (server only handles signaling)
- Cost-effective (no expensive media servers)
- Scalable (server doesn't process video)

### Architecture
```
┌─────────┐    WebSocket     ┌──────────┐
│ Browser │◄──Signaling─────►│ Node.js  │
│ (User A)│   (JSON msgs)    │  Server  │
└─────────┘                  └──────────┘
     │                            │
     └──►STUN (NAT Traversal)◄────┘
              │
              ▼
     ┌─────────────────────┐
     │  Direct P2P Media   │
     │   (UDP Packets)     │
     └─────────────────────┘
              │
              ▼
         ┌─────────┐
         │ Browser │
         │ (User B)│
         └─────────┘
```

### What Server Does vs Does NOT Do
**DOES**: WebSocket connections, relay signaling (offer/answer/ICE), track rooms, authentication  
**DOES NOT**: Touch video/audio data, process media, store streams, relay video packets

**Key Point**: "Server is just a matchmaker. Once users exchange connection details, they talk directly."

---

## 2. COMPLETE FLOW (USER STORY)

### Step 1: Alice Opens App
1. Authentication → JWT token stored
2. Sees HomePage with "Create Room" or "Join Room"
3. Creates room → generates ID "XYZ789"

### Step 2: Camera/Mic Access
```javascript
// useWebRTC.js
const stream = await navigator.mediaDevices.getUserMedia({
    video: true, audio: true
});
```
- Browser shows permission popup
- Returns MediaStream with video + audio tracks
- Alice sees her preview

### Step 3: Join Room (Signaling)
```javascript
socket.emit("join-room", "XYZ789");
// Server: rooms["XYZ789"] = ["socket_alice_123"]
socket.emit("all-users", []); // Empty, Alice is alone
```

### Step 4: Bob Joins
```javascript
// Bob joins same room
socket.emit("join-room", "XYZ789");
// Server: rooms["XYZ789"] = ["socket_alice_123", "socket_bob_456"]
socket.emit("all-users", ["socket_alice_123"]); // Sent to Bob
```

### Step 5: Offer → Answer (WebRTC Handshake)
**Bob creates offer**:
```javascript
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
socket.emit("offer", { userToCall: "socket_alice_123", sdp: offer });
```

**Alice receives offer, creates answer**:
```javascript
await pc.setRemoteDescription(new RTCSessionDescription(sdp));
const answer = await pc.createAnswer();
socket.emit("answer", { callerID: "socket_bob_456", sdp: answer });
```

**SDP (Session Description Protocol)** = "I can send VP8 video + Opus audio at these IPs"

### Step 6: ICE Candidate Exchange
```javascript
pc.onicecandidate = (e) => {
    socket.emit("ice-candidate", { target: targetID, candidate: e.candidate });
};
```
**ICE Candidates** = Possible network paths (local IP, public IP from STUN, TURN relay)

### Step 7: Media Flows
```javascript
pc.ontrack = (e) => {
    const remoteStream = e.streams[0];
    setPeers([...peers, { peerID: targetID, stream: remoteStream }]);
};
```
Both users see each other's video in real-time!

### Step 8: Call End
```javascript
localStream.getTracks().forEach(t => t.stop()); // Stop camera/mic
pc.close(); // Close WebRTC connection
socket.emit("disconnect");
```

---

## 3. FILE-BY-FILE EXPLANATION

### `backend/index.js` (Signaling Server)
**Purpose**: Matchmaker that helps browsers find each other

**Key Code**:
```javascript
const rooms = {}; // { "XYZ789": ["socket_alice", "socket_bob"] }

socket.on("join-room", (roomId) => {
    rooms[roomId].push(socket.id);
    socket.emit("all-users", rooms[roomId].filter(id => id !== socket.id));
});

socket.on("offer", (payload) => {
    io.to(payload.userToCall).emit("offer", { sdp: payload.sdp, callerID: socket.id });
});
```
**Never touches media** - only relays JSON messages

---

### `frontend/src/hooks/useWebRTC.js` (WebRTC Logic)
**Purpose**: Encapsulates all WebRTC complexity

**Key Functions**:
```javascript
// Create peer connection
const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

// Add local tracks
stream.getTracks().forEach(track => pc.addTrack(track, stream));

// Receive remote tracks
pc.ontrack = (e) => {
    setPeers([...peers, { peerID: targetID, stream: e.streams[0] }]);
};

// Handle ICE candidates
pc.onicecandidate = (e) => {
    socket.emit("ice-candidate", { target: targetID, candidate: e.candidate });
};
```

**Critical**: ICE candidate queuing to avoid race conditions
```javascript
if (pc.remoteDescription) {
    pc.addIceCandidate(candidate);
} else {
    icQueue.push(candidate); // Add after remote description is set
}
```

---

### `frontend/src/socket.js` (WebSocket Client)
```javascript
export const socket = io(VITE_APP_SIGNALING_SERVER, {
    transports: ["websocket"]
});
```
**Singleton pattern** - one connection shared across app

---

### `backend/ecosystem.config.js` (PM2 Config)
```javascript
instances: 'max',        // Use all CPU cores
exec_mode: 'cluster',    // Load balancing
```
**Production benefits**: Auto-restart on crash, zero-downtime deploys

---

### `nginx.conf.example` (Reverse Proxy)
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```
**Required for WebSocket** - upgrades HTTP to WS protocol

---

## 4. KEY WEBRTC CONCEPTS

### RTCPeerConnection
The JavaScript API managing the entire P2P connection
```javascript
const pc = new RTCPeerConnection({ iceServers: [...] });
```
Handles: codec negotiation, ICE, encryption, media send/receive

### SDP (Session Description Protocol)
Text format describing the media session
```
m=video 9 UDP/TLS/RTP/SAVPF 96 97  ← Video
a=rtpmap:96 VP8/90000              ← VP8 codec
m=audio 9 UDP/TLS/RTP/SAVPF 111    ← Audio
a=rtpmap:111 opus/48000/2          ← Opus codec
```
**Offer** = "Here's what I can send"  
**Answer** = "Here's what I agree to"

### ICE Candidates
Possible network paths to reach the peer
- **Host**: Local IP (192.168.1.5)
- **Server Reflexive (srflx)**: Public IP from STUN (203.0.113.45)
- **Relay**: TURN server IP (fallback)

### STUN vs TURN
**STUN**: Discovers public IP ("What's my address?") - Free, 80% success  
**TURN**: Relays media when direct fails - Expensive, 95% success

### Why UDP?
**TCP**: Packet lost → Retransmit → Delay (bad for real-time)  
**UDP**: Packet lost → Skip it → Keep going (better slight glitch than freeze)

---

## 5. LOW LATENCY DESIGN

### Why Low Latency?
1. **P2P Architecture**: No server processing (User A → User B directly)
2. **UDP Protocol**: No retransmission delays
3. **No Server Processing**: Media never touches server
4. **Optimized Codecs**: VP8/VP9 hardware-accelerated, Opus 20ms frames

### Latency Breakdown
- **P2P (this project)**: 100-200ms
- **TURN relay**: 300-500ms
- **Traditional server**: 500-2000ms

---

## 6. REAL-WORLD PROBLEMS

### Problem 1: Call Not Connecting Behind NAT
**Cause**: Both users behind routers, can't find each other  
**Solution**: Add TURN server
```javascript
iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "turn:turn.example.com:3478", username: "user", credential: "pass" }
]
```

### Problem 2: One-Way Audio/Video
**Cause**: Asymmetric firewall or missing tracks  
**Debug**:
```javascript
pc.getSenders().forEach(s => console.log(s.track.kind)); // Check sent tracks
pc.ontrack = (e) => console.log("Received:", e.track.kind); // Check received
```

### Problem 3: ICE Candidate Timing
**Cause**: Candidate arrives before remote description set  
**Solution**: Queue candidates
```javascript
if (pc.remoteDescription) {
    pc.addIceCandidate(candidate);
} else {
    icQueue.push(candidate);
}
```

### Problem 4: HTTPS Required
**Cause**: Browsers block getUserMedia on HTTP  
**Solution**: Deploy with SSL certificate (Let's Encrypt)

---

## 7. OPTIMIZATIONS

### Beginner-Friendly
1. **Bitrate Control**:
```javascript
sender.setParameters({ encodings: [{ maxBitrate: 1000000 }] }); // 1Mbps
```

2. **Resolution Adaptation**:
```javascript
stream.getVideoTracks()[0].applyConstraints({ width: 640, height: 480 });
```

### Production-Grade
1. **Redis for Room State**: Horizontal scaling
2. **Regional TURN Servers**: Lower latency
3. **Load Balancing**: NGINX + multiple backend servers

### What Google/Zoom Does
- **SFU (Selective Forwarding Unit)**: For group calls
- **Simulcast**: Send multiple resolutions simultaneously
- **AI**: Noise suppression, background blur
- **Global Infrastructure**: TURN in 50+ regions

---

## 8. INTERVIEW PREPARATION

### 5 Strong Talking Points
1. "Built production-ready WebRTC app with sub-200ms latency using P2P architecture"
2. "Solved NAT traversal with STUN/TURN and ICE candidate queuing"
3. "Implemented WebSocket signaling for offer/answer/ICE exchange"
4. "Optimized for low latency using UDP and direct P2P connections"
5. "Handled production concerns: JWT auth, HTTPS, PM2, NGINX, error handling"

### 3 System Design Questions

**Q1: Scale to 10,000 concurrent calls?**
- Horizontal scaling: 10 servers + Redis + NGINX load balancer
- Regional deployment (US, EU, Asia)
- Monitoring: Prometheus + Grafana

**Q2: Add group calls (3+ participants)?**
- Mesh topology (up to 4 users): Simple, low latency
- SFU (5+ users): Server forwards streams, scalable to 50+
- Use mediasoup library

**Q3: Handle poor network conditions?**
- Adaptive bitrate based on getStats()
- Forward Error Correction (FEC)
- Simulcast (multiple resolutions)
- Fallback to audio-only

### 3 Common Mistakes
❌ "Server sends video to both users" → ✅ "Server only relays signaling, media is P2P"  
❌ "STUN and TURN are the same" → ✅ "STUN discovers IPs, TURN relays media"  
❌ "WebRTC uses TCP" → ✅ "WebRTC uses UDP for low latency"

### 2-Minute Elevator Pitch
"I built a production-ready P2P video calling app using WebRTC, React, and Node.js with sub-200ms latency. The architecture uses a Node.js signaling server for WebSocket-based offer/answer/ICE exchange, but actual media flows directly between browsers via UDP. I solved NAT traversal with STUN servers and implemented ICE candidate queuing to handle race conditions. For production, I used PM2 for process management, NGINX for WebSocket upgrades, and enforced HTTPS for getUserMedia security. The biggest challenge was handling various network topologies - I implemented adaptive bitrate control by monitoring WebRTC stats. This project taught me deep fundamentals of real-time communication and network protocols."

---

## 9. IMPROVEMENTS & NEXT STEPS

| Feature | Difficulty | Impact | Timeline |
|---------|-----------|--------|----------|
| Screen Sharing | Easy | High | 1 day |
| Recording (Client) | Easy | Medium | 2 days |
| Noise Suppression | Medium | High | 1 week |
| Group Calls (Mesh) | Medium | Medium | 1 week |
| Background Blur | Hard | Medium | 2 weeks |
| Group Calls (SFU) | Hard | High | 1 month |
| Live Transcription | Hard | High | 2 weeks |

### Group Calls: SFU vs MCU
**SFU (Modern)**: Server forwards packets, no processing, low latency (Google Meet, Zoom)  
**MCU (Legacy)**: Server composites all streams into one, high CPU, high latency

---

## Key Interview Tips
1. **Show depth, not breadth**: Explain WHY you chose technologies
2. **Use STAR method**: Situation → Task → Action → Result
3. **Anticipate follow-ups**: "How would you debug a failed connection?"
4. **Connect to real products**: "This is similar to how Google Meet..."
5. **Be honest**: "This works for 1:1, but for groups I'd need an SFU"

---

**You're now ready for FAANG-level interviews!** 🚀
