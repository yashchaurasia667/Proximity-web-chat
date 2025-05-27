import { KAPLAYCtx, Vec2 } from "kaplay";

import { socket } from "./utils";
import Member from "./player";

export default class Lobby {
  private lobby = new Map<string, { pos: Vec2; player: Member }>();
  private k: KAPLAYCtx;
  private SPEED: number;

  constructor(k: KAPLAYCtx, speed: number, type: "player" | "remote") {
    this.SPEED = speed;
    this.k = k;
    this.addMember(socket.id!, type);

    socket.on("player_joined", (data) => {
      if (this.lobby.has(data.id)) return;
      this.addMember(data.id, "remote", k.vec2(data.pos.x, data.pos.y));
    });

    socket.on("player_left", (data) => {
      if (this.lobby.has(data.id)) this.removeMember(data.id);
    });

    socket.on("player_move", (data) => {
      // console.log(`id: ${data.id} has moved`);
      if (this.lobby.has(data.id))
        this.lobby
          .get(data.id)
          ?.player.moveRemote(k.vec2(data.pos.x, data.pos.y));
    });

    socket.once("lobby", (data) => {
      const rawLobby: Record<string, { x: number; y: number }> = data.lobby;

      for (const [id, pos] of Object.entries(rawLobby)) {
        if (this.lobby.has(id)) continue;

        const vecPos = k.vec2(pos.x, pos.y);
        const member = new Member(id, k, speed, "remote", vecPos);
        this.lobby.set(id, { pos: vecPos, player: member });
      }
    });
  }

  private addMember(id: string, type: "player" | "remote", pos?: Vec2) {
    pos = pos ? pos : this.k.center();
    const player = new Member(id, this.k, this.SPEED, type, pos);
    this.lobby.set(player.id, { pos: player.pos, player });
    socket.emit("player_joined", { id, pos });
  }

  private removeMember(id: string) {
    this.lobby.get(id)?.player.destroy();
    this.lobby.delete(id);
  }
}
