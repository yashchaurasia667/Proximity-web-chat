import React, { useEffect, useMemo, useRef, useState } from "react";

import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { BsFillCameraVideoFill, BsFillCameraVideoOffFill } from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { FaGear } from "react-icons/fa6";
import { getDevices } from "../sfu/helper";

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

  useEffect(() => {
    (async () => {
      await getLocalDevices();
    })();
  }, []);

  const toggleSettings = () => {
    setSettingState(!settingState);
  };

  return (
    <>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-highlight px-2 py-2 rounded-full flex items-center gap-x-3 transition-all">
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
          onClick={toggleSettings}
        >
          <FaGear size={23} fill="#d9dbe1" className="hover:fill-white" />
        </div>

        <dialog
          className="bottom-full -right-full -translate-y-1 max-w-[400px] overflow-hidden rounded-md bg-highlight py-2 px-4 pb-4"
          open={settingState}
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
      <div className="absolute top-0 right-0">
        {localMediaEl}
        {remoteMediaEl}
      </div>
    </>
  );
};

export default Videochat;
