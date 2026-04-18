import * as THREE from 'three';
import { randRange } from '../utils/math';

/** Builds a simple humanoid NPC (low-poly but recognizable). */
export class NPC {
  public root = new THREE.Group();
  public color: number;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private walkPhase = Math.random() * Math.PI * 2;

  public walkSpeed = 0;
  public walking = false;
  public targetPos: THREE.Vector3 | null = null;

  constructor(opts: { shirt?: number; pants?: number; skin?: number; tall?: number } = {}) {
    const shirt = opts.shirt ?? this.pick([0xe54d4d, 0x4a73e0, 0x40a74a, 0xf0a030, 0x8040a0, 0xffbbaa]);
    const pants = opts.pants ?? this.pick([0x222244, 0x333333, 0x555544, 0x2a2a2a]);
    const skin = opts.skin ?? this.pick([0xf0c9a0, 0xd8a070, 0xba875a, 0xf7d2b0]);
    const tall = opts.tall ?? 1;
    this.color = shirt;

    const bodyMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.85 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pants, roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.6 });

    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8 * tall, 0.32), bodyMat);
    this.body.position.y = 0.5 + 0.8 * tall / 2;
    this.body.castShadow = true;
    this.root.add(this.body);

    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skinMat);
    this.head.position.y = 0.5 + 0.8 * tall + 0.2;
    this.head.castShadow = true;
    this.root.add(this.head);

    const legGeo = new THREE.BoxGeometry(0.2, 0.55, 0.22);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.13, 0.275, 0);
    this.leftLeg.castShadow = true;
    this.root.add(this.leftLeg);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.13, 0.275, 0);
    this.rightLeg.castShadow = true;
    this.root.add(this.rightLeg);

    const armGeo = new THREE.BoxGeometry(0.15, 0.65 * tall, 0.18);
    this.leftArm = new THREE.Mesh(armGeo, bodyMat);
    this.leftArm.position.set(-0.38, 0.5 + 0.8 * tall / 2, 0);
    this.leftArm.castShadow = true;
    this.root.add(this.leftArm);
    this.rightArm = new THREE.Mesh(armGeo, bodyMat);
    this.rightArm.position.set(0.38, 0.5 + 0.8 * tall / 2, 0);
    this.rightArm.castShadow = true;
    this.root.add(this.rightArm);
  }

  private pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  update(dt: number) {
    if (this.walking) {
      this.walkPhase += dt * 8;
      const s = Math.sin(this.walkPhase) * 0.5;
      this.leftLeg.rotation.x = s;
      this.rightLeg.rotation.x = -s;
      this.leftArm.rotation.x = -s * 0.8;
      this.rightArm.rotation.x = s * 0.8;
    } else {
      // ease to idle
      this.leftLeg.rotation.x *= 0.85;
      this.rightLeg.rotation.x *= 0.85;
      this.leftArm.rotation.x *= 0.85;
      this.rightArm.rotation.x *= 0.85;
    }
  }

  setVisible(v: boolean) {
    this.root.visible = v;
  }
}

/** Walking pedestrian that wanders along sidewalks. */
export class Pedestrian extends NPC {
  private wanderCooldown = 0;
  private dir = new THREE.Vector3(1, 0, 0);
  public speed: number;
  private bounds: number;

  constructor(bounds: number) {
    super();
    this.speed = randRange(1.0, 1.8);
    this.bounds = bounds;
    this.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    this.walking = true;
  }

  update(dt: number) {
    this.wanderCooldown -= dt;
    if (this.wanderCooldown <= 0) {
      this.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      this.wanderCooldown = 3 + Math.random() * 3;
    }
    this.root.position.x += this.dir.x * this.speed * dt;
    this.root.position.z += this.dir.z * this.speed * dt;
    // Bounce at bounds
    if (Math.abs(this.root.position.x) > this.bounds) { this.dir.x *= -1; this.root.position.x = Math.sign(this.root.position.x) * this.bounds; }
    if (Math.abs(this.root.position.z) > this.bounds) { this.dir.z *= -1; this.root.position.z = Math.sign(this.root.position.z) * this.bounds; }
    this.root.rotation.y = Math.atan2(this.dir.x, this.dir.z);
    super.update(dt);
  }
}
