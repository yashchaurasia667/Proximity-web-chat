// import { Device, MediaKind } from "mediasoup-client/types";
import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import {
  DtlsParameters,
  IceCandidate,
  IceParameters,
  MediaKind,
  RtpCapabilities,
  RtpParameters,
  Device,
  Transport,
} from "mediasoup-client/types";

export type deviceParams = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
};

export type consumeParams = {
  producerId: string;
  id: string;
  rtpParameters: RtpParameters;
  kind: MediaKind;
  type: "simple" | "simulcast" | "svc" | "pipe";
  producerPaused: boolean;
};

export const socket = io("https://localhost:9000/mediasoup");

export const copyURL = () => {
  navigator.clipboard.writeText(window.location.href);
};

export const socketRequest = (type: string, data = {}) => {
  return new Promise((resolve, reject) => {
    socket.emit(type, data, (data: { error?: unknown }) => {
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data);
      }
    });
  });
};

export const getDevices = async () => {
  // 1. Check if navigator.mediaDevices exists
  if (!navigator.mediaDevices) {
    console.error("navigator.mediaDevices is not available");
    return [];
  }

  const constraints = { video: true, audio: true };
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    const devices = await navigator.mediaDevices.enumerateDevices();

    for (const track of stream.getTracks()) {
      track.stop();
    }

    return devices;
  } catch (error) {
    console.error("Error accessing media devices:", error);
    return [];
  } finally {
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
  }
};

export const createMediasoupDevice = async (routerRtpCapabilities: RtpCapabilities) => {
  try {
    const dev = new mediasoupClient.Device();
    await dev.load({ routerRtpCapabilities });
    return dev;
  } catch (error) {
    console.error(error);
  }
};

export const initTransport = async (device: mediasoupClient.Device) => {
  // INIT PRODUCER TRANSPORT
  const producerTransportRes = (await socketRequest("create_webrtc_transport")) as {
    params: deviceParams;
    error?: unknown;
  };
  if (producerTransportRes.error) {
    console.error(producerTransportRes.error);
    return;
  }

  console.log("send transport params", producerTransportRes.params);
  const { id, iceCandidates, iceParameters, dtlsParameters } = producerTransportRes.params;

  const pTransport = device.createSendTransport({
    id,
    iceCandidates,
    iceParameters,
    dtlsParameters,
  });

  pTransport.on("connect", async ({ dtlsParameters }, callback, errorback) => {
    console.log("produce connect");
    try {
      await socketRequest("connect_transport", { transportId: pTransport.id, dtlsParameters });
      callback();
    } catch (error) {
      console.log(error);
      errorback(error as Error);
    }
  });

  pTransport.on("produce", async ({ kind, rtpParameters }, callback, errorback) => {
    try {
      console.log("transport is producing");
      const { producerId } = (await socketRequest("produce", {
        producerTransportId: pTransport.id,
        rtpParameters,
        kind,
      })) as { producerId: string };

      console.log("producer id", producerId);
      callback({ id: producerId });
    } catch (error) {
      console.log(error);
      errorback(error as Error);
    }
  });

  pTransport.on("connectionstatechange", (state) => {
    console.log("Producer transport connection state:", state);
  });

  // INIT CONSUMER TRANSPORT
  const { params, error } = (await socketRequest("create_webrtc_transport")) as {
    params: deviceParams;
    error?: unknown;
  };
  if (error) {
    console.error(error);
    return;
  }

  const cTransport = device.createRecvTransport(params);

  cTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    console.log("consumer connect");
    try {
      const data = await socketRequest("connect_transport", {
        transportId: cTransport.id,
        dtlsParameters,
      });
      console.log(data);
      callback();
    } catch (error) {
      errback(error as Error);
    }
  });

  cTransport.on("connectionstatechange", (state) => {
    console.log("consumer state changed:", state);
  });

  return { pTransport, cTransport };
};

export const getConsumeStream = async (producerId: string, mediasoupDevice: Device, consumerTransport: Transport) => {
  return new Promise(async (resolve, reject) => {
    const { rtpCapabilities } = mediasoupDevice;
    const data = (await socketRequest("consume", {
      consumerTransportId: consumerTransport.id,
      rtpCapabilities,
      producerId,
    })) as consumeParams;

    if (!data) {
      console.log("Failed to consume");
      reject();
    }
    const { id, kind, rtpParameters } = data;
    // console.log(consumerTransport.connectionState);

    const handleConnection = async (state: string) => {
      if (state === "connected") {
        console.log("Transport connected, now consuming.");
        const consumer = await consumerTransport.consume({
          id,
          producerId,
          kind,
          rtpParameters,
        });

        consumerTransport.removeListener("connectionstatechange", handleConnection);

        resolve({ consumer, kind: data.kind });
      } else if (state === "failed") {
        consumerTransport.removeListener("connectionstatechange", handleConnection);

        reject(new Error("Transport connection failed."));
      }
    };

    consumerTransport.on("connectionstatechange", handleConnection);
  });
};
