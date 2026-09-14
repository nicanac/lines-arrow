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
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
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
        background: #1e293b;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 24px;
        padding: 28px 24px;
        width: 90%;
        max-width: 360px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        transform: scale(0.92);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      #modal-backdrop.active .modal-card {
        transform: scale(1);
      }
      .modal-emoji {
        font-size: 3.5rem;
        margin-bottom: 8px;
        display: inline-block;
        animation: bounce 0.6s infinite alternate ease-in-out;
      }
      @keyframes bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-8px); }
      }
      .modal-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: #f8fafc;
        margin-bottom: 6px;
      }
      .modal-desc {
        font-size: 0.92rem;
        color: #94a3b8;
        margin-bottom: 22px;
        line-height: 1.4;
      }
      .modal-btn-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .modal-btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #ffffff;
        border: none;
        border-radius: 14px;
        padding: 14px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
      }
      .modal-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6);
      }
      .modal-btn-primary:active {
        transform: translateY(1px);
      }
      .modal-btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: #cbd5e1;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .modal-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      .modal-btn-reward {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
      }
      .modal-btn-reward:hover {
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
      }
    `;
    document.head.appendChild(style);
  }

  public showWinModal(level: number, onNext: () => void): void {
    this.overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-emoji">🎉</div>
        <div class="modal-title">Level ${level} Cleared!</div>
        <div class="modal-desc">All arrows safely escaped the board. Outstanding!</div>
        <div class="modal-btn-group">
          <button id="modal-next-btn" class="modal-btn-primary">Next Level ➡️</button>
        </div>
      </div>
    `;

    this.overlay.classList.add('active');
    const nextBtn = document.getElementById('modal-next-btn');
    nextBtn?.addEventListener('click', () => {
      this.hide();
      onNext();
    });
  }

  public showGameOverModal(onRevive: () => void, onRetry: () => void): void {
    this.overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-emoji">💔</div>
        <div class="modal-title">Out of Lives!</div>
        <div class="modal-desc">An arrow collided with an obstacle. Watch an ad to revive with full lives or retry the level!</div>
        <div class="modal-btn-group">
          <button id="modal-revive-btn" class="modal-btn-primary modal-btn-reward">📺 Watch Ad to Revive (+3 Lives)</button>
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
