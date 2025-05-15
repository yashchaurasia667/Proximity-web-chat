"use client";

import { useEffect, useRef } from "react";
import { Application, extend } from "@pixi/react";

import Player from "./Player";
import { Container } from "pixi.js";

extend({
  Container,
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
