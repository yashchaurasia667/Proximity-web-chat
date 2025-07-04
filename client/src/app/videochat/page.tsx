"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gameSocket } from "../../utils";

type OfferEntry = {
  id: string;
  offer: RTCSessionDescriptionInit;
  offererICECandidates: RTCIceCandidate[];
  answererId: string | null;
  answer: RTCSessionDescriptionInit | null;
  answererICECandidate: RTCIceCandidate[];
};

const VideoChat = () => {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  const [type, setType] = useState<"offer" | "answer">("offer");
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [availableOffers, setAvailableOffers] = useState<OfferEntry[]>([]);

  const [offerToAnswer, setOfferToAnswer] = useState<OfferEntry | null>(null);

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);

  const createPeerConnection = useCallback(
    async (offer?: RTCSessionDescriptionInit) => {
      if (localStream && !peerConnection) {
        const config = {
          iceServers: [
            {
              urls: [
                "stun:stun.google.com:19302",
                "stun:stun1.l.google.com:5349",
              ],
            },
          ],
        };

        console.log("Creating peer Connection");

        const pc = new RTCPeerConnection(config);
        for (const track of localStream.getTracks())
          pc.addTrack(track, localStream);

        pc.addEventListener("signalingstatechange", () => {
          console.log("Signaling state changed:", pc.signalingState);
        });

        pc.addEventListener("icecandidate", (e) => {
          console.log("Got an ICE candidate...");

          if (e.candidate) {
            gameSocket.emit("rtc_ice_candidate", {
              iceCandidate: e.candidate,
              id: gameSocket.id,
              didIOffer: type === "offer",
              targetId: offerToAnswer?.id,
            });
          }
        });

        pc.addEventListener("track", (e) => {
          if (remoteStream) {
            console.log("Got remote stream...");

            setRemoteStream(() => {
              const updated = new MediaStream();
              for (const track of e.streams[0].getTracks()) {
                updated.addTrack(track);
              }
              if (remoteRef.current) remoteRef.current.srcObject = updated;
              return updated;
            });

            if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
          }
        });

        if (type === "answer" && offer) await pc.setRemoteDescription(offer);

        setPeerConnection(pc);
      }
    },
    [localStream, offerToAnswer?.id, peerConnection, remoteStream, type]
  );

  // set localref and remoteref to streams
  useEffect(() => {
    if (localRef.current && remoteRef.current && !peerConnection) {
      console.log("Setting local and remote streams");
      localRef.current.srcObject = localStream;
      remoteRef.current.srcObject = remoteStream;
    }
  }, [localStream, peerConnection, remoteStream]);

  // gameSocket listeners for send offer, receive ice candidates and answers
  useEffect(() => {
    gameSocket.on(
      "rtc_offer",
      (data: { offer: Record<string, Omit<OfferEntry, "id">> }) => {
        if (data.offer) {
          const offersArray = Object.entries(data.offer).map(
            ([id, offerData]) => ({
              id,
              offer: offerData.offer,
              offererICECandidates: offerData.offererICECandidates,
              answererId: offerData.answererId,
              answer: offerData.answer,
              answererICECandidate: offerData.answererICECandidate,
            })
          );
          setAvailableOffers(offersArray);
        } else {
          setAvailableOffers([]);
        }
      }
    );

    gameSocket.on("rtc_ice_candidates", (data) => {
      console.log("adding ice candidates");
      peerConnection?.addIceCandidate(data.iceCandidate);
    });

    gameSocket.on("rtc_answer", async (data) => {
      if (peerConnection) {
        if (data.answererICECandidates) {
          for (const ice of data.answererICECandidates) {
            console.log("Got answerer's ice candidates");
            peerConnection.addIceCandidate(ice);
          }
        }
        if (peerConnection.signalingState !== "stable") {
          peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        }
      }
    });
  }, [createPeerConnection, peerConnection]);

  // 2. create peer connection and add event listeners
  useEffect(() => {
    if (!peerConnection && localStream) {
      createPeerConnection();
    }
  }, [createPeerConnection, localStream, peerConnection]);

  // 3. create offer
  useEffect(() => {
    if (!offer && peerConnection && !offerToAnswer) {
      console.log("Creating an offer...");

      setType("offer");
      const createOffer = async () => {
        try {
          const offer = await peerConnection?.createOffer();
          await peerConnection?.setLocalDescription(offer);
          setOffer(offer);

          gameSocket.emit("rtc_offer", { id: gameSocket.id, offer });
        } catch (error) {
          console.error(error);
        }
      };

      createOffer();
    }
  }, [offer, offerToAnswer, peerConnection]);

  // 2. answer an offer
  useEffect(() => {
    const answerRemoteOffer = async () => {
      if (offerToAnswer && type == "answer") {
        if (peerConnection) {
          console.log("peerconnection found, creating an answer");

          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(offerToAnswer.offer)
          );

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          for (const ice of offerToAnswer.offererICECandidates) {
            console.log("adding offerer's ice candidates");
            peerConnection.addIceCandidate(ice);
          }

          gameSocket.emit("rtc_answer", {
            id: gameSocket.id,
            targetId: offerToAnswer.id,
            answer,
          });
        } else {
          console.log("peerconnection not found, initiating call...");
          initCall();
          // createPeerConnection(offerToAnswer?.offer);
        }
      }
    };

    answerRemoteOffer();
  }, [createPeerConnection, offerToAnswer, peerConnection, type]);

  // 1. enable user media and set streams
  const initCall = async () => {
    console.log("Initiating call...");

    const constraints = {
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    setRemoteStream(new MediaStream());
  };

  const call = async () => {
    await initCall();
  };

  // 1. initiate answer call
  const answer = async (offer: OfferEntry) => {
    console.log("Setting offer to answer...");
    setType("answer");
    setOfferToAnswer({ ...offer });
  };

  return (
    <div className="p-4">
      <div>Video Chat</div>
      <div className="my-4">
        <button
          className="font-semibold text-lg bg-blue-700 rounded-md px-6 py-2"
          onClick={call}
        >
          Call
        </button>

        <div className="my-4 flex gap-x-3 items-center">
          <p>Available Offers: </p>
          <div>
            {availableOffers.map((offer, index) => (
              <button
                onClick={() => answer(offer)}
                key={index}
                className="bg-green-600 rounded-md px-6 py-2 font-semibold text-lg mx-1"
              >
                {offer.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-x-4">
        <div>
          <p className="text-lg">local video</p>
          <video
            ref={localRef}
            className="rotate-y-180"
            autoPlay
            muted
            playsInline
          />
        </div>
        <div>
          <p className="text-lg">remote video</p>
          <video
            ref={remoteRef}
            className="rotate-y-180"
            autoPlay
            muted
            playsInline
          />
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
