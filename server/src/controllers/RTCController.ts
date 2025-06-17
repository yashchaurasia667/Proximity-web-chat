import { io } from "../global.d.js";
const RTCStart = () => {
  // const offers: RTCSessionDescriptionInit[] = [];
  const offers = new Map<string, RTCSessionDescriptionInit>();

  const emitOffers = (data?: {
    id: string;
    offer: RTCSessionDescriptionInit;
  }) => {
    if (data) offers.set(data.id, data.offer);

    const offerObj = Object.fromEntries(offers.entries());
    return offerObj;
  };

  io.on("connection", (socket) => {
    // console.log(`User connected: ${socket.id}`);
    if (offers.size > 0) {
      console.log("emitting offers on connection");
      socket.to(socket.id).emit("rtc_offer", emitOffers());
    }

    socket.on("rtc_offer", (data) => {
      const offerObj = emitOffers(data);
      socket.broadcast.emit("rtc_offer", { offer: offerObj });
    });

    socket.on("rtc_ice_candidate", (data) => {
      socket.broadcast.emit("rtc_ice_candidate", data);
    });

    socket.on("rtc_answer", (data) => {
      socket.to(data.targetId).emit("rtc_answer", data);
    });

    socket.on("disconnect", () => {
      if (offers.has(socket.id)) offers.delete(socket.id);
      socket.broadcast.emit("rtc_offer", emitOffers());
    });
  });
};

export default RTCStart;
