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
  const constraints = { video: true, audio: true };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  const devices = await navigator.mediaDevices.enumerateDevices();
  for (const track of stream.getTracks()) {
    track.stop();
  }
  return devices;
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

  const pTransport = device.createSendTransport(producerTransportRes.params);

  pTransport.on("connect", async ({ dtlsParameters }, callback, errorback) => {
    socketRequest("connect_transport", { transportId: pTransport.id, dtlsParameters }).then(callback).catch(errorback);
  });

  pTransport.on("produce", async ({ kind, rtpParameters }, callback, errorback) => {
    try {
      const { producerId } = (await socketRequest("produce", {
        producerTransportId: pTransport.id,
        rtpParameters,
        kind,
      })) as { producerId: string };
      callback({ id: producerId });
    } catch (error) {
      errorback(error as Error);
    }
  });

  pTransport.on("connectionstatechange", (state) => {
    switch (state) {
      case "connecting":
        break;
      case "connected":
        break;
      case "failed":
        pTransport.close();
        break;
      default:
        break;
    }
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

  cTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
    // console.log("connect transport");
    socketRequest("connect_transport", {
      transportId: cTransport.id,
      dtlsParameters,
    })
      .then(callback)
      .catch(errback);
  });

  cTransport.on("connectionstatechange", (state) => {
    switch (state) {
      case "connecting":
        break;
      case "connected":
        break;
      case "failed":
        cTransport.close();
        break;
      default:
        break;
    }
  });

  return { pTransport, cTransport };
};

export const getConsumeStream = async (producerId: string, mediasoupDevice: Device, consumerTransport: Transport) => {
  const { rtpCapabilities } = mediasoupDevice;
  const data = (await socketRequest("consume", {
    consumerTransportId: consumerTransport.id,
    rtpCapabilities,
    producerId,
  })) as consumeParams;

  if (!data) {
    console.log("Failed to consume");
    return;
  }

  const { id, kind, rtpParameters } = data;
  // console.log(consumerTransport.connectionState);

  const consumer = await consumerTransport.consume({
    id,
    producerId,
    kind,
    rtpParameters,
  });
  // console.log("get consume stream");

  console.log("consume tracks", consumer.track);

  // const stream = new MediaStream();
  // stream.addTrack(consumer.track);

  return {
    consumer,
    kind: data.kind,
  };
};
