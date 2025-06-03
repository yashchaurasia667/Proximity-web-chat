import express from "express";
import { Server } from "node:http";
import { Server as socketIoServer } from "socket.io";

const app = express();
const server = Server(app);

const io = new socketIoServer(server, {
  cors: {
    origin: "*", // Replace with actual frontend origin in production
    credentials: true,
  },
});

export { app, server, io };
