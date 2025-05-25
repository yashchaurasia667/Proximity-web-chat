import makeKaplayCtx from "./kaplayCtx";
import makePlayer from "./player";

import { GameObj, Vec2 } from "kaplay";
import { Socket } from "socket.io-client";

export default async function initGame(socket: Socket) {
  const k = makeKaplayCtx();
  const roomMembers: { id: string; player: GameObj } = [];
  const SPEED = 150;

  // player sprite
  k.loadSprite("player", "/sprites/gameboy/player.png", {
    sliceX: 4,
    sliceY: 8,
    anims: {
      "walk-down-idle": 0,
      "walk-down": { from: 0, to: 3, loop: true },
      // "walk-left-down": { from: 4, to: 7, loop: true },
      // "walk-left-down-idle": 4,
      "walk-left": { from: 8, to: 11, loop: true },
      "walk-left-idle": 8,
      // "walk-left-up": { from: 12, to: 15, loop: true },
      // "walk-left-up-idle": 12,
      "walk-up": { from: 16, to: 19, loop: true },
      "walk-up-idle": 16,
      // "walk-right-up": { from: 20, to: 23, loop: true },
      // "walk-right-up-idle": 20,
      "walk-right": { from: 24, to: 27, loop: true },
      "walk-right-idle": 24,
      // "walk-right-down": { from: 28, to: 31, loop: true },
      // "walk-right-down-idle": 28,
    },
  });

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

  // PLAYER CONTROLS
  const player = makePlayer(k, k.vec2(k.center()));

  const movePlayerKeyboard = (key: string, anim: string, velocity: Vec2) => {
    player.onKeyPress(key, () => {
      // k.debug.log(`${key} pressed`);
      player.vel = velocity;
      socket.emit("movement", player.pos);
      player.play(anim);
    });
    player.onKeyRelease(key, () => {
      // k.debug.log(`${key} released`);
      if (player.vel == velocity) {
        player.vel = k.vec2(0, 0);
        socket.emit("movement", player.pos);
        player.play(`${anim}-idle`);
      }
    });
  };

  const movePlayerMouse = (clickPos: Vec2) => {
    const distance = clickPos.sub(player.pos);
    // k.debug.log(`${Math.abs(distance.x)}  ${Math.abs(distance.y)}`);

    if (Math.abs(distance.y) < Math.abs(distance.x)) {
      // distance.y < 0 ? player.play("walk-up") : player.play("walk-down");
      player.moveTo(player.pos.x, clickPos.y);
      // distance.x < 0 ? player.play("walk-left") : player.play("walk-right");
      player.moveTo(clickPos.x, player.pos.y);
    } else {
      player.moveTo(clickPos.x, player.pos.y);
      player.moveTo(player.pos.x, clickPos.y);
    }
  };

  movePlayerKeyboard("w", "walk-up", k.vec2(0, -SPEED));
  movePlayerKeyboard("up", "walk-up", k.vec2(0, -SPEED));

  movePlayerKeyboard("s", "walk-down", k.vec2(0, SPEED));
  movePlayerKeyboard("down", "walk-down", k.vec2(0, SPEED));

  movePlayerKeyboard("a", "walk-left", k.vec2(-SPEED, 0));
  movePlayerKeyboard("left", "walk-left", k.vec2(-SPEED, 0));

  movePlayerKeyboard("d", "walk-right", k.vec2(SPEED, 0));
  movePlayerKeyboard("right", "walk-right", k.vec2(SPEED, 0));

  k.onUpdate(() => {
    player.move(player.vel);
    // socket.emit("movement", player.vel);
  });

  map.onClick(() => {
    const clickPos = k.mousePos();

    const destMarker = k.add([k.pos(clickPos), k.circle(8)]);
    movePlayerMouse(clickPos);
    destMarker.destroy();
  });
}
