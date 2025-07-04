import { io } from "../global.d.js";

import * as mediasoup from "mediasoup";
import config from "../mediasoup-config.js";
import { Router, Worker } from "mediasoup/types";

const peers = io.of("/mediasoup");
let worker: Worker;
let router: Router;

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

const mediasoupStart = async () => {
  worker = await createWorker();

  peers.on("connection", async (socket) => {
    console.log(socket.id);

    socket.on("disconnect", () => {
      console.log(`${socket.id} has disconnected`);
    });

    router = await worker.createRouter({
      mediaCodecs: config.mediasoup.routerOptions.mediaCodecs,
    });
  });
};

export default mediasoupStart;
