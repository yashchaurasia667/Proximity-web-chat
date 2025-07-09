import { io } from "../global.d.js";
import Peer from "../helpers/Peer.js";
import Room from "../helpers/Room.js";
import config from "../mediasoup-config.js";

import * as mediasoup from "mediasoup";
// import { Consumer, DtlsParameters, IceCandidate, IceParameters, Producer, Router, WebRtcTransport, Worker } from "mediasoup/types";

const createWorker = async () => {
  const worker = await mediasoup.createWorker(config.mediasoup.workerSettings);

  worker.on("died", () => {
    console.error("mediasoup worker died, exiting in 2 seconds... [pid:%d]", worker.pid);
    setTimeout(() => process.exit(1), 2000);
  });
  return worker;
};

const mediasoupStart = async () => {
  const peers = io.of("/mediasoup");
  const worker = await createWorker();
  const room = new Room("global_room", peers, worker);

  peers.on("connection", (socket) => {
    socket.on("join", ({ name }, callback) => {
      console.log(`${socket.id} has joined the room`);
      room.addPeer(new Peer(socket.id, name));
      callback(room.toJSON());
    });

    socket.on("get_producers", () => {
      console.log("Get Producers:", { name: `${room.getPeers().get(socket.id)?.name}` });
      const producerList = room.getProducerListForPeer();
      socket.emit("newProducers", producerList);
    });

    socket.on("get_router_rtp_capabilities", (callback) => {
      console.log("Get router RTP capabilities");
      try {
        callback(room.getRtpCapabilities());
      } catch (error) {
        callback({ error });
      }
    });

    socket.on("create_webrtc_transport", async (callback) => {
      try {
        const { params } = await room.createWebRtcTransport(socket.id);
        callback(params);
      } catch (error) {
        console.error(error);
        callback({ error });
      }
    });

    socket.on("connect_transport", async ({ transportId, dtlsParameters }, callback) => {
      try {
        await room.connectPeerTransport(socket.id, transportId, dtlsParameters);
        callback("success");
      } catch (error) {
        console.error(error);
        callback({ error });
      }
    });

    socket.on("produce", async ({ producerTransportId, rtpParameters, kind }, callback) => {
      const producerId = await room.produce(socket.id, producerTransportId, rtpParameters, kind);
      callback({ producerId });
    });

    socket.on("consume", async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
      const params = await room.consume(socket.id, consumerTransportId, producerId, rtpCapabilities);
      if (params) {
        callback(params);
      }
    });

    // socket.on("resume", async (data, callback) => {
    //   await consumer.resume();
    // callback();
    // });

    socket.on("get_room_info", (callback) => {
      callback(room.toJSON());
    });

    socket.on("producer_closed", ({ producerId }) => {
      console.log("Producer close", { name: `${room.getPeers().get(socket.id)?.name}` });

      room.closeProducer(socket.id, producerId);
    });

    socket.on("exit_room", (_, callback) => {
      console.log("Exit room", { name: `${room.getPeers().get(socket.id)?.name}` });

      room.removePeer(socket.id);
      callback("successfully exited room");
    });

    socket.on("disconnect", () => {
      console.log(`${socket.id} has disconnected`);
    });
  });
};

export default mediasoupStart;
