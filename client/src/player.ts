import type { KAPLAYCtx, Vec2 } from "kaplay";

export default function makePlayer(k: KAPLAYCtx, posVec2: Vec2, speed: number) {
  let velX = 0, velY = 0;

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

  player.onKeyDown("w", () => {
    player.move(0, -200);
    player.play("walk-up")
  });
  player.onKeyDown("s", () => {
    player.move(0, 200);
    player.play("walk-down")
  });
  player.onKeyDown("a", () => {
    player.move(-200, 0);
    player.play("walk-left")
  });
  player.onKeyDown("d", () => {
    player.move(200, 0);
    player.play("walk-right")
  });

  // k.onUpdate(()=> {
  //   player.move(velX, velY)
  // })

  return player;
}
