"use client";

import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../utils";

const VideoChat = () => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [didIOffer, setDidIOffer] = useState(false);

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);

  // let didIoffer = false;

  async function fetchMediaDevices() {
    return navigator.mediaDevices.getUserMedia({
      video: true,
      // audio: { echoCancellation: true, noiseSuppression: true },
    });
  }
  async function getConnectedDevices(type: MediaDeviceKind) {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const filtered = allDevices.filter((device) => device.kind === type);
    return filtered;
  }

  const createPeerConnection = async (
    offerObj?: RTCLocalSessionDescriptionInit
  ) => {
    const peerConfig = {
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:5349",
          ],
        },
      ],
    };

    setPeerConnection(new RTCPeerConnection(peerConfig));
    setRemoteStream(new MediaStream());
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

    if (localStream) {
      for (const track of localStream.getTracks())
        peerConnection?.addTrack(track, localStream);
    }

    peerConnection?.addEventListener("icecandidate", (e) => {
      console.log("..........ICE candidate found.............");
      console.log(e);

      if (e.candidate) {
        // socket.emit("send_ice_candidate_to_signaling_server", {
        socket.emit("rtc_ice_candidate", {
          ICE: e.candidate,
          username: socket.id,
          didIOffer,
        });
      }
    });

    peerConnection?.addEventListener("track", (e) => {
      console.log("Got a track from the other peer!! How excting");
      console.log(e);
      
      for (const tracks of e.streams[0].getTracks())
        remoteStream?.addTrack(tracks);
    });

    if (offerObj) await peerConnection?.setLocalDescription(offerObj);
  };

  useEffect(() => {
    (async () => {
      try {
        const stream = await fetchMediaDevices();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          setLocalStream(stream);
        }

        await createPeerConnection();
        // socket.emit("rtc_offer", {
        //   targetId: socket.id,
        //   offer: "hello this is an offer",
        // });

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
