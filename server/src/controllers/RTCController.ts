import { io } from "../global.d.js";

const offers = [
  // offerer username
  // offer
  // offerer ice candidates
  // answerer username
  // answer
  // answerer ice candidates
];
const connectedSockets = [
  // username, socketId
];

const RTCStart = () => {
  io.on("connection", (socket) => {
    if (offers.length) socket.emit("available_offers", offers);

    // console.log(offers);
    // socket.broadcast.emit("offers", offers[0]);
    // socket.on("rtc_offer", ({ offer }) => {
    //   offers[0] = offer;
    // });
    // socket.on("call_user", (data) => {
    //   socket.broadcast.emit("incoming_call", { from: socket.id, data });
    // });
    // socket.on("rtc_answer", ({ answer }) => {
    //   io.emit("rtc_answer", {
    //     senderId: socket.id,
    //     answer,
    //   });
    // });
    // socket.on("rtc_ice_candidate", ({ targetId, candidate }) => {
    //   console.log(targetId, candidate);
    //   io.to(targetId).emit("rtc_ice_candidate", {
    //     senderId: socket.id,
    //     candidate,
    //   });
    // });
  });
};

export default RTCStart;
