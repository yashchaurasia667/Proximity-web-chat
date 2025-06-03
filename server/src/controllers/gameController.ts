import { Socket } from "socket.io";
import { io } from "../global.d.js";

import { PlayerData } from "../types.js";

const socketStart = () => {
  const members = new Map<string, Omit<PlayerData, "id">>();

  io.on("connection", (socket: Socket) => {
    // triggeres when a user joins
    socket.on("player_joined", (data: PlayerData) => {
      if (!data?.id || !data?.name || !data?.sprite || !data?.pos) return;

      members.set(data.id, {
        name: data.name,
        sprite: data.sprite,
        pos: data.pos,
      });
      // io.emit("player_joined", data);
      socket.broadcast.emit("player_joined", data);

      // to  update new player's lobby
      const lobbyObj = Object.fromEntries(members.entries());
      io.emit("lobby", { lobby: lobbyObj });
    });

    socket.on("disconnect", () => {
      members.delete(socket.id);
      io.emit("player_left", { id: socket.id });
    });

    socket.on("get_lobby", () => {
      const lobbyObj = Object.fromEntries(members.entries());
      io.emit("lobby", { lobby: lobbyObj });
    });

    socket.on("chat_message", (data) => {
      io.emit("chat_message", data);
    });

    socket.on("player_move", (data: PlayerData) => {
      if (!data.id || !data.pos) return;

      const existing = members.get(data.id);
      if (existing) {
        members.set(data.id, {
          ...existing,
          pos: data.pos,
        });
        socket.broadcast.emit("player_move", data);
      }
    });
  });
};

export default socketStart;
