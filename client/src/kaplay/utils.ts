const throttle = (callback: () => void, delay: number) => {
  let wait = false;
  if (wait) return;
  callback();
  wait = true;
  setTimeout(() => {
    wait = false;
  }, delay);
};

export { throttle };
