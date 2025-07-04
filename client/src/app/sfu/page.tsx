"use client";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://localhost:9000/mediasoup");
const SFU = () => {
  const [localStream, SetLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const [params, setParams] = useState({});

  const getLocalVideo = async () => {
    const constraints = {
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const track = stream.getVideoTracks()[0];
    setParams({
      track,
      ...params,
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    SetLocalStream(stream);
  };

  useEffect(() => {
    if (socket.connected) console.log(socket.id);
  }, []);

  return (
    <div className="p-2">
      <div className="flex gap-x-2">
        <div>
          <p className="text-2xl font-semibold">Local video</p>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="bg-black w-[360px]"
          />
        </div>
        <div>
          <p className="text-2xl font-semibold">Remote video</p>
          <video autoPlay className="bg-black w-[360px]" />
        </div>
      </div>

      <div>
        <button
          className="text-black bg-white font-medium mx-2 px-3 py-2 my-2"
          onClick={getLocalVideo}
        >
          1. Get local video
        </button>
        <div>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2">
            2. Get RTP capabilities
          </button>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2">
            3. Create Device
          </button>
        </div>
        <div>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2">
            4. Create send transport
          </button>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2">
            5. Connect send transport and produce
          </button>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2">
            6. Create Recv transport
          </button>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2">
            7. Create Recv transport & consume
          </button>
        </div>
      </div>
    </div>
  );
};

export default SFU;
