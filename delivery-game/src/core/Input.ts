export type KeyState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  handbrake: boolean;
  horn: boolean;
  interact: boolean;
  switchCam: boolean;
};

export class Input {
  public state: KeyState = {
    forward: false,
    back: false,
    left: false,
    right: false,
    run: false,
    handbrake: false,
    horn: false,
    interact: false,
    switchCam: false,
  };

  // Edge-triggered (one-shot) detections:
  public interactPressed = false;
  public switchCamPressed = false;
  public hornPressed = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.releaseAll);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    switch (k) {
      case 'w': case 'arrowup': this.state.forward = true; break;
      case 's': case 'arrowdown': this.state.back = true; break;
      case 'a': case 'arrowleft': this.state.left = true; break;
      case 'd': case 'arrowright': this.state.right = true; break;
      case 'shift': this.state.run = true; break;
      case ' ': this.state.handbrake = true; break;
      case 'h': this.state.horn = true; this.hornPressed = true; break;
      case 'e': this.state.interact = true; this.interactPressed = true; break;
      case 'c': this.state.switchCam = true; this.switchCamPressed = true; break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    switch (k) {
      case 'w': case 'arrowup': this.state.forward = false; break;
      case 's': case 'arrowdown': this.state.back = false; break;
      case 'a': case 'arrowleft': this.state.left = false; break;
      case 'd': case 'arrowright': this.state.right = false; break;
      case 'shift': this.state.run = false; break;
      case ' ': this.state.handbrake = false; break;
      case 'h': this.state.horn = false; break;
      case 'e': this.state.interact = false; break;
      case 'c': this.state.switchCam = false; break;
    }
  };

  private releaseAll = () => {
    for (const k of Object.keys(this.state) as (keyof KeyState)[]) {
      this.state[k] = false;
    }
  };

  /** Call at END of frame to consume edge-trigger flags. */
  public endFrame() {
    this.interactPressed = false;
    this.switchCamPressed = false;
    this.hornPressed = false;
  }
}
