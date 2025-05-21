import type { KAPLAYCtx, Vec2 } from "kaplay";

export default function makePlayer(k: KAPLAYCtx, posVec2: Vec2, speed: number) {
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

  const movePlayerKeyboard = (key: string, anim: string, velocity: Vec2) => {
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

  movePlayerKeyboard("w", "walk-up", k.vec2(0, -speed));
  movePlayerKeyboard("up", "walk-up", k.vec2(0, -speed));

  movePlayerKeyboard("s", "walk-down", k.vec2(0, speed));
  movePlayerKeyboard("down", "walk-down", k.vec2(0, speed));

  movePlayerKeyboard("a", "walk-left", k.vec2(-speed, 0));
  movePlayerKeyboard("left", "walk-left", k.vec2(-speed, 0));

  movePlayerKeyboard("d", "walk-right", k.vec2(speed, 0));
  movePlayerKeyboard("right", "walk-right", k.vec2(speed, 0));

  k.onUpdate(() => {
    player.move(vel);
  });

  k.onClick("main_area", (e) => {
    k.debug.log(player.pos);
    console.log(e);
  });

  return player;
}
