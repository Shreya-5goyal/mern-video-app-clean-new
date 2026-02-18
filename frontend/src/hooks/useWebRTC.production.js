import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "../socket";

// ============================================
// PRODUCTION-READY WEBRTC HOOK
// ============================================

const STUN_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
];

// Add TURN servers from environment (production)
const getTurnServers = () => {
    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnPassword = import.meta.env.VITE_TURN_PASSWORD;

    if (turnUrl && turnUsername && turnPassword) {
        return [
            {
                urls: turnUrl,
                username: turnUsername,
                credential: turnPassword,
            },
        ];
    }
    return [];
};

const ICE_SERVERS = [...STUN_SERVERS, ...getTurnServers()];

// ============================================
// WEBRTC CONFIGURATION
// ============================================
const PC_CONFIG = {
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
};

// Media constraints for optimal quality
const MEDIA_CONSTRAINTS = {
    video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: "user",
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
    },
};

// ============================================
// WEBRTC STATS MONITORING
// ============================================
class WebRTCStats {
    constructor(pc, peerID) {
        this.pc = pc;
        this.peerID = peerID;
        this.statsInterval = null;
    }

    start() {
        this.statsInterval = setInterval(async () => {
            try {
                const stats = await this.pc.getStats();
                let packetsLost = 0;
                let packetsReceived = 0;
                let bytesReceived = 0;

                stats.forEach((report) => {
                    if (report.type === "inbound-rtp" && report.kind === "video") {
                        packetsLost = report.packetsLost || 0;
                        packetsReceived = report.packetsReceived || 0;
                        bytesReceived = report.bytesReceived || 0;
                    }
                });

                const packetLossRate = packetsReceived > 0 ? (packetsLost / packetsReceived) * 100 : 0;

                if (packetLossRate > 5) {
                    console.warn(`[WebRTC Stats] High packet loss: ${packetLossRate.toFixed(2)}% for peer ${this.peerID}`);
                }
            } catch (err) {
                console.error("[WebRTC Stats] Error getting stats:", err);
            }
        }, 5000); // Check every 5 seconds
    }

    stop() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
    }
}

// ============================================
// MAIN WEBRTC HOOK
// ============================================
export const useWebRTC = (roomId) => {
    const [peers, setPeers] = useState([]);
    const [localStream, setLocalStream] = useState(null);
    const [error, setError] = useState(null);
    const [connectionState, setConnectionState] = useState("new"); // new, connecting, connected, failed

    const localStreamRef = useRef(null);
    const peersRef = useRef({}); // { [socketId]: { pc, icQueue: [], stats: WebRTCStats } }
    const reconnectAttempts = useRef({});
    const maxReconnectAttempts = 3;

    // ============================================
    // CREATE PEER CONNECTION
    // ============================================
    const createPC = useCallback((targetID, stream) => {
        console.log(`[WebRTC] 🔌 Creating PeerConnection for: ${targetID}`);

        const pc = new RTCPeerConnection(PC_CONFIG);

        // Add local tracks
        stream.getTracks().forEach((track) => {
            const sender = pc.addTrack(track, stream);
            console.log(`[WebRTC] Added ${track.kind} track to peer ${targetID}`);
        });

        // ICE candidate handling
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("ice-candidate", {
                    target: targetID,
                    candidate: e.candidate,
                });
                console.log(`[WebRTC] 🧊 ICE candidate sent to ${targetID}`);
            } else {
                console.log(`[WebRTC] 🧊 ICE gathering complete for ${targetID}`);
            }
        };

        // Track handling
        pc.ontrack = (e) => {
            console.log(`[WebRTC] 🎞️ Track received from ${targetID}:`, e.track.kind);
            const incomingStream = e.streams[0];

            setPeers((prev) => {
                const exists = prev.find((p) => p.peerID === targetID);
                if (exists) {
                    // Update existing peer stream
                    return prev.map((p) =>
                        p.peerID === targetID ? { ...p, stream: incomingStream } : p
                    );
                }
                return [...prev, { peerID: targetID, stream: incomingStream }];
            });
        };

        // Connection state monitoring
        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log(`[WebRTC] Connection ${targetID}: ${state}`);
            setConnectionState(state);

            if (state === "failed") {
                handleConnectionFailure(targetID, stream);
            } else if (state === "connected") {
                reconnectAttempts.current[targetID] = 0;
                console.log(`[WebRTC] ✅ Successfully connected to ${targetID}`);
            }
        };

        // ICE connection state
        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE state ${targetID}: ${pc.iceConnectionState}`);

            if (pc.iceConnectionState === "disconnected") {
                console.warn(`[WebRTC] ⚠️ ICE disconnected for ${targetID}, attempting restart...`);
                pc.restartIce();
            }
        };

        // Negotiation needed
        pc.onnegotiationneeded = async () => {
            console.log(`[WebRTC] Negotiation needed for ${targetID}`);
        };

        // Start stats monitoring
        const stats = new WebRTCStats(pc, targetID);
        stats.start();

        return { pc, stats };
    }, []);

    // ============================================
    // HANDLE CONNECTION FAILURE
    // ============================================
    const handleConnectionFailure = useCallback((targetID, stream) => {
        const attempts = reconnectAttempts.current[targetID] || 0;

        if (attempts < maxReconnectAttempts) {
            console.log(`[WebRTC] 🔄 Reconnection attempt ${attempts + 1}/${maxReconnectAttempts} for ${targetID}`);
            reconnectAttempts.current[targetID] = attempts + 1;

            // Close old connection
            if (peersRef.current[targetID]) {
                peersRef.current[targetID].pc.close();
                peersRef.current[targetID].stats.stop();
            }

            // Create new connection
            setTimeout(() => {
                const { pc, stats } = createPC(targetID, stream);
                peersRef.current[targetID] = { pc, icQueue: [], stats };

                // Create new offer
                pc.createOffer()
                    .then((offer) => pc.setLocalDescription(offer))
                    .then(() => {
                        socket.emit("offer", {
                            userToCall: targetID,
                            sdp: pc.localDescription,
                        });
                    })
                    .catch((err) => console.error("[WebRTC] Reconnection offer error:", err));
            }, 2000); // Wait 2 seconds before reconnecting
        } else {
            console.error(`[WebRTC] ❌ Max reconnection attempts reached for ${targetID}`);
            setError(`Failed to connect to peer after ${maxReconnectAttempts} attempts`);
        }
    }, [createPC]);

    // ============================================
    // MAIN EFFECT
    // ============================================
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                // Get user media
                console.log("[WebRTC] Requesting user media...");
                const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);

                if (!mounted) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                console.log("[WebRTC] ✅ User media acquired");
                setLocalStream(stream);
                localStreamRef.current = stream;

                // ============================================
                // SOCKET EVENT HANDLERS
                // ============================================

                // All users in room
                socket.on("all-users", (users) => {
                    console.log("[Socket] Current users in room:", users);
                    users.forEach((id) => {
                        if (id === socket.id) return;

                        const { pc, stats } = createPC(id, stream);
                        peersRef.current[id] = { pc, icQueue: [], stats };

                        pc.createOffer()
                            .then((offer) => pc.setLocalDescription(offer))
                            .then(() => {
                                socket.emit("offer", { userToCall: id, sdp: pc.localDescription });
                            })
                            .catch((err) => console.error("[WebRTC] Offer error:", err));
                    });
                });

                // Offer received
                socket.on("offer", async ({ callerID, sdp }) => {
                    console.log("[Socket] 📨 Offer from:", callerID);

                    const { pc, stats } = createPC(callerID, stream);
                    peersRef.current[callerID] = { pc, icQueue: [], stats };

                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit("answer", { callerID, sdp: answer });

                        // Process queued ICE candidates
                        const queue = peersRef.current[callerID].icQueue;
                        while (queue.length > 0) {
                            const cand = queue.shift();
                            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
                        }
                    } catch (err) {
                        console.error("[WebRTC] Offer handling error:", err);
                    }
                });

                // Answer received
                socket.on("answer", async ({ id, sdp }) => {
                    console.log("[Socket] 📨 Answer from:", id);
                    const peer = peersRef.current[id];
                    if (peer?.pc) {
                        try {
                            await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
                        } catch (err) {
                            console.error("[WebRTC] Answer handling error:", err);
                        }
                    }
                });

                // ICE candidate received
                socket.on("ice-candidate", async ({ callerID, candidate }) => {
                    const peer = peersRef.current[callerID];
                    if (peer?.pc) {
                        if (peer.pc.remoteDescription) {
                            try {
                                await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
                            } catch (err) {
                                console.error("[WebRTC] ICE candidate error:", err);
                            }
                        } else {
                            // Queue candidate if remote description not set yet
                            peer.icQueue.push(candidate);
                        }
                    }
                });

                // User disconnected
                socket.on("user-disconnected", (id) => {
                    console.log("[Socket] 👋 User left:", id);
                    if (peersRef.current[id]) {
                        peersRef.current[id].pc.close();
                        peersRef.current[id].stats.stop();
                        delete peersRef.current[id];
                        setPeers((prev) => prev.filter((p) => p.peerID !== id));
                    }
                });

                // Error handling
                socket.on("error", ({ message }) => {
                    console.error("[Socket] Error:", message);
                    setError(message);
                });

                // Join room
                socket.emit("join-room", roomId);
            } catch (err) {
                console.error("[WebRTC] Initialization error:", err);
                if (mounted) {
                    if (err.name === "NotAllowedError") {
                        setError("Camera/microphone access denied. Please allow permissions.");
                    } else if (err.name === "NotFoundError") {
                        setError("No camera or microphone found.");
                    } else {
                        setError("Failed to access camera/microphone.");
                    }
                }
            }
        };

        init();

        // ============================================
        // CLEANUP
        // ============================================
        return () => {
            mounted = false;

            // Stop local stream
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => {
                    t.stop();
                    console.log(`[WebRTC] Stopped ${t.kind} track`);
                });
            }

            // Close all peer connections
            Object.keys(peersRef.current).forEach((id) => {
                if (peersRef.current[id]?.pc) {
                    peersRef.current[id].pc.close();
                    peersRef.current[id].stats.stop();
                }
            });

            // Remove socket listeners
            socket.off("all-users");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user-disconnected");
            socket.off("error");

            console.log("[WebRTC] Cleanup complete");
        };
    }, [roomId, createPC]);

    // ============================================
    // TOGGLE TRACK (MUTE/UNMUTE)
    // ============================================
    const toggleTrack = useCallback((type) => {
        const stream = localStreamRef.current;
        if (!stream) return false;

        const tracks = type === "video" ? stream.getVideoTracks() : stream.getAudioTracks();
        if (tracks && tracks[0]) {
            tracks[0].enabled = !tracks[0].enabled;
            console.log(`[WebRTC] ${type} ${tracks[0].enabled ? "enabled" : "disabled"}`);
            return !tracks[0].enabled; // Return muted state
        }
        return false;
    }, []);

    // ============================================
    // ADAPTIVE BITRATE (PRODUCTION OPTIMIZATION)
    // ============================================
    const adjustBitrate = useCallback((bitrate) => {
        Object.values(peersRef.current).forEach(({ pc }) => {
            const senders = pc.getSenders();
            senders.forEach((sender) => {
                if (sender.track?.kind === "video") {
                    const params = sender.getParameters();
                    if (!params.encodings) params.encodings = [{}];
                    params.encodings[0].maxBitrate = bitrate;
                    sender.setParameters(params).catch(console.error);
                }
            });
        });
        console.log(`[WebRTC] Bitrate adjusted to ${bitrate}bps`);
    }, []);

    return {
        localStream,
        peers,
        error,
        connectionState,
        toggleTrack,
        adjustBitrate,
    };
};
