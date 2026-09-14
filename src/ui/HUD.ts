export interface HUDCallbacks {
  onBack: () => void;
  onHint: () => void;
  onRestart: () => void;
  onToggleSound: () => boolean;
}

export class HUD {
  private container: HTMLElement;
  private livesEl!: HTMLElement;
  private hintBtn!: HTMLButtonElement;
  private soundBtn!: HTMLButtonElement;
  private restartBtn!: HTMLButtonElement;
  private backBtn!: HTMLButtonElement;
  private levelSubtitleEl!: HTMLElement;

  private callbacks: HUDCallbacks;
  private maxLives = 3;

  constructor(callbacks: HUDCallbacks, maxLives = 3) {
    this.callbacks = callbacks;
    this.maxLives = maxLives;
    this.container = document.createElement('div');
    this.container.id = 'app-hud-overlay';
    this.injectStyles();
    this.createUI();
    document.body.appendChild(this.container);
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #app-hud-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        box-sizing: border-box;
        z-index: 50;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      .hud-top-section {
        width: 100%;
        background: #ffffff;
        padding-top: 14px;
        padding-bottom: 8px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: auto;
      }
      .game-title-group {
        text-align: center;
        margin-bottom: 12px;
      }
      .game-title-primary {
        font-size: 2.1rem;
        font-weight: 800;
        color: #243356;
        line-height: 1.1;
        letter-spacing: -0.5px;
      }
      .game-title-secondary {
        font-size: 2.1rem;
        font-weight: 800;
        color: #243356;
        line-height: 1.1;
        letter-spacing: -0.5px;
      }
      .level-subtitle {
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        margin-top: 2px;
      }
      .hud-controls-row {
        width: 100%;
        max-width: 440px;
        padding: 0 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
      }
      .round-icon-btn {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: #eef2f8;
        border: none;
        color: #243356;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.15s ease;
        font-size: 1.1rem;
      }
      .round-icon-btn:hover {
        background: #e2e8f0;
        transform: scale(1.05);
      }
      .round-icon-btn:active {
        transform: scale(0.95);
      }
      .hearts-container {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: center;
      }
      .heart-icon {
        font-size: 1.8rem;
        line-height: 1;
        color: #ef4444;
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
        display: inline-block;
      }
      .heart-icon.lost {
        opacity: 0.22;
        transform: scale(0.72);
        filter: grayscale(1);
      }
      .hud-right-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .hud-divider {
        width: 100%;
        height: 1.5px;
        background: #eef2f6;
        margin-top: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  private createUI(): void {
    const topSection = document.createElement('div');
    topSection.className = 'hud-top-section';

    // Game Title ("Tap Away \n ArrowLines")
    const titleGroup = document.createElement('div');
    titleGroup.className = 'game-title-group';

    const primaryTitle = document.createElement('div');
    primaryTitle.className = 'game-title-primary';
    primaryTitle.textContent = 'Tap Away';

    const secondaryTitle = document.createElement('div');
    secondaryTitle.className = 'game-title-secondary';
    secondaryTitle.textContent = 'ArrowLines';

    this.levelSubtitleEl = document.createElement('div');
    this.levelSubtitleEl.className = 'level-subtitle';
    this.levelSubtitleEl.textContent = 'Level 1';

    titleGroup.appendChild(primaryTitle);
    titleGroup.appendChild(secondaryTitle);
    titleGroup.appendChild(this.levelSubtitleEl);

    // Controls Row (Back button on left, Hearts in center, Actions on right)
    const controlsRow = document.createElement('div');
    controlsRow.className = 'hud-controls-row';

    this.backBtn = document.createElement('button');
    this.backBtn.className = 'round-icon-btn';
    this.backBtn.innerHTML = '◀';
    this.backBtn.title = 'Previous Level';
    this.backBtn.addEventListener('click', () => this.callbacks.onBack());

    this.livesEl = document.createElement('div');
    this.livesEl.className = 'hearts-container';
    this.renderHearts(this.maxLives);

    const rightActions = document.createElement('div');
    rightActions.className = 'hud-right-actions';

    this.hintBtn = document.createElement('button');
    this.hintBtn.className = 'round-icon-btn';
    this.hintBtn.innerHTML = '💡';
    this.hintBtn.title = 'Get a Hint';
    this.hintBtn.addEventListener('click', () => this.callbacks.onHint());

    this.restartBtn = document.createElement('button');
    this.restartBtn.className = 'round-icon-btn';
    this.restartBtn.innerHTML = '🔄';
    this.restartBtn.title = 'Restart';
    this.restartBtn.addEventListener('click', () => this.callbacks.onRestart());

    this.soundBtn = document.createElement('button');
    this.soundBtn.className = 'round-icon-btn';
    this.soundBtn.innerHTML = '🔊';
    this.soundBtn.title = 'Sound';
    this.soundBtn.addEventListener('click', () => {
      const isSoundOn = this.callbacks.onToggleSound();
      this.soundBtn.innerHTML = isSoundOn ? '🔊' : '🔇';
    });

    rightActions.appendChild(this.hintBtn);
    rightActions.appendChild(this.restartBtn);
    rightActions.appendChild(this.soundBtn);

    controlsRow.appendChild(this.backBtn);
    controlsRow.appendChild(this.livesEl);
    controlsRow.appendChild(rightActions);

    const divider = document.createElement('div');
    divider.className = 'hud-divider';

    topSection.appendChild(titleGroup);
    topSection.appendChild(controlsRow);
    topSection.appendChild(divider);

    this.container.appendChild(topSection);
  }

  public updateLevel(level: number, remaining: number): void {
    this.levelSubtitleEl.textContent = `Level ${level} • ${remaining} lines left`;
  }

  public updateLives(lives: number): void {
    this.renderHearts(lives);
  }

  private renderHearts(currentLives: number): void {
    this.livesEl.innerHTML = '';
    for (let i = 0; i < this.maxLives; i++) {
      const heart = document.createElement('span');
      heart.className = `heart-icon ${i < currentLives ? '' : 'lost'}`;
      heart.textContent = '❤️';
      this.livesEl.appendChild(heart);
    }
  }
}
