import type { KAPLAYCtx, Vec2 } from "kaplay";

export default function makePlayer(k: KAPLAYCtx, posVec2: Vec2) {
  let vel = k.vec2(0, 0);

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

  const movePlayer = (key: string, anim: string, velocity: Vec2) => {
    player.onKeyPress(key, () => {
      k.debug.log(`${key} pressed`);
      vel = velocity;
      player.play(anim);
    });
    player.onKeyRelease(key, () => {
      k.debug.log(`${key} released`);
      if (vel == velocity) {
        vel = k.vec2(0, 0);
        player.play(`${anim}-idle`);
      }
    });
  };

  movePlayer("w", "walk-up", k.vec2(0, -200));
  movePlayer("up", "walk-up", k.vec2(0, -200));

  movePlayer("s", "walk-down", k.vec2(0, 200));
  movePlayer("down", "walk-down", k.vec2(0, 200));

  movePlayer("a", "walk-left", k.vec2(-200, 0));
  movePlayer("left", "walk-left", k.vec2(-200, 0));

  movePlayer("d", "walk-right", k.vec2(200, 0));
  movePlayer("right", "walk-right", k.vec2(200, 0));

  k.onUpdate(() => {
    player.move(vel);
  });

  return player;
}
