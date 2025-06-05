"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

const VideoChat = () => {
  const [elements, setElements] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement

  async function openMediaDevices(constraints: MediaStreamConstraints) {
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  async function getConnectedDevices(type: string) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === type);
  }

  async function playVideoFromCamera() {
    try {
      const constraints = { video: true, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // const videoElement = document.querySelector("video#localVideo");
      // videoElement.srcObject = stream;
    } catch (error) {
      console.error("Error opening video camera.", error);
    }
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
        width: { min: minWidth },
        height: { min: minHeight },
      },
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  useEffect(() => {
    async function updateCameraList() {
      const cameras = await getConnectedDevices("videoinput");
      setElements(cameras);
      if (cameras && cameras.length > 0) {
        const stream = openCamera(cameras[0].deviceId, 1280, 720);
      }
    }

    const handleDeviceChange = () => {
      updateCameraList();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    (async () => {
      try {
        const stream = await openMediaDevices({ video: true, audio: true });
        console.log("Got mediaStream:", stream);
        await updateCameraList();
      } catch (error) {
        console.error(`Error accessing devices. ${error}`);
      }
    })();

    // Cleanup the event listener on unmount
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, []);

  const cameras = useMemo(() => {
    return elements.map((camera, index) => (
      <div key={index}>{camera.label || "Unnamed Camera"}</div>
    ));
  }, [elements]);

  return (
    <div>
      <h2>Available Camera Devices</h2>
      {cameras}
    </div>
  );
};

export default VideoChat;
