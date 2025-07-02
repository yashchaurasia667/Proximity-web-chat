import fs from "node:fs";
import https from "node:https";
import dotenv from "dotenv";

import express from "express";
import { Server as socketIoServer, Socket } from "socket.io";

import { types as mediasoupTypes } from "mediasoup";

dotenv.config();
const app = express();

const sslOptions = {
  key: fs.readFileSync("./certs/server-key.pem"),
  cert: fs.readFileSync("./certs/server-cert.pem"),
};

const server = https.createServer(sslOptions, app);

const io = new socketIoServer(server, {
  cors: {
    origin: ["https://localhost:3000", "https://192.168.29.232:3000"], // Replace with actual frontend origin in production
    methods: ["GET", "POST"],
    // credentials: true,
  },
});

class Room {
  private router: mediasoupTypes.Router;
  private peers: Map<string, { socket: Socket }> = new Map();

  constructor(worker: mediasoupTypes.Worker) {
    this.init(worker);
  }

  private async init(worker: mediasoupTypes.Worker) {
    this.router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
        },
      ],
    });
  }

  public async addPeer(socket: Socket) {
    const id = socket.id;
    this.peers.set(id, { socket });

    socket.on("getRtpCapabilities", (_, cb) => {
      if (!this.router) return;
      cb(this.router.rtpCapabilities);
    });
    // TODO: Add createTransport, connectTransport, produce, consume
  }
}
export { app, server, io, Room };
