import kaplay from "kaplay";

// const canvas = document.getElementById("game");
// if (!(canvas instanceof HTMLCanvasElement)) {
//   throw new Error("Canvas element with id 'game' not found or is not a <canvas>.");
// }

export default function makeKaplayCtx() {
  return kaplay({
    global: false,
    pixelDensity: 2,
    touchToMouse: true,
    debug: true,    //TODO: set to false in production
    debugKey: "`",
    canvas: document.getElementById("game") as HTMLCanvasElement
    // canvas: canvas
  })
}