import { Consumer, DtlsParameters, MediaKind, Producer, RtpCapabilities, RtpParameters, WebRtcTransport } from "mediasoup/types";

// type peerType = {
//   id: string;
//   name: string;
//   producers: Map<string, Producer>;
//   addTransports(id: string, transport: WebRtcTransport): void;
//   connectTransport(id: string, dtlsParameters: DtlsParameters): Promise<void>;
//   createProducer(transportId: string, rtpParameters: RtpParameters, kind: MediaKind): Promise<Producer>;
//   createConsumer(
//     transportId: string,
//     producerId: string,
//     rtpCapabilities: RtpCapabilities
//   ): Promise<{
//     consumer: Consumer;
//     params: {
//       id: string;
//       rtpParameters: RtpParameters;
//       type: ConsumerType;
//       producerPaused: boolean;
//     };
//   }>;
//   closeProducer(id: string): void;
//   getProducer(id: string): Producer | undefined;
//   close(): void;
//   removeConsumer(id: string): void;
// };

class Peer {
  public id: string;
  public name: string;
  private transports: Map<string, WebRtcTransport>;
  public producers: Map<string, Producer>;
  private consumers: Map<string, Consumer>;

  constructor(socket_id: string, name: string) {
    this.id = socket_id;
    this.name = name;
    this.transports = new Map();
    this.producers = new Map();
    this.consumers = new Map();
  }

  addTransport(id: string, transport: WebRtcTransport) {
    this.transports.set(id, transport);
  }

  async connectTransport(id: string, dtlsParameters: DtlsParameters) {
    const transport = this.transports.get(id);
    if (transport) {
      await transport.connect({ dtlsParameters });
      this.transports.set(id, transport);
    }
  }

  async createProducer(transportId: string, rtpParameters: RtpParameters, kind: MediaKind) {
    const tp = this.transports.get(transportId);
    if (tp) {
      const producer = await tp.produce({
        kind,
        rtpParameters,
      });

      this.producers.set(producer.id, producer);

      producer.on("transportclose", () => {
        producer.close();
        this.producers.delete(producer.id);
      });

      return producer;
    }
  }

  async createConsumer(transportId: string, producerId: string, rtpCapabilities: RtpCapabilities) {
    const tp = this.transports.get(transportId);
    let consumer;
    try {
      if (tp) {
        consumer = await tp.consume({ producerId, rtpCapabilities, paused: false });
      }
    } catch (error) {
      console.error("consume failed:", error);
      return;
    }

    if (consumer?.type === "simulcast") {
      await consumer.setPreferredLayers({
        spatialLayer: 2,
        temporalLayer: 2,
      });
    }

    if (consumer) this.consumers.set(consumer.id, consumer);

    consumer?.on("transportclose", () => {
      this.consumers.delete(consumer.id);
    });

    return {
      consumer,
      params: {
        producerId,
        id: consumer?.id,
        rtpParameters: consumer?.rtpParameters,
        type: consumer?.type,
        producerPaused: consumer?.producerPaused,
      },
    };
  }

  closeProducer(id: string) {
    const prod = this.producers.get(id);
    if (prod) {
      prod.close();
    }
  }

  getProducer(id: string) {
    return this.producers.get(id);
  }

  close() {
    this.transports.forEach((transport) => transport.close());
  }

  removeConsumer(id: string) {
    this.consumers.delete(id);
  }
}

export default Peer;
// export type { peerType };
