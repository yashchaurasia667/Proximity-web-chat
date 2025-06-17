"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "../../utils";

const VideoChat = () => {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  const [type, setType] = useState<"offer" | "answer">("offer");
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [availableOffers, setAvailableOffers] = useState<
    { offer: RTCSessionDescriptionInit; id: string }[]
  >([]);

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);

  // set localref and remoteref to streams
  useEffect(() => {
    if (localRef.current && remoteRef.current) {
      localRef.current.srcObject = localStream;
      remoteRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // socket listeners
  useEffect(() => {
    socket.on("rtc_offer", (data) => {
      setAvailableOffers((prev) => [
        ...prev,
        { id: data.id, offer: data.offer },
      ]);
    });
  }, []);

  // create peer connection and add event listeners
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createPeerConnection = async (offerObj?: any) => {
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

        pc.addEventListener("signalingstatechange", (e) => {
          console.log("Signaling state changed");
          console.log(e);
          console.log(pc.signalingState);
        });

        pc.addEventListener("icecandidate", (e) => {
          console.log("Got an ICE candidate!");

          if (e.candidate) {
            socket.emit("rtc_ice_candidate", {
              iceCandidate: e.candidate,
              didIOffer: type === "offer",
            });
          }
        });

        pc.addEventListener("track", (e) => {
          if (remoteStream) {
            console.log("Got remote stream!");

            for (const track of e.streams[0].getTracks()) {
              remoteStream.addTrack(track);
              console.log("This should add some audio/video to remote feed");
            }

            if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
          }
        });

        if (offerObj) await pc.setRemoteDescription(offerObj.offer);

        setPeerConnection(pc);
      }
    };

    if (!peerConnection && localStream) {
      createPeerConnection();
    }
  }, [localStream, peerConnection, remoteStream, type]);

  // create offer
  useEffect(() => {
    if (!offer && peerConnection) {
      const createOffer = async () => {
        try {
          const offer = await peerConnection?.createOffer();
          await peerConnection?.setLocalDescription(offer);
          if (offer) setOffer(offer);
          setType("offer");
          socket.emit("rtc_offer", { offer });
        } catch (error) {
          console.error(error);
        }
      };

      createOffer();
    }
  }, [offer, peerConnection]);

  // enable user media and set streams
  const initCall = async () => {
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
    // await createPeerConnection();
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
