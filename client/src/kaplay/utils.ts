import { io } from "socket.io-client";

const throttle = (callback: () => void, delay: number) => {
  let wait = false;
  if (wait) return;
  callback();
  wait = true;
  setTimeout(() => {
    wait = false;
  }, delay);
};

const socket = io("http://localhost:9000");

export { throttle, socket };
