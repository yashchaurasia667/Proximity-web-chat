import { io } from "../global.d.js";
import config from "../mediasoup-config.js";

import * as mediasoup from "mediasoup";
import { Router, WebRtcTransport, Worker } from "mediasoup/types";

const peers = io.of("/mediasoup");
let worker: Worker;
let router: Router;
let producerTransport: WebRtcTransport;
let consumerTransport: WebRtcTransport;

const createWorker = async () => {
  const worker = await mediasoup.createWorker();
  console.log(`worker pid: ${worker.pid}`);

  worker.on("died", (error) => {
    console.log(
      "mediasoup worker has died, the process will exit in 2 seconds...",
      error
    );

    setTimeout(() => {
      process.exit(1);
    }, 2000);
  });

  return worker;
};

const createWebRtcTransport = async (callback) => {
  try {
    const transport = await router.createWebRtcTransport(
      config.mediasoup.webRtcTransportOptions
    );
    console.log("Transport id:", transport.id);

    transport.on("dtlsstatechange", (dtlsState) => {
      if (dtlsState === "closed") transport.close();
    });

    callback({
      params: {
        // ...transport,
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    });

    return transport;
  } catch (error) {
    console.log(error);
    callback({
      params: {
        error: error,
      },
    });
  }
};

const mediasoupStart = async () => {
  worker = await createWorker();

  peers.on("connection", async (socket) => {
    console.log(socket.id);

    socket.on("disconnect", () => {
      console.log(`${socket.id} has disconnected`);
    });

    socket.on("getRtpCapabilities", (callback) => {
      const rtpCapabilities = router.rtpCapabilities;
      console.log("rtp capabilities", rtpCapabilities);

      callback({ rtpCapabilities });
    });

    socket.on("createWebRtcTransport", async ({ sender }, callback) => {
      console.log(`Is this a sender request? ${sender}`);
      const transport = await createWebRtcTransport(callback);
      if (transport) {
        if (sender) producerTransport = transport;
        else consumerTransport = transport;
      }
    });

    router = await worker.createRouter({
      mediaCodecs: config.mediasoup.routerOptions.mediaCodecs,
    });
  });
};

export default mediasoupStart;
