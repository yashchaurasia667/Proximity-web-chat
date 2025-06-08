import express from "express";
import { Server } from "node:http";
import { Server as socketIoServer } from "socket.io";

const app = express();
const server = Server(app);

const io = new socketIoServer(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.29.232:3000"], // Replace with actual frontend origin in production
   methods: ["GET", "POST"],
    credentials: true,
  },
});

export { app, server, io };
