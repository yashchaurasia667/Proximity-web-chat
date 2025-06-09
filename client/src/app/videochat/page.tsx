"use client";

import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../utils";

const VideoChat = () => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);

  // let didIoffer = false;

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

  const createPeerConnection = async (
    offerObj?: RTCLocalSessionDescriptionInit
  ) => {
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
    setPeerConnection(new RTCPeerConnection(peerConfiguration));
    setRemoteStream(new MediaStream());
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

    if (localStream) {
      for (const track of localStream.getTracks())
        peerConnection?.addTrack(track, localStream);
    }

    peerConnection?.addEventListener("signalingstatechange", (e) => {
      console.log(e);
      // console.log(peerConfiguration.);
    });

    peerConnection?.addEventListener("icecandidate", (e) => {
      console.log("..........ICE candidate found.............");
      console.log(e);
      if (e.candidate) {
        socket.emit("send_ice_candidate_to_signaling_server", {
          iceCandidate: e.candidate,
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

  const addNewIceCandidate = (iceCandidate: RTCIceCandidate) => {
    peerConnection?.addIceCandidate(iceCandidate);
    console.log("======Added Ice Candidate======");
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
