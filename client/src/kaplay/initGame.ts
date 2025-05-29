import makeKaplayCtx from "./kaplayCtx";
import Lobby from "./lobby";

export default async function initGame(spriteUrl: string) {
  const k = makeKaplayCtx();
  const SPEED = 300;

  console.log(spriteUrl);
  // player sprite

  if (spriteUrl == "adventurer_female") {
    k.loadSprite("player", "/sprites/adventurer_female/walk.png", {
      sliceX: 8,
      sliceY: 6,
      anims: {
        "walk-down-idle": 0,
        "walk-down": { from: 0, to: 7, loop: true },
        "walk-left": { from: 8, to: 15, loop: true },
        "walk-left-idle": 10,
        "walk-up": { from: 24, to: 31, loop: true },
        "walk-up-idle": 24,
        "walk-right": { from: 40, to: 47, loop: true },
        "walk-right-idle": 42,
      },
    });
  } else if (spriteUrl == "adventurer_male") {
    k.loadSprite("player", "/sprites/adventurer_male/walk.png", {
      sliceX: 8,
      sliceY: 6,
      anims: {
        "walk-down-idle": 0,
        "walk-down": { from: 0, to: 8, loop: true },
        "walk-left": { from: 8, to: 15, loop: true },
        "walk-left-idle": 8,
        "walk-up": { from: 16, to: 23, loop: true },
        "walk-up-idle": 16,
        "walk-right": { from: 24, to: 31, loop: true },
        "walk-right-idle": 24,
      },
    });
  } else {
    k.loadSprite("player", "/sprites/gameboy/walk.png", {
      sliceX: 4,
      sliceY: 8,
      anims: {
        "walk-down-idle": 0,
        "walk-down": { from: 0, to: 3, loop: true },
        "walk-left": { from: 8, to: 11, loop: true },
        "walk-left-idle": 8,
        "walk-up": { from: 16, to: 19, loop: true },
        "walk-up-idle": 16,
        "walk-right": { from: 24, to: 27, loop: true },
        "walk-right-idle": 24,
      },
    });
  }

  // background
  k.loadSprite("main_area", "/areas/main_area.png");
  const map = k.add([
    k.sprite("main_area"),
    k.area(),
    k.anchor("center"),
    k.pos(k.center()),
    k.width() > k.height()
      ? k.sprite("main_area", { height: k.height() })
      : k.sprite("main_area", { width: k.width() }),
    "main_area",
  ]);

  k.onResize(() => {
    if (k.width() > k.height()) map.height = k.height();
    else map.width = k.width();
  });

  // PLAYER & LOBBY
  new Lobby(k, SPEED, "player");
}
