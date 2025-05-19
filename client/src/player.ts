import type { KAPLAYCtx, Vec2 } from "kaplay";

export default function makePlayer(k: KAPLAYCtx, posVec2: Vec2, speed: number) {
  const player = k.add([
    k.sprite("player", { anim: "walk-down-idle" }),
    k.scale(8),
    k.anchor("center"),
    k.area({ shape: new k.Rect(k.vec2(0), 5, 10) }),
    k.body(),
    k.pos(posVec2),
    "player",
    {
      direction: k.vec2(0, 0),
      directionName: "walk-down",
    },
  ]);
  // TODO: player controls

  return player;
}
