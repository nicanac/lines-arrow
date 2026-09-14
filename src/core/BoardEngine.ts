import { ArrowNodeData, Direction, GridCoord, LevelSchema } from '../types/game.types';

export class BoardEngine {
  private cols: number;
  private rows: number;
  private grid: Map<string, ArrowNodeData> = new Map();

  // Directional Unit Vectors
  public static readonly VECTOR_MAP: Record<Direction, GridCoord> = {
    N:  { x: 0,  y: -1 },
    S:  { x: 0,  y: 1  },
    E:  { x: 1,  y: 0  },
    W:  { x: -1, y: 0  },
    NE: { x: 1,  y: -1 },
    NW: { x: -1, y: -1 },
    SE: { x: 1,  y: 1  },
    SW: { x: -1, y: 1  }
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
    this.grid.clear();
    this.cols = level.cols;
    this.rows = level.rows;
    for (const node of level.arrows) {
      this.grid.set(BoardEngine.getHash(node.coord), { ...node, isRemoved: false });
    }
  }

  /**
   * Raycasts along the entity's directional vector.
   * Returns clear: true if the exit path to boundary is unblocked.
   */
  public evaluatePath(nodeId: string): { canEscape: boolean; blockerNode: ArrowNodeData | null } {
    const origin = Array.from(this.grid.values()).find(n => n.id === nodeId);
    if (!origin || origin.isRemoved) {
      return { canEscape: false, blockerNode: null };
    }

    const step = BoardEngine.VECTOR_MAP[origin.direction];
    let cx = origin.coord.x + step.x;
    let cy = origin.coord.y + step.y;

    while (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
      const obstacle = this.grid.get(BoardEngine.getHash({ x: cx, y: cy }));
      if (obstacle && !obstacle.isRemoved) {
        return { canEscape: false, blockerNode: obstacle };
      }
      cx += step.x;
      cy += step.y;
    }

    return { canEscape: true, blockerNode: null };
  }

  public markRemoved(nodeId: string): void {
    for (const node of this.grid.values()) {
      if (node.id === nodeId) {
        node.isRemoved = true;
        break;
      }
    }
  }

  public isBoardCleared(): boolean {
    return Array.from(this.grid.values()).every(n => n.isRemoved);
  }

  /**
   * Finds the first currently unblocked node for the Hint System.
   */
  public findSolvableNode(): ArrowNodeData | null {
    for (const node of this.grid.values()) {
      if (!node.isRemoved && this.evaluatePath(node.id).canEscape) {
        return node;
      }
    }
    return null;
  }

  public getRemainingCount(): number {
    return Array.from(this.grid.values()).filter(n => !n.isRemoved).length;
  }

  public getTotalCount(): number {
    return this.grid.size;
  }
}
