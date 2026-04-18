export class HUD {
  private objectiveEl: HTMLElement;
  private stageEl: HTMLElement;
  private moneyEl: HTMLElement;
  private timerEl: HTMLElement;
  private speedEl: HTMLElement;
  private fuelPctEl: HTMLElement;
  private fuelFillEl: HTMLElement;
  private passengersCountEl: HTMLElement;
  private passengersDotsEl: HTMLElement;
  private interactPromptEl: HTMLElement;
  private loadingEl: HTMLElement;
  private loadingBarEl: HTMLElement;
  private loadingStatusEl: HTMLElement;
  private toastWrap: HTMLElement;

  constructor() {
    this.objectiveEl = document.getElementById('objective-text')!;
    this.stageEl = document.getElementById('stage-num')!;
    this.moneyEl = document.getElementById('money')!;
    this.timerEl = document.getElementById('timer')!;
    this.speedEl = document.getElementById('speed')!;
    this.fuelPctEl = document.getElementById('fuel-pct')!;
    this.fuelFillEl = document.getElementById('fuel-fill')!;
    this.passengersCountEl = document.getElementById('passengers-count')!;
    this.passengersDotsEl = document.getElementById('passengers-dots')!;
    this.interactPromptEl = document.getElementById('interact-prompt')!;
    this.loadingEl = document.getElementById('loading')!;
    this.loadingBarEl = document.getElementById('loading-bar-fill')!;
    this.loadingStatusEl = document.getElementById('loading-status')!;
    this.toastWrap = document.getElementById('toast-wrap')!;
  }

  setObjective(text: string) { this.objectiveEl.textContent = text; }
  setStage(n: number) { this.stageEl.textContent = String(n); }
  setMoney(amount: number) { this.moneyEl.textContent = `${Math.round(amount)} $`; }
  setTimer(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    this.timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  setSpeed(kmh: number) { this.speedEl.textContent = String(Math.round(Math.abs(kmh))); }
  setFuel(pct01: number) {
    const pct = Math.max(0, Math.min(1, pct01));
    this.fuelFillEl.style.width = (pct * 100) + '%';
    this.fuelPctEl.textContent = Math.round(pct * 100) + '%';
    if (pct < 0.15) this.fuelFillEl.style.background = '#ff4444';
    else if (pct < 0.3) this.fuelFillEl.style.background = '#ffaa33';
    else this.fuelFillEl.style.background = '#66ff99';
  }
  setPassengers(current: number, total: number) {
    this.passengersCountEl.textContent = `${current}/${total}`;
    this.passengersDotsEl.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i < current ? ' on' : '');
      this.passengersDotsEl.appendChild(dot);
    }
  }
  showInteract(show: boolean, text?: string) {
    this.interactPromptEl.classList.toggle('show', show);
    if (text) this.interactPromptEl.innerHTML = text;
    else this.interactPromptEl.innerHTML = 'اضغط <kbd>E</kbd>';
  }
  updateLoading(pct: number, msg?: string) {
    this.loadingBarEl.style.width = (pct * 100) + '%';
    if (msg) this.loadingStatusEl.textContent = msg;
  }
  hideLoading() {
    this.loadingEl.style.opacity = '0';
    this.loadingEl.style.transition = 'opacity 0.5s';
    setTimeout(() => { this.loadingEl.style.display = 'none'; }, 550);
  }

  toast(msg: string, kind: 'info' | 'warn' | 'error' | 'success' = 'info') {
    const el = document.createElement('div');
    el.className = 'toast' + (kind !== 'info' ? ' ' + kind : '');
    el.textContent = msg;
    this.toastWrap.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

export class DialogManager {
  static show(id: string, cb?: () => void) {
    // Any UI dialog must be interactable, so release pointer lock first — otherwise all click
    // events stay captured by the canvas and the player can't press dialog buttons.
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('show');
      cb?.();
    }
  }
  static hide(id: string) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  }
}
