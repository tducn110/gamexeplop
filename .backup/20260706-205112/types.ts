export type GameStatus = "idle" | "countdown" | "running" | "revive" | "x2score" | "gameOver" | "paused";
export type GameSubstate = "moving" | "dropping" | "paused" | "gameOver";

export interface Block {
  x: number;
  w: number;
}

export interface DroppingBlock {
  x: number;
  y: number;
  w: number;
  vy: number;
}

export interface FallingPiece {
  x: number;
  y: number;
  w: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  alpha: number;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  c: string;
}

export interface FloatingFlash {
  id: number;
  txt: string;
  x: number;
  y: number;
  alpha: number;
  c: string;
  vy: number;
  sz: number;
}

export interface PlacementEvent {
  token: number;
  kind: "perfect" | "good" | "base";
  combo: number;
  scoreDelta: number;
}

export interface GameState {
  sub: GameSubstate;
  blocks: Block[];
  mv: { x: number; w: number; dir: number; spd: number };
  drop: DroppingBlock | null;
  pieces: FallingPiece[];
  sparks: Spark[];
  flashes: FloatingFlash[];
  scroll: number;
  scrollT: number;
  score: number;
  combo: number;
  placed: number;
  pauseT: number;
  flashId: number;
  lastPlacement: PlacementEvent | null;
  perfectHighlight: { x: number; y: number; w: number; alpha: number } | null;
}

export interface GameResult {
  score: number;
  floors: number;
}
