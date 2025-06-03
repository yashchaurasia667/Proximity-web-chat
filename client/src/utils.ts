import { io } from "socket.io-client";

const socket = io("http://localhost:9000");

let wait = false;
const throttle = (callback: () => void, delay: number) => {
  if (wait) return () => {};
  return () => {
    callback();
    wait = true;

    setTimeout(() => {
      wait = false;
    }, delay);
  };
};

const setupDevice = async () => {
  console.log("Setup invoked");
  try {
    const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const localPlayer = document.getElementById(
      "localVideo"
    ) as HTMLVideoElement | null;

    if (localPlayer) {
      localPlayer.srcObject = stream;
    } else {
      console.log("localPlayer not found");
    }
  } catch (error) {
    console.error("something went wrong", error);
  }
};

export { throttle, socket, setupDevice };
