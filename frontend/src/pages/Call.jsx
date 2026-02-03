const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
});

localStream.getTracks().forEach(track => {
  pc.addTrack(track, localStream);
});

pc.ontrack = (event) => {
  remoteVideoRef.current.srcObject = event.streams[0];
};

pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit("ice-candidate", {
      roomId,
      candidate: event.candidate
    });
  }
};


