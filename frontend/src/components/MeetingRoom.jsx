import { useEffect, useRef, useState, memo, useCallback } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import { useAI } from "../hooks/useAI";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  ShieldCheck, BrainCircuit, MessageSquare,
  UserCircle, Settings, Sparkles, Scan, Share
} from "lucide-react";
import AILayer from "./AI/AILayer";
import PostCallAnalytics from "./AI/PostCallAnalytics";
import "./MeetingRoom.css";

const VideoItem = memo(({ stream, id, isLocal = false, isVideoOff = false, label = "", aiState }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream || isVideoOff) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    const play = async () => {
      try { if (video.paused) await video.play(); } catch (e) { }
    };
    play();
  }, [stream, isVideoOff]);

  return (
    <div className="video-box" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isVideoOff ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', color: '#fff' }}>
          <UserCircle size={64} opacity={0.3} />
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className={aiState?.isFocused ? "" : "blur-video"}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }}
        />
      )}
      <div className="video-label">
        {isLocal ? <UserCircle size={14} /> : <div className="live-dot" />}
        {label}
        {aiState && <span className="ai-status-small">{aiState.emotion}</span>}
      </div>

      {isLocal && aiState && <AILayer aiState={aiState} />}
    </div>
  );
});

const MeetingRoom = ({ roomId, userName, onLeave }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [theme, setTheme] = useState('dark');

  const { localStream, peers, error, toggleTrack, startScreenShare, stopScreenShare } = useWebRTC(roomId);
  const aiState = useAI(isVerified && aiEnabled);

  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    if (verifying) {
      const timer = setTimeout(() => {
        setVerifying(false);
        setIsVerified(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [verifying]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      setIsScreenSharing(false);
    } else {
      const success = await startScreenShare();
      if (success) setIsScreenSharing(true);
    }
  };

  const handleEndCall = () => {
    setShowAnalytics(true);
  };

  const activePeers = Array.isArray(peers) ? peers : [];

  if (showAnalytics) {
    return <PostCallAnalytics stats={aiState.stats} userName={userName} onBackHome={onLeave} />;
  }

  if (error) return (
    <div className="error-view">
      <div className="verification-card glass-morphism">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={onLeave}>Go Back</button>
      </div>
    </div>
  );

  if (verifying) {
    return (
      <div className="security-overlay">
        <div className="verification-card glass-morphism">
          <div className="face-scan-ring">
            <Scan size={48} className="text-primary" />
            <div className="scanning-bar"></div>
          </div>
          <h2>AI Security Layer</h2>
          <p>Verifying biometric identity for {userName}...</p>
          <div className="security-status">
            <ShieldCheck size={16} /> <span>Secure Connection Established</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-wrapper">
      {/* Theme Toggle */}
      <div className="theme-toggle-wrapper">
        <button onClick={toggleTheme} className="theme-btn" title="Toggle Theme">
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </div>

      <div className="p2p-view">
        <div className="remote-main">
          {activePeers[0] ? (
            <VideoItem stream={activePeers[0].stream} id={activePeers[0].peerID} label="Guest" />
          ) : (
            <div className="waiting-info">
              <Sparkles className="pulse-slow" size={48} />
              <h2>Room: {roomId}</h2>
              <p>Waiting for the guest to join the secure session...</p>
            </div>
          )}
        </div>

        <div className="local-small">
          <VideoItem
            stream={localStream}
            id="local"
            isLocal={true}
            isVideoOff={videoOff}
            label={isScreenSharing ? "Your Screen" : "You"}
            aiState={aiState}
          />
        </div>

        {/* Live Captions Overlay */}
        {captionsEnabled && aiState.captions.length > 0 && (
          <div className="captions-overlay">
            {aiState.captions.map(c => (
              <p key={c.id} className="caption-text">{c.text}</p>
            ))}
          </div>
        )}
      </div>

      <div className="controls-bar">
        <button
          onClick={() => setMuted(toggleTrack("audio"))}
          className={`ctrl-btn ${muted ? "active" : ""}`}
          title="Toggle Mic"
        >
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={() => setVideoOff(toggleTrack("video"))}
          className={`ctrl-btn ${videoOff ? "active" : ""}`}
          title="Toggle Video"
        >
          {videoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button
          onClick={handleScreenShare}
          className={`ctrl-btn ${isScreenSharing ? "active-share" : ""}`}
          title="Share Screen"
        >
          <Share size={20} />
        </button>

        <button onClick={handleEndCall} className="ctrl-btn danger" title="End Call">
          <PhoneOff size={24} />
        </button>

        <div className="ai-toggle-group">
          <button
            className={`ai-btn ${aiEnabled ? "active" : ""}`}
            onClick={() => setAiEnabled(!aiEnabled)}
          >
            <BrainCircuit size={16} /> {aiEnabled ? "AI ON" : "AI OFF"}
          </button>

          <button
            className={`ai-btn ${captionsEnabled ? "active" : ""}`}
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
          >
            <MessageSquare size={16} /> Captions
          </button>

          <button
            className={`ai-btn ${aiState.isAvatarMode ? "active" : ""}`}
            onClick={() => aiState.setIsAvatarMode(!aiState.isAvatarMode)}
          >
            <Sparkles size={16} /> Avatar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;

