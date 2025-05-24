import express from "express";
import { createServer } from "node:http";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
