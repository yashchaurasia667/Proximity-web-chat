"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RtpCapabilities, Device, Transport, Consumer, Producer, ProducerOptions } from "mediasoup-client/types";
// import * as mediasoupClient from "mediasoup-client";

import {
  copyURL,
  getDevices,
  createMediasoupDevice,
  socket,
  socketRequest,
  initTransport,
  getConsumeStream,
} from "./helper";

const SFU = () => {
  const buttonClass = "bg-white text-black font-semibold px-4 py-1 rounded-md";

  const [videoOn, setVideoOn] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);

  const [name, setName] = useState("");
  const [localVideoDevices, setLocalVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [localAudioDevices, setLocalAudioDevices] = useState<MediaDeviceInfo[]>([]);

  const [localMedia, setLocalMedia] = useState<{ type: string; stream: MediaStream }[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<{ id: string; stream: MediaStream }[]>([]);

  const [producerTransport, setProducerTransport] = useState<Transport | null>(null);
  const [consumerTransport, setConsumerTransport] = useState<Transport | null>(null);
  const [mediasoupDevice, setMediasoupDevice] = useState<Device | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [consumers, setConsumers] = useState<Map<string, Consumer>>(new Map());
  const [producers, setProducers] = useState<Map<string, Producer>>(new Map());
  const [producerLabel, setProducerLabel] = useState<Map<string, string>>(new Map());

  const videoSelectRef = useRef<HTMLSelectElement | null>(null);
  const audioSelectRef = useRef<HTMLSelectElement | null>(null);

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

  const videoOptions = useMemo(() => {
    return localVideoDevices.map((device, index) => (
      <option key={index} value={device.deviceId}>
        {device.label}
      </option>
    ));
  }, [localVideoDevices]);

  const audioOptions = useMemo(() => {
    return localAudioDevices.map((device, index) => (
      <option key={index} value={device.deviceId}>
        {device.label}
      </option>
    ));
  }, [localAudioDevices]);

  const remoteMediaEl = useMemo(() => {
    return remoteStreams.map(({ id, stream }) => (
      <video
        key={id}
        autoPlay
        playsInline
        muted
        className="bg-black"
        ref={(video) => {
          console.log(stream.id);
          if (video) {
            video.srcObject = stream;
            video
              .play()
              .then(() => (video.muted = false))
              .catch((err) => console.error("play error", err));
          }
        }}
      ></video>
    ));
  }, [remoteStreams]);

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

  const closeProducer = (type: string) => {
    if (!producerLabel.has(type)) {
      console.log("There is no producer of this type ", type);
      return;
    }

    const producerId = producerLabel.get(type);
    console.log("close producer", producerId);

    socket.emit("producer_closed", { producerId });
    producers.get(producerId!)?.close();

    setProducers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(producerId!);
      return newMap;
    });

    if (type !== "audioType") {
      setLocalMedia((prev) => {
        return prev.filter((media) => media.type !== type);
      });
    }

    setProducerLabel((prev) => {
      const newMap = new Map(prev);
      newMap.delete(type);
      return newMap;
    });
  };

  const produce = async (type: string, deviceId: string = "") => {
    let mediaConstraints = {};
    let audio = false;
    let screen = false;

    switch (type) {
      case "audioType":
        mediaConstraints = {
          audio: {
            deviceId: deviceId,
          },
          video: false,
        };
        audio = true;
        break;
      case "videoType":
        mediaConstraints = {
          audio: false,
          video: {
            width: {
              min: 640,
              ideal: 1920,
            },
            height: {
              min: 400,
              ideal: 1080,
            },
            deviceId: deviceId,
          },
        };
        break;
      case "screenType":
        mediaConstraints = false;
        screen = true;
        break;
      default:
        return;
    }

    if (!mediasoupDevice?.canProduce("video") && !audio) {
      console.error("Cannot produce video");
      return;
    }
    if (producerLabel.has(type)) {
      console.log("Producer already exists for this type ", type);
      return;
    }
    if (!producerTransport) {
      console.error("no producer transport");
      return;
    }

    // console.log("Media constraints:", mediaConstraints);
    try {
      const stream = screen
        ? await navigator.mediaDevices.getDisplayMedia()
        : await navigator.mediaDevices.getUserMedia(mediaConstraints);
      // console.log(navigator.mediaDevices.getSupportedConstraints());

      const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
      if (!track) throw new Error("No media track available");
      const params: ProducerOptions = { track };

      if (!audio && !screen) {
        params.encodings = [
          {
            rid: "r0",
            maxBitrate: 100000,
            //scaleResolutionDownBy: 10.0,
            scalabilityMode: "S1T3",
          },
          {
            rid: "r1",
            maxBitrate: 300000,
            scalabilityMode: "S1T3",
          },
          {
            rid: "r2",
            maxBitrate: 900000,
            scalabilityMode: "S1T3",
          },
        ];
        params.codecOptions = {
          videoGoogleStartBitrate: 1000,
        };
      }

      const producer = await producerTransport.produce(params);
      if (!producer) {
        console.log("no producer");
        return;
      }
      // console.log("Producer:", producer);
      setProducers((prev) => {
        const newMap = new Map(prev);
        newMap.set(producer.id, producer);
        return newMap;
      });

      if (!audio) {
        // console.log(stream);
        setLocalMedia((prev) => [...prev, { type, stream }]);
        // setLocalMedia();
      }

      producer.on("trackended", () => {
        closeProducer(type);
      });

      producer.on("@close", () => {
        console.log("Closing producer");
        // if (!audio) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        // }

        setProducers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(producer.id);
          return newMap;
        });
      });

      setProducerLabel((prev) => {
        const newMap = new Map(prev);
        newMap.set(type, producer.id);
        return newMap;
      });
    } catch (error) {
      console.error("Produce Error:", error);
    }
  };

  const removeConsumer = (consumerId: string) => {
    console.log("removing a consumer", consumerId);
    setRemoteStreams((prev) => {
      return prev.filter((media) => {
        if (media.id === consumerId) {
          media.stream.getTracks().forEach((track) => track.stop());
          return false;
        }
        return true;
      });
    });

    setConsumers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(consumerId);
      return newMap;
    });
  };

  const consume = useCallback(
    async (producerId: string) => {
      if (!mediasoupDevice || !consumerTransport) {
        console.log("consumer Transport:", consumerTransport);
        console.log("media device:", mediasoupDevice);
        console.log("consumer transport connection state:", consumerTransport?.connectionState);

        console.log("No mediasoup device or consumer Transport");
        console.log("");
        return;
      }

      const res = await getConsumeStream(producerId, mediasoupDevice, consumerTransport);
      if (!res) {
        console.log("Failed to consume media");
        return;
      }

      // console.log("Remote consumer created:", res.consumer.id);
      // console.log("Remote stream tracks:", res.stream.getTracks());
      // res.stream.getTracks().forEach((t) => console.log("Track:", t.kind, "enabled:", t.enabled));
      // console.log("stream active", res.stream.active);

      // console.log("remote stream id:", res.stream.id);
      const stream = new MediaStream();
      stream.addTrack(res.consumer.track);
      setRemoteStreams((prev) => [...prev, { id: res.consumer.id, stream: stream }]);

      res.consumer.on("trackended", () => {
        console.log("track ended");
        removeConsumer(res.consumer.id);
      });

      res.consumer.on("transportclose", () => {
        console.log("consumer transport closed");
        removeConsumer(res.consumer.id);
      });

      setConsumers((prev) => {
        // prev.set(res.consumer.id, res.consumer)
        const newMap = new Map(prev);
        newMap.set(res.consumer.id, res.consumer);
        return newMap;
      });
    },
    [consumerTransport, mediasoupDevice]
  );

  const clean = useCallback(() => {
    consumerTransport?.close();
    producerTransport?.close();
    socket.off("disconnect");
    socket.off("new_producers");
    socket.off("consumer_closed");
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
      const nm = window.localStorage.getItem("name");
      if (nm) setName(nm);

      await getLocalDevices();
    })();
  }, []);

  // JOIN
  useEffect(() => {
    (async () => {
      if (!name) return;

      if (!mediasoupDevice) {
        const json = await socketRequest("join", { name });
        console.log("Joined room", json);

        const data = (await socketRequest("get_router_rtp_capabilities")) as {
          rtpCapabilities: RtpCapabilities;
          error?: unknown;
        };
        if (data.error) {
          console.error(data.error);
          return;
        }

        const dev = await createMediasoupDevice(data.rtpCapabilities);
        if (!dev) {
          console.error("Failed to create Device");
          return;
        }

        setMediasoupDevice(dev);
      } else if (mediasoupDevice && !consumerTransport) {
        // console.log("Creating transports");
        // console.log(mediasoupDevice);
        const res = await initTransport(mediasoupDevice);
        if (!res) {
          console.error("Failed to initialize transports");
          return;
        }
        // console.log(res);

        setProducerTransport(res.pTransport);
        setConsumerTransport(res.cTransport);

        socket.emit("get_producers");
      }
    })();
  }, [name, mediasoupDevice, consumerTransport]);

  // INIT SOCKETS
  useEffect(() => {
    const handleConsumerClosed = ({ consumerId }: { consumerId: string }) => {
      console.log("closing consumer:", consumerId);
      // TODO: REMOVE CONSUMER
      removeConsumer(consumerId);
    };

    if (consumerTransport) {
      socket.on("consumer_closed", handleConsumerClosed);

      socket.on("new_producers", async (data: { producerId: string; producerSocketId: string }[]) => {
        // if (data.length === 0) return;

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
    }
  }, [clean, consume, consumerTransport, exit]);

  return (
    <div>
      {/* CONTROLS */}
      <div className="flex gap-x-4 my-4 ml-6">
        <button
          className={buttonClass}
          onClick={() => {
            exit();
          }}
        >
          Exit
        </button>
        <button className={buttonClass} onClick={copyURL}>
          Copy url
        </button>
        {/* <button className={buttonClass} onClick={getLocalDevices}>
          Enumerate Devices
        </button> */}
        <button
          className={buttonClass}
          onClick={() => {
            if (!audioOn) produce("audioType", audioSelectRef.current?.value);
            else closeProducer("audioType");
            setAudioOn((prev) => !prev);
          }}
        >
          {audioOn ? "Close mic" : "Open mic"}
        </button>
        <button
          className={buttonClass}
          onClick={() => {
            if (!videoOn) produce("videoType", videoSelectRef.current?.value);
            else closeProducer("videoType");
            setVideoOn((prev) => !prev);
          }}
        >
          {videoOn ? "Close camera" : "Open camera"}
        </button>
        <button
          className={buttonClass}
          onClick={() => {
            if (!screenOn) produce("screenType");
            else closeProducer("screenType");
            setScreenOn((prev) => !prev);
          }}
        >
          {screenOn ? "Close screen" : "Open screen"}
        </button>

        <select ref={videoSelectRef}>{videoOptions}</select>
        <select ref={audioSelectRef}>{audioOptions}</select>
      </div>

      {/* LOCAL MEDIA */}
      <div className="flex gap-x-4">{localMediaEl}</div>

      {/* REMOTE MEDIA */}
      <div className="flex gap-x-4 gap-y-4">{remoteMediaEl}</div>
    </div>
  );
};

export default SFU;
