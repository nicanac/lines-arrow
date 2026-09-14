export type Direction = 'N' | 'E' | 'S' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';

export interface GridCoord {
  x: number; // Column index (0 to cols - 1)
  y: number; // Row index (0 to rows - 1)
}

export interface ArrowNodeData {
  id: string;
  coord: GridCoord;
  direction: Direction;
  isRemoved: boolean;
  color?: number;
}

export interface LevelSchema {
  id: number;
  cols: number;
  rows: number;
  arrows: ArrowNodeData[];
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
