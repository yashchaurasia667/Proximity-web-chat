import { DtlsParameters, MediaKind, Router, RtpCapabilities, RtpParameters, Worker } from "mediasoup/types";
import { Namespace } from "socket.io";

import config from "../mediasoup-config.js";
import Peer from "./Peer.js";

// type params = {
//   id: string;
//   iceParameters: IceParameters;
//   iceCandidates: IceCandidate;
//   dtlsParameters: DtlsParameters;
// };

// type consumerParams = {
//   producerId: string;
//   id: string;
//   rtpParameters: RtpParameters;
//   type: ConsumerType;
//   producerPaused: boolean;
// };

// type roomType = {
//   id: string;
//   addPeer(peer: Peer): void;
//   getProducerListForPeer(): { producerId: string }[];
//   getRtpCapabilities(): RtpCapabilities;
//   createWebRtcTransport(socketId: string): Promise<params>;
//   connectPeerTransport(socketId: string, transportId: string, dtlsParameters: DtlsParameters): Promise<void>;
//   produce(socketId: string, producerTransportId: string, rtpParameters: RtpParameters): Promise<void>;
//   consume(socketId: string, consumerTransportId: string, rtpCapabilities: RtpCapabilities): Promise<consumerParams>;
//   removePeer(socketId: string): void;
//   closeProducer(socketId: string, producerId: string): void;
//   broadcast(socketId: string, name: string, data: unknown): void;
//   send(socketId: string, name: string, data: unknown): void;
//   getPeers(): Map<string, Peer>;
//   toJSON(): { id: string; peers: string };
// };

class Room {
  public id: string;
  private io: Namespace;
  private router!: Router;
  private peers: Map<string, Peer>;

  constructor(room_id: string, io: Namespace, worker: Worker) {
    this.id = room_id;
    this.io = io;
    this.peers = new Map();

    worker.createRouter(config.mediasoup.routerOptions).then((router) => (this.router = router));
  }

  addPeer(peer: Peer) {
    this.peers.set(peer.id, peer);
  }

  getProducerListForPeer() {
    const producerList: { producerId: string }[] = [];
    this.peers.forEach((peer) => {
      peer.producers.forEach((producer) => {
        producerList.push({
          producerId: producer.id,
        });
      });
    });

    return producerList;
  }

  getRtpCapabilities() {
    return this.router.rtpCapabilities;
  }

  async createWebRtcTransport(socketId: string) {
    const transport = await this.router.createWebRtcTransport(config.mediasoup.webRtcTransportOptions);

    console.log(transport);

    transport.on("dtlsstatechange", (dtlsState) => {
      if (dtlsState === "closed") {
        console.log("Transport closed");
        transport.close();
      }
    });

    transport.on("@close", () => {
      console.log("Transport has cloesd.");
    });

    const peer = this.peers.get(socketId);
    if (peer) {
      peer.addTransport(transport.id, transport);
      this.peers.set(peer.id, peer);
    }

    return {
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }

  async connectPeerTransport(socketId: string, transportId: string, dtlsParameters: DtlsParameters) {
    const peer = this.peers.get(socketId);
    if (peer) {
      await peer.connectTransport(transportId, dtlsParameters);
    }
  }

  async produce(socketId: string, producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind) {
    return new Promise(async (resolve) => {
      const producer = await this.peers.get(socketId)?.createProducer(producerTransportId, rtpParameters, kind);
      resolve(producer?.id);
      this.broadcast(socketId, "new_producers", [
        {
          producerId: producer?.id,
          producerSocketId: socketId,
        },
      ]);
    });
  }

  async consume(socketId: string, consumerTransportId: string, producerId: string, rtpCapabilities: RtpCapabilities) {
    if (!this.router.canConsume({ producerId, rtpCapabilities })) {
      console.error("can not consume");
      return;
    }

    const res = await this.peers.get(socketId)?.createConsumer(consumerTransportId, producerId, rtpCapabilities);
    if (res?.consumer && res.params) {
      const { consumer, params } = res;

      consumer.on("producerclose", () => {
        this.peers.get(socketId)?.removeConsumer(consumer.id);
        this.io.to(socketId).emit("consumer_closed", { consumerId: consumer.id });
      });
      return params;
    }
  }

  removePeer(socketId: string) {
    if (this.peers.has(socketId)) {
      this.peers.get(socketId)?.close();
      this.peers.delete(socketId);
    }
  }

  closeProducer(socketId: string, producerId: string) {
    if (this.peers.has(socketId)) {
      this.peers.get(socketId)?.closeProducer(producerId);
    }
  }

  broadcast(socketId: string, name: string, data: unknown) {
    for (const otherID of Array.from(this.peers.keys()).filter((id) => id !== socketId)) {
      this.send(otherID, name, data);
    }
  }

  send(socketId: string, name: string, data: unknown) {
    this.io.to(socketId).emit(name, data);
  }

  getPeers() {
    return this.peers;
  }

  toJSON() {
    return {
      id: this.id,
      peers: JSON.stringify([...this.peers]),
    };
  }
}

export default Room;
// export type { roomType };
