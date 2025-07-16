import React, { useMemo, useState } from "react";

import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { BsFillCameraVideoFill, BsFillCameraVideoOffFill } from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";

interface props {
  mic: boolean;
  camera: boolean;
  screen: boolean;
}

const Videochat = ({ mic = false, camera = false, screen = false }: props) => {
  // COMPONENT STATES
  const [micState, setMicState] = useState(mic);
  const [cameraState, setCameraState] = useState(camera);
  const [screenState, setScreenState] = useState(screen);

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
      </div>

      <div className="absolute top-0 right-0">
        {localMediaEl}
        {remoteMediaEl}
      </div>
    </>
  );
};

export default Videochat;
