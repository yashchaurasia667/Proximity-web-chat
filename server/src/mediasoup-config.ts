import { WorkerLogLevel, WorkerLogTag, RtpCodecCapability, WebRtcTransportOptions } from "mediasoup/types";
import os from "os";

const __dirname = import.meta.dirname;

const config = {
  domain: process.env.DOMAIN || "localhost",

  https: {
    listenIp: "0.0.0.0",
    listenPort: 9000,

    tls: {
      cert: process.env.HTTPS_CERT || `${__dirname}/certs/server-cert.pem`,
      key: process.env.HTTPS_KEY || `${__dirname}/certs/server-key.pem`,
    },
  },

  mediasoup: {
    numWorkers: Object.keys(os.cpus()).length,

    workerSettings: {
      dtlsCertificateFile: process.env.WORKER_CERT,
      dtlsPrivateKeyFile: process.env.WORKER_KEY,

      rtcMinPort: 10000,
      rtcMaxPort: 10100,

      loglevel: "debug" as WorkerLogLevel,
      logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp", "bwe", "ortc", "sctp"] as WorkerLogTag[],
    },

    routerOptions: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/VP9",
          clockRate: 90000,
          parameters: {
            "profile-id": 2,
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/h264",
          clockRate: 90000,
          parameters: {
            "packetization-mode": 1,
            "profile-level-id": "4d0032",
            "level-asymmetry-allowed": 1,
            "x-google-start-bitrate": 1000,
          },
        },
      ] as RtpCodecCapability[],
    },

    webRtcServerOptions: {
      listenInfos: [
        {
          protocol: "udp",
          ip: process.env.MEDIASOUP_LISTEN_IP || "127.0.0.1",
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
          port: 44444,
        },
        {
          protocol: "tcp",
          ip: process.env.MEDIASOUP_LISTEN_IP || "127.0.0.1",
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
          port: 44444,
        },
      ],
    },

    webRtcTransportOptions: {
      listenInfos: [
        {
          protocol: "udp",
          ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
          portRange: {
            min: process.env.MEDIASOUP_MIN_PORT || 40000,
            max: process.env.MEDIASOUP_MAX_PORT || 49999,
          },
        },
        {
          protocol: "tcp",
          ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
          portRange: {
            min: process.env.MEDIASOUP_MIN_PORT || 40000,
            max: process.env.MEDIASOUP_MAX_PORT || 49999,
          },
        },
      ],

      initialAvailableOutgoingBitrate: 600000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,

      maxIncomingBitrate: 1500000,
    } as WebRtcTransportOptions,
  },
};

export default config;
