import express from "express";
import { createServer } from "node:http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import cors from "cors";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

const PORT = process.env.PORT || 8000;
app.use(cors());

app.get("/api", (req, res) => {
  res.json({
    message: "Hello world",
  });
});

let id: string;

io.on("connection", (socket) => {
  id = socket.id;
  io.emit("joined", id);

  socket.on("disconnect", () => {
    io.emit("left", id);
  });

  socket.on("message", (msg) => {
    // console.log(`${id}==> ${msg}`);
    io.emit("message", { message: msg, id: id });
  });

  socket.on("movement", (pos) => {
    // console.log(pos);
    io.emit("movement", { id: id, pos: pos });
  });
});

server.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
