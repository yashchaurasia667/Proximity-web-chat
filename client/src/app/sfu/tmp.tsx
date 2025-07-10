"use client";

import { Device } from "mediasoup-client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDevices } from "./helper";
import * as mediasoupClient from "mediasoup-client";

const TMP = () => {
  const [localVideoDevices, setLocalVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [localAudioDevices, setLocalAudioDevices] = useState<MediaDeviceInfo[]>([]);

  const [mediasoupDevice, setMediasoupDevice] = useState<Device | null>(null);

  const [localMedia, setLocalMedia] = useState<MediaStream[]>([]);

  const videoSelectRef = useRef<HTMLSelectElement | null>(null);
  const audioSelectRef = useRef<HTMLSelectElement | null>(null);

  const localMediaEl = useMemo(() => {
    return localMedia.map((stream, index) => (
      <video
        key={index}
        autoPlay
        playsInline
        muted
        ref={(video) => {
          if (video) video.srcObject = stream;
        }}
      />
    ));
  }, [localMedia]);

  const videoOptions = useMemo(() => {
    return localVideoDevices.map((device, index) => (
      <option key={index} value={device.deviceId}>
        {device.label}
      </option>
    ));
  }, [localVideoDevices]);

  const audioOptions = useMemo(() => {
    return localAudioDevices.map((device, index) => (
      <option key={index} value={device.deviceId}>
        {device.label}
      </option>
    ));
  }, [localAudioDevices]);

  const getLocalDevices = async () => {
    const devices = await getDevices();

    const audio = [];
    const video = [];
    for (const device of devices) {
      if (device.kind === "audioinput") audio.push(device);
      else if (device.kind === "videoinput") video.push(device);
    }
    setLocalAudioDevices(audio);
    setLocalVideoDevices(video);
  };

  const createDevice = async () => {
    const rtpCapabilities = socket.emit("get_router_rtp_capabilities", async ({ rtpCapabilities, error }: { rtpCapabilities: RtpCapabilities; error: unknown }) => {
      if (error) {
        console.error("Failed to get router RTP capabilities");
        return;
      }

      try {
        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });
        setMediasoupDevice(device);
        // return device;
      } catch (error) {
        console.error(error);
        return;
      }
    });
  };

  const initTransports = async () => {
    // INIT PRODUCER TRANSPORT
    {
      socket.emit("create_webrtc_transport", ({ params, error }: { params: deviceParams; error: unknown }) => {
        if (error) {
          console.error(error);
          return;
        }

        if (mediasoupDevice) {
          const producerTransport = mediasoupDevice.createSendTransport(params);

          producerTransport.on("connect", async ({ dtlsParameters }, callback) => {
            socket.emit("connect_transport", { transportId: producerTransport.id, dtlsParameters }, callback);
          });

          producerTransport.on("produce", async ({ kind, rtpParameters }, callback, errorback) => {
            try {
              socket.emit("produce", { producerTransportId: producerTransport.id, rtpParameters, kind }, ({ producerId }: { producerId: string }) => {
                callback({ id: producerId });
              });
            } catch (error) {
              errorback(error as Error);
            }
          });

          producerTransport.on("connectionstatechange", (state) => {
            switch (state) {
              case "connecting":
                break;
              case "connected":
                break;
              case "failed":
                producerTransport.close();
                break;
              default:
                break;
            }
          });
        }
      });
    }

    // // INIT CONSUMER TRANSPORT
    {
      socket.emit("create_webrtc_transport", ({ params, error }: { params: deviceParams; error: unknown }) => {
        if (error) {
          console.error(error);
          return;
        }

        if (mediasoupDevice) {
          const consumerTransport = mediasoupDevice.createRecvTransport(params);

          consumerTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
            try {
              socket.emit("connect_transport", { transportId: consumerTransport.id, dtlsParameters }, callback);
            } catch (error) {
              errback(error as Error);
            }
          });

          consumerTransport.on("connectionstatechange", (state) => {
            switch (state) {
              case "connecting":
                break;
              case "connected":
                break;
              case "failed":
                consumerTransport.close();
                break;
              default:
                break;
            }
          });
        }
      });
    }
  };

  useEffect(() => {
    socket.on("consumer_closed", ({ consumerId }) => {});
  }, []);

  // RUN ON JOIN
  useEffect(() => {
    getLocalDevices();
    createDevice();
    initTransports();
  }, []);

  return <div></div>;
};

export default TMP;
