import { KAPLAYCtx, Vec2 } from "kaplay";

import { gameSocket } from "../utils";
import Member from "./player";

export default class Lobby {
  private lobby = new Map<
    string,
    { name: string; pos: Vec2; player: Member }
  >();
  private k: KAPLAYCtx;
  private SPEED: number;
  private name;

  constructor(k: KAPLAYCtx, speed: number, name: string, sprite: string) {
    this.SPEED = speed;
    this.k = k;
    this.name = name;
    this.addMember(gameSocket.id!, "player", this.name, sprite);

    gameSocket.on("player_joined", (data) => {
      if (this.lobby.has(data.id)) return;
      this.addMember(
        data.id,
        "remote",
        data.name,
        data.sprite,
        k.vec2(data.pos.x, data.pos.y)
      );
    });

    gameSocket.on("player_left", (data) => {
      if (this.lobby.has(data.id)) this.removeMember(data.id);
    });

    gameSocket.on("player_move", (data) => {
      if (this.lobby.has(data.id))
        this.lobby
          .get(data.id)
          ?.player.moveRemote(k.vec2(data.pos.x, data.pos.y));
    });

    gameSocket.on("lobby", (data) => {
      const rawLobby: Record<
        string,
        { name: string; sprite: string; pos: { x: number; y: number } }
      > = data.lobby;

      for (const [id, info] of Object.entries(rawLobby)) {
        if (this.lobby.has(id)) continue;

        const vecPos = k.vec2(info.pos.x, info.pos.y);
        const member = new Member(
          id,
          k,
          speed,
          "remote",
          vecPos,
          info.name,
          info.sprite
        );
        this.lobby.set(id, {
          name: info.name,
          pos: vecPos,
          player: member,
        });
      }
    });
  }

  private addMember(
    id: string,
    type: "player" | "remote",
    name: string,
    sprite: string,
    pos?: Vec2
  ) {
    pos = pos ? pos : this.k.center();
    const player = new Member(id, this.k, this.SPEED, type, pos, name, sprite);
    this.lobby.set(player.id, { name: name, pos: player.pos, player });
    gameSocket.emit("player_joined", { id, sprite, name: this.name, pos });
  }

  private removeMember(id: string) {
    this.lobby.get(id)?.player.destroy();
    this.lobby.delete(id);
  }
}
