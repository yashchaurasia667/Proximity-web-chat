import { io } from "../global.d.js";
const RTCStart = () => {
  // const offers: RTCSessionDescriptionInit[] = [];

  io.on("connection", (socket) => {
    // console.log(`User connected: ${socket.id}`);

    socket.on("rtc_offer", (data) => {
      // offers.push(data.offer);
      socket.broadcast.emit("rtc_offer", { offer: data.offer, id: socket.id });
    });
  });
};

export default RTCStart;
