import { useEffect, useRef, useState, memo } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import "./MeetingRoom.css";

const VideoItem = memo(({ stream, id, isLocal = false, isVideoOff = false, label = "" }) => {
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
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161b22', color: '#fff' }}>
          {label.charAt(0)}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }}
        />
      )}
      <div className="video-label">{label}</div>
    </div>
  );
});

const MeetingRoom = ({ roomId, userName, onLeave }) => {
  const { localStream, peers, error, toggleTrack } = useWebRTC(roomId);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const activePeers = Array.isArray(peers) ? peers : [];
  const layout = activePeers.length === 0 ? "waiting" : (activePeers.length === 1 ? "p2p" : "grid");

  if (error) return <div style={{ color: 'white', textAlign: 'center', paddingTop: '50px' }}>{error} <button onClick={onLeave}>Go Back</button></div>;

  return (
    <div className={`meeting-wrapper layout-${layout}`}>

      {layout === "waiting" && (
        <div className="fullscreen-view">
          <VideoItem stream={localStream} id="local" isLocal={true} isVideoOff={videoOff} label="You" />
          <div className="waiting-info">
            <h2>Room: {roomId}</h2>
            <p>Waiting for others...</p>
          </div>
        </div>
      )}

      {layout === "p2p" && activePeers[0] && (
        <div className="p2p-view">
          <div className="remote-main">
            <VideoItem stream={activePeers[0].stream} id={activePeers[0].peerID} label="Guest" />
          </div>
          <div className="local-small">
            <VideoItem stream={localStream} id="local" isLocal={true} isVideoOff={videoOff} label="You" />
          </div>
        </div>
      )}

      {layout === "grid" && (
        <div className="grid-view">
          <div className="video-cell">
            <VideoItem stream={localStream} id="local" isLocal={true} isVideoOff={videoOff} label="You" />
          </div>
          {activePeers.map(p => (
            <div key={p.peerID} className="video-cell">
              <VideoItem stream={p.stream} id={p.peerID} label="Guest" />
            </div>
          ))}
        </div>
      )}

      <div className="controls-bar">
        <button onClick={() => setMuted(toggleTrack("audio"))} className={muted ? "btn-red" : ""}>
          {muted ? "Muted" : "Mic On"}
        </button>
        <button onClick={onLeave} className="btn-red end-btn">End Call</button>
        <button onClick={() => setVideoOff(toggleTrack("video"))} className={videoOff ? "btn-red" : ""}>
          {videoOff ? "Cam Off" : "Cam On"}
        </button>
      </div>

    </div>
  );
};

export default MeetingRoom;
