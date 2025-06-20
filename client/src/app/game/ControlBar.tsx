import React, { useState } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import {
  BsFillCameraVideoFill,
  BsFillCameraVideoOffFill,
} from "react-icons/bs";

interface props {
  mic: boolean;
  camera: boolean;
}

const ControlBar = ({ mic, camera }: props) => {
  const [micState, setMicState] = useState(mic);
  const [cameraState, setCameraState] = useState(camera);
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-highlight px-6 py-4 rounded-full flex gap-x-4">
      <div
        onClick={() => setMicState(!micState)}
        className="cursor-pointer hover:scale-110 transition-all"
      >
        {micState ? (
          <FaMicrophone size={25} fill="#d9dbe1" className="hover:fill-white" />
        ) : (
          <FaMicrophoneSlash size={25} fill="#ed2c3f" />
        )}
      </div>

      <div
        onClick={() => setCameraState(!cameraState)}
        className="cursor-pointer hover:scale-110 transition-all"
      >
        {cameraState ? (
          <BsFillCameraVideoFill
            size={25}
            fill="#d9dbe1"
            className="hover:fill-white"
          />
        ) : (
          <BsFillCameraVideoOffFill size={25} fill="#ed2c3f" />
        )}
      </div>
    </div>
  );
};

export default ControlBar;
