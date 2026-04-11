export class InputManager {
  constructor() {
    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.mouseDown = false;
    this.pointerLocked = false;
    this.callbacks = {};

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.emit('keydown', e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.emit('keyup', e.code);
    });
    window.addEventListener('mousemove', (e) => {
      this.mouseDX = e.movementX || 0;
      this.mouseDY = e.movementY || 0;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    window.addEventListener('mousedown', () => { this.mouseDown = true; });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = !!document.pointerLockElement;
    });
  }

  isKey(code) {
    return !!this.keys[code];
  }

  isForward() {
    return this.keys['KeyW'] || this.keys['ArrowUp'];
  }
  isBackward() {
    return this.keys['KeyS'] || this.keys['ArrowDown'];
  }
  isLeft() {
    return this.keys['KeyA'] || this.keys['ArrowLeft'];
  }
  isRight() {
    return this.keys['KeyD'] || this.keys['ArrowRight'];
  }
  isUp() {
    return this.keys['KeyQ'] || this.keys['Space'];
  }
  isDown() {
    return this.keys['KeyE'] || this.keys['ShiftLeft'];
  }

  requestPointerLock(element) {
    element.requestPointerLock();
  }

  resetMouseDelta() {
    this.mouseDX = 0;
    this.mouseDY = 0;
  }

  on(event, cb) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(cb);
  }

  off(event, cb) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(c => c !== cb);
    }
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }
}
