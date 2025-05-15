"use client";

import { useContext, useEffect, useState } from "react";
import { Texture, Assets, Sprite, Container } from "pixi.js";

import { extend } from "@pixi/react";

import PlayerContext from "../../context/playerContext/PlayerContext";

extend({
  Container,
  Sprite,
});

const Player = () => {
  const playerContext = useContext(PlayerContext);
  if (!playerContext) throw new Error("No player context");

  const { playerPos, setPlayerPos } = playerContext;
  const [texture, setTexture] = useState(Texture.EMPTY);

  useEffect(() => {
    if (texture == Texture.EMPTY) {
      Assets.load("/avatars/boy_red/boy_red_cleaned.png").then((result) => {
        setTexture(result);
        setPlayerPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      });
    }
    console.log(playerPos);
  }, [texture, setPlayerPos]);

  return (
    <pixiSprite
      anchor={0.5}
      eventMode="static"
      texture={texture}
      width={70}
      height={70}
      {...playerPos}
    />
  );
};

export default Player;
