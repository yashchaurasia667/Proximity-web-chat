"use client";

import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../utils";

const VideoChat = () => {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection>(null);
  const [remoteOffer, setRemoteOffer] =
    useState<RTCSessionDescriptionInit | null>(null);

  useEffect(() => {
    const handleOffer = (offers: RTCSessionDescriptionInit) => {
      if (offers !== null) setRemoteOffer(offers);
    };

    socket.on("offers", handleOffer);

    return () => {
      socket.off("offers", handleOffer);
    };
  }, []);

  useEffect(() => {
    socket.on("rtc_answer", async ({ answer }) => {
      console.log("Received RTC answer");
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    return () => {
      socket.off("rtc_answer");
    };
  }, []);

  useEffect(() => {
    const createOffer = async () => {
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

      if (remoteOffer) {
        console.log("Remote offer present. Answering...");

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(remoteOffer)
        );

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit("rtc_answer", {
          answer,
        });
      } else {
        console.log("No remote offer. Creating and sending one.");
        const offer = await createOffer();
        socket.emit("rtc_offer", { offer });
      }
    };

    getUserMedia();
  }, [remoteOffer]);

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
          <video
            className="rotate-y-180"
            ref={remoteRef}
            autoPlay
            muted
            playsInline
          />
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
