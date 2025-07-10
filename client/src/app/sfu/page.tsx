"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import { RtpCapabilities, Device, Transport, Consumer, Producer, ProducerOptions } from "mediasoup-client/types";
// import * as mediasoupClient from "mediasoup-client";

import { copyURL, getDevices, createMediasoupDevice, socket, socketRequest, initTransport } from "./helper";

const SFU = () => {
  const buttonClass = "bg-white text-black font-semibold px-4 py-1 rounded-md";
  const [name, setName] = useState("");
  const [localVideoDevices, setLocalVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [localAudioDevices, setLocalAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [localMedia, setLocalMedia] = useState<MediaStream[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [producerTransport, setProducerTransport] = useState<Transport | null>(null);
  const [consumerTransport, setConsumerTransport] = useState<Transport | null>(null);
  const [mediasoupDevice, setMediasoupDevice] = useState<Device | null>(null);
  const [consumers, setConsumers] = useState<Map<string, Consumer>>(new Map());
  const [producers, setProducers] = useState<Map<string, Producer>>(new Map());
  const [producerLabel, setProducerLabel] = useState<Map<string, string>>(new Map());

  const videoSelectRef = useRef<HTMLSelectElement | null>(null);
  const audioSelectRef = useRef<HTMLSelectElement | null>(null);

  const localMediaEl = useMemo(() => {
    return localMedia.map((stream, index) => (
      <video
        key={index}
        autoPlay
        playsInline
        muted
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
      prev.delete(producerId!);
      return prev;
    });

    if (type !== "audioType") {
      // let elem = document.getElementById(producer_id);
      // elem.srcObject.getTracks().forEach(function (track) {
      //   track.stop();
      // });
      // elem.parentNode.removeChild(elem);
    }
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

    console.log("Media constraints:", mediaConstraints);
    try {
      const stream = screen
        ? await navigator.mediaDevices.getDisplayMedia()
        : await navigator.mediaDevices.getUserMedia(mediaConstraints);
      console.log(navigator.mediaDevices.getSupportedConstraints());

      const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
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

      const producer = await producerTransport?.produce(params);
      if (producer) {
        console.log("Producer:", producer);
        setProducers((prev) => prev.set(producer.id, producer));

        if (!audio) {
          setLocalMedia((prev) => [...prev, stream]);
        }

        producer.on("trackended", () => {
          closeProducer(type);
        });

        producer.on("@close", () => {
          console.log("Closing producer");
          if (!audio) {
            for (const track of stream.getTracks()) {
              track.stop();
            }
          }

          setProducers((prev) => {
            prev.delete(producer.id);
            return prev;
          });
        });
      }
    } catch (error) {
      console.error("Produce Error:", error);
    }
  };

  // const removeConsumer = (consumerId: string) => {
  // };

  const exit = (offline = false) => {
    const clean = () => {
      consumerTransport?.close();
      producerTransport?.close();
      socket.off("disconnect");
      socket.off("new_producers");
      socket.off("consumer_closed");
    };

    if (!offline) {
      socketRequest("exit_room")
        .then((e) => console.log(e))
        .catch((e) => console.warn(e))
        .finally(() => clean());
    } else {
      clean();
    }
  };

  // INIT
  useEffect(() => {
    (async () => {
      const nm = window.localStorage.getItem("name");
      if (nm) setName(nm);

      await getLocalDevices();
    })();

    socket.on("consumer_closed", ({ consumerId }: { consumerId: string }) => {
      console.log("closing consumer:", consumerId);
      // TODO: REMOVE CONSUMER
    });

    socket.on("new_producers", async (data: { producerId: string; producerSocketId: string }[]) => {
      console.log("New producers:", data);

      // for (const { producerId } of data) {
      // TODO: CONSUME
      // await consume(producerId);
      // }
    });

    socket.on("disconnect", () => {
      exit(true);
    });
  }, []);

  // JOIN
  useEffect(() => {
    (async () => {
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
      } else {
        const res = await initTransport(mediasoupDevice);

        if (!res) {
          console.error("Failed to initialize transports");
          return;
        }

        const { pTransport, cTransport } = res;
        setProducerTransport(pTransport);
        setConsumerTransport(cTransport);

        socket.emit("get_producers");
      }
    })();
  }, [name, mediasoupDevice]);

  return (
    <div>
      {/* CONTROLS */}
      <div className="flex gap-x-4 mt-4 ml-6">
        <button className={buttonClass}>Exit</button>
        <button className={buttonClass} onClick={copyURL}>
          Copy url
        </button>
        {/* <button className={buttonClass} onClick={getLocalDevices}>
          Enumerate Devices
        </button> */}
        <button className={buttonClass} onClick={() => produce("audioType", audioSelectRef.current?.value)}>
          toggle audio
        </button>
        <button className={buttonClass} onClick={() => produce("videoType", videoSelectRef.current?.value)}>
          toggle video
        </button>
        <button className={buttonClass} onClick={() => produce("screenType")}>
          toggle screen
        </button>

        <select ref={videoSelectRef}>{videoOptions}</select>
        <select ref={audioSelectRef}>{audioOptions}</select>
      </div>

      {/* LOCAL MEDIA */}
      <div className="flex gap-x-4">{localMediaEl}</div>
    </div>
  );
};

export default SFU;
