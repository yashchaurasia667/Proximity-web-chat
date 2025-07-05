"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import * as mediasoupClient from "mediasoup-client";
import {
  RtpCapabilities,
  Device,
  IceParameters,
  IceCandidate,
  DtlsParameters,
  Transport,
} from "mediasoup-client/types";

interface WebRtcTransportParams {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
  error?: string;
}

const socket = io("https://localhost:9000/mediasoup");
const SFU = () => {
  const [localStream, SetLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const [params, setParams] = useState({});
  const [rtpCapabilities, setRtpCapabilities] =
    useState<RtpCapabilities | null>(null);
  const [device, setDevice] = useState<Device | null>(null);

  const [producerTransport, setProducerTransport] = useState<Transport | null>(
    null
  );

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

  const getRtpCapabilities = async () => {
    socket.emit(
      "getRtpCapabilities",
      (data: { rtpCapabilities: RtpCapabilities }) => {
        console.log(`Router RTP capabilities... ${data.rtpCapabilities}`);
        setRtpCapabilities(data.rtpCapabilities);
      }
    );
  };

  const createDevice = async () => {
    try {
      const dev = new mediasoupClient.Device();

      if (rtpCapabilities) {
        await dev.load({
          routerRtpCapabilities: rtpCapabilities,
        });
        setDevice(dev);

        console.log("RTP capabilities ", rtpCapabilities);
      }
    } catch (error) {
      console.error(error);
      // if (error.name === "UnsupportedError")
      //   console.log("Browser not supported");
    }
  };

  const createSendTransport = async () => {
    socket.emit(
      "createWebRtcTransport",
      { sender: true },
      ({ params }: { params: WebRtcTransportParams }) => {
        if (params.error) {
          console.log(params.error);
          return;
        }
        console.log("params:", params);
        if (device) {
          const transport = device.createSendTransport(params);
          transport.on("connect", async ({ dtlsParameters }, callback) => {
            try {
              socket.emit("transport-connect", {
                transportId: transport.id,
                dtlsParameters: dtlsParameters,
              });

              callback();
            } catch (error) {
              console.log(error);
            }
          });

          transport.on("produce", (parameters, callback) => {
            console.log(parameters);
            try {
              socket.emit(
                "transport-produce",
                {
                  transportId: transport.id,
                  kind: parameters.kind,
                  rtpParameters: parameters.rtpParameters,
                  appData: parameters.appData,
                },
                ({ id }: { id: string }) => {
                  callback({ id });
                }
              );
            } catch (error) {
              console.log(error);
            }
          });
          setProducerTransport(transport);
        }
      }
    );
  };

  const connectSendTransportAndProduce = async () => {
    const producer = producerTransport?.produce(params);
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
          <button
            className="text-black bg-white font-medium mx-2 px-3 py-2 my-2"
            onClick={getRtpCapabilities}
          >
            2. Get RTP capabilities
          </button>
          <button
            className="text-black bg-white font-medium mx-2 px-3 py-2 my-2"
            onClick={createDevice}
          >
            3. Create Device
          </button>
        </div>
        <div>
          <button
            className="text-black bg-white font-medium mx-2 px-3 py-2 my-2"
            onClick={createSendTransport}
          >
            4. Create send transport
          </button>
          <button
            className="text-black bg-white font-medium mx-2 px-3 py-2 my-2"
            onClick={connectSendTransportAndProduce}
          >
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
