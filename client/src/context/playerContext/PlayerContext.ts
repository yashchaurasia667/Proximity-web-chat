import { FederatedPointerEvent } from "pixi.js";
import React from "react";

type PlayerContext = {
  playerPos: { x: number; y: number };
  setPlayerPos: (e: { x: number; y: number }) => void;
  movePlayer: (e: FederatedPointerEvent) => void;
};

const PlayerContext = React.createContext<PlayerContext | undefined>(undefined);
export default PlayerContext;
