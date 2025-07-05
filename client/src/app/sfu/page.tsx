"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import * as mediasoupClient from "mediasoup-client";
import { RtpCapabilities, Device, IceParameters, IceCandidate, DtlsParameters, Transport } from "mediasoup-client/types";

interface WebRtcTransportParams {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
  error?: string;
}

const socket = io("https://localhost:9000/mediasoup");
const SFU = () => {
  // const [localStream, SetLocalStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [params, setParams] = useState<any>({
    encoding: [
      { rid: "r0", maxBitrate: 100000, scalabilityMode: "S1T3" },
      { rid: "r1", maxBitrate: 300000, scalabilityMode: "S1T3" },
      { rid: "r2", maxBitrate: 900000, scalabilityMode: "S1T3" },
    ],
    codesOptions: {
      videoGoogleStartBitrate: 1000,
    },
  });

  const [device, setDevice] = useState<Device | null>(null);
  const [rtpCapabilities, setRtpCapabilities] = useState<RtpCapabilities | null>(null);
  const [producerTransport, setProducerTransport] = useState<Transport | null>(null);
  const [consumerTransport, setConsumerTransport] = useState<Transport | null>(null);

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
      ...params,
      track,
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    // SetLocalStream(stream);
  };

  const getRtpCapabilities = async () => {
    socket.emit("get_router_rtp_capabilities", (data: { rtpCapabilities: RtpCapabilities }) => {
      console.log(`Router RTP capabilities... ${data.rtpCapabilities}`);
      setRtpCapabilities(data.rtpCapabilities);
    });
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
    socket.emit("create_transport", { sender: true }, ({ params }: { params: WebRtcTransportParams }) => {
      if (params.error) {
        console.log(params.error);
        return;
      }
      console.log("params:", params);

      if (device) {
        const transport = device.createSendTransport(params);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport.on("connect", async ({ dtlsParameters }, callback, errback: any) => {
          try {
            console.log("----------> producer transport has connected");
            socket.emit("transport_connect", {
              transportId: transport.id,
              dtlsParameters: dtlsParameters,
            });

            callback();
          } catch (error) {
            console.log(error);
            errback(error);
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport.on("produce", (parameters, callback, errback: any) => {
          console.log("----------> transport-produce");
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
            errback(error);
          }
        });

        setProducerTransport(transport);
      }
    });
  };

  const connectSendTransportAndProduce = async () => {
    const localProducer = await producerTransport?.produce(params);

    localProducer?.on("trackended", () => {
      console.log("Track ended");
    });

    localProducer?.on("transportclose", () => {
      console.log("Transport close");
    });
  };

  const createRecvTransport = async () => {
    socket.emit("create_transport", { sender: false }, ({ params }: { params: WebRtcTransportParams }) => {
      if (params.error) return;

      const transport = device?.createRecvTransport(params);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport?.on("connect", async ({ dtlsParameters }, callback, errback: any) => {
        try {
          socket.emit("connect_consumer_transport", { dtlsParameters });
          callback();
        } catch (error) {
          console.error(error);
          errback(error);
        }
      });

      if (transport) setConsumerTransport(transport);
    });
  };

  const connectRecvTransportAndConsume = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.emit("consume_media", { rtpCapabilities: device?.rtpCapabilities }, async ({ params }: any) => {
      if (params.error) return;

      const consumer = await consumerTransport?.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters,
      });

      if (consumer) {
        const { track } = consumer;

        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = new MediaStream([track]);
        socket.emit("resume_paused_consumer");
      }
    });
  };

  useEffect(() => {
    if (socket.connected) console.log(socket.id);
  }, []);

  return (
    <div className="p-2">
      <div className="flex gap-x-2">
        <div>
          <p className="text-2xl font-semibold">Local video</p>
          <video ref={localVideoRef} id="localVideo" autoPlay muted className="bg-black w-[360px]" />
        </div>
        <div>
          <p className="text-2xl font-semibold">Remote video</p>
          <video ref={remoteVideoRef} id="remoteVideo" autoPlay className="bg-black w-[360px]" />
        </div>
      </div>

      <div>
        <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2" onClick={getLocalVideo}>
          1. Get local video
        </button>
        <div>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2" onClick={getRtpCapabilities}>
            2. Get RTP capabilities
          </button>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2" onClick={createDevice}>
            3. Create Device
          </button>
        </div>
        <div>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2" onClick={createSendTransport}>
            4. Create send transport
          </button>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2" onClick={connectSendTransportAndProduce}>
            5. Connect send transport and produce
          </button>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2" onClick={createRecvTransport}>
            6. Create Recv transport
          </button>
          <button className="text-black bg-white font-medium mx-2 px-3 py-2 my-2" onClick={connectRecvTransportAndConsume}>
            7. Connect Recv transport & consume
          </button>
        </div>
      </div>
    </div>
  );
};

export default SFU;
