import { io } from "../global.d.js";

const RTCStart = () => {
  // offerer_id: {offer, ice candidates[], answer_id, answer, answerer_ice_candidates}
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
      offers.set(data.id, {
        offer: data.offer,
        offererICECandidates: [],
        answererId: null,
        answer: null,
        answererICECandidate: [],
      });
      socket.broadcast.emit("rtc_offer", { offer: emitOffers() });
    });

    socket.on("rtc_ice_candidate", (data) => {
      // data: {iceCandidate, id, didIoffer, targetId?}

      // if candidates are coming from the offerer
      if (data.didIoffer) {
        const offer = offers.get(data.id);
        if (offer) {
          // store the candidates into the array and send when the offer is answered
          console.log("Offer found for offerer's ice candidate");
          offer.offererICECandidates.push(data.iceCandidate);
          offers.set(data.id, offer);

          // if the offer has been answered, pass through the ice candidates
          if (offer.answererId) {
            socket.to(offer.answererId).emit("rtc_ice_candidate", data);
          }
        }
      } else {
        const offer = offers.get(data.targetId);
        if (offer) {
          console.log("Offer found for offerer's ice candidate");
          offer.answererICECandidate.push(data.iceCandidate);
          offers.set(data.targetId, offer);
          socket.to(data.targetId).emit("rtc_ice_candidate", data);
        }
      }
    });

    socket.on("rtc_answer", (data) => {
      const offer = offers.get(data.targetId);
      if (offer) {
        offer.answer = data.answer;
        offers.set(data.targetId, offer);
        socket
          .to(data.targetId)
          .emit("rtc_answer", {
            id: offer.answererId,
            answer: offer.answer,
            answererICECandidates: offer.answererICECandidate,
          });
      }
    });

    socket.on("disconnect", () => {
      if (offers.has(socket.id)) offers.delete(socket.id);
      socket.broadcast.emit("rtc_offer", emitOffers());
    });
  });
};

export default RTCStart;
