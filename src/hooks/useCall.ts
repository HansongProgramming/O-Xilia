import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SIGNALING_URL = "http://localhost:3001";

export function useCall(channelId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.ontrack = (event) => setRemoteStream(event.streams[0]);
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice", channelId, event.candidate);
      }
    };

    return pc;
  };

  async function startCall() {
    if (!channelId) {
      console.error("useCall: channelId is missing");
      return;
    }

    console.log("startCall invoked with channelId:", channelId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      const socket = io(SIGNALING_URL);
      socketRef.current = socket;

      socket.on("connect", () => console.log("socket connected", socket.id));

      const pc = createPeerConnection();
      setPeerConnection(pc);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      socket.emit("join", channelId);

      socket.on("peer-joined", async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", channelId, offer);
      });

      socket.on("offer", async (offer) => {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", channelId, answer);
      });

      socket.on("answer", async (answer) => await pc.setRemoteDescription(answer));

      socket.on("ice", async (candidate) => {
        try {
          await pc.addIceCandidate(candidate);
        } catch (e) {
          console.warn("ICE error", e);
        }
      });

    } catch (error) {
      console.error("Call start failed:", error);
    }
  }

  function endCall() {
    peerConnection?.close();
    socketRef.current?.disconnect();
    localStream?.getTracks().forEach(t => t.stop());
    setPeerConnection(null);
    setLocalStream(null);
    setRemoteStream(null);
  }

  useEffect(() => {
    return () => endCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { startCall, endCall, localStream, remoteStream, peerConnection };
}
