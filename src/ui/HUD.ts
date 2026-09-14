export interface HUDCallbacks {
  onHint: () => void;
  onRestart: () => void;
  onToggleSound: () => boolean;
}

export class HUD {
  private container: HTMLElement;
  private levelEl!: HTMLElement;
  private livesEl!: HTMLElement;
  private remainingEl!: HTMLElement;
  private hintBtn!: HTMLButtonElement;
  private soundBtn!: HTMLButtonElement;
  private restartBtn!: HTMLButtonElement;
  private tipEl!: HTMLElement;

  private callbacks: HUDCallbacks;
  private maxLives = 3;

  constructor(callbacks: HUDCallbacks, maxLives = 3) {
    this.callbacks = callbacks;
    this.maxLives = maxLives;
    this.container = document.createElement('div');
    this.container.id = 'hud-overlay';
    this.injectStyles();
    this.createUI();
    document.body.appendChild(this.container);
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #hud-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 16px;
        box-sizing: border-box;
        z-index: 50;
        font-family: inherit;
      }
      .hud-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 18px;
        padding: 10px 18px;
        pointer-events: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      .hud-badge {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .hud-level-title {
        font-size: 1.15rem;
        font-weight: 800;
        letter-spacing: 0.5px;
        color: #f8fafc;
      }
      .hud-sub {
        font-size: 0.75rem;
        color: #94a3b8;
        font-weight: 600;
      }
      .hud-lives {
        display: flex;
        gap: 4px;
        font-size: 1.25rem;
      }
      .heart {
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;
      }
      .heart.lost {
        opacity: 0.25;
        transform: scale(0.75);
        filter: grayscale(1);
      }
      .hud-actions {
        display: flex;
        gap: 8px;
      }
      .hud-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #f8fafc;
        border-radius: 12px;
        padding: 8px 12px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        pointer-events: auto;
      }
      .hud-btn:hover {
        background: rgba(255, 255, 255, 0.18);
        transform: translateY(-1px);
      }
      .hud-btn:active {
        transform: translateY(1px) scale(0.96);
      }
      .hud-btn-hint {
        background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.3));
        border-color: rgba(234, 179, 8, 0.4);
        color: #fef08a;
      }
      .hud-footer {
        display: flex;
        justify-content: center;
        margin-bottom: 8px;
        pointer-events: auto;
      }
      .hud-tip {
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 6px 16px;
        font-size: 0.82rem;
        color: #94a3b8;
        font-weight: 500;
        text-align: center;
        transition: color 0.2s, background 0.2s;
      }
      .hud-tip.warning {
        color: #f87171;
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
      }
      .hud-tip.success {
        color: #4ade80;
        background: rgba(34, 197, 94, 0.15);
        border-color: rgba(34, 197, 94, 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  private createUI(): void {
    // Header
    const header = document.createElement('div');
    header.className = 'hud-header';

    const badge = document.createElement('div');
    badge.className = 'hud-badge';

    this.levelEl = document.createElement('div');
    this.levelEl.className = 'hud-level-title';
    this.levelEl.textContent = 'Level 1';

    this.remainingEl = document.createElement('div');
    this.remainingEl.className = 'hud-sub';
    this.remainingEl.textContent = 'Remaining: 0';

    badge.appendChild(this.levelEl);
    badge.appendChild(this.remainingEl);

    this.livesEl = document.createElement('div');
    this.livesEl.className = 'hud-lives';
    this.renderHearts(this.maxLives);

    const actions = document.createElement('div');
    actions.className = 'hud-actions';

    this.hintBtn = document.createElement('button');
    this.hintBtn.className = 'hud-btn hud-btn-hint';
    this.hintBtn.innerHTML = '<span>💡</span> <span>Hint</span>';
    this.hintBtn.addEventListener('click', () => this.callbacks.onHint());

    this.restartBtn = document.createElement('button');
    this.restartBtn.className = 'hud-btn';
    this.restartBtn.innerHTML = '<span>🔄</span>';
    this.restartBtn.title = 'Restart Level';
    this.restartBtn.addEventListener('click', () => this.callbacks.onRestart());

    this.soundBtn = document.createElement('button');
    this.soundBtn.className = 'hud-btn';
    this.soundBtn.innerHTML = '<span>🔊</span>';
    this.soundBtn.title = 'Toggle Sound';
    this.soundBtn.addEventListener('click', () => {
      const isSoundOn = this.callbacks.onToggleSound();
      this.soundBtn.innerHTML = isSoundOn ? '<span>🔊</span>' : '<span>🔇</span>';
    });

    actions.appendChild(this.hintBtn);
    actions.appendChild(this.restartBtn);
    actions.appendChild(this.soundBtn);

    header.appendChild(badge);
    header.appendChild(this.livesEl);
    header.appendChild(actions);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'hud-footer';

    this.tipEl = document.createElement('div');
    this.tipEl.className = 'hud-tip';
    this.tipEl.textContent = 'Tap an arrow whose exit path is clear!';
    footer.appendChild(this.tipEl);

    this.container.appendChild(header);
    this.container.appendChild(footer);
  }

  public updateLevel(level: number, remaining: number): void {
    this.levelEl.textContent = `Level ${level}`;
    this.remainingEl.textContent = `Remaining: ${remaining}`;
  }

  public updateLives(lives: number): void {
    this.renderHearts(lives);
  }

  public showMessage(text: string, type: 'normal' | 'warning' | 'success' = 'normal'): void {
    this.tipEl.textContent = text;
    this.tipEl.className = `hud-tip ${type}`;
  }

  private renderHearts(currentLives: number): void {
    this.livesEl.innerHTML = '';
    for (let i = 0; i < this.maxLives; i++) {
      const heart = document.createElement('span');
      heart.className = `heart ${i < currentLives ? '' : 'lost'}`;
      heart.textContent = '❤️';
      this.livesEl.appendChild(heart);
    }
  }
}
