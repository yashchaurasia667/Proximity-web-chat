import { io } from "../global.d.js";

const RTCStart = () => {
  // id: {offer, ice candidates[], answer_id, answer, answerer_ice_candidates}
  const offers = new Map<
    string,
    {
      offer: RTCSessionDescriptionInit;
      offererICECandidates: RTCIceCandidate[];
      answererId: string | null;
      answer: RTCSessionDescriptionInit | null;
      answererICECandidate: RTCIceCandidate[];
    }
  >();

  const emitOffers = () => {
    const offerObj = Object.fromEntries(offers.entries());
    return offerObj;
  };

  io.on("connection", (socket) => {
    // console.log(`User connected: ${socket.id}`);
    if (offers.size > 0) {
      socket.to(socket.id).emit("rtc_offer", emitOffers());
    }

    socket.on("rtc_offer", (data) => {
      if (offers.has(data.id)) {
        const prevOffer = offers.get(data.id);
        prevOffer!.offer = data.offer;
        offers.set(data.id, prevOffer!);
      } else {
        offers.set(data.id, {
          offer: data.offer,
          offererICECandidates: [],
          answererId: null,
          answer: null,
          answererICECandidate: [],
        });
      }
      socket.broadcast.emit("rtc_offer", { offer: emitOffers() });
    });

    socket.on("rtc_ice_candidate", (data) => {
      // if (offers.has(data.id)) {
      //   const prevOffer = offers.get(data.id);
      //   prevOffer!.offererICECandidates.push(data.iceCandidate);
      //   offers.set(data.id, prevOffer!);
      // }
      // socket.broadcast.emit("rtc_ice_candidate", data);

      if (data.didIOffer) {
        if (offers.has(data.id)) {
          const offer = offers.get(data.id);
          offer!.offererICECandidates.push(data.iceCandidate);
          offers.set(data.id, offer!);

          if (offer?.answererId) {
            socket
              .to(offer.answererId)
              .emit("rtc_ice_candidate", { iceCandidate: data.iceCandidate });
          }
          // else {
          //   console.log(
          //     "Got ice candidate but no answerer, saved it to the object"
          //   );
          // }
        }
      } else {
        const offer = offers.get(data.targetId);
        if (offer) {
          offer.answererId = socket.id;
          offer.answererICECandidate.push(data.iceCandidate);
          offers.set(data.targetId, offer);
        }
      }
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
