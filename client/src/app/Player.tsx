"use client";

import { useEffect, useRef, useState } from "react";
import {
  Texture,
  Assets,
  Sprite,
  Container,
  FederatedPointerEvent,
} from "pixi.js";

import { extend } from "@pixi/react";
extend({
  Container,
  Sprite,
});

// interface props {
//   x: number;
//   y: number;
// }

const Player = () => {
  const [texture, setTexture] = useState(Texture.EMPTY);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const spriteRef = useRef(null);

  const movePlayer = (e: FederatedPointerEvent) => {
    const pos = e.global;
    setPlayerPos({ ...pos });
  };

  useEffect(() => {
    if (texture == Texture.EMPTY) {
      Assets.load("/avatars/boy_red/boy_red_cleaned.png").then((result) => {
        setTexture(result);
        setPlayerPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      });
    }
  }, [texture]);

  return (
    <pixiContainer
      interactive
      width={window.innerWidth}
      height={window.innerHeight}
      onPointerMove={movePlayer}
    >
      <pixiSprite
        ref={spriteRef}
        anchor={0.5}
        eventMode="static"
        texture={texture}
        width={70}
        height={70}
        {...playerPos}
      />
    </pixiContainer>
  );
};

export default Player;
