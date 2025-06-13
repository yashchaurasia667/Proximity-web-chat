import { io } from "../global.d.js";

const RTCStart = () => {
  io.on("connection", (socket) => {
    socket.on("rtc_offer", ({ offer }) => {
      console.log(offer);
    });

    socket.on("rtc_answer", ({ targetId, answer }) => {
      io.to(targetId).emit("rtc_answer", {
        senderId: socket.id,
        answer,
      });
    });

    socket.on("rtc_ice_candidate", ({ targetId, candidate }) => {
      console.log(targetId, candidate);
      io.to(targetId).emit("rtc_ice_candidate", {
        senderId: socket.id,
        candidate,
      });
    });
  });
};

export default RTCStart;
