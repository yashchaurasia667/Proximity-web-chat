// import { Device, MediaKind } from "mediasoup-client/types";
import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import { DtlsParameters, IceCandidate, IceParameters, RtpCapabilities } from "mediasoup-client/types";

export type deviceParams = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
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
  const producerTransportRes = (await socketRequest("create_webrtc_transport")) as { params: deviceParams; error?: unknown };
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
      const { producerId } = (await socketRequest("produce", { producerTransportId: pTransport.id, rtpParameters, kind })) as { producerId: string };
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
  const { params, error } = (await socketRequest("create_webrtc_transport")) as { params: deviceParams; error?: unknown };
  if (error) {
    console.error(error);
    return;
  }

  const cTransport = device.createRecvTransport(params);

  cTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
    socketRequest("connectTransport", {
      transport_id: cTransport.id,
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

export const removeConsumer = () => {};

// export const mediaTypes = {
//   audio: "audioType",
// };

// export const produce = async (type, deviceId: string, device: Device) => {
//   let mediaConstraints = {};
//   let audio = false;
//   let video = false;
//   let screen = false;

//   switch (type) {
//     case "audioType":
//       mediaConstraints = {
//         audio: {
//           deviceId,
//         },
//         video: false,
//       };
//       audio = true;
//       break;
//     case "videoType":
//       mediaConstraints = {
//         video: {
//           deviceId,
//         },
//         audio: false,
//       };
//       video = true;
//       break;
//     case "screenType":
//       mediaConstraints = false;
//       screen = true;
//       break;
//     default:
//       return;
//   }
// };
