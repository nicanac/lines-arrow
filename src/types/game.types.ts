export type Direction = 'N' | 'E' | 'S' | 'W';

export interface GridCoord {
  x: number;
  y: number;
}

export interface ArrowLineData {
  id: string;
  points: GridCoord[];      // Points ordered from tail (index 0) to head (index points.length - 1)
  headDirection: Direction; // Direction the head points and travels
  isRemoved: boolean;
  color?: number;
}

export interface LevelSchema {
  id: number;
  cols: number;
  rows: number;
  lines: ArrowLineData[];
}

export enum GameState {
  INITIALIZING = 'INITIALIZING',
  IDLE = 'IDLE',
  RESOLVING = 'RESOLVING',
  LEVEL_WON = 'LEVEL_WON',
  GAME_OVER = 'GAME_OVER'
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  musicEnabled: boolean;
}
