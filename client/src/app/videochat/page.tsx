"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

const VideoChat = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function openMediaDevices(constraints: MediaStreamConstraints) {
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  async function getConnectedDevices(type: string) {
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
      (device) => device.kind == type
    );
    setDevices(devices);
    return devices;
  }

  async function openCamera(
    cameraId: string,
    minWidth: number,
    minHeight: number
  ) {
    const constraints = {
      audio: { echoCancellation: true },
      video: {
        deviceId: cameraId,
        width: minWidth,
        height: minHeight,
      },
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  useEffect(() => {
    (async () => {
      try {
        openMediaDevices({ video: true, audio: true });
        const cameras = await getConnectedDevices("videoinput");
        if (cameras.length > 0) {
          const stream = await openCamera(cameras[0].deviceId, 1280, 720);
          if (videoRef.current) videoRef.current.srcObject = stream;
        }

        navigator.mediaDevices.addEventListener("devicechange", () => {
          getConnectedDevices("videoinput");
        });
      } catch (error) {
        console.error("Something went wrong...", error);
      }
    })();
  }, []);

  const cameras = useMemo(() => {
    return devices.map((camera, index) => (
      <option key={index}>{camera.label || "Unnamed Camera"}</option>
    ));
  }, [devices]);

  return (
    <div>
      <h2>Available Camera Devices</h2>
      {cameras}
      <video
        ref={videoRef}
        width={1280}
        height={720}
        autoPlay
        playsInline
        muted
      />
    </div>
  );
};

export default VideoChat;
