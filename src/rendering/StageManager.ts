import { Application, Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { GameConfig } from '../config/game.config';

export class StageManager {
  private app: Application;
  private rootContainer: Container;
  private boardLayer: Container;
  private particleLayer: Container;
  private tutorialLayer: Container;
  private tutorialHandContainer!: Container;
  private tutorialTween?: gsap.core.Tween;
  private onResizeCallback?: (cellSize: number) => void;

  private currentCols = 12;
  private currentRows = 14;
  private currentCellSize: number = GameConfig.grid.baseCellSize;

  constructor(app: Application) {
    this.app = app;
    this.rootContainer = new Container();
    this.boardLayer = new Container();
    this.particleLayer = new Container();
    this.tutorialLayer = new Container();

    this.rootContainer.addChild(this.boardLayer);
    this.rootContainer.addChild(this.particleLayer);
    this.rootContainer.addChild(this.tutorialLayer);
    this.app.stage.addChild(this.rootContainer);

    this.initTutorialHand();
    window.addEventListener('resize', () => this.handleResize());
  }

  public getBoardLayer(): Container {
    return this.boardLayer;
  }

  public getCellSize(): number {
    return this.currentCellSize;
  }

  public setResizeCallback(callback: (cellSize: number) => void): void {
    this.onResizeCallback = callback;
  }

  public setupBoard(cols: number, rows: number): number {
    this.currentCols = cols;
    this.currentRows = rows;
    this.recalculateLayout();
    return this.currentCellSize;
  }

  public handleResize(): void {
    this.recalculateLayout();
    if (this.onResizeCallback) {
      this.onResizeCallback(this.currentCellSize);
    }
  }

  private recalculateLayout(): void {
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    // Allocate padding: top HUD is ~130px, bottom margin ~40px
    const availableWidth = screenWidth - 48;
    const availableHeight = screenHeight - 190;

    const sizeByWidth = availableWidth / this.currentCols;
    const sizeByHeight = availableHeight / this.currentRows;
    const targetSize = Math.floor(Math.min(sizeByWidth, sizeByHeight));

    this.currentCellSize = Math.max(
      GameConfig.grid.minCellSize,
      Math.min(GameConfig.grid.maxCellSize, targetSize)
    );

    const totalWidth = this.currentCols * this.currentCellSize;
    const totalHeight = this.currentRows * this.currentCellSize;

    const startX = Math.floor((screenWidth - totalWidth) / 2);
    const startY = Math.floor((screenHeight - totalHeight) / 2) + 40;

    this.boardLayer.x = startX;
    this.boardLayer.y = startY;
  }

  public triggerScreenShake(): void {
    const origX = 0;
    const origY = 0;

    gsap.timeline()
      .to(this.rootContainer, { x: origX - 6, y: origY + 3, duration: 0.04 })
      .to(this.rootContainer, { x: origX + 6, y: origY - 3, duration: 0.04 })
      .to(this.rootContainer, { x: origX - 3, y: origY + 2, duration: 0.04 })
      .to(this.rootContainer, { x: origX + 3, y: origY - 2, duration: 0.04 })
      .to(this.rootContainer, { x: origX, y: origY, duration: 0.04 });
  }

  public spawnBurst(globalX: number, globalY: number, color = GameConfig.colors.lineSelected): void {
    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
      const p = new Graphics();
      p.circle(0, 0, Math.random() * 3 + 2).fill({ color, alpha: 0.85 });
      p.x = globalX;
      p.y = globalY;
      this.particleLayer.addChild(p);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 70 + 35;
      const targetX = p.x + Math.cos(angle) * speed;
      const targetY = p.y + Math.sin(angle) * speed;

      gsap.to(p, {
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 0.45,
        ease: 'power2.out',
        onComplete: () => {
          this.particleLayer.removeChild(p);
          p.destroy();
        }
      });
    }
  }

  private initTutorialHand(): void {
    this.tutorialHandContainer = new Container();
    this.tutorialHandContainer.visible = false;

    // Glowing blue touch pulse circle
    const pulseRing = new Graphics();
    pulseRing.circle(0, 0, 24)
      .fill({ color: 0x38bdf8, alpha: 0.35 })
      .stroke({ width: 2, color: 0x0284c7, alpha: 0.8 });
    pulseRing.label = 'pulse';

    // Cartoon hand pointing finger (matching screenshot)
    const handGfx = new Graphics();
    // Palm and fingers
    handGfx.roundRect(6, 12, 34, 42, 14)
      .fill({ color: 0xdbeafe })
      .stroke({ width: 2, color: 0x93c5fd });

    // Index finger pointing up-left to (0, 0)
    handGfx.moveTo(0, 0)
      .lineTo(14, 18)
      .lineTo(8, 26)
      .closePath()
      .fill({ color: 0xeff6ff })
      .stroke({ width: 2, color: 0x93c5fd });

    // Wrist
    handGfx.roundRect(14, 48, 22, 18, 6)
      .fill({ color: 0xbfdbfe })
      .stroke({ width: 1.5, color: 0x60a5fa });

    this.tutorialHandContainer.addChild(pulseRing);
    this.tutorialHandContainer.addChild(handGfx);
    this.tutorialLayer.addChild(this.tutorialHandContainer);
  }

  public showTutorialHand(x: number, y: number): void {
    this.tutorialHandContainer.x = x;
    this.tutorialHandContainer.y = y;
    this.tutorialHandContainer.visible = true;
    this.tutorialHandContainer.alpha = 1;

    const pulse = this.tutorialHandContainer.getChildByLabel('pulse');

    if (this.tutorialTween) this.tutorialTween.kill();
    this.tutorialTween = gsap.to(this.tutorialHandContainer, {
      y: y + 8,
      duration: 0.6,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    if (pulse) {
      gsap.to(pulse.scale, {
        x: 1.35,
        y: 1.35,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }

  public hideTutorialHand(): void {
    if (this.tutorialTween) {
      this.tutorialTween.kill();
      this.tutorialTween = undefined;
    }
    gsap.to(this.tutorialHandContainer, {
      alpha: 0,
      duration: 0.25,
      onComplete: () => {
        this.tutorialHandContainer.visible = false;
      }
    });
  }
}
