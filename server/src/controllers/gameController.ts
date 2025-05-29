import { server } from "../global.d.js";
import { Server } from "socket.io";
import { pos } from "../types.js";

const socketStart = () => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Replace with actual frontend origin in production
      credentials: true,
    },
  });

  const members = new Map<string, { name: string; sprite: string; pos: pos }>();

  // triggeres when a user joins
  io.on("connection", (socket) => {
    socket.on("player_joined", (data) => {
      members.set(data.id, {
        name: data.name,
        sprite: data.sprite,
        pos: data.pos,
      });
      io.emit("player_joined", data);
      // console.log(`player joined, members size: ${members.size}`);

      const lobbyObj = Object.fromEntries(members.entries());
      io.emit("lobby", { lobby: lobbyObj });
    });

    socket.on("disconnect", () => {
      members.delete(socket.id);
      io.emit("player_left", { id: socket.id });
      // console.log(`player left, members size: ${members.size}`);
    });

    socket.on("get_lobby", () => {
      io.emit("lobby", { lobby: members });
    });

    socket.on("chat_message", (data) => {
      io.emit("chat_message", data);
    });

    socket.on("player_move", (data) => {
      console.log(`id: ${data.id}, moved to: ${data.pos.x} ${data.pos.y}`);
      members.set(data.id, {
        name: data.name,
        sprite: data.sprite,
        pos: data.pos,
      });
      io.emit("player_move", data);
    });
  });
};

export default socketStart;
