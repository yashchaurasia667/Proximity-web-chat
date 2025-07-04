import { Socket } from "socket.io";
import { io } from "../global.d.js";

import { PlayerData } from "../types.js";

const gameStart = () => {
  const members = new Map<string, Omit<PlayerData, "id">>();
  const game = io.of("/game");

  game.on("connection", (socket: Socket) => {
    // triggeres when a user joins
    socket.on("player_joined", (data: PlayerData) => {
      if (!data?.id || !data?.name || !data?.sprite || !data?.pos) return;

      members.set(data.id, {
        name: data.name,
        sprite: data.sprite,
        pos: data.pos,
      });
      socket.broadcast.emit("player_joined", data);

      // to  update new player's lobby
      const lobbyObj = Object.fromEntries(members.entries());
      game.emit("lobby", { lobby: lobbyObj });
    });

    socket.on("disconnect", () => {
      members.delete(socket.id);
      game.emit("player_left", { id: socket.id });
    });

    socket.on("get_lobby", () => {
      const lobbyObj = Object.fromEntries(members.entries());
      game.emit("lobby", { lobby: lobbyObj });
    });

    socket.on("chat_message", (data) => {
      game.emit("chat_message", data);
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

export default gameStart;
