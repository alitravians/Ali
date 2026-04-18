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

  /** Mouse-driven camera yaw/pitch (radians). Updated via pointer-lock mouse look. */
  public mouseYaw = 0;
  public mousePitch = 0.15;
  public pointerLocked = false;
  /** Sensitivity in radians per pixel (~0.115°/px). */
  public mouseSensitivity = 0.002;
  /** Inclusive pitch clamp: slightly upward to steeply downward looking at the player. */
  public pitchMin = -0.35;
  public pitchMax = 0.85;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.releaseAll);
    window.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    // Click on the canvas (the rendered game surface) to capture the pointer and start mouse-look.
    // We defer attachment until the first animation frame so the Three.js canvas is in the DOM.
    requestAnimationFrame(() => {
      const canvas = document.querySelector('body > canvas') as HTMLCanvasElement | null;
      if (canvas) {
        canvas.addEventListener('click', this.requestPointerLockOnCanvas);
      }
    });
  }

  private requestPointerLockOnCanvas = (e: MouseEvent) => {
    if (document.pointerLockElement) return;
    // Don't grab the pointer while a dialog is open — user is interacting with buttons.
    const anyDialogOpen = document.querySelectorAll('.dialog-backdrop.show').length > 0;
    if (anyDialogOpen) return;
    const canvas = e.currentTarget as HTMLCanvasElement;
    canvas.requestPointerLock?.();
  };

  private onPointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement !== null;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.pointerLocked) return;
    // movementX: rightward is positive → reduce yaw so "look right" turns the world clockwise.
    this.mouseYaw -= e.movementX * this.mouseSensitivity;
    this.mousePitch += e.movementY * this.mouseSensitivity;
    if (this.mousePitch < this.pitchMin) this.mousePitch = this.pitchMin;
    if (this.mousePitch > this.pitchMax) this.mousePitch = this.pitchMax;
  };

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
