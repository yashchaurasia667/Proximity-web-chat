import { useContext, useEffect, useRef, useState } from "react";

import { FederatedPointerEvent, Rectangle } from "pixi.js";

import Player from "./Player";
import PlayerContext from "../../context/playerContext/PlayerContext";

const Main = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("No player context");

  const { setPlayerPos } = context;
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  const containerRef = useRef(null);

  return (
    <pixiContainer
      ref={containerRef}
      interactive
      // {...viewport}
      hitArea={new Rectangle(0, 0, viewport.width, viewport.height)}
      onClick={(e: FederatedPointerEvent) => {
        setPlayerPos({ ...e.global });
      }}
    >
      <Player />
    </pixiContainer>
  );
};

export default Main;
