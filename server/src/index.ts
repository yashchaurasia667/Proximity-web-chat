import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { app, server } from "./global.d.js";
import socketStart from "./controllers/gameController.js";

dotenv.config();
const PORT = process.env.PORT || 8000;

app.disable("x-powered-by");
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.get("/ping", (req, res) => {
  res.json("pongg..");
});

socketStart();

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
