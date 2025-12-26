import { useEffect, useRef, useState } from "react";
import { useCall } from "../hooks/useCall";
import { Icon } from '@iconify/react';
import "../index.css";

interface ChannelPageProps {
  channelId: string;
}

export default function ChannelPage({ channelId }: ChannelPageProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const { startCall, endCall, localStream, remoteStream } = useCall(channelId);

  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div className="channel-page">
      <h2 className="channel-title">Channel: {channelId}</h2>

      <div className="videos">
        <div className="video-wrapper">
          <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
          <span className="label">You</span>
        </div>

        <div className="video-wrapper">
          <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
          <span className="label">Remote</span>
        </div>
      </div>

      <div className="controls">
        {!inCall ? (
          <button className="join" onClick={async () => { await startCall(); setInCall(true); }}>
            Join Call
          </button>
        ) : (
          <button onClick={() => { endCall(); setInCall(false); }}>Leave Call</button>
        )}
      </div>
    </div>
  );
}
