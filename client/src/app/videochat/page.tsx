"use client";
import React, { useEffect, useRef, useState } from "react";

const VideoChat = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // To stop previous stream

  async function getConnectedDevices(type: MediaDeviceKind) {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const filtered = allDevices.filter((device) => device.kind === type);
    setDevices(filtered);
    return filtered;
  }

  async function openCamera(cameraId: string, width: number, height: number) {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    const constraints = {
      audio: { echoCancellation: true },
      video: {
        deviceId: { exact: cameraId },
        width,
        height,
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const cams = await getConnectedDevices("videoinput");

        if (cams.length > 0) {
          setSelectedCameraId(cams[0].deviceId); // Default select first cam
        }

        navigator.mediaDevices.addEventListener("devicechange", () => {
          getConnectedDevices("videoinput");
        });
      } catch (err) {
        console.error("Failed to initialize camera", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedCameraId) {
      openCamera(selectedCameraId, 1280, 720);
    }
  }, [selectedCameraId]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Select Camera</h2>
      <form className="space-y-2">
        {devices.map((device) => (
          <label key={device.deviceId} className="block">
            <input
              type="radio"
              name="camera"
              value={device.deviceId}
              checked={selectedCameraId === device.deviceId}
              onChange={() => setSelectedCameraId(device.deviceId)}
              className="mr-2"
            />
            {device.label || "Unnamed Camera"}
          </label>
        ))}
      </form>

      <video
        ref={videoRef}
        width={1280}
        height={720}
        autoPlay
        playsInline
        muted
        className="border rounded"
      />
    </div>
  );
};

export default VideoChat;
