import { useEffect, useRef, useState } from "react";
import { useCall } from "../hooks/useCall";
import "../index.css";
import { Icon } from '@iconify/react';

interface ChannelPageProps {
  channelId: string;
}

export default function ChannelPage({ channelId }: ChannelPageProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const { startCall, endCall, localStream, remoteStream } = useCall(channelId);

  const [inCall, setInCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Update local video & setup voice detection
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      setupVoiceDetection(localStream);
    }
  }, [localStream]);

  // Update remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ---------- voice detection ----------
  const setupVoiceDetection = (stream: MediaStream) => {
    if (!stream.getAudioTracks().length) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 512;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const detect = () => {
      analyser.getByteFrequencyData(data);
      const volume = data.reduce((a, b) => a + b, 0) / data.length;

      setIsSpeaking(volume > 18); // Discord-style highlight threshold
      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  // Toggle mic
  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(track => track.enabled = !micEnabled);
    setMicEnabled(!micEnabled);
  };

  // Toggle cam
  const toggleCam = () => {
    localStream?.getVideoTracks().forEach(track => track.enabled = !camEnabled);
    setCamEnabled(!camEnabled);
  };

  return (
    <div className="channel-page">
      <h2 className="channel-title">Channel: {channelId}</h2>

      <div className="videos">
        <div className={`video-wrapper ${isSpeaking ? "speaking" : ""}`}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
          />
          <span className="label">You</span>
        </div>

        <div className="video-wrapper">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
          <span className="label">Remote</span>
        </div>
      </div>

      <div className="controls">
        {!inCall ? (
          <button
            className="join"
            onClick={async () => {
              await startCall();
              setInCall(true);
            }}
          >
            Join Call
          </button>
        ) : (
          <>
            <button onClick={toggleMic} className={micEnabled ? "" : "danger"}>
              <Icon
                icon={micEnabled ? "material-symbols:mic-rounded" : "material-symbols:mic-off-rounded"}
                width="20"
                height="20"
              />
            </button>

            <button onClick={toggleCam} className={camEnabled ? "" : "danger"}>
              <Icon
                icon={camEnabled ? "material-symbols:video-camera-front" : "material-symbols:video-camera-front-off"}
                width="20"
                height="20"
              />
            </button>

            <button
              className="leave"
              onClick={() => {
                endCall();
                setInCall(false);
              }}
            >
              <Icon
                icon={"material-symbols:phone-disabled-rounded"}
                width="20"
                height="20"
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
