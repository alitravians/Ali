import * as THREE from 'three';
import { Car } from './Car';

export type CameraMode = 'chase' | 'interior' | 'far' | 'walk';

export class CameraRig {
  private camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'chase';
  private offsets = {
    chase:    new THREE.Vector3(0, 3.2, -7.5),
    interior: new THREE.Vector3(0, 1.35, 0.15),
    far:      new THREE.Vector3(0, 8, -16),
    walk:     new THREE.Vector3(0, 3.8, -5.5),
  };
  private currentPos = new THREE.Vector3(0, 5, 0);
  private currentLook = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  cycleCarMode() {
    const order: CameraMode[] = ['chase', 'interior', 'far'];
    const idx = order.indexOf(this.mode);
    this.mode = order[(idx + 1) % order.length];
  }

  setMode(mode: CameraMode) {
    this.mode = mode;
  }

  /** Follow car smoothly. */
  updateForCar(car: Car, dt: number) {
    const offset = this.offsets[this.mode as 'chase' | 'interior' | 'far'].clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.heading);
    const targetPos = car.root.position.clone().add(offset);

    const lookAhead = new THREE.Vector3(0, 1.0, 8).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.heading);
    const look = car.root.position.clone().add(lookAhead);

    const follow = this.mode === 'interior' ? 0.6 : 0.12;
    this.currentPos.lerp(targetPos, follow);
    this.currentLook.lerp(look, follow);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLook);
  }

  /** Follow walking player (third-person). */
  updateForWalk(target: THREE.Object3D, _dt: number) {
    const yaw = this.getYaw();
    const offset = new THREE.Vector3(0, 3.2, -5.0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const targetPos = target.position.clone().add(offset);
    const look = target.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    this.currentPos.lerp(targetPos, 0.15);
    this.currentLook.lerp(look, 0.18);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLook);
  }

  getYaw(): number {
    // Camera yaw approximated from current heading target
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    return Math.atan2(fwd.x, fwd.z);
  }
}
