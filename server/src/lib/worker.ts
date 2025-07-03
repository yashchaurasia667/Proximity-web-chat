// import * as mediasoup from "mediasoup";
import * as mediasoup from "mediasoup";
import { Router, Worker, WorkerLogLevel } from "mediasoup/types";

import config from "../mediasoup-config.js";

const worker: Array<{
  worker: Worker;
  router: Router;
}> = [];

let nextMediasoupWorkerIndex = 0;

const createWorker = async () => {
  const worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.workerSettings.loglevel,
    logTags: config.mediasoup.workerSettings.logTags,
  });

  worker.on("died", () => {
    console.error(
      "mediasoup worker died, exiting in 2 seconds... [pid:&d]",
      worker.pid
    );
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  });
};

export { createWorker };
