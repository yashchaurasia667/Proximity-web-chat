"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { gameSocket } from "../../utils";
import initGame from "../../kaplay/initGame";

import Chat from "./Chat";
import ControlKeys from "./ControlKeys";
import Videochat from "./Videochat";

const Game = () => {
  const router = useRouter();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const handleConnect = () => {
      const sprite = window.localStorage.getItem("sprite");
      const name = window.localStorage.getItem("name");

      if (sprite == null || name == null) router.push("/");
      else setName(name);

      console.log("Connected with gameSocket ID:", gameSocket.id);
      initGame(name!, sprite!);
    };

    gameSocket.on("connect", handleConnect);
    if (gameSocket.connected) handleConnect();

    return () => {
      gameSocket.off("connect", handleConnect);
    };
  }, [router]);

  return (
    <>
      <div className="font-pixelated absolute text-lg right-0 bottom-0 py-8 w-[20%]">
        <p className="text-2xl px-28">CONTROLS</p>
        <div className="flex gap-x-3 justify-center mt-8">
          <ControlKeys
            up={"/logos/w_key.png"}
            down={"/logos/s_key.png"}
            left={"/logos/a_key.png"}
            right={"/logos/d_key.png"}
          />
          <ControlKeys
            up={"/logos/up_key.png"}
            down={"/logos/down_key.png"}
            left={"/logos/left_key.png"}
            right={"/logos/right_key.png"}
          />
        </div>
        <div className="text-center mt-3">up, down, left, right</div>
      </div>

      {name ? <Videochat name={name} /> : ""}
      {/* <ControlBar mic={false} camera={false} screen={false} /> */}

      <Chat socket={gameSocket} />
    </>
  );
};

export default Game;
