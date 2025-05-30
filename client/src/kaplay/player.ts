import { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { throttle, socket } from "./utils";

export default class Member {
  public id: string;
  public pos: Vec2;
  private name: string;
  private k: KAPLAYCtx;
  private player: GameObj;
  private SPEED: number;

  constructor(
    id: string,
    k: KAPLAYCtx,
    speed: number,
    type: "player" | "remote",
    pos: Vec2,
    name: string,
    sprite: string
  ) {
    this.id = id;
    this.k = k;
    this.SPEED = speed;
    this.pos = pos;
    this.name = name;

    this.player = this.makePlayer(k, pos, sprite);
    // k.onDraw("player", (character) => {
    //   k.drawText({
    //     text: this.name,
    //     size: 24,
    //     font: "pixelated",
    //     color: k.rgb(0, 0, 0),
    //   });
    // });
    if (type == "player") this.enableMovement();
  }

  private makePlayer(k: KAPLAYCtx, posVec2: Vec2, sprite: string) {
    return k.add([
      k.sprite(sprite, { anim: "walk-down-idle" }),
      k.scale(2.5),
      k.anchor("center"),
      k.area({ shape: new k.Rect(k.vec2(0), 5, 10) }),
      // k.body(),
      k.pos(posVec2),
      k.area(),
      "player",
      {
        direction: k.vec2(0, 0),
        directionName: "walk-down",
      },
    ]);
  }

  public moveRemote(pos: Vec2) {
    this.player.moveTo(pos);
  }

  private emitMovement() {
    console.log("emitting movement");
    socket.emit("player_move", {
      id: socket.id,
      pos: this.player.pos,
    });
  }

  private movePlayerKeyboard(key: string, anim: string, velocity: Vec2) {
    this.player.onKeyPress(key, () => {
      this.player.play(anim);
      this.player.vel = velocity;
    });

    this.player.onKeyDown(key, () => {
      // this.player.move(this.player.vel);
      throttle(() => this.emitMovement(), 300)();
    });

    this.player.onKeyRelease(key, () => {
      if (this.player.vel == velocity) {
        this.player.vel = this.k.vec2(0);
        this.player.play(`${anim}-idle`);
        this.emitMovement();
      }
    });
  }

  // private moveMouseHelper(dist: number, animation: string) {
  //   this.player.play(animation);
  //   while(this.player.pos )
  // }

  private movePlayerMouse(clickPos: Vec2) {
    const distance = clickPos.sub(this.player.pos);
    const attrX =
      distance.x < 0
        ? { anim: "walk-left", vel: -200 }
        : { anim: "walk-right", vel: 200 };
    const attrY =
      distance.y < 0
        ? { anim: "walk-up", vel: -200 }
        : { anim: "walk-down", vel: 200 };
    this.k.debug.log(distance);

    if (Math.abs(distance.y) < Math.abs(distance.x)) {
      this.player.play(attrY.anim);
      this.player.vel = this.k.vec2(0, attrY.vel);
      this.player.play(attrX.anim);
      this.player.vel = this.k.vec2(0, attrX.vel);
      // this.player.moveTo(this.player.pos.x, clickPos.y);
      // this.player.moveTo(clickPos.x, this.player.pos.y);
    } else {
      this.player.play(attrX.anim);
      this.player.vel = this.k.vec2(0, attrX.vel);
      this.player.play(attrY.anim);
      this.player.vel = this.k.vec2(0, attrY.vel);
    }
    this.emitMovement();
  }

  private enableMovement() {
    this.movePlayerKeyboard("w", "walk-up", this.k.vec2(0, -this.SPEED));
    this.movePlayerKeyboard("up", "walk-up", this.k.vec2(0, -this.SPEED));
    this.movePlayerKeyboard("s", "walk-down", this.k.vec2(0, this.SPEED));
    this.movePlayerKeyboard("down", "walk-down", this.k.vec2(0, this.SPEED));
    this.movePlayerKeyboard("a", "walk-left", this.k.vec2(-this.SPEED, 0));
    this.movePlayerKeyboard("left", "walk-left", this.k.vec2(-this.SPEED, 0));
    this.movePlayerKeyboard("d", "walk-right", this.k.vec2(this.SPEED, 0));
    this.movePlayerKeyboard("right", "walk-right", this.k.vec2(this.SPEED, 0));

    this.k.onUpdate(() => {
      this.player.move(this.player.vel);
    });

    this.k.onClick("main_area", () => {
      const clickPos = this.k.mousePos();

      this.k.add([
        this.k.pos(clickPos),
        this.k.circle(8),
        this.k.lifespan(0.5, {
          fade: 0,
        }),
        this.k.opacity(1),
      ]);
      this.movePlayerMouse(clickPos);
    });
  }

  public destroy() {
    this.player.destroy();
  }
}
