export type pos = {
  x: number;
  y: number;
};

export type member = {
  id: string;
  pos: pos;
};

export type PlayerData = {
  id: string;
  name: string;
  sprite: string;
  pos: pos;
};
