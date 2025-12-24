import React, { useEffect, useRef, useState } from "react";

import { useCall } from "../hooks/useCall";

interface ChannelPageProps {
  channelId: string;
}

export default function ChannelPage({ channelId }: ChannelPageProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const { startCall, endCall, localStream, remoteStream } = useCall();

  const [inCall, setInCall] = useState(false);  

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="channel-page">
      <h2>Channel: {channelId}</h2>
      <div className="videos">
        <video ref={localVideoRef} autoPlay muted className="local-video" />
        <video ref={remoteVideoRef} autoPlay className="remote-video" />
      </div>
      <div className="controls">
        {!inCall ? (
          <button
            onClick={async () => {
              await startCall(channelId);
              setInCall(true);
            }}
          >
            Join Call
          </button>
        ) : (
          <button
            onClick={() => {
              endCall();
              setInCall(false);
            }}
          >
            Leave Call
          </button>
        )}
      </div>
    </div>
  );
}
