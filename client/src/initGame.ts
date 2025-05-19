import makeKaplayCtx from "./kaplayCtx";
// import makePlayer from "./player";

export default async function initGame() {
  const k = makeKaplayCtx();

  // player sprite
  k.loadSprite("player", "/sprites/gameboy/player.png", {
    sliceX: 4,
    sliceY: 8,
    anims: {
      "walk-down-idle": 0,
      "walk-down": { from: 0, to: 3, loop: true },
      "walk-left-down": { from: 4, to: 7, loop: true },
      "walk-left-down-idle": 4,
      "walk-left": { from: 8, to: 11, loop: true },
      "walk-left-idle": 8,
      "walk-left-up": { from: 12, to: 15, loop: true },
      "walk-left-up-idle": 12,
      "walk-up": { from: 16, to: 19, loop: true },
      "walk-up-idle": 16,
      "walk-right-up": { from: 20, to: 23, loop: true },
      "walk-right-up-idle": 20,
      "walk-right": { from: 24, to: 27, loop: true },
      "walk-right-idle": 24,
      "walk-right-down": { from: 28, to: 31, loop: true },
      "walk-right-down-idle": 28,
    },
  });

  // background
  k.loadSprite("main_area", "/areas/main_area.png");
  const map = k.add([
    k.sprite("main_area"),
    // k.anchor("botleft"),
    k.area(),
    k.pos(0, 0),
  ]);

  console.log(map)

  // k.loadShaderURL("tiledPattern", null, "/shaders/tiledPattern.frag");
  // const tiledBackground = k.add([
  //   k.uvquad(k.width(), k.height()),
  //   k.shader("tiledPattern", () => ({
  //     u_time: k.time() / 20,
  //     u_color1: k.Color.fromHex("#aaea6c"),
  //     u_color2: k.Color.fromHex("#ffffff"),
  //     u_speed: k.vec2(1, -1),
  //     u_aspect: k.width() / k.height(),
  //     u_size: 5,
  //   })),
  //   k.pos(0, 0),
  //   k.fixed(),
  // ]);

  // k.onResize(() => {
  //   tiledBackground.width = k.width();
  //   tiledBackground.height = k.height();
  //   tiledBackground.uniform!.u_aspect = k.width() / k.height()
  // });

  // makePlayer(k, k.vec2(k.center()), 700)
}
