"use client";

import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../utils";

const VideoChat = () => {
  const [joined, setJoined] = useState(false);
  const [type, setType] = useState<"offer" | "answer">("offer");
  const [availableCalls, setAvailableCalls] = useState([]);
  const [userName, setUserName] = useState("");

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection>(null);

  const [offerData, setOfferData] = useState(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteOffer, setRemoteOffer] =
    useState<RTCSessionDescriptionInit | null>(null);

  const initCall = async (type: "offer" | "answer") => {
    try {
      // set localStream and GUM
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        // audio: {
        //   echoCancellation: true,
        //   noiseSuppression: true,
        // },
      });

      if (localRef.current) localRef.current.srcObject = stream;
      console.log("LOCAL MEDIA ACCESS GRANTED");
      setType(type);
    } catch (error) {
      console.error(error);
    }
  };

  const call = async (e) => {
    initCall("offer");
  };

  const answer = async (callData) => {
    initCall("answer");
    setOfferData(callData);
  };

  useEffect(() => {
    const setCalls = (data) => {
      setAvailableCalls(data);
      console.log(data);
    };

    setUserName(localStorage.getItem("name") || "");
    socket.on("available_offers", setCalls);
    socket.on("new_offer_waiting", setCalls);
  }, [joined]);

  // we have media access now setup peerconnection w/listeners
  useEffect(() => {
    if (!peerConnection.current && remoteStream !== null) {
      // create peerconnection
      const peerConfiguration = {
        iceServers: [
          {
            urls: [
              "stun:stun.google.com:19302",
              "stun:stun1.l.google.com:5349",
            ],
          },
        ],
      };

      peerConnection.current = new RTCPeerConnection(peerConfiguration);
      setRemoteStream(new MediaStream());
      if (remoteRef.current) remoteRef.current.srcObject = remoteStream;

      peerConnection.current.addEventListener("signalingstatechange", (e) => {
        console.log("signaling event change");
        console.log(e);
        console.log(peerConnection.current?.signalingState);
      });

      peerConnection.current.addEventListener("icecandidate", (e) => {
        console.log("Foung an ICE candidate");
        if (e.candidate) {
          socket.emit("send_ice_candidate_to_signaling_server", {
            iceCandidate: e.candidate,
            iceUserName: userName,
            didIOffer: type === "offer",
          });
        }
      });

      peerConnection.current.addEventListener("track", (e) => {
        // the remote has sent us a track
        for (const track of e.streams[0].getTracks()) {
          remoteStream.addTrack(track);
          console.log("This should add some audio/video to remote feed");
        }
      });
    }
  }, [remoteStream]);

  // we know what kind of client this is and have a peer connection
  useEffect(() => {
    if (type && peerConnection.current) {
      socket.on("answer_response", (offerObj) => {
        console.log(offerObj);
        const answer = offerObj.answer;
      });

      socket.on("received_ice_candidate_from_server", (iceC) => {
        peerConnection.current?.addIceCandidate(iceC);
        console.log(iceC);
        console.log("Added an iceCandidate to existing page presence");
      });
    }
  }, [type]);

  useEffect(() => {
    const handleOffer = (offers: RTCSessionDescriptionInit) => {
      if (offers !== null) setRemoteOffer(offers);
    };

    socket.on("offers", handleOffer);

    return () => {
      socket.off("offers", handleOffer);
    };
  }, []);

  useEffect(() => {
    socket.on("rtc_answer", async ({ answer }) => {
      console.log("Received RTC answer");
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    return () => {
      socket.off("rtc_answer");
    };
  }, []);

  return (
    <div className="px-4 py-6">
      <h1 className="font-bold text-2xl">video chat</h1>
      <div className="mt-4 mb-2">
        <button
          className="bg-blue-700 px-6 py-2 rounded-md font-semibold"
          onClick={call}
        >
          Call
        </button>
        <div className="available-calls flex gap-x-3 items-center mt-3 text-lg font-medium">
          <p>available calls: </p>
          {availableCalls.map((callData, index) => (
            <button
              key={index}
              className="bg-blue-700 px-6 py-2 rounded-md font-semibold"
              onClick={() => answer(callData)}
            >
              {callData.offererUserName}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-x-4 ">
        <div>
          <p>Local video</p>
          <video
            className="rotate-y-180"
            ref={localRef}
            autoPlay
            muted
            playsInline
          />
        </div>
        <div>
          <p>Remote video</p>
          <video
            className="rotate-y-180"
            ref={remoteRef}
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
