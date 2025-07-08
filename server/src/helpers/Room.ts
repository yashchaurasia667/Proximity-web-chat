import config from "../mediasoup-config.js";
import { peerType } from "./Peer.js";

import { Socket } from "socket.io";
import { DtlsParameters, MediaKind, Router, RtpParameters, Worker } from "mediasoup/types";

type roomType = {
  id: string;
  peers: Map<string, peerType>;
};

class Room {
  public id: string;
  public peers: Map<string, peerType>;
  private io: Socket;
  private router: Router;

  constructor(room_id: string, worker: Worker, io: Socket) {
    this.id = room_id;
    this.io = io;
    this.peers = new Map();
    const mediaCodecs = config.mediasoup.routerOptions.mediaCodecs;
    worker.createRouter({ mediaCodecs }).then((router) => (this.router = router));
  }

  addPeer(peer: peerType) {
    this.peers.set(peer.id, peer);
  }

  getProducerListForPeer() {
    const producerList: { producer_id: string }[] = [];
    this.peers.forEach((peer) => {
      peer.producers.forEach((producer) => {
        producerList.push({
          producer_id: producer.id,
        });
      });
    });
    return producerList;
  }

  getRtpCapabilities() {
    return this.router.rtpCapabilities;
  }

  async createWebRtcTransport(socket_id: string) {
    // const { initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransportOptions;

    const transport = await this.router.createWebRtcTransport(config.mediasoup.webRtcTransportOptions);

    // const transport = await this.router.createWebRtcTransport({
    // listenIps: config.mediasoup.webRtcTransportOptions.listenIps,
    // enableUdp: true,
    // enableTcp: true,
    // preferUdp: true,
    // initialAvailableOutgoingBitrate,
    // });

    // if (maxIncomingBitrate) {
    //   try {
    //     await transport.setMaxIncomingBitrate(maxIncomingBitrate);
    //   } catch (error) {}
    // }

    transport.on("dtlsstatechange", (dtlsState) => {
      if (dtlsState === "closed") {
        // console.log("Transport close", { name: this.peers.get(socket_id).name });
        transport.close();
      }
    });

    transport.on("@close", () => {
      console.log("Transport close");
    });

    console.log("Adding transport", { transportId: transport.id });
    const peer = this.peers.get(socket_id);
    if (peer !== undefined) {
      peer.addTransport(transport);
      this.peers.set(peer.id, peer);
      return {
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      };
    }
  }

  async connectPeerTransport(socket_id: string, transport_id: string, dtlsParameters: DtlsParameters) {
    const peer = this.peers.get(socket_id);
    if (peer) {
      await peer.connectTransport(transport_id, dtlsParameters);
    }
  }

  async produce(socket_id: string, producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind) {
    // handle undefined errors
    return new Promise(async (resolve, reject) => {
      const peer = this.peers.get(socket_id);
      if (peer) {

       const producer = await peer.createProducer(producerTransportId, rtpParameters, kind);
      resolve(producer.id);
      this.broadCast(socket_id, "newProducers", [
        {
          producer_id: producer.id,
          producer_socket_id: socket_id,
        },
      ]);
    });
      }
  }

  async consume(socket_id, consumer_transport_id, producer_id, rtpCapabilities) {
    // handle nulls
    if (
      !this.router.canConsume({
        producerId: producer_id,
        rtpCapabilities,
      })
    ) {
      console.error("can not consume");
      return;
    }

    let { consumer, params } = await this.peers.get(socket_id).createConsumer(consumer_transport_id, producer_id, rtpCapabilities);

    consumer.on(
      "producerclose",
      function () {
        console.log("Consumer closed due to producerclose event", {
          name: `${this.peers.get(socket_id).name}`,
          consumer_id: `${consumer.id}`,
        });
        this.peers.get(socket_id).removeConsumer(consumer.id);
        // tell client consumer is dead
        this.io.to(socket_id).emit("consumerClosed", {
          consumer_id: consumer.id,
        });
      }.bind(this)
    );

    return params;
  }

  async removePeer(socket_id) {
    this.peers.get(socket_id).close();
    this.peers.delete(socket_id);
  }

  closeProducer(socket_id, producer_id) {
    this.peers.get(socket_id).closeProducer(producer_id);
  }

  broadCast(socket_id, name, data) {
    for (let otherID of Array.from(this.peers.keys()).filter((id) => id !== socket_id)) {
      this.send(otherID, name, data);
    }
  }

  send(socket_id, name, data) {
    this.io.to(socket_id).emit(name, data);
  }

  getPeers() {
    return this.peers;
  }

  toJson() {
    return {
      id: this.id,
      peers: JSON.stringify([...this.peers]),
    };
  }
}

export default Room;
export type { roomType };
