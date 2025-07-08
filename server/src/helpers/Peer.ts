import { Consumer, DtlsParameters, MediaKind, Producer, RtpCapabilities, RtpParameters, WebRtcTransport } from "mediasoup/types";

type peerType = {
  id: string;
  name: string;
  transports: Map<string, WebRtcTransport>;
  consumers: Map<string, Consumer>;
  producers: Map<string, Producer>;
  addTransport: (transport: WebRtcTransport) => void;
  connectTransport: (transport_id: string, dtlsParameters: DtlsParameters) => Promise<void>;
};

class Peer {
  public id: string;
  public name: string;
  public transports: Map<string, WebRtcTransport>;
  public consumers: Map<string, Consumer>;
  public producers: Map<string, Producer>;

  constructor(socket_id: string, name: string) {
    this.id = socket_id;
    this.name = name;
    this.transports = new Map();
    this.consumers = new Map();
    this.producers = new Map();
  }

  addTransport(transport: WebRtcTransport) {
    this.transports.set(transport.id, transport);
  }

  async connectTransport(transport_id: string, dtlsParameters: DtlsParameters) {
    const transport = this.transports.get(transport_id);
    if (transport) {
      await transport.connect({ dtlsParameters: dtlsParameters });
      this.transports.set(transport.id, transport);
    }
  }

  async createProducer(producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind) {
    //TODO handle null errors
    const producerTransport = this.transports.get(producerTransportId);
    if (producerTransport) {
      const producer = await producerTransport.produce({
        kind,
        rtpParameters,
      });

      this.producers.set(producer.id, producer);

      producer.on("transportclose", () => {
        console.log("Producer transport close", { name: `${this.name}`, consumer_id: `${producer.id}` });
        producer.close();
        this.producers.delete(producer.id);
      });

      return producer;
    }
  }

  async createConsumer(consumer_transport_id: string, producer_id: string, rtpCapabilities: RtpCapabilities) {
    const consumerTransport = this.transports.get(consumer_transport_id);

    let consumer = null;
    try {
      consumer = await consumerTransport.consume({
        producerId: producer_id,
        rtpCapabilities,
        paused: false, //producer.kind === 'video',
      });
    } catch (error) {
      console.error("Consume failed", error);
      return;
    }

    if (consumer.type === "simulcast") {
      await consumer.setPreferredLayers({
        spatialLayer: 2,
        temporalLayer: 2,
      });
    }

    this.consumers.set(consumer.id, consumer);

    consumer.on("transportclose", () => {
      console.log("Consumer transport close", { name: `${this.name}`, consumer_id: `${consumer.id}` });
      this.consumers.delete(consumer.id);
    });

    return {
      consumer,
      params: {
        producerId: producer_id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      },
    };
  }

  closeProducer(producer_id: string) {
    try {
      this.producers.get(producer_id).close();
    } catch (e) {
      console.warn(e);
    }

    this.producers.delete(producer_id);
  }

  getProducer(producer_id: string) {
    return this.producers.get(producer_id);
  }

  close() {
    this.transports.forEach((transport) => transport.close());
  }

  removeConsumer(consumer_id: string) {
    this.consumers.delete(consumer_id);
  }
}

export default Peer;
export type { peerType };
