import { Application } from 'pixi.js';
import { BoardEngine } from './core/BoardEngine';
import { LevelGenerator } from './core/LevelGenerator';
import { StateMachine } from './core/StateMachine';
import { AudioManager } from './core/AudioManager';
import { ArrowView } from './rendering/ArrowView';
import { StageManager } from './rendering/StageManager';
import { GameState, LevelSchema } from './types/game.types';
import { GameConfig } from './config/game.config';
import { HapticService } from './services/HapticService';
import { AdService } from './services/AdService';
import { StorageService } from './services/StorageService';
import { HUD } from './ui/HUD';
import { ModalManager } from './ui/ModalManager';

export class GameApp {
  private app!: Application;
  private stageManager!: StageManager;
  private engine!: BoardEngine;
  private stateMachine!: StateMachine;
  private hud!: HUD;
  private modalManager!: ModalManager;
  private currentLevelData!: LevelSchema;

  private currentLevelIndex = 1;
  private lives = GameConfig.lives.default;
  private arrowViews: Map<string, ArrowView> = new Map();

  public async init(): Promise<void> {
    this.stateMachine = new StateMachine(GameState.INITIALIZING);

    // Load saved progress
    this.currentLevelIndex = await StorageService.getLevel();
    const soundEnabled = await StorageService.getSoundEnabled();
    AudioManager.getInstance().setSoundEnabled(soundEnabled);

    // Initialize PixiJS Application
    this.app = new Application();
    await this.app.init({
      resizeTo: window,
      backgroundColor: GameConfig.colors.background,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    const gameContainer = document.getElementById('game-container') || document.body;
    gameContainer.appendChild(this.app.canvas);

    this.stageManager = new StageManager(this.app);
    this.stageManager.setResizeCallback((newCellSize) => {
      this.arrowViews.forEach(view => view.updateCellSize(newCellSize));
    });

    // Initialize UI Overlays
    this.hud = new HUD({
      onHint: () => this.triggerHint(),
      onRestart: () => this.restartCurrentLevel(),
      onToggleSound: () => {
        const enabled = AudioManager.getInstance().toggleSound();
        StorageService.setSoundEnabled(enabled);
        return enabled;
      },
    }, GameConfig.lives.max);

    this.modalManager = new ModalManager();

    // Initialize hardware & ads
    await AdService.getInstance().initialize();

    // Begin Level
    this.startLevel(this.currentLevelIndex);
  }

  private startLevel(lvlIndex: number): void {
    this.stateMachine.forceState(GameState.INITIALIZING);
    this.lives = GameConfig.lives.default;

    // Difficulty scaling: dynamically compute columns & rows
    const cols = Math.min(7, 4 + Math.floor((lvlIndex - 1) / 4));
    const rows = Math.min(8, 4 + Math.floor((lvlIndex - 1) / 3));
    const fillRate = Math.min(0.75, 0.55 + (lvlIndex * 0.01));

    this.currentLevelData = LevelGenerator.generate(lvlIndex, cols, rows, fillRate);
    this.engine = new BoardEngine(this.currentLevelData);

    const cellSize = this.stageManager.setupBoard(cols, rows);
    this.renderBoard(this.currentLevelData, cellSize);

    this.hud.updateLevel(lvlIndex, this.engine.getRemainingCount());
    this.hud.updateLives(this.lives);
    this.hud.showMessage(`Level ${lvlIndex}: Clear the board!`);

    this.stateMachine.forceState(GameState.IDLE);
  }

  private renderBoard(level: LevelSchema, cellSize: number): void {
    const boardLayer = this.stageManager.getBoardLayer();
    boardLayer.removeChildren();
    this.arrowViews.clear();

    level.arrows.forEach(data => {
      const view = new ArrowView(data, cellSize);
      view.on('pointerdown', () => this.handleNodeTap(view));
      boardLayer.addChild(view);
      this.arrowViews.set(data.id, view);
    });
  }

  private handleNodeTap(view: ArrowView): void {
    if (this.stateMachine.getState() !== GameState.IDLE || view.data.isRemoved) {
      return;
    }

    this.stateMachine.transition(GameState.RESOLVING);
    const result = this.engine.evaluatePath(view.data.id);

    if (result.canEscape) {
      // Path clear!
      AudioManager.getInstance().playEscape();
      HapticService.success();

      // Particle effect at arrow origin
      const globalPos = view.toGlobal({ x: 0, y: 0 });
      this.stageManager.spawnBurst(globalPos.x, globalPos.y, view.data.color || GameConfig.colors.arrowSuccess);

      this.engine.markRemoved(view.data.id);
      this.hud.updateLevel(this.currentLevelIndex, this.engine.getRemainingCount());
      this.hud.showMessage('Path clear! Arrow escaped.', 'success');

      view.animateExit(() => {
        const boardLayer = this.stageManager.getBoardLayer();
        boardLayer.removeChild(view);
        this.arrowViews.delete(view.data.id);
        view.destroy();

        if (this.engine.isBoardCleared()) {
          this.handleWin();
        } else {
          this.stateMachine.transition(GameState.IDLE);
        }
      });
    } else {
      // Collision / blocked!
      AudioManager.getInstance().playBump();
      HapticService.bump();
      this.stageManager.triggerScreenShake();
      view.animateBump();

      this.lives--;
      this.hud.updateLives(this.lives);
      this.hud.showMessage('Path blocked by another arrow! -1 Life', 'warning');

      if (this.lives <= 0) {
        this.handleGameOver();
      } else {
        this.stateMachine.transition(GameState.IDLE);
      }
    }
  }

  public triggerHint(): void {
    if (this.stateMachine.getState() !== GameState.IDLE) return;

    const hintNode = this.engine.findSolvableNode();
    if (hintNode) {
      AudioManager.getInstance().playHint();
      const view = this.arrowViews.get(hintNode.id);
      if (view) {
        view.highlight();
        this.hud.showMessage('Hint highlighted an escape route!', 'normal');
      }
    } else {
      this.hud.showMessage('No immediate moves available.', 'warning');
    }
  }

  private restartCurrentLevel(): void {
    this.startLevel(this.currentLevelIndex);
  }

  private async handleWin(): Promise<void> {
    this.stateMachine.forceState(GameState.LEVEL_WON);
    AudioManager.getInstance().playLevelClear();
    HapticService.levelClear();
    this.hud.showMessage('Level Cleared! Outstanding!', 'success');

    await StorageService.setLevel(this.currentLevelIndex + 1);

    this.modalManager.showWinModal(this.currentLevelIndex, async () => {
      this.currentLevelIndex++;
      if (this.currentLevelIndex % GameConfig.ads.interstitialFrequency === 0) {
        await AdService.getInstance().showInterstitial();
      }
      this.startLevel(this.currentLevelIndex);
    });
  }

  private handleGameOver(): void {
    this.stateMachine.forceState(GameState.GAME_OVER);
    AudioManager.getInstance().playGameOver();
    this.hud.showMessage('Game Over! No lives left.', 'warning');

    this.modalManager.showGameOverModal(
      // On Watch Ad / Revive
      () => {
        AdService.getInstance().showRewardAd(() => {
          this.lives = GameConfig.lives.max;
          this.hud.updateLives(this.lives);
          this.hud.showMessage('Revived! Full lives restored.', 'success');
          this.stateMachine.forceState(GameState.IDLE);
        });
      },
      // On Restart
      () => {
        this.startLevel(this.currentLevelIndex);
      }
    );
  }
}

// Bootstrap once DOM content is ready
window.addEventListener('DOMContentLoaded', () => {
  const game = new GameApp();
  game.init().catch(err => {
    console.error('Failed to initialize Arrow Escape game:', err);
  });
});
