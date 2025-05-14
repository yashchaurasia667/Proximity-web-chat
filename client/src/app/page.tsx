"use client";

import { Application, extend } from "@pixi/react";
import { Container, Graphics, Sprite } from "pixi.js";

import { useEffect, useRef } from "react";

import Player from "./Player";

extend({
  Container,
  Graphics,
  Sprite,
});

export default function App() {
  const mainTag = useRef(null);
  const app = useRef(null);

  useEffect(() => {
    if (!app.current) return;
    // app.current.loader.add('background', "/areas/main_area.png")
  }, [app]);

  return (
    <main ref={mainTag} className="w-screen h-screen">
      <Application
        ref={app}
        antialias
        autoStart
        sharedTicker
        resizeTo={mainTag}
      >
        <Player />
      </Application>
    </main>
  );
}
