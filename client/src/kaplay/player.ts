import type { Vec2, KAPLAYCtx } from "kaplay";

export default function makePlayer(k: KAPLAYCtx, posVec2: Vec2) {
  // const vel = k.vec2(0, 0);

  const player = k.add([
    k.sprite("player", { anim: "walk-down-idle" }),
    k.scale(2.5),
    k.anchor("center"),
    k.area({ shape: new k.Rect(k.vec2(0), 5, 10) }),
    k.body(),
    k.pos(posVec2),
    k.area(),
    "player",
    {
      direction: k.vec2(0, 0),
      directionName: "walk-down",
    },
  ]);
  return player;
}
