import fs from "node:fs";
import https from "node:https";
import dotenv from "dotenv";

import express from "express";
import { Server as socketIoServer } from "socket.io";

dotenv.config();
const app = express();

const sslOptions = {
  key: fs.readFileSync("./certs/server-key.pem"),
  cert: fs.readFileSync("./certs/server-cert.pem"),
};

const server = https.createServer(sslOptions, app);

const io = new socketIoServer(server, {
  cors: {
    origin: "*", // Replace with actual frontend origin in production
    methods: ["GET", "POST"],
    // credentials: true,
  },
});

export { app, server, io };
