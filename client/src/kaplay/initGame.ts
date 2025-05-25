import makeKaplayCtx from "./kaplayCtx";
import Member from "./player";

import { Socket } from "socket.io-client";

type roomMember = {
  id: string;
  player: Member;
};

export default async function initGame(socket: Socket) {
  // const roomMembers: { id: string; player: GameObj } = [];
  const roomMembers: roomMember[] = [];

  const k = makeKaplayCtx();
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
  const player = new Member("player", k, SPEED, socket);
  roomMembers.push({ id: player.id, player: player });
}
