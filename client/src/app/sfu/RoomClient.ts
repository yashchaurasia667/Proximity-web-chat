// import {} from "mediasoup-client/types"

import { Socket } from "socket.io-client";

class RoomClient {
  public name: string;
  private setLocalMediaEl: (e: MediaStream[]) => void;

  constructor(name: string, setLocalMediaEl: (e: MediaStream[]) => void, remoteVideoEl: MediaStream[], remoteAudioEl: MediaStream[], mediasoupClient, socket: Socket, successCallback) {
    this.name = name;
  }
}

export default RoomClient;
