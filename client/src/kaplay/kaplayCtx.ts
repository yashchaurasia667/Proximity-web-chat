import kaplay from "kaplay";

// const canvas = document.getElementById("game") as HTMLCanvasElement;
// if (!(canvas instanceof HTMLCanvasElement)) {
//   throw new Error("Canvas element with id 'game' not found or is not a <canvas>.");
// }

export default function makeKaplayCtx() {
  // canvas.getContext("2d");
  // const background = new Image();
  // background.src = "/areas/main_area.png";

  return kaplay({
    global: false,
    // pixelDensity: 2,
    touchToMouse: true,
    debug: true, //TODO: set to false in production
    debugKey: "`",
    // canvas: canvas,
    // width: 1920,
    // height: 1080,
    // letterbox: true,
    background: [0, 0, 0, 0],
    maxFPS: 60,
  });
}
