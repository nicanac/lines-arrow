import { ArrowLineData, Direction, GridCoord, LevelSchema } from '../types/game.types';

export class BoardEngine {
  private cols: number;
  private rows: number;
  private lines: Map<string, ArrowLineData> = new Map();
  // Map of "x,y" coordinate to line id occupying it
  private occupancyMap: Map<string, string> = new Map();

  public static readonly VECTOR_MAP: Record<Direction, GridCoord> = {
    N: { x: 0,  y: -1 },
    S: { x: 0,  y: 1  },
    E: { x: 1,  y: 0  },
    W: { x: -1, y: 0  }
  };

  constructor(level: LevelSchema) {
    this.cols = level.cols;
    this.rows = level.rows;
    this.loadLevel(level);
  }

  public static getHash(coord: GridCoord): string {
    return `${coord.x},${coord.y}`;
  }

  public loadLevel(level: LevelSchema): void {
    this.lines.clear();
    this.occupancyMap.clear();
    this.cols = level.cols;
    this.rows = level.rows;

    for (const line of level.lines) {
      this.lines.set(line.id, { ...line, isRemoved: false });
      this.registerLineOccupancy(line);
    }
  }

  private registerLineOccupancy(line: ArrowLineData): void {
    const points = line.points;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          this.occupancyMap.set(BoardEngine.getHash({ x, y }), line.id);
        }
      }
    }
  }

  public evaluatePath(lineId: string): { canEscape: boolean; blockerLine: ArrowLineData | null; hitCoord: GridCoord | null } {
    const line = this.lines.get(lineId);
    if (!line || line.isRemoved) {
      return { canEscape: false, blockerLine: null, hitCoord: null };
    }

    const head = line.points[line.points.length - 1];
    const step = BoardEngine.VECTOR_MAP[line.headDirection];

    let cx = head.x + step.x;
    let cy = head.y + step.y;

    while (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
      const occupantId = this.occupancyMap.get(BoardEngine.getHash({ x: cx, y: cy }));
      if (occupantId && occupantId !== lineId) {
        const blocker = this.lines.get(occupantId);
        if (blocker && !blocker.isRemoved) {
          return { canEscape: false, blockerLine: blocker, hitCoord: { x: cx, y: cy } };
        }
      }
      cx += step.x;
      cy += step.y;
    }

    return { canEscape: true, blockerLine: null, hitCoord: null };
  }

  public markRemoved(lineId: string): void {
    const line = this.lines.get(lineId);
    if (line) {
      line.isRemoved = true;
    }
  }

  public isBoardCleared(): boolean {
    return Array.from(this.lines.values()).every(l => l.isRemoved);
  }

  public findSolvableLine(): ArrowLineData | null {
    for (const line of this.lines.values()) {
      if (!line.isRemoved && this.evaluatePath(line.id).canEscape) {
        return line;
      }
    }
    return null;
  }

  public getRemainingCount(): number {
    return Array.from(this.lines.values()).filter(l => !l.isRemoved).length;
  }

  public getTotalCount(): number {
    return this.lines.size;
  }
}
