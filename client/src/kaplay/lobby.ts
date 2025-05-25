import Member from "./player";

export default class Lobby {
  private lobby: Member[];
  constructor() {
    this.lobby = [];
    // this.lobby.push(player);
  }

  addMember(player: Member) {
    this.lobby.push(player);
  }

  removeMember(id: string) {
    this.lobby.filter((player) => {
      console.log(player);
      if (player.id !== id) {
        return player;
      } else player.destroy();
    });
    console.log(this.lobby);
  }
}
