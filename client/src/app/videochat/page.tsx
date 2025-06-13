"use client";

import React, { useEffect, useRef } from "react";
import { socket } from "../../utils";

const VideoChat = () => {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection>(null);

  useEffect(() => {
    const createOffer = async () => {
      console.log(peerConnection);
      if (peerConnection.current) {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        return offer;
      }
    };

    const getUserMedia = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (localRef.current) localRef.current.srcObject = stream;

      const peerConfiguration = {
        iceServers: [
          {
            urls: [
              "stun:stun.google.com:19302",
              "stun:stun1.l.google.com:5349",
            ],
          },
        ],
      };
      peerConnection.current = new RTCPeerConnection(peerConfiguration);

      for (const track of stream.getTracks())
        peerConnection.current.addTrack(track);

      const offer = await createOffer();
      socket.emit("rtc_offer", { offer });
    };

    (async () => {
      await getUserMedia();
    })();
  }, []);

  return (
    <div className="px-4 py-6">
      <h1 className="font-bold text-2xl">video chat</h1>
      <div className="flex gap-x-4 ">
        <div>
          <p>Local video</p>
          <video
            className="rotate-y-180"
            ref={localRef}
            autoPlay
            muted
            playsInline
          />
        </div>
        <div>
          <p>Remote video</p>
          <video ref={remoteRef} autoPlay muted playsInline />
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
