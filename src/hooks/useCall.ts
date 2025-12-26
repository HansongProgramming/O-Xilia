import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SIGNALING_URL = "http://localhost:3001";

export function useCall(channelId?: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // ---------- helpers ----------
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && channelId) {
        socketRef.current.emit("ice", channelId, event.candidate);
      }
    };

    return pc;
  };

  // ---------- start call ----------
  async function startCall() {
    if (!channelId) return;

    try {
      // 1. get media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);

      // 2. connect signaling
      const socket = io(SIGNALING_URL);
      socketRef.current = socket;

      // 3. create pc
      const pc = createPeerConnection();
      setPeerConnection(pc);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 4. signaling events
      socket.emit("join", channelId);

      socket.on("peer-joined", async () => {
        // create offer
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

      socket.on("answer", async (answer) => {
        await pc.setRemoteDescription(answer);
      });

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

  // ---------- end call ----------
  function endCall() {
    peerConnection?.close();
    socketRef.current?.disconnect();

    localStream?.getTracks().forEach(t => t.stop());

    setPeerConnection(null);
    setLocalStream(null);
    setRemoteStream(null);
  }

  // ---------- cleanup ----------
  useEffect(() => {
    return () => {
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    startCall,
    endCall,
    localStream,
    remoteStream,
    peerConnection
  };
}
