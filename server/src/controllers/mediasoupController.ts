import { io } from "../global.d.js";
import Peer from "../helpers/Peer.js";
import Room from "../helpers/Room.js";
import config from "../mediasoup-config.js";

import * as mediasoup from "mediasoup";
import { Consumer, DtlsParameters, IceCandidate, IceParameters, Producer, Router, WebRtcTransport, Worker } from "mediasoup/types";

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
    });

    socket.on("disconnect", () => {
      console.log(`${socket.id} has disconnected`);
    });
  });
};

export default mediasoupStart;
