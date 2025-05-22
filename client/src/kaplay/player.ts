import type { Vec2, KAPLAYCtx } from "kaplay";

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

  k.onClick("main_area", () => {
    const clickPos = k.mousePos();

    const destMarker = k.add([k.pos(clickPos), k.circle(8)]);
    // player.moveTo(clickPos);
    movePlayerMouse(clickPos);
    destMarker.destroy();
  });

  return player;
}
