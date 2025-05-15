import React, { ReactNode, useRef, useState } from 'react'
import PlayerContext from './PlayerContext';

import { FederatedPointerEvent, Sprite } from 'pixi.js';

interface props {
  children: ReactNode;
}

const PlayerContextProvider = ({children}: props) => {
  const [playerPos, setPlayerPos] = useState({x: 0, y: 0});
  const playerRef = useRef(null);

  const movePlayer = (e: FederatedPointerEvent) => {
    const pos = e.global;
    setPlayerPos({ ...pos });
  };

  const value = {
    playerPos,
    setPlayerPos,
    movePlayer,
  }
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export default PlayerContextProvider