import * as THREE from 'three';
import { NPC } from '../world/NPC';
import { Input } from '../core/Input';

/** Player (first builds NPC-shaped humanoid, then adds movement). */
export class Player {
  public npc: NPC;
  public root: THREE.Group;
  public velocity = new THREE.Vector3();
  public speed = 3.2;
  public runSpeed = 6.0;
  public visibleWhenDriving = false;

  constructor() {
    this.npc = new NPC({ shirt: 0xffcc33, pants: 0x2a2a44 });
    this.root = this.npc.root;
    this.root.position.y = 0;
  }

  update(dt: number, input: Input, cameraYaw: number, colliders: { x: number; z: number; sx: number; sz: number }[]) {
    if (!this.root.visible) return;

    const forwardK = input.state.forward ? 1 : 0;
    const backK = input.state.back ? 1 : 0;
    const strafeL = input.state.left ? 1 : 0;
    const strafeR = input.state.right ? 1 : 0;

    // Standard third-person controls: derive the forward and right world-space axes
    // from the mouse-driven camera yaw, then compose motion as (W−S)·forward + (D−A)·right.
    // At yaw=0 the camera sits at world −Z looking toward +Z, so forward must be +Z and right +X.
    const sinY = Math.sin(cameraYaw);
    const cosY = Math.cos(cameraYaw);
    const fwdAxis = new THREE.Vector3(sinY, 0, cosY);
    const rightAxis = new THREE.Vector3(cosY, 0, -sinY);
    const moveAmt = forwardK - backK;
    const strafeAmt = strafeR - strafeL;
    const move = new THREE.Vector3()
      .addScaledVector(fwdAxis, moveAmt)
      .addScaledVector(rightAxis, strafeAmt);

    const moving = move.lengthSq() > 0.001;
    if (moving) {
      move.normalize();
      const sp = input.state.run ? this.runSpeed : this.speed;
      this.velocity.lerp(move.multiplyScalar(sp), 0.25);
    } else {
      this.velocity.lerp(new THREE.Vector3(), 0.25);
    }

    // Apply movement
    const next = this.root.position.clone().addScaledVector(this.velocity, dt);

    // Building collision (AABB pushback)
    for (const c of colliders) {
      const dx = next.x - c.x;
      const dz = next.z - c.z;
      const hx = c.sx / 2 + 0.4;
      const hz = c.sz / 2 + 0.4;
      if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
        // Push back on the axis of shallowest penetration
        const overlapX = hx - Math.abs(dx);
        const overlapZ = hz - Math.abs(dz);
        if (overlapX < overlapZ) {
          next.x = c.x + Math.sign(dx) * hx;
        } else {
          next.z = c.z + Math.sign(dz) * hz;
        }
      }
    }

    this.root.position.copy(next);
    this.npc.walking = this.velocity.lengthSq() > 0.25;
    if (this.npc.walking) {
      this.root.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
    }
    this.npc.update(dt);
  }
}
