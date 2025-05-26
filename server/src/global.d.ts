import express from "express";
import { Server } from "node:http";

const app = express();
const server = Server(app);

export { app, server };
