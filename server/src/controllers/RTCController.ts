import { io } from "../global.js";

io.on("connection", (socket) => {
  socket.on("rtc_offer", ({ targetId, offer }) => {
    io.to(targetId).emit("rtc_offer", {
      senderId: socket.id,
      offer,
    });
  });

  socket.on("rtc_answer", ({ targetId, answer }) => {
    io.to(targetId).emit("rtc_answer", {
      senderId: socket.id,
      answer,
    });
  });

  socket.on("rtc_ice_candidate", ({ targetId, candidate }) => {
    io.to(targetId).emit("rtc_ice_candidate", {
      senderId: socket.id,
      candidate,
    });
  });
});
