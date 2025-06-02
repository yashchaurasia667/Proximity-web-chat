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

      // to  update new player's lobby 
      const lobbyObj = Object.fromEntries(members.entries());
      io.emit("lobby", { lobby: lobbyObj });
    });

    socket.on("disconnect", () => {
      members.delete(socket.id);
      io.emit("player_left", { id: socket.id });
    });

    socket.on("get_lobby", () => {
      io.emit("lobby", { lobby: members });
    });

    socket.on("chat_message", (data) => {
      io.emit("chat_message", data);
    });

    socket.on("player_move", (data) => {
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
