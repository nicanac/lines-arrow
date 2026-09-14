import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { ArrowNodeData, Direction } from '../types/game.types';
import { GameConfig } from '../config/game.config';

export class ArrowView extends Container {
  public data: ArrowNodeData;
  private gfx: Graphics;
  private cellSize: number;
  private baseColor: number;

  constructor(data: ArrowNodeData, cellSize: number) {
    super();
    this.data = data;
    this.cellSize = cellSize;
    this.baseColor = data.color ?? GameConfig.colors.arrowDefault;

    // Center container in the cell
    this.x = data.coord.x * cellSize + cellSize / 2;
    this.y = data.coord.y * cellSize + cellSize / 2;

    this.gfx = new Graphics();
    this.addChild(this.gfx);
    this.drawArrow(this.baseColor);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.setDirectionRotation(data.direction);

    // Hover feedback
    this.on('pointerover', () => {
      if (!this.data.isRemoved) {
        gsap.to(this.scale, { x: 1.06, y: 1.06, duration: 0.12 });
      }
    });
    this.on('pointerout', () => {
      if (!this.data.isRemoved) {
        gsap.to(this.scale, { x: 1.0, y: 1.0, duration: 0.12 });
      }
    });
  }

  public updateCellSize(cellSize: number): void {
    this.cellSize = cellSize;
    this.x = this.data.coord.x * cellSize + cellSize / 2;
    this.y = this.data.coord.y * cellSize + cellSize / 2;
    this.drawArrow(this.baseColor);
  }

  private drawArrow(boxColor: number, borderColor = 0xffffff, borderAlpha = 0.25): void {
    const size = this.cellSize * 0.78;
    const half = size / 2;
    const radius = Math.min(10, size * 0.18);

    this.gfx.clear();

    // Subtle drop shadow / back layer
    this.gfx.roundRect(-half + 1, -half + 2, size, size, radius)
      .fill({ color: 0x000000, alpha: 0.35 });

    // Node Box Body
    this.gfx.roundRect(-half, -half, size, size, radius)
      .fill({ color: boxColor })
      .stroke({ width: 1.5, color: borderColor, alpha: borderAlpha });

    // Inner Directional Arrow Glyph (pointing UP at rotation 0)
    const arrowWidth = half * 0.52;
    const arrowHeight = half * 0.65;
    const stemWidth = half * 0.22;
    const stemBottom = half * 0.45;

    // Arrow Head
    this.gfx.moveTo(0, -arrowHeight)
      .lineTo(arrowWidth, 0)
      .lineTo(stemWidth, 0)
      .lineTo(stemWidth, stemBottom)
      .lineTo(-stemWidth, stemBottom)
      .lineTo(-stemWidth, 0)
      .lineTo(-arrowWidth, 0)
      .closePath()
      .fill({ color: GameConfig.colors.glyphWhite });
  }

  private setDirectionRotation(dir: Direction): void {
    const rotations: Record<Direction, number> = {
      N: 0,
      NE: Math.PI / 4,
      E: Math.PI / 2,
      SE: (3 * Math.PI) / 4,
      S: Math.PI,
      SW: (5 * Math.PI) / 4,
      W: (3 * Math.PI) / 2,
      NW: (7 * Math.PI) / 4,
    };
    this.gfx.rotation = rotations[dir];
  }

  public animateExit(onComplete: () => void): void {
    const dist = GameConfig.animation.exitDistance;
    const angle = this.gfx.rotation - Math.PI / 2;
    const targetX = this.x + Math.cos(angle) * dist;
    const targetY = this.y + Math.sin(angle) * dist;

    // Glow success color
    this.drawArrow(GameConfig.colors.arrowSuccess, 0x10b981, 0.8);

    gsap.to(this, {
      x: targetX,
      y: targetY,
      duration: GameConfig.animation.exitDuration,
      ease: 'power2.in',
      onComplete,
    });
  }

  public animateBump(): void {
    const angle = this.gfx.rotation - Math.PI / 2;
    const bumpDist = GameConfig.animation.bumpDistance;
    const origX = this.x;
    const origY = this.y;

    // Flash error red
    this.drawArrow(GameConfig.colors.arrowError, 0xef4444, 0.9);

    gsap.timeline()
      .to(this, {
        x: origX + Math.cos(angle) * bumpDist,
        y: origY + Math.sin(angle) * bumpDist,
        duration: GameConfig.animation.bumpDuration,
        ease: 'power1.out',
      })
      .to(this, {
        x: origX,
        y: origY,
        duration: GameConfig.animation.bumpReturnDuration,
        ease: 'elastic.out(1.2, 0.4)',
        onComplete: () => {
          this.drawArrow(this.baseColor);
        },
      });
  }

  public highlight(): void {
    // Flash hint golden
    this.drawArrow(GameConfig.colors.arrowHint, 0xfacc15, 0.9);

    gsap.timeline({
      repeat: GameConfig.animation.hintPulseRepeats,
      yoyo: true,
      onComplete: () => {
        this.drawArrow(this.baseColor);
      },
    })
      .to(this.scale, { x: 1.25, y: 1.25, duration: GameConfig.animation.hintPulseDuration, ease: 'sine.inOut' })
      .to(this.scale, { x: 1.0, y: 1.0, duration: GameConfig.animation.hintPulseDuration, ease: 'sine.inOut' });
  }
}
