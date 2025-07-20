import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { BsCameraVideoOff, BsFillCameraVideoFill, BsFillCameraVideoOffFill } from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { FaGear } from "react-icons/fa6";
import { createMediasoupDevice, getConsumeStream, getDevices, initTransport, socket, socketRequest } from "./helper";
import { Device, RtpCapabilities } from "mediasoup-client/types";

interface props {
  mic: boolean;
  camera: boolean;
  screen: boolean;
  name: string;
}

const Videochat = ({ mic = false, camera = false, screen = false, name = "" }: props) => {
  // COMPONENT STATES
  const [micState, setMicState] = useState(mic);
  const [cameraState, setCameraState] = useState(camera);
  const [screenState, setScreenState] = useState(screen);
  const [settingState, setSettingState] = useState(false);

  // MEDIASOUP RELATED
  const [mediasoupDevice, setMediasoupDevice] = useState<Device | null>(null);
  const [producerTransport, setProducerTransport] = useState<Transport | null>(null);
  const [consumerTransport, setConsumerTransport] = useState<Transport | null>(null);

  // DEVICE REFS
  const videoSelectRef = useRef<HTMLSelectElement | null>(null);
  const audioSelectRef = useRef<HTMLSelectElement | null>(null);

  // AVAILABLE DEVICES
  const [localAudioDevices, setLocalAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [localVideoDevices, setLocalVideoDevices] = useState<MediaDeviceInfo[]>([]);

  // VIDEO ELEMENT STATES
  const [localMedia, setLocalMedia] = useState<{ type: string; stream: MediaStream }[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<{ id: string; stream: MediaStream }[]>([]);

  // VIDEO ELEMENT MEMOS
  const localMediaEl = useMemo(() => {
    return localMedia.map(({ stream, type }) => (
      <video
        key={stream.id}
        autoPlay
        playsInline
        muted
        className={type === "videoType" ? "rotate-y-180" : ""}
        ref={(video) => {
          if (video) video.srcObject = stream;
        }}
      />
    ));
  }, [localMedia]);

  const remoteMediaEl = useMemo(() => {
    return remoteStreams.map(({ id, stream }) => (
      <video
        key={id}
        autoPlay
        playsInline
        className="rotate-y-180"
        ref={(video) => {
          if (video) video.srcObject = stream;
        }}
      />
    ));
  }, [remoteStreams]);

  // DEVICE SELECT OPTIONS
  const videoOptions = useMemo(() => {
    return localVideoDevices.map((device, index) => (
      <option key={index} value={device.deviceId} className="bg-">
        {device.label}
      </option>
    ));
  }, [localVideoDevices]);

  const audioOptions = useMemo(() => {
    return localAudioDevices.map((device, index) => (
      <option key={index} value={device.deviceId} className="truncate" style={{ maxWidth: "100%" }}>
        {device.label}
      </option>
    ));
  }, [localAudioDevices]);

  // FUNCTIONS
  const getLocalDevices = async () => {
    const devices = await getDevices();

    const audio = [];
    const video = [];
    for (const device of devices) {
      if (device.kind === "audioinput") audio.push(device);
      else if (device.kind === "videoinput") video.push(device);
    }

    setLocalAudioDevices(audio);
    setLocalVideoDevices(video);
  };

  const removeConsumer = (consumerId: string) => {
    console.log("removing a consumer:", consumerId);
    setRemoteStreams((prev) => {
      return prev.filter((media) => {
        if (media.id === consumerId) {
          media.stream.getTracks().forEach((track) => track.stop());
          return false;
        }
        return true;
      });
    });
  };

  const consume = useCallback(
    async (producerId: string) => {
      if (!consumerTransport || !mediasoupDevice) {
        console.log("No consumer transport or mediasoup device");
        console.log("[DEBUG] consumer Transport:", consumerTransport);
        console.log("[DEBUG] media device:", mediasoupDevice);
        console.log("[DEBUG] consumer transport connection state:", consumerTransport.connectionState);
        console.log("");
        return;
      }

      const res = await getConsumeStream(producerId, mediasoupDevice, consumerTransport);
      if (!res) {
        console.warn("Failed to consume media");
        return;
      }

      const stream = new MediaStream();
      stream.addTrack(res.consumer.track);
      setRemoteStreams((prev) => [...prev, { id: res.consumer.id, stream }]);

      res.consumer.on("trackended", () => {
        console.log("track ended");
        removeConsumer(res.consumer.id);
      });

      res.consumer.on("transportclose", () => {
        console.log("consumer transport closed");
        removeConsumer(res.consumer.id);
      });
    },
    [consumerTransport, mediasoupDevice]
  );

  const clean = useCallback(() => {
    consumerTransport.close();
    producerTransport.close();
    socket.removeAllListeners("disconnect");
    socket.removeAllListeners("new_producers");
    socket.removeAllListeners("consumer_closed");
  }, [consumerTransport, producerTransport]);

  const exit = useCallback(
    (offline = false) => {
      if (!offline) {
        socketRequest("exit_room")
          .then((e) => console.log(e))
          .catch((e) => console.warn(e))
          .finally(() => clean());
      } else {
        clean();
      }
    },
    [clean]
  );

  // INIT
  useEffect(() => {
    (async () => {
      await getLocalDevices();
    })();
  }, []);

  // JOIN AND CREATE DEVICE
  useEffect(() => {
    (async () => {
      if (!name) throw new Error("No name provided");
      if (!mediasoupDevice) {
        const json = await socketRequest("join", { name });
        console.log("Joined Room: ", json);

        const { rtpCapabilities, error } = (await socketRequest("get_router_rtp_capabilities")) as {
          rtpCapabilities: RtpCapabilities;
          error?: unknown;
        };

        if (error) {
          console.error(error);
          return;
        }

        const device = await createMediasoupDevice(rtpCapabilities);
        if (!device) {
          console.error("Failed to create device");
          return;
        }
        setMediasoupDevice(device);
      }
    })();
  }, [mediasoupDevice, name]);

  // INIT TRANSPORTS
  useEffect(() => {
    (async () => {
      if (mediasoupDevice && !producerTransport && !consumerTransport) {
        const res = await initTransport(mediasoupDevice);
        if (!res) {
          console.error("Failed to initialize transports");
          return;
        }

        setProducerTransport(res.pTransport);
        setConsumerTransport(res.cTransport);

        socket.emit("get_producers");
      }
    })();
  }, [consumerTransport, mediasoupDevice, producerTransport]);

  // INIT SOCKETS
  useEffect(() => {
    if (!consumerTransport) {
      console.error("No consumer transport");
      return;
    }

    socket.on("consumer_closed", ({ consumerId }: { consumerId: string }) => {
      console.log("closing consumer:", consumerId);
      // TODO: remove consumer
    });

    socket.on("new_producers", async (data: { producerId: string; producerSocketId: string }[]) => {
      console.log("New producers:", data);
      for (const { producerId } of data) {
        await consume(producerId);
      }
    });

    socket.on("disconnect", () => {
      exit(true);
    });

    return () => {
      clean();
    };
  }, [clean, consume, consumerTransport, exit]);

  return (
    <>
      {/* CONTROL BAR */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-highlight px-2 py-2 rounded-full flex items-center gap-x-3 transition-all"
        onClick={() => {
          document.getElementsByTagName("canvas")[0].focus();
        }}
      >
        <div
          onClick={() => setMicState(!micState)}
          className="cursor-pointer hover:scale-110 transition-all hover:bg-elevated-highlight p-2 rounded-full"
        >
          {micState ? (
            <FaMicrophone size={25} fill="#d9dbe1" className="hover:fill-white" />
          ) : (
            <FaMicrophoneSlash size={25} fill="#ed2c3f" />
          )}
        </div>

        <div
          onClick={() => setCameraState(!cameraState)}
          className="cursor-pointer hover:scale-110 transition-all hover:bg-elevated-highlight p-2 rounded-full"
        >
          {cameraState ? (
            <BsFillCameraVideoFill size={25} fill="#d9dbe1" className="hover:fill-white" />
          ) : (
            <BsFillCameraVideoOffFill size={25} fill="#ed2c3f" />
          )}
        </div>

        <div
          onClick={() => setScreenState(!screenState)}
          className="cursor-pointer hover:scale-110 transition-all hover:bg-elevated-highlight p-2 rounded-full"
        >
          {screenState ? (
            <MdScreenShare size={25} fill="#d9dbe1" className="hover:fill-white" />
          ) : (
            <MdStopScreenShare size={25} stroke="#d9dbe1" color="#d9dbe1" fill="#ed2c3f" />
          )}
        </div>

        <div className="w-px h-6 bg-white/30"></div>

        <div
          className="cursor-pointer hover:scale-110 transition-all hover:bg-elevated-highlight p-2 rounded-full"
          onClick={() => {
            setSettingState(!settingState);
          }}
        >
          <FaGear size={23} fill="#d9dbe1" className="hover:fill-white" />
        </div>

        <dialog
          className="bottom-full -right-full -translate-y-1 max-w-[400px] overflow-hidden rounded-md bg-highlight py-2 px-4 pb-4"
          open={settingState}
          onFocusCapture={() => {
            document.getElementsByTagName("canvas")[0].focus();
          }}
        >
          {/* <div className="p-4"> */}
          <p className="font-semibold text-xl mb-4">Devices</p>
          <div className="mt-2 flex gap-x-2">
            <p className="text-md font-medium">Camera: </p>
            <select
              ref={videoSelectRef}
              className="rounded-full px-3 py-1 border border-text-base flex-grow min-w-0 truncate outline-none"
            >
              {videoOptions}
            </select>
          </div>

          <div className="mt-4 flex gap-x-2">
            <p className="font-medium text-md">Microphone: </p>
            <select
              ref={audioSelectRef}
              className="rounded-full px-3 py-1 border border-text-base flex-grow min-w-0 truncate outline-none"
            >
              {audioOptions}
            </select>
          </div>
          {/* </div> */}
        </dialog>
      </div>

      {/*  MEDIA ELEMENTS */}
      <div className="absolute top-0 right-0 mt-4 mr-2">
        <div className="w-[280px] h-[180px] rounded-lg bg-[#242424]">
          <span className="absolute bottom-0 left-0 p-3">
            {micState ? <FaMicrophone size={20} fill="#d9dbe1" /> : <FaMicrophoneSlash size={25} fill="#ed2c3f" />}
          </span>
          {cameraState ? localMediaEl : <BsCameraVideoOff className="w-full h-full p-8" fill="#a0a2b3" />}
        </div>

        {remoteMediaEl}
      </div>
    </>
  );
};

export default Videochat;
