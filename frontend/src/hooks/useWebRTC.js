import { useEffect, useRef, useState, useCallback, memo } from "react";
import { socket } from "../socket";

export const useWebRTC = (roomId) => {
  const [peers, setPeers] = useState([]); // [{ peerID, stream }]
  const [localStream, setLocalStream] = useState(null);
  const [error, setError] = useState(null);

  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // { [socketId]: { pc, icQueue: [] } }

  useEffect(() => {
    let mounted = true;

    const createPC = (targetID, stream) => {
      console.log(`[WebRTC] 🔌 Creating PeerConnection for: ${targetID}`);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" }
        ]
      });

      // Add Tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle ICE
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { target: targetID, candidate: e.candidate });
        }
      };

      // Handle Track
      pc.ontrack = (e) => {
        console.log(`[WebRTC] 🎞️ Track Received from ${targetID}`);
        const incomingStream = e.streams[0];

        if (!mounted) return;

        setPeers(prev => {
          const exists = prev.find(p => p.peerID === targetID);
          if (exists) return prev;
          return [...prev, { peerID: targetID, stream: incomingStream }];
        });
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection ${targetID}: ${pc.connectionState}`);
      };

      return pc;
    };

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

        setLocalStream(stream);
        localStreamRef.current = stream;

        // SIGNALING
        socket.on("all-users", (users) => {
          console.log("[Socket] Current users in room:", users);
          users.forEach(id => {
            if (id === socket.id) return;
            const pc = createPC(id, stream);
            peersRef.current[id] = { pc, icQueue: [] };

            pc.createOffer().then(offer => {
              pc.setLocalDescription(offer);
              socket.emit("offer", { userToCall: id, sdp: offer });
            });
          });
        });

        socket.on("offer", async ({ callerID, sdp }) => {
          console.log("[Socket] Offer from:", callerID);
          const pc = createPC(callerID, stream);
          peersRef.current[callerID] = { pc, icQueue: [] };

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { callerID, sdp: answer });

            // Process queued candidates
            const queue = peersRef.current[callerID].icQueue;
            while (queue.length > 0) {
              const cand = queue.shift();
              pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => { });
            }
          } catch (err) { console.error("Offer Error:", err); }
        });

        socket.on("answer", async ({ id, sdp }) => {
          console.log("[Socket] Answer from:", id);
          const peer = peersRef.current[id];
          if (peer && peer.pc) {
            await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(() => { });
          }
        });

        socket.on("ice-candidate", async ({ callerID, candidate }) => {
          const peer = peersRef.current[callerID];
          if (peer && peer.pc) {
            if (peer.pc.remoteDescription) {
              peer.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
            } else {
              peer.icQueue.push(candidate);
            }
          }
        });

        socket.on("user-disconnected", (id) => {
          console.log("[Socket] User left:", id);
          if (peersRef.current[id]) {
            peersRef.current[id].pc.close();
            delete peersRef.current[id];
            setPeers(prev => prev.filter(p => p.peerID !== id));
          }
        });

        socket.emit("join-room", roomId);

      } catch (err) {
        console.error("WebRTC Error:", err);
        if (mounted) setError("Camera access denied.");
      }
    };

    init();

    return () => {
      mounted = false;
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      Object.keys(peersRef.current).forEach(id => {
        if (peersRef.current[id]?.pc) peersRef.current[id].pc.close();
      });
      socket.off("all-users");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-disconnected");
    };
  }, [roomId]);

  const toggleTrack = useCallback((type) => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const tracks = type === "video" ? stream.getVideoTracks() : stream.getAudioTracks();
    if (tracks && tracks[0]) {
      tracks[0].enabled = !tracks[0].enabled;
      return !tracks[0].enabled;
    }
    return false;
  }, []);

  return { localStream, peers, error, toggleTrack };
};
