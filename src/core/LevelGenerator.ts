import { ArrowNodeData, Direction, LevelSchema } from '../types/game.types';
import { BoardEngine } from './BoardEngine';
import { GameConfig } from '../config/game.config';

export class LevelGenerator {
  private static readonly CARDINAL_DIRS: Direction[] = ['N', 'E', 'S', 'W'];
  private static readonly ALL_DIRS: Direction[] = ['N', 'E', 'S', 'W', 'NE', 'NW', 'SE', 'SW'];

  private static readonly COLOR_PALETTE = [
    GameConfig.colors.arrowDefault,
    GameConfig.colors.arrowAccent1,
    GameConfig.colors.arrowAccent2,
    GameConfig.colors.arrowAccent3,
  ];

  /**
   * Generates a guaranteed 100% solvable board using reverse topological placement.
   */
  public static generate(
    levelId: number,
    cols: number,
    rows: number,
    fillRate = 0.65
  ): LevelSchema {
    const totalCells = cols * rows;
    const targetCount = Math.max(3, Math.min(Math.floor(totalCells * fillRate), totalCells - 1));
    const dirsToUse = levelId > 10 ? this.ALL_DIRS : this.CARDINAL_DIRS;

    // Attempt reverse placement up to 10 times, falling back to randomized with solver
    for (let genAttempt = 0; genAttempt < 10; genAttempt++) {
      const placedMap = new Map<string, ArrowNodeData>();
      const placedList: ArrowNodeData[] = [];

      let iterations = 0;
      const maxIterations = 2000;

      while (placedList.length < targetCount && iterations < maxIterations) {
        iterations++;
        const rx = Math.floor(Math.random() * cols);
        const ry = Math.floor(Math.random() * rows);
        const key = BoardEngine.getHash({ x: rx, y: ry });

        if (placedMap.has(key)) continue;

        // Shuffle directions to test
        const dirs = [...dirsToUse].sort(() => Math.random() - 0.5);
        let validDir: Direction | null = null;

        for (const dir of dirs) {
          const step = BoardEngine.VECTOR_MAP[dir];
          let cx = rx + step.x;
          let cy = ry + step.y;
          let blockedByEarlier = false;

          // In reverse generation, this arrow must not be blocked by any previously placed arrow
          while (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
            if (placedMap.has(BoardEngine.getHash({ x: cx, y: cy }))) {
              blockedByEarlier = true;
              break;
            }
            cx += step.x;
            cy += step.y;
          }

          if (!blockedByEarlier) {
            validDir = dir;
            break;
          }
        }

        if (validDir) {
          const colorIndex = placedList.length % this.COLOR_PALETTE.length;
          const node: ArrowNodeData = {
            id: `arrow_${rx}_${ry}`,
            coord: { x: rx, y: ry },
            direction: validDir,
            isRemoved: false,
            color: this.COLOR_PALETTE[colorIndex],
          };

          placedMap.set(key, node);
          placedList.push(node);
        }
      }

      const candidateLevel: LevelSchema = {
        id: levelId,
        cols,
        rows,
        arrows: placedList,
      };

      if (placedList.length >= Math.floor(targetCount * 0.7) && this.isLevelSolvable(candidateLevel)) {
        return candidateLevel;
      }
    }

    // Fallback: minimal guaranteed level if loops exhausted
    return this.createFallbackLevel(levelId, cols, rows);
  }

  /**
   * Fast solver simulation to verify that the board can be 100% cleared.
   */
  public static isLevelSolvable(level: LevelSchema): boolean {
    const engine = new BoardEngine(level);
    let moves = 0;
    const maxMoves = level.arrows.length;

    while (moves < maxMoves) {
      const node = engine.findSolvableNode();
      if (!node) break;
      engine.markRemoved(node.id);
      moves++;
      if (engine.isBoardCleared()) return true;
    }

    return engine.isBoardCleared();
  }

  private static createFallbackLevel(levelId: number, cols: number, rows: number): LevelSchema {
    const arrows: ArrowNodeData[] = [];
    const count = Math.min(cols, rows);
    for (let i = 0; i < count; i++) {
      arrows.push({
        id: `arrow_${i}_${i}`,
        coord: { x: i, y: i },
        direction: i % 2 === 0 ? 'N' : 'E',
        isRemoved: false,
        color: this.COLOR_PALETTE[i % this.COLOR_PALETTE.length],
      });
    }
    return { id: levelId, cols, rows, arrows };
  }
}
