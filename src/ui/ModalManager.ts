export class ModalManager {
  private overlay: HTMLElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'modal-backdrop';
    this.injectStyles();
    document.body.appendChild(this.overlay);
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 100;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      #modal-backdrop.active {
        display: flex;
        opacity: 1;
      }
      .modal-card {
        background: #ffffff;
        border-radius: 28px;
        padding: 32px 26px;
        width: 88%;
        max-width: 360px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
        transform: scale(0.92);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: inherit;
      }
      #modal-backdrop.active .modal-card {
        transform: scale(1);
      }
      .modal-emoji {
        font-size: 3.5rem;
        margin-bottom: 10px;
        display: inline-block;
      }
      .modal-title {
        font-size: 1.6rem;
        font-weight: 800;
        color: #243356;
        margin-bottom: 8px;
      }
      .modal-desc {
        font-size: 0.95rem;
        color: #64748b;
        margin-bottom: 24px;
        line-height: 1.45;
      }
      .modal-btn-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .modal-btn-primary {
        background: #0091ff;
        color: #ffffff;
        border: none;
        border-radius: 16px;
        padding: 14px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.15s ease;
        box-shadow: 0 4px 14px rgba(0, 145, 255, 0.35);
      }
      .modal-btn-primary:hover {
        background: #0080e0;
        transform: translateY(-2px);
      }
      .modal-btn-primary:active {
        transform: translateY(1px);
      }
      .modal-btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: none;
        border-radius: 16px;
        padding: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .modal-btn-secondary:hover {
        background: #e2e8f0;
      }
      .modal-btn-reward {
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      }
    `;
    document.head.appendChild(style);
  }

  public showWinModal(level: number, onNext: () => void): void {
    this.overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-emoji">🎉</div>
        <div class="modal-title">Level ${level} Solved!</div>
        <div class="modal-desc">All lines untangled and cleared successfully!</div>
        <div class="modal-btn-group">
          <button id="modal-next-btn" class="modal-btn-primary">Next Level ➔</button>
        </div>
      </div>
    `;

    this.overlay.classList.add('active');
    document.getElementById('modal-next-btn')?.addEventListener('click', () => {
      this.hide();
      onNext();
    });
  }

  public showGameOverModal(onRevive: () => void, onRetry: () => void): void {
    this.overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-emoji">💔</div>
        <div class="modal-title">Out of Hearts!</div>
        <div class="modal-desc">An arrow collided with another line. Watch an ad to revive or retry!</div>
        <div class="modal-btn-group">
          <button id="modal-revive-btn" class="modal-btn-primary modal-btn-reward">📺 Watch Ad to Revive (+3 ❤️)</button>
          <button id="modal-retry-btn" class="modal-btn-secondary">🔄 Restart Level</button>
        </div>
      </div>
    `;

    this.overlay.classList.add('active');

    document.getElementById('modal-revive-btn')?.addEventListener('click', () => {
      this.hide();
      onRevive();
    });

    document.getElementById('modal-retry-btn')?.addEventListener('click', () => {
      this.hide();
      onRetry();
    });
  }

  public hide(): void {
    this.overlay.classList.remove('active');
  }
}
