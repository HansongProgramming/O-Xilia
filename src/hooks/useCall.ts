import { useEffect, useState } from "react";

export function useCall() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  async function startCall(channelId: string) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);

    const pc = new RTCPeerConnection();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    setPeerConnection(pc);

  }

  function endCall() {
    peerConnection?.close();
    setPeerConnection(null);
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
  }

  return { startCall, endCall, localStream, remoteStream, peerConnection };
}
