import { Application, Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { GameConfig } from '../config/game.config';

export class StageManager {
  private app: Application;
  private rootContainer: Container;
  private gridBgLayer: Graphics;
  private boardLayer: Container;
  private particleLayer: Container;
  private onResizeCallback?: (cellSize: number) => void;

  private currentCols = 6;
  private currentRows = 6;
  private currentCellSize: number = GameConfig.grid.baseCellSize;

  constructor(app: Application) {
    this.app = app;
    this.rootContainer = new Container();
    this.gridBgLayer = new Graphics();
    this.boardLayer = new Container();
    this.particleLayer = new Container();

    this.rootContainer.addChild(this.gridBgLayer);
    this.rootContainer.addChild(this.boardLayer);
    this.rootContainer.addChild(this.particleLayer);
    this.app.stage.addChild(this.rootContainer);

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

  /**
   * Adapts the board dimensions and cell size to fit the screen with comfortable padding.
   */
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

    // Leave space for HUD at top (80px) and bottom (60px)
    const availableWidth = screenWidth - 32;
    const availableHeight = screenHeight - 160;

    const sizeByWidth = availableWidth / this.currentCols;
    const sizeByHeight = availableHeight / this.currentRows;
    const targetSize = Math.floor(Math.min(sizeByWidth, sizeByHeight));

    this.currentCellSize = Math.max(
      GameConfig.grid.minCellSize,
      Math.min(GameConfig.grid.maxCellSize, targetSize)
    );

    const totalWidth = this.currentCols * this.currentCellSize;
    const totalHeight = this.currentRows * this.currentCellSize;

    // Center board
    const startX = Math.floor((screenWidth - totalWidth) / 2);
    const startY = Math.floor((screenHeight - totalHeight) / 2) + 15; // slightly offset for top HUD

    this.boardLayer.x = startX;
    this.boardLayer.y = startY;

    this.drawGridBackground(startX, startY, totalWidth, totalHeight);
  }

  private drawGridBackground(x: number, y: number, width: number, height: number): void {
    this.gridBgLayer.clear();

    const pad = 12;
    // Outer board card
    this.gridBgLayer.roundRect(x - pad, y - pad, width + pad * 2, height + pad * 2, 20)
      .fill({ color: GameConfig.colors.gridBackground, alpha: 0.6 })
      .stroke({ width: 2, color: GameConfig.colors.gridBorder, alpha: 0.7 });

    // Cell slot hints
    for (let c = 0; c < this.currentCols; c++) {
      for (let r = 0; r < this.currentRows; r++) {
        const cx = x + c * this.currentCellSize + this.currentCellSize / 2;
        const cy = y + r * this.currentCellSize + this.currentCellSize / 2;
        const slotSize = this.currentCellSize * 0.78;
        const half = slotSize / 2;
        const radius = Math.min(10, slotSize * 0.18);

        this.gridBgLayer.roundRect(cx - half, cy - half, slotSize, slotSize, radius)
          .fill({ color: 0x0f172a, alpha: 0.4 })
          .stroke({ width: 1, color: 0x334155, alpha: 0.3 });
      }
    }
  }

  /**
   * Visual screen shake feedback on illegal move / bump
   */
  public triggerScreenShake(): void {
    const origX = 0;
    const origY = 0;

    gsap.timeline()
      .to(this.rootContainer, { x: origX - 8, y: origY + 4, duration: 0.04 })
      .to(this.rootContainer, { x: origX + 8, y: origY - 4, duration: 0.04 })
      .to(this.rootContainer, { x: origX - 4, y: origY + 2, duration: 0.04 })
      .to(this.rootContainer, { x: origX + 4, y: origY - 2, duration: 0.04 })
      .to(this.rootContainer, { x: origX, y: origY, duration: 0.04 });
  }

  /**
   * Spawn particle burst on arrow escape
   */
  public spawnBurst(globalX: number, globalY: number, color: number): void {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const p = new Graphics();
      p.circle(0, 0, Math.random() * 3 + 2).fill({ color, alpha: 0.9 });
      p.x = globalX;
      p.y = globalY;
      this.particleLayer.addChild(p);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 60 + 30;
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
}
