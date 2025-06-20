"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { socket } from "../../utils";
import initGame from "../../kaplay/initGame";

import Chat from "./Chat";
import ControlKeys from "./ControlKeys";
import ControlBar from "./ControlBar";

const Game = () => {
  const router = useRouter();

  useEffect(() => {
    const handleConnect = () => {
      const sprite = window.localStorage.getItem("sprite");
      const name = window.localStorage.getItem("name");
      if (sprite == null || name == null) router.push("/");

      console.log("Connected with socket ID:", socket.id);
      initGame(name!, sprite!);
    };

    socket.on("connect", handleConnect);
    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [router]);

  return (
    <>
      <div className="font-pixelated absolute text-lg right-0 bottom-0 py-8">
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

      <ControlBar mic={false} camera={false} />

      <Chat socket={socket} />
    </>
  );
};

export default Game;
