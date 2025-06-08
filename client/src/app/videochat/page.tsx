"use client";

import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../utils";

const VideoChat = () => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  let didIoffer = false;

  async function getConnectedDevices(type: MediaDeviceKind) {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const filtered = allDevices.filter((device) => device.kind === type);
    return filtered;
  }

  async function openCamera(cameraId?: string) {
    const constraints = {
      // audio: { echoCancellation: true },
      video: {
        deviceId: { exact: cameraId },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // if (localVideoRef.current) {
    //   localVideoRef.current.srcObject = stream;
    // }
    return stream;
  }

  const createPeerConnection = async (offerObj) => {
    const peerConfiguration = {
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
          ],
        },
      ],
    };
    const peerConnection = new RTCPeerConnection(peerConfiguration);
    const remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (localStream) {
      for (const track of localStream.getTracks())
        peerConnection.addTrack(track, localStream);
    }

    peerConnection.addEventListener("signalingstatechange", (e) => {
      console.log(e);
      // console.log(peerConfiguration.);
    });

    peerConnection.addEventListener("icecandidate", (e) => {
      console.log("..........ICE candidate found.............");
      console.log(e);
      if (e.candidate) {
        socket.emit("send_ice_candidate_to_signaling_server", {
          iceCandidate: e.candidate,
        });
      }
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const stream = await openCamera();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          setLocalStream(stream);
        }

        await createPeerConnection();

        navigator.mediaDevices.addEventListener("devicechange", () => {
          getConnectedDevices("videoinput");
        });
      } catch (err) {
        console.error("Failed to initialize camera", err);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-x-4">
        {/* local stream */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          className="border rounded"
        />
        {/* remote stream */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="border rounded"
        />
      </div>
    </div>
  );
};

export default VideoChat;
