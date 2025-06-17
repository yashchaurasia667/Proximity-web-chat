import { io } from "../global.d.js";
const RTCStart = () => {
  // const offers: RTCSessionDescriptionInit[] = [];
  const offers = new Map<string, RTCSessionDescriptionInit>();

  io.on("connection", (socket) => {
    // console.log(`User connected: ${socket.id}`);

    socket.on("rtc_offer", (data) => {
      offers.set(data.id, data.offer);

      const offerObj = Object.fromEntries(offers.entries());
      socket.broadcast.emit("rtc_offer", { offer: offerObj });
    });

    socket.on("rtc_ice_candidate", (data) => {
      socket.broadcast.emit("rtc_ice_candidate", data);
    });

    socket.on("rtc_answer", (data) => {
      socket.to(data.targetId).emit("rtc_answer", data);
    });
  });
};

export default RTCStart;
