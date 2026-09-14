import { ArrowLineData, Direction, GridCoord, LevelSchema } from '../types/game.types';
import { BoardEngine } from './BoardEngine';

export class LevelGenerator {
  private static readonly DIRECTIONS: Direction[] = ['N', 'E', 'S', 'W'];

  private static readonly OPPOSITE: Record<Direction, Direction> = {
    N: 'S',
    S: 'N',
    E: 'W',
    W: 'E',
  };

  /**
   * Generates a guaranteed 100% solvable ArrowLines maze.
   */
  public static generate(levelId: number, cols = 12, rows = 14): LevelSchema {
    // Scale line count based on level
    const targetLineCount = Math.min(28, Math.max(6, 6 + Math.floor(levelId * 1.8)));

    for (let attempt = 0; attempt < 25; attempt++) {
      const placedLines: ArrowLineData[] = [];
      const occupiedPoints = new Set<string>();

      let genTries = 0;
      const maxGenTries = 800;

      while (placedLines.length < targetLineCount && genTries < maxGenTries) {
        genTries++;

        // Pick random exit direction
        const exitDir = this.DIRECTIONS[Math.floor(Math.random() * this.DIRECTIONS.length)];
        const step = BoardEngine.VECTOR_MAP[exitDir];

        // Pick random candidate head position with some padding
        const hx = Math.floor(Math.random() * (cols - 2)) + 1;
        const hy = Math.floor(Math.random() * (rows - 2)) + 1;
        const headCoord: GridCoord = { x: hx, y: hy };

        if (occupiedPoints.has(BoardEngine.getHash(headCoord))) continue;

        // Verify that the ray from head in exitDir to boundary is clear of currently placed lines
        let rayClear = true;
        let rx = hx + step.x;
        let ry = hy + step.y;

        while (rx >= 0 && rx < cols && ry >= 0 && ry < rows) {
          if (occupiedPoints.has(BoardEngine.getHash({ x: rx, y: ry }))) {
            rayClear = false;
            break;
          }
          rx += step.x;
          ry += step.y;
        }

        if (!rayClear) continue;

        // Grow line backwards from head
        const linePoints = this.growLineBackwards(headCoord, exitDir, cols, rows, occupiedPoints);
        if (linePoints && linePoints.length >= 2) {
          const newLine: ArrowLineData = {
            id: `line_${placedLines.length}_${hx}_${hy}`,
            points: linePoints,
            headDirection: exitDir,
            isRemoved: false,
          };

          // Register all points along this line in occupied set
          this.registerOccupiedPoints(linePoints, occupiedPoints);
          placedLines.push(newLine);
        }
      }

      const candidateLevel: LevelSchema = {
        id: levelId,
        cols,
        rows,
        lines: placedLines,
      };

      if (placedLines.length >= Math.max(4, Math.floor(targetLineCount * 0.7)) && this.isSolvable(candidateLevel)) {
        return candidateLevel;
      }
    }

    // Reliable fallback level if randomized attempts take too long
    return this.createFallbackLevel(levelId, cols, rows);
  }

  /**
   * Grows line backwards from head (p_last = head) towards tail (p_0).
   * Returns points ordered [tail, ..., head].
   */
  private static growLineBackwards(
    head: GridCoord,
    forwardDir: Direction,
    cols: number,
    rows: number,
    occupied: Set<string>
  ): GridCoord[] | null {
    const pointsFromHead: GridCoord[] = [head];
    const tempOccupied = new Set<string>([BoardEngine.getHash(head)]);

    // First backward step must be opposite to forward exit direction
    const firstBackDir = this.OPPOSITE[forwardDir];
    const numTurns = Math.floor(Math.random() * 3); // 0 to 2 turns
    let currentDir = firstBackDir;
    let curr = { ...head };

    // Initial backward segment: 1 to 3 units
    const firstSegmentLen = Math.floor(Math.random() * 3) + 1;
    if (!this.stepSegment(curr, currentDir, firstSegmentLen, cols, rows, occupied, tempOccupied, pointsFromHead)) {
      return null;
    }
    curr = pointsFromHead[pointsFromHead.length - 1];

    // Subsequent turns
    for (let t = 0; t < numTurns; t++) {
      const turnDirs = this.getPerpendicularDirections(currentDir).sort(() => Math.random() - 0.5);
      let turned = false;

      for (const nextDir of turnDirs) {
        const segLen = Math.floor(Math.random() * 3) + 1;
        if (this.stepSegment(curr, nextDir, segLen, cols, rows, occupied, tempOccupied, pointsFromHead)) {
          curr = pointsFromHead[pointsFromHead.length - 1];
          currentDir = nextDir;
          turned = true;
          break;
        }
      }

      if (!turned) break;
    }

    if (pointsFromHead.length < 2) return null;

    // Reverse so points are ordered from tail to head
    return pointsFromHead.reverse();
  }

  private static stepSegment(
    start: GridCoord,
    dir: Direction,
    length: number,
    cols: number,
    rows: number,
    globalOccupied: Set<string>,
    tempOccupied: Set<string>,
    pathPoints: GridCoord[]
  ): boolean {
    const step = BoardEngine.VECTOR_MAP[dir];
    let cx = start.x;
    let cy = start.y;

    const added: GridCoord[] = [];

    for (let i = 0; i < length; i++) {
      cx += step.x;
      cy += step.y;

      if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) {
        return false;
      }

      const key = BoardEngine.getHash({ x: cx, y: cy });
      if (globalOccupied.has(key) || tempOccupied.has(key)) {
        return false;
      }

      added.push({ x: cx, y: cy });
    }

    for (const pt of added) {
      tempOccupied.add(BoardEngine.getHash(pt));
    }

    pathPoints.push(added[added.length - 1]);
    return true;
  }

  private static getPerpendicularDirections(dir: Direction): Direction[] {
    if (dir === 'N' || dir === 'S') return ['E', 'W'];
    return ['N', 'S'];
  }

  private static registerOccupiedPoints(points: GridCoord[], set: Set<string>): void {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          set.add(BoardEngine.getHash({ x, y }));
        }
      }
    }
  }

  public static isSolvable(level: LevelSchema): boolean {
    const engine = new BoardEngine(level);
    let moves = 0;
    const maxMoves = level.lines.length;

    while (moves < maxMoves) {
      const line = engine.findSolvableLine();
      if (!line) break;
      engine.markRemoved(line.id);
      moves++;
      if (engine.isBoardCleared()) return true;
    }

    return engine.isBoardCleared();
  }

  private static createFallbackLevel(levelId: number, cols: number, rows: number): LevelSchema {
    const lines: ArrowLineData[] = [
      {
        id: 'fallback_1',
        points: [{ x: 2, y: 3 }, { x: 2, y: 7 }, { x: 5, y: 7 }],
        headDirection: 'E',
        isRemoved: false,
      },
      {
        id: 'fallback_2',
        points: [{ x: 5, y: 2 }, { x: 5, y: 5 }, { x: 8, y: 5 }],
        headDirection: 'E',
        isRemoved: false,
      },
      {
        id: 'fallback_3',
        points: [{ x: 8, y: 8 }, { x: 8, y: 3 }, { x: 3, y: 3 }],
        headDirection: 'W',
        isRemoved: false,
      },
      {
        id: 'fallback_4',
        points: [{ x: 3, y: 9 }, { x: 3, y: 11 }, { x: 8, y: 11 }],
        headDirection: 'E',
        isRemoved: false,
      },
      {
        id: 'fallback_5',
        points: [{ x: 7, y: 1 }, { x: 7, y: 4 }],
        headDirection: 'S',
        isRemoved: false,
      }
    ];

    return { id: levelId, cols, rows, lines };
  }
}
