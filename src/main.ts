import { Application } from 'pixi.js';
import { BoardEngine } from './core/BoardEngine';
import { LevelGenerator } from './core/LevelGenerator';
import { StateMachine } from './core/StateMachine';
import { AudioManager } from './core/AudioManager';
import { ArrowLineView } from './rendering/ArrowLineView';
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
  private lineViews: Map<string, ArrowLineView> = new Map();

  public async init(): Promise<void> {
    this.stateMachine = new StateMachine(GameState.INITIALIZING);

    this.currentLevelIndex = await StorageService.getLevel();
    const soundEnabled = await StorageService.getSoundEnabled();
    AudioManager.getInstance().setSoundEnabled(soundEnabled);

    // Initialize PixiJS Application with crisp white background
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
      this.lineViews.forEach(view => view.updateCellSize(newCellSize));
    });

    // Top Header & Controls HUD
    this.hud = new HUD({
      onBack: () => {
        if (this.currentLevelIndex > 1) {
          this.currentLevelIndex--;
          StorageService.setLevel(this.currentLevelIndex);
          this.startLevel(this.currentLevelIndex);
        }
      },
      onHint: () => this.triggerHint(),
      onRestart: () => this.restartCurrentLevel(),
      onToggleSound: () => {
        const enabled = AudioManager.getInstance().toggleSound();
        StorageService.setSoundEnabled(enabled);
        return enabled;
      },
    }, GameConfig.lives.max);

    this.modalManager = new ModalManager();

    await AdService.getInstance().initialize();
    this.startLevel(this.currentLevelIndex);
  }

  private startLevel(lvlIndex: number): void {
    this.stateMachine.forceState(GameState.INITIALIZING);
    this.lives = GameConfig.lives.default;

    // Grid size scales with level
    const cols = Math.min(14, 10 + Math.floor((lvlIndex - 1) / 3));
    const rows = Math.min(18, 12 + Math.floor((lvlIndex - 1) / 2));

    this.currentLevelData = LevelGenerator.generate(lvlIndex, cols, rows);
    this.engine = new BoardEngine(this.currentLevelData);

    const cellSize = this.stageManager.setupBoard(cols, rows);
    this.renderBoard(this.currentLevelData, cellSize);

    this.hud.updateLevel(lvlIndex, this.engine.getRemainingCount());
    this.hud.updateLives(this.lives);

    // If Level 1, guide player with tutorial finger on the first solvable line
    if (lvlIndex === 1) {
      this.showInitialTutorialPrompt();
    } else {
      this.stageManager.hideTutorialHand();
    }

    this.stateMachine.forceState(GameState.IDLE);
  }

  private renderBoard(level: LevelSchema, cellSize: number): void {
    const boardLayer = this.stageManager.getBoardLayer();
    boardLayer.removeChildren();
    this.lineViews.clear();

    level.lines.forEach(data => {
      const view = new ArrowLineView(data, cellSize);
      view.on('pointerdown', () => this.handleLineTap(view));
      boardLayer.addChild(view);
      this.lineViews.set(data.id, view);
    });
  }

  private showInitialTutorialPrompt(): void {
    const firstSolvable = this.engine.findSolvableLine();
    if (firstSolvable) {
      const view = this.lineViews.get(firstSolvable.id);
      if (view) {
        // Highlight line in electric blue
        view.renderLine(GameConfig.colors.lineSelected);
        const pos = view.getCenterGlobalPosition();
        this.stageManager.showTutorialHand(pos.x, pos.y);
      }
    }
  }

  private handleLineTap(view: ArrowLineView): void {
    if (this.stateMachine.getState() !== GameState.IDLE || view.data.isRemoved) {
      return;
    }

    this.stageManager.hideTutorialHand();
    this.stateMachine.transition(GameState.RESOLVING);
    const result = this.engine.evaluatePath(view.data.id);

    if (result.canEscape) {
      // Path clear!
      AudioManager.getInstance().playEscape();
      HapticService.success();

      const headPos = view.getHeadGlobalPosition();
      this.stageManager.spawnBurst(headPos.x, headPos.y, GameConfig.colors.lineSuccess);

      this.engine.markRemoved(view.data.id);
      this.hud.updateLevel(this.currentLevelIndex, this.engine.getRemainingCount());

      view.animateExit(() => {
        const boardLayer = this.stageManager.getBoardLayer();
        boardLayer.removeChild(view);
        this.lineViews.delete(view.data.id);
        view.destroy();

        if (this.engine.isBoardCleared()) {
          this.handleWin();
        } else {
          this.stateMachine.transition(GameState.IDLE);
        }
      });
    } else {
      // Path blocked!
      AudioManager.getInstance().playBump();
      HapticService.bump();
      this.stageManager.triggerScreenShake();
      view.animateBump();

      this.lives--;
      this.hud.updateLives(this.lives);

      if (this.lives <= 0) {
        this.handleGameOver();
      } else {
        this.stateMachine.transition(GameState.IDLE);
      }
    }
  }

  public triggerHint(): void {
    if (this.stateMachine.getState() !== GameState.IDLE) return;

    const hintLine = this.engine.findSolvableLine();
    if (hintLine) {
      AudioManager.getInstance().playHint();
      const view = this.lineViews.get(hintLine.id);
      if (view) {
        view.highlight();
        const pos = view.getCenterGlobalPosition();
        this.stageManager.showTutorialHand(pos.x, pos.y);
        setTimeout(() => this.stageManager.hideTutorialHand(), 3500);
      }
    }
  }

  private restartCurrentLevel(): void {
    this.startLevel(this.currentLevelIndex);
  }

  private async handleWin(): Promise<void> {
    this.stateMachine.forceState(GameState.LEVEL_WON);
    AudioManager.getInstance().playLevelClear();
    HapticService.levelClear();

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

    this.modalManager.showGameOverModal(
      () => {
        AdService.getInstance().showRewardAd(() => {
          this.lives = GameConfig.lives.max;
          this.hud.updateLives(this.lives);
          this.stateMachine.forceState(GameState.IDLE);
        });
      },
      () => {
        this.startLevel(this.currentLevelIndex);
      }
    );
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new GameApp();
  game.init().catch(err => {
    console.error('Failed to initialize ArrowLines game:', err);
  });
});
