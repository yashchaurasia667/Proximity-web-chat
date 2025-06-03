// server/signaling.js or inside your custom Next.js API route
import { Socket } from "socket.io";
import { io } from "../global.d.js";

const rooms = {};

io.on("connection", (socket: Socket) => {
  socket.on("join_call", (roomId: string) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    // Send list of other users
    const otherUsers = rooms[roomId].filter((id) => id !== socket.id);
    socket.emit("all-users", otherUsers);

    // Notify others
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit("user-signal", {
      signal: payload.signal,
      callerId: payload.callerId,
    });
  });

  socket.on("returning-signal", (payload) => {
    io.to(payload.callerId).emit("received-returned-signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      rooms[roomId] = rooms[roomId]?.filter((id) => id !== socket.id);
      socket.to(roomId).emit("user-left", socket.id);
    }
  });
});
