import { io } from "socket.io-client";

const gameSocket = io("https://localhost:9000/game");

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

export { throttle, gameSocket };
