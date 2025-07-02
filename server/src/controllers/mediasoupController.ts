import { types as mediasoupTypes, createWorker } from "mediasoup";

import { io, Room } from "../global.d.js";

const workers: mediasoupTypes.Worker[] = [];
const rooms = new Map<string, Room>();

export const startMediasoup = async () => {
  const worker = await createWorker();
  workers.push(worker);

  io.on("connection", (socket) => {
    socket.on("joinRoom", async ({ roomName }: { roomName: string }) => {
      let room = rooms.get(roomName);
      if (!room) {
        room = new Room(worker);
        rooms.set(roomName, room);
      }

      await room.addPeer(socket);
    });
  });
};
