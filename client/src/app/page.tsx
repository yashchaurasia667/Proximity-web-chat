"use client";

import { useRef } from "react";
import { Application } from "@pixi/react";

import Main from "../components/main/Main";

import PlayerContextProvider from "../context/playerContext/PlayerContextProvider";

export default function App() {
  const mainTag = useRef(null);

  return (
    <main ref={mainTag} className="w-screen h-screen">
      <PlayerContextProvider>
        <Application
          background={"#444444"}
          antialias
          autoStart
          sharedTicker
          resizeTo={mainTag}
        >
          <Main />
        </Application>
      </PlayerContextProvider>
    </main>
  );
}
