import { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { Socket } from "socket.io-client";

export default class Member {
  public id: string;
  private k: KAPLAYCtx;
  private player: GameObj;
  private socket: Socket;
  private SPEED: number;

  constructor(id: string, k: KAPLAYCtx, speed: number, socket: Socket) {
    this.id = id;
    this.k = k;
    this.socket = socket;
    this.SPEED = speed;

    this.player = this.makePlayer(k, k.vec2(k.center()));
    this.enableMovement();
  }

  private makePlayer(k: KAPLAYCtx, posVec2: Vec2) {
    return k.add([
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
  }

  private emitMovement() {
    this.socket.emit("movement", this.player.pos);
  }

  private movePlayerKeyboard(key: string, anim: string, velocity: Vec2) {
    this.player.onKeyPress(key, () => {
      this.player.vel = velocity;
      this.player.play(anim);
      this.emitMovement();
    });

    this.player.onKeyRelease(key, () => {
      if (this.player.vel == velocity) {
        this.player.vel = this.k.vec2(0, 0);
        this.player.play(`${anim}-idle`);
        this.emitMovement();
      }
    });
  }

  private movePlayerMouse(clickPos: Vec2) {
    const distance = clickPos.sub(this.player.pos);

    if (Math.abs(distance.y) < Math.abs(distance.x)) {
      this.player.moveTo(this.player.pos.x, clickPos.y);
      this.player.moveTo(clickPos.x, this.player.pos.y);
    } else {
      this.player.moveTo(clickPos.x, this.player.pos.y);
      this.player.moveTo(this.player.pos.x, clickPos.y);
    }
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

      // this.k.add([
      //   this.k.pos(clickPos),
      //   this.k.circle(8),
      //   this.k.lifespan(1, {
      //     fade: 0.5,
      //   }),
      // ]);
      this.movePlayerMouse(clickPos);
    });
  }
}
