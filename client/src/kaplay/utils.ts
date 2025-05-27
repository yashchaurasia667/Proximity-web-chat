import { io } from "socket.io-client";

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

const socket = io("http://localhost:9000");

export { throttle, socket };
