import express from "express";
import cors from "cors";

import { app, server } from "./global.d.js";
import gameStart from "./controllers/gameController.js";
import mediasoupStart from "./controllers/mediasoupController.js";
// import RTCStart from "./controllers/RTCController.js";

const PORT = process.env.PORT || 9000;

app.disable("x-powered-by");
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.get("/", (req, res) => {
  res.json("Hello");
});

app.get("/ping", (req, res) => {
  res.json("pongg..");
});

gameStart();
mediasoupStart();
// RTCStart();

server.listen(PORT, () => {
  console.log(`\nServer listening on port ${PORT}\n`);
});
