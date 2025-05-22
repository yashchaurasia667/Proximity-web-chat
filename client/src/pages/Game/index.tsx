import initGame from "../../kaplay/initGame";
import ControlKeys from "./ControlKeys";

const Game = () => {
  initGame();
  return (
    <div className="font-pixelated absolute text-lg right-0 bottom-0 py-8">
      <p className="text-2xl px-28">CONTROLS</p>
      <div className="flex gap-x-3 justify-center mt-8">
        <ControlKeys up={"/logos/w_key.png"} down={"/logos/s_key.png"} left={"/logos/a_key.png"} right={"/logos/d_key.png"}/>
        <ControlKeys up={"/logos/up_key.png"} down={"/logos/down_key.png"} left={"/logos/left_key.png"} right={"/logos/right_key.png"}/>
      </div>
      <div className="text-center mt-3">
        up, down, left, right
      </div>
    </div>
  );
};

export default Game;
