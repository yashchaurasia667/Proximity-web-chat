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

export { throttle, socket };
