"use client";

import { useEffect, useRef, useState } from "react";
import { Texture, Assets } from "pixi.js";

const Player = () => {
  const [texture, setTexture] = useState(Texture.EMPTY);
  const spriteRef = useRef(null);

  useEffect(() => {
    if (texture == Texture.EMPTY) {
      Assets.load("/avatars/boy_red/boy_red_cleaned.png").then((result) =>
        setTexture(result)
      );
    }
  }, [texture]);

  return (
    <pixiSprite
      ref={spriteRef}
      anchor={0.5}
      eventMode="static"
      texture={texture}
      width={70}
      height={70}
      x={window.innerWidth/2}
      y={window.innerHeight/2}
    />
  );
};

export default Player;
