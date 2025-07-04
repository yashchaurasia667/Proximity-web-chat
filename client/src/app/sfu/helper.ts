export const getLocalStream = async () => {
  console.log("Fetching local user media");

  const constraints = {
    video: true,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  return stream;
};
