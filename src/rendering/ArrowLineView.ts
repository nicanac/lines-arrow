import { Container, Graphics, Rectangle } from 'pixi.js';
import gsap from 'gsap';
import { ArrowLineData, Direction, GridCoord } from '../types/game.types';
import { GameConfig } from '../config/game.config';
import { BoardEngine } from '../core/BoardEngine';

export class ArrowLineView extends Container {
  public data: ArrowLineData;
  private cellSize: number;
  private strokeWidth: number;
  private mainGfx: Graphics;
  private exitRayGfx: Graphics;
  private baseColor: number;

  constructor(data: ArrowLineData, cellSize: number) {
    super();
    this.data = data;
    this.cellSize = cellSize;
    this.strokeWidth = Math.max(4, cellSize * GameConfig.grid.lineWidthRatio);
    this.baseColor = data.color ?? GameConfig.colors.lineDefault;

    this.mainGfx = new Graphics();
    this.exitRayGfx = new Graphics();
    this.addChild(this.exitRayGfx);
    this.addChild(this.mainGfx);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.renderLine(this.baseColor);
    this.setupHitArea();

    // Hover feedback
    this.on('pointerover', () => {
      if (!this.data.isRemoved) {
        this.renderLine(GameConfig.colors.lineSelected);
      }
    });
    this.on('pointerout', () => {
      if (!this.data.isRemoved) {
        this.renderLine(this.baseColor);
      }
    });
  }

  public updateCellSize(cellSize: number): void {
    this.cellSize = cellSize;
    this.strokeWidth = Math.max(4, cellSize * GameConfig.grid.lineWidthRatio);
    this.renderLine(this.baseColor);
    this.setupHitArea();
  }

  private setupHitArea(): void {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const pt of this.data.points) {
      const px = pt.x * this.cellSize;
      const py = pt.y * this.cellSize;
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }

    const pad = Math.max(14, this.cellSize * 0.35);
    this.hitArea = new Rectangle(
      minX - pad,
      minY - pad,
      (maxX - minX) + pad * 2,
      (maxY - minY) + pad * 2
    );
  }

  public renderLine(color: number, strokeAlpha = 1.0): void {
    this.mainGfx.clear();
    const pts = this.data.points;
    if (pts.length < 2) return;

    // 1. Draw connecting polyline body
    this.mainGfx.moveTo(pts[0].x * this.cellSize, pts[0].y * this.cellSize);
    for (let i = 1; i < pts.length; i++) {
      this.mainGfx.lineTo(pts[i].x * this.cellSize, pts[i].y * this.cellSize);
    }
    this.mainGfx.stroke({
      width: this.strokeWidth,
      color,
      alpha: strokeAlpha,
      cap: 'round',
      join: 'round',
    });

    // 2. Draw directional chevrons along segments
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const midX = (p1.x + p2.x) / 2 * this.cellSize;
      const midY = (p1.y + p2.y) / 2 * this.cellSize;

      const segDir: Direction =
        p2.x > p1.x ? 'E' :
        p2.x < p1.x ? 'W' :
        p2.y > p1.y ? 'S' : 'N';

      this.drawChevron(midX, midY, segDir, color);
    }

    // 3. Draw arrow head at final point (head)
    const head = pts[pts.length - 1];
    const headX = head.x * this.cellSize;
    const headY = head.y * this.cellSize;
    this.drawArrowHead(headX, headY, this.data.headDirection, color);
  }

  private drawChevron(cx: number, cy: number, dir: Direction, color: number): void {
    const size = Math.max(4, this.cellSize * 0.16);
    const step = BoardEngine.VECTOR_MAP[dir];
    // Perpendicular vector
    const perpX = -step.y;
    const perpY = step.x;

    const tipX = cx + step.x * size;
    const tipY = cy + step.y * size;

    const leftX = cx - step.x * size * 0.6 + perpX * size * 0.8;
    const leftY = cy - step.y * size * 0.6 + perpY * size * 0.8;

    const rightX = cx - step.x * size * 0.6 - perpX * size * 0.8;
    const rightY = cy - step.y * size * 0.6 - perpY * size * 0.8;

    this.mainGfx.moveTo(leftX, leftY)
      .lineTo(tipX, tipY)
      .lineTo(rightX, rightY)
      .stroke({ width: Math.max(2, this.strokeWidth * 0.45), color, cap: 'round', join: 'round' });
  }

  private drawArrowHead(hx: number, hy: number, dir: Direction, color: number): void {
    const headLen = Math.max(8, this.cellSize * 0.32);
    const headWing = Math.max(5, this.cellSize * 0.22);
    const step = BoardEngine.VECTOR_MAP[dir];
    const perpX = -step.y;
    const perpY = step.x;

    const tipX = hx + step.x * headLen;
    const tipY = hy + step.y * headLen;

    const leftX = hx + perpX * headWing;
    const leftY = hy + perpY * headWing;

    const rightX = hx - perpX * headWing;
    const rightY = hy - perpY * headWing;

    this.mainGfx.moveTo(tipX, tipY)
      .lineTo(leftX, leftY)
      .lineTo(rightX, rightY)
      .closePath()
      .fill({ color });
  }

  public animateExit(onComplete: () => void): void {
    const step = BoardEngine.VECTOR_MAP[this.data.headDirection];
    const dist = GameConfig.animation.exitDistance;
    const targetX = this.x + step.x * dist;
    const targetY = this.y + step.y * dist;

    // Draw extended ray shooting to screen edge (like the blue line in screenshot)
    this.renderLine(GameConfig.colors.lineSuccess);
    const head = this.data.points[this.data.points.length - 1];
    const hx = head.x * this.cellSize;
    const hy = head.y * this.cellSize;

    this.exitRayGfx.clear();
    this.exitRayGfx.moveTo(hx, hy)
      .lineTo(hx + step.x * 500, hy + step.y * 500)
      .stroke({
        width: this.strokeWidth,
        color: GameConfig.colors.lineSuccess,
        cap: 'round',
      });

    gsap.to(this, {
      x: targetX,
      y: targetY,
      duration: GameConfig.animation.exitDuration,
      ease: 'power2.in',
      onComplete: () => {
        this.exitRayGfx.clear();
        onComplete();
      },
    });
  }

  public animateBump(): void {
    const step = BoardEngine.VECTOR_MAP[this.data.headDirection];
    const bumpDist = GameConfig.animation.bumpDistance;
    const origX = this.x;
    const origY = this.y;

    this.renderLine(GameConfig.colors.lineError);

    gsap.timeline()
      .to(this, {
        x: origX + step.x * bumpDist,
        y: origY + step.y * bumpDist,
        duration: GameConfig.animation.bumpDuration,
        ease: 'power1.out',
      })
      .to(this, {
        x: origX,
        y: origY,
        duration: GameConfig.animation.bumpReturnDuration,
        ease: 'elastic.out(1.2, 0.4)',
        onComplete: () => {
          this.renderLine(this.baseColor);
        },
      });
  }

  public highlight(): void {
    this.renderLine(GameConfig.colors.lineSelected);
    gsap.timeline({
      repeat: GameConfig.animation.hintPulseRepeats,
      yoyo: true,
      onComplete: () => {
        this.renderLine(this.baseColor);
      },
    })
      .to(this.scale, { x: 1.08, y: 1.08, duration: GameConfig.animation.hintPulseDuration, ease: 'sine.inOut' })
      .to(this.scale, { x: 1.0, y: 1.0, duration: GameConfig.animation.hintPulseDuration, ease: 'sine.inOut' });
  }

  public getHeadGlobalPosition(): { x: number; y: number } {
    const head = this.data.points[this.data.points.length - 1];
    return this.toGlobal({ x: head.x * this.cellSize, y: head.y * this.cellSize });
  }

  public getCenterGlobalPosition(): { x: number; y: number } {
    const midIdx = Math.floor(this.data.points.length / 2);
    const mid = this.data.points[midIdx];
    return this.toGlobal({ x: mid.x * this.cellSize, y: mid.y * this.cellSize });
  }
}
