import makeKaplayCtx from "./kaplayCtx";

export default async function initGame() {
  const k = makeKaplayCtx();
  k.loadSprite("player", "/sprites/boy_red/boy_red.png")
}