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

app.get("/ping", (req, res) => {
  res.json("pongg..");
});

socketStart();

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
