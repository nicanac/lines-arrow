import { Container, Graphics, Rectangle } from 'pixi.js';
import gsap from 'gsap';
import { ArrowLineData, GridCoord } from '../types/game.types';
import { GameConfig } from '../config/game.config';
import { BoardEngine } from '../core/BoardEngine';

interface TrackSample {
  points: { x: number; y: number }[];
  headTangent: { dx: number; dy: number };
}

export class ArrowLineView extends Container {
  public data: ArrowLineData;
  private cellSize: number;
  private strokeWidth: number;
  private mainGfx: Graphics;
  private baseColor: number;

  // Path track geometry
  private track: { x: number; y: number }[] = [];
  private segLengths: number[] = [];
  private cumLengths: number[] = [];
  private bodyLength = 0;
  private totalTrackLength = 0;

  constructor(data: ArrowLineData, cellSize: number) {
    super();
    this.data = data;
    this.cellSize = cellSize;
    this.strokeWidth = Math.max(5, cellSize * GameConfig.grid.lineWidthRatio);
    this.baseColor = data.color ?? GameConfig.colors.lineDefault;

    this.mainGfx = new Graphics();
    this.addChild(this.mainGfx);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.buildTrack();
    const sample = this.getSubPath(0, this.bodyLength);
    this.renderSubPath(sample, this.baseColor);
    this.setupHitArea();

    // Hover feedback
    this.on('pointerover', () => {
      if (!this.data.isRemoved) {
        const s = this.getSubPath(0, this.bodyLength);
        this.renderSubPath(s, GameConfig.colors.lineSelected);
      }
    });
    this.on('pointerout', () => {
      if (!this.data.isRemoved) {
        const s = this.getSubPath(0, this.bodyLength);
        this.renderSubPath(s, this.baseColor);
      }
    });
  }

  public updateCellSize(cellSize: number): void {
    this.cellSize = cellSize;
    this.strokeWidth = Math.max(5, cellSize * GameConfig.grid.lineWidthRatio);
    this.buildTrack();
    const sample = this.getSubPath(0, this.bodyLength);
    this.renderSubPath(sample, this.baseColor);
    this.setupHitArea();
  }

  /**
   * Constructs the continuous line track including its extended forward exit vector.
   */
  private buildTrack(): void {
    const pts = this.data.points;
    this.track = pts.map(p => ({
      x: p.x * this.cellSize,
      y: p.y * this.cellSize,
    }));

    // Add forward exit point in headDirection
    const head = this.track[this.track.length - 1];
    const step = BoardEngine.VECTOR_MAP[this.data.headDirection];
    const exitDist = GameConfig.animation.exitDistance;

    this.track.push({
      x: head.x + step.x * exitDist,
      y: head.y + step.y * exitDist,
    });

    this.segLengths = [];
    this.cumLengths = [0];

    for (let i = 0; i < this.track.length - 1; i++) {
      const p1 = this.track[i];
      const p2 = this.track[i + 1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      this.segLengths.push(dist);
      this.cumLengths.push(this.cumLengths[i] + dist);
    }

    // Body length is the length of the original segments (excluding the exit extension)
    this.bodyLength = this.cumLengths[pts.length - 1];
    this.totalTrackLength = this.cumLengths[this.cumLengths.length - 1];
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

    const pad = Math.max(16, this.cellSize * 0.4);
    this.hitArea = new Rectangle(
      minX - pad,
      minY - pad,
      (maxX - minX) + pad * 2,
      (maxY - minY) + pad * 2
    );
  }

  /**
   * Slices a sub-path along the track between startDist and endDist.
   * This enables the line to follow the track/corners fluidly like a train or snake!
   */
  private getSubPath(startDist: number, endDist: number): TrackSample {
    const pts: { x: number; y: number }[] = [];
    if (this.track.length < 2 || endDist <= 0) {
      return { points: pts, headTangent: { dx: 1, dy: 0 } };
    }

    const clampedStart = Math.max(0, startDist);
    const clampedEnd = Math.min(this.totalTrackLength, endDist);

    // 1. Starting vertex at clampedStart
    let startIdx = 0;
    while (startIdx < this.segLengths.length - 1 && this.cumLengths[startIdx + 1] < clampedStart) {
      startIdx++;
    }
    const segLenStart = this.segLengths[startIdx];
    const tStart = segLenStart > 0 ? (clampedStart - this.cumLengths[startIdx]) / segLenStart : 0;
    pts.push({
      x: this.track[startIdx].x + (this.track[startIdx + 1].x - this.track[startIdx].x) * tStart,
      y: this.track[startIdx].y + (this.track[startIdx + 1].y - this.track[startIdx].y) * tStart,
    });

    // 2. Add all original track vertices strictly between start and end
    for (let i = startIdx + 1; i < this.track.length; i++) {
      if (this.cumLengths[i] > clampedStart && this.cumLengths[i] < clampedEnd) {
        pts.push({ x: this.track[i].x, y: this.track[i].y });
      }
    }

    // 3. Ending vertex at clampedEnd
    let endIdx = 0;
    while (endIdx < this.segLengths.length - 1 && this.cumLengths[endIdx + 1] < clampedEnd) {
      endIdx++;
    }
    const segLenEnd = this.segLengths[endIdx];
    const tEnd = segLenEnd > 0 ? (clampedEnd - this.cumLengths[endIdx]) / segLenEnd : 0;
    const endPt = {
      x: this.track[endIdx].x + (this.track[endIdx + 1].x - this.track[endIdx].x) * tEnd,
      y: this.track[endIdx].y + (this.track[endIdx + 1].y - this.track[endIdx].y) * tEnd,
    };
    pts.push(endPt);

    // Tangent vector of segment at the head
    const segDx = this.track[endIdx + 1].x - this.track[endIdx].x;
    const segDy = this.track[endIdx + 1].y - this.track[endIdx].y;
    const len = Math.hypot(segDx, segDy) || 1;

    return {
      points: pts,
      headTangent: { dx: segDx / len, dy: segDy / len },
    };
  }

  /**
   * Renders the line body and a single crisp arrow head at the leading tip.
   */
  public renderSubPath(sample: TrackSample, color: number): void {
    this.mainGfx.clear();
    const pts = sample.points;
    if (pts.length < 2) return;

    // Stroke the body along all its bends and curves
    this.mainGfx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      this.mainGfx.lineTo(pts[i].x, pts[i].y);
    }
    this.mainGfx.stroke({
      width: this.strokeWidth,
      color,
      cap: 'round',
      join: 'round',
    });

    // Draw single arrow head at the leading point (head)
    const headPt = pts[pts.length - 1];
    this.drawArrowHeadAt(headPt.x, headPt.y, sample.headTangent.dx, sample.headTangent.dy, color);
  }

  public renderLine(color: number): void {
    const sample = this.getSubPath(0, this.bodyLength);
    this.renderSubPath(sample, color);
  }

  /**
   * Single clean arrow head drawn at (hx, hy) facing along unit tangent (dx, dy).
   */
  private drawArrowHeadAt(hx: number, hy: number, dx: number, dy: number, color: number): void {
    const headLen = Math.max(9, this.cellSize * 0.32);
    const headWing = Math.max(6, this.cellSize * 0.22);

    // Perpendicular vector (-dy, dx)
    const perpX = -dy;
    const perpY = dx;

    const tipX = hx;
    const tipY = hy;

    const leftX = hx - dx * headLen + perpX * headWing;
    const leftY = hy - dy * headLen + perpY * headWing;

    const rightX = hx - dx * headLen - perpX * headWing;
    const rightY = hy - dy * headLen - perpY * headWing;

    this.mainGfx.moveTo(tipX, tipY)
      .lineTo(leftX, leftY)
      .lineTo(rightX, rightY)
      .closePath()
      .fill({ color });
  }

  /**
   * Fluid slithering escape animation:
   * The line travels forward through its own body and out the head, turning corners!
   */
  public animateExit(onComplete: () => void): void {
    const anim = { dist: this.bodyLength };
    const targetDist = this.totalTrackLength + this.bodyLength;

    gsap.to(anim, {
      dist: targetDist,
      duration: 0.55,
      ease: 'power2.in',
      onUpdate: () => {
        const endDist = anim.dist;
        const startDist = Math.max(0, endDist - this.bodyLength);
        if (startDist < this.totalTrackLength) {
          const sample = this.getSubPath(startDist, Math.min(this.totalTrackLength, endDist));
          this.renderSubPath(sample, GameConfig.colors.lineSuccess);
        } else {
          this.mainGfx.clear();
        }
      },
      onComplete: () => {
        this.mainGfx.clear();
        onComplete();
      },
    });
  }

  /**
   * Collision bump animation:
   * Line jolts forward along its path slightly, hits obstacle, and springs back elastically!
   */
  public animateBump(): void {
    const anim = { dist: this.bodyLength };
    const bumpOffset = Math.min(10, this.cellSize * 0.22);

    gsap.timeline()
      .to(anim, {
        dist: this.bodyLength + bumpOffset,
        duration: 0.08,
        ease: 'power1.out',
        onUpdate: () => {
          const endDist = anim.dist;
          const startDist = Math.max(0, endDist - this.bodyLength);
          const sample = this.getSubPath(startDist, endDist);
          this.renderSubPath(sample, GameConfig.colors.lineError);
        },
      })
      .to(anim, {
        dist: this.bodyLength,
        duration: 0.2,
        ease: 'elastic.out(1.2, 0.4)',
        onUpdate: () => {
          const endDist = anim.dist;
          const startDist = Math.max(0, endDist - this.bodyLength);
          const sample = this.getSubPath(startDist, endDist);
          this.renderSubPath(sample, GameConfig.colors.lineError);
        },
        onComplete: () => {
          const sample = this.getSubPath(0, this.bodyLength);
          this.renderSubPath(sample, this.baseColor);
        },
      });
  }

  public highlight(): void {
    const sample = this.getSubPath(0, this.bodyLength);
    this.renderSubPath(sample, GameConfig.colors.lineSelected);

    gsap.timeline({
      repeat: GameConfig.animation.hintPulseRepeats,
      yoyo: true,
      onComplete: () => {
        this.renderSubPath(sample, this.baseColor);
      },
    })
      .to(this.scale, { x: 1.06, y: 1.06, duration: GameConfig.animation.hintPulseDuration, ease: 'sine.inOut' })
      .to(this.scale, { x: 1.0, y: 1.0, duration: GameConfig.animation.hintPulseDuration, ease: 'sine.inOut' });
  }

  public getHeadGlobalPosition(): { x: number; y: number } {
    const head = this.track[this.data.points.length - 1];
    return this.toGlobal(head);
  }

  public getCenterGlobalPosition(): { x: number; y: number } {
    const midIdx = Math.floor(this.data.points.length / 2);
    const mid = this.track[midIdx];
    return this.toGlobal(mid);
  }
}
