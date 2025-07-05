import { io } from "../global.d.js";
import config from "../mediasoup-config.js";

import * as mediasoup from "mediasoup";
import {
  Consumer,
  DtlsParameters,
  IceCandidate,
  IceParameters,
  Producer,
  Router,
  WebRtcTransport,
  Worker,
} from "mediasoup/types";

const mediasoupStart = async () => {
  const peers = io.of("/mediasoup");
  let producerTransport: WebRtcTransport;
  let consumerTransport: WebRtcTransport;
  let producer: Producer;
  let consumer: Consumer;

  const createWorker = async (): Promise<Worker> => {
    const newWorker = await mediasoup.createWorker(
      config.mediasoup.workerSettings
    );

    newWorker.on("died", () => {
      console.log(
        `worker ${newWorker.pid} has died, the process will close in 2 seconds...`
      );

      setTimeout(() => {
        process.exit(1);
      }, 2000);
    });

    return newWorker;
  };

  const createWebRtcTransport = async (
    router: Router,
    callback: (arg0: {
      params:
        | {
            id: string;
            iceParameters: IceParameters;
            iceCandidates: IceCandidate[];
            dtlsParameters: DtlsParameters;
          }
        | { error: unknown };
    }) => void
  ) => {
    try {
      const transport = await router.createWebRtcTransport(
        config.mediasoup.webRtcTransportOptions
      );
      console.log("Transport Created: ", transport);

      transport.on("dtlsstatechange", (dtlsState) => {
        if (dtlsState === "closed") transport.close();
      });

      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });
      return transport;
    } catch (error) {
      console.error(error);
      callback({
        params: {
          error,
        },
      });
    }
  };

  peers.on("connection", async (socket) => {
    const worker: Worker = await createWorker();
    const router: Router = await worker.createRouter(
      config.mediasoup.routerOptions
    );

    socket.on("disconnect", () => {
      console.log("peer disconnected");
    });

    socket.on("get_router_rtp_capabilities", (callback) => {
      const rtpCapabilities = router.rtpCapabilities;
      console.log("router rtp capabilities", rtpCapabilities);
      callback({ rtpCapabilities });
    });

    socket.on("create_transport", async ({ sender }, callback) => {
      const transport = await createWebRtcTransport(router, callback);
      if (transport) {
        if (sender) producerTransport = transport;
        else consumerTransport = transport;
      }
    });

    socket.on("connect_producer_transport", async ({ dtlsParameters }) => {
      await producerTransport.connect({ dtlsParameters });
      console.log("Producer transport connected");
    });

    socket.on(
      "transport_produce",
      async ({ kind, rtpParameters }, callback) => {
        producer = await producerTransport.produce({
          kind,
          rtpParameters,
        });

        producer.on("transportclose", () => {
          console.log("Producer Transport closed");
          producer.close();
        });

        callback({ id: producer.id });
      }
    );

    socket.on("connect_consumer_transport", async ({ dtlsParameters }) => {
      await consumerTransport.connect({ dtlsParameters });
    });

    socket.on("consume_media", async ({ rtpCapabilities }, callback) => {
      try {
        if (producer) {
      console.log("consume media");
          if (
            !router.canConsume({ producerId: producer.id, rtpCapabilities })
          ) {
            console.error("Cannot consume");
            return;
          }

          console.log("---------> consume");

          consumer = await consumerTransport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: producer.kind === "video",
          });

          consumer?.on("transportclose", () => {
            console.log("Consumer transport closed");
            consumer?.close();
          });

          consumer?.on("producerclose", () => {
            console.log("Producer closed");
            consumer?.close();
          });

          callback({
            params: {
              producerId: producer?.id,
              id: consumer?.id,
              kind: consumer?.kind,
              rtpParameters: consumer?.rtpParameters,
            },
          });
        }
      } catch (error) {
        console.error("Error consuming:", error);
        callback({ params: { error } });
      }
    });
    socket.on("resume_paused_consumer", async () => {
      console.log("consume resume");
      await consumer.resume();
    });
  });
};

export default mediasoupStart;
