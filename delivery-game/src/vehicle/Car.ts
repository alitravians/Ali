import * as THREE from 'three';
import type { CarSpec } from './CarCatalog';
import { Input } from '../core/Input';
import { clamp } from '../utils/math';

/**
 * Arcade-style but with believable handling: acceleration, braking,
 * steering dependent on speed, handbrake (reduces grip), reverse.
 * Not full rigid-body physics — but uses Ackermann-ish bicycle steering
 * so the car feels like a real car.
 */
export class Car {
  public spec: CarSpec;
  public root = new THREE.Group();
  public body: THREE.Group;

  public wheels: THREE.Mesh[] = [];
  public wheelGroups: THREE.Group[] = [];
  public headlights: THREE.SpotLight[] = [];
  public headlightMeshes: THREE.Mesh[] = [];
  public brakeLightMeshes: THREE.Mesh[] = [];

  public speed = 0;            // m/s (along heading)
  public heading = 0;          // radians, 0 = +X (no, actually: y-rotation)
  public steerAngle = 0;       // radians
  public rpm01 = 0;            // 0..1
  public engineRunning = true;
  public handbrakeActive = false;
  public reversing = false;

  // Passenger list
  public passengers: { npc: THREE.Group }[] = [];

  // Visual skid offsets
  public skidFactor = 0;

  constructor(spec: CarSpec) {
    this.spec = spec;
    this.body = this.buildMesh();
    this.root.add(this.body);
    this.root.updateMatrixWorld(true);
  }

  private buildMesh(): THREE.Group {
    const g = new THREE.Group();
    const s = this.spec;

    const mainColor = s.color;
    const darkTrim = 0x1a1a1a;
    const glass = 0x2a3550;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: mainColor, roughness: 0.3, metalness: 0.65,
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: darkTrim, roughness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: glass, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.78,
    });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 0.8, roughness: 0.3 });

    // Main body (lower)
    const lower = new THREE.Mesh(new THREE.BoxGeometry(s.bodyW, s.bodyH * 0.55, s.bodyL), bodyMat);
    lower.position.y = s.wheelRadius + s.bodyH * 0.275;
    lower.castShadow = true;
    lower.receiveShadow = true;
    g.add(lower);

    // Cabin (upper)
    const cabinH = s.bodyH * 0.55;
    const cabinL = s.bodyL * 0.55;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(s.bodyW * 0.93, cabinH, cabinL), bodyMat);
    cabin.position.set(0, s.wheelRadius + s.bodyH * 0.55 + cabinH / 2, s.bodyL * 0.05);
    cabin.castShadow = true;
    g.add(cabin);

    // Windows (windshield + rear + sides)
    const ws = new THREE.Mesh(
      new THREE.PlaneGeometry(s.bodyW * 0.85, cabinH * 0.85),
      glassMat
    );
    ws.position.set(0, cabin.position.y, s.bodyL * 0.05 + cabinL / 2 + 0.001);
    ws.rotation.x = -0.18;
    g.add(ws);

    const rw = ws.clone();
    rw.position.z = s.bodyL * 0.05 - cabinL / 2 - 0.001;
    rw.rotation.x = 0.18;
    rw.rotation.y = Math.PI;
    g.add(rw);

    const sideW = new THREE.Mesh(
      new THREE.PlaneGeometry(cabinL * 0.9, cabinH * 0.7),
      glassMat
    );
    sideW.position.set(s.bodyW * 0.465, cabin.position.y, s.bodyL * 0.05);
    sideW.rotation.y = -Math.PI / 2;
    g.add(sideW);
    const sideW2 = sideW.clone();
    sideW2.position.x = -s.bodyW * 0.465;
    sideW2.rotation.y = Math.PI / 2;
    g.add(sideW2);

    // Headlights (front = +z)
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xfff8dd, emissive: 0xffeecc, emissiveIntensity: 0.9,
    });
    for (const hx of [-s.bodyW * 0.32, s.bodyW * 0.32]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.08), headlightMat);
      hl.position.set(hx, s.wheelRadius + s.bodyH * 0.3, s.bodyL / 2 - 0.02);
      g.add(hl);
      this.headlightMeshes.push(hl);

      const light = new THREE.SpotLight(0xfff2d1, 0, 35, Math.PI / 6, 0.4, 1.4);
      light.position.set(hx, s.wheelRadius + s.bodyH * 0.3, s.bodyL / 2);
      const target = new THREE.Object3D();
      target.position.set(hx, 0.3, s.bodyL / 2 + 8);
      g.add(target);
      light.target = target;
      g.add(light);
      this.headlights.push(light);
    }

    // Tail lights
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x880000, emissive: 0xff3322, emissiveIntensity: 0.6,
    });
    for (const hx of [-s.bodyW * 0.34, s.bodyW * 0.34]) {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.08), tailMat);
      tl.position.set(hx, s.wheelRadius + s.bodyH * 0.35, -s.bodyL / 2 + 0.02);
      g.add(tl);
      this.brakeLightMeshes.push(tl);
    }

    // Bumper
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(s.bodyW, 0.18, 0.25),
      trimMat
    );
    bumper.position.set(0, s.wheelRadius + 0.12, s.bodyL / 2 - 0.1);
    g.add(bumper);
    const bumper2 = bumper.clone();
    bumper2.position.z = -s.bodyL / 2 + 0.1;
    g.add(bumper2);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(s.wheelRadius, s.wheelRadius, s.wheelWidth, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const positions: [number, number, number][] = [
      [-s.bodyW / 2 - s.wheelWidth / 2 + 0.05, s.wheelRadius,  s.wheelBase / 2], // FL
      [ s.bodyW / 2 + s.wheelWidth / 2 - 0.05, s.wheelRadius,  s.wheelBase / 2], // FR
      [-s.bodyW / 2 - s.wheelWidth / 2 + 0.05, s.wheelRadius, -s.wheelBase / 2], // RL
      [ s.bodyW / 2 + s.wheelWidth / 2 - 0.05, s.wheelRadius, -s.wheelBase / 2], // RR
    ];
    for (const [x, y, z] of positions) {
      const wrap = new THREE.Group();
      wrap.position.set(x, y, z);
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.castShadow = true;
      wrap.add(wheel);
      // Rim
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(s.wheelRadius * 0.55, s.wheelRadius * 0.55, s.wheelWidth + 0.005, 10),
        rimMat
      );
      rim.rotation.z = Math.PI / 2;
      wrap.add(rim);
      g.add(wrap);
      this.wheels.push(wheel);
      this.wheelGroups.push(wrap);
    }

    // License plate
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.03), plateMat);
    plate.position.set(0, s.wheelRadius + 0.2, -s.bodyL / 2 - 0.02);
    g.add(plate);

    return g;
  }

  /** Main update. */
  update(dt: number, input: Input | null, isControlling: boolean) {
    const s = this.spec;
    const maxSpeed = s.maxSpeedKmh / 3.6;

    let throttle = 0;
    let brake = 0;
    let steerInput = 0;
    this.handbrakeActive = false;

    if (isControlling && input) {
      throttle = (input.state.forward ? 1 : 0) - 0 * 0;
      brake = input.state.back ? 1 : 0;
      steerInput = (input.state.left ? 1 : 0) - (input.state.right ? 1 : 0);
      this.handbrakeActive = input.state.handbrake;
    }

    // Determine forward speed direction
    const movingForward = this.speed >= -0.2;

    // Accelerate / reverse
    if (throttle > 0) {
      this.speed += s.accel * dt;
      this.reversing = false;
    } else if (brake > 0) {
      if (this.speed > 0.5) {
        // Decelerate
        this.speed -= s.brake * dt;
      } else {
        // Reverse
        this.speed -= s.accel * 0.5 * dt;
        this.reversing = true;
      }
    } else {
      // Coast
      this.speed *= 1 - 1.2 * dt;
    }

    // Handbrake
    if (this.handbrakeActive) {
      this.speed *= 1 - 3.0 * dt;
      this.skidFactor = Math.min(1, this.skidFactor + dt * 2);
    } else {
      this.skidFactor *= 0.9;
    }

    this.speed = clamp(this.speed, -maxSpeed * 0.35, maxSpeed);

    // Steering — more sensitive at low speed
    const speedFactor = clamp(Math.abs(this.speed) / maxSpeed, 0, 1);
    const steerReduce = 1.0 - speedFactor * 0.55;
    const targetSteer = steerInput * s.turnRate * 0.35 * steerReduce;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer, 10, dt);

    // Bicycle kinematic model
    if (Math.abs(this.speed) > 0.01) {
      // yaw rate = speed / wheelBase * tan(steer)
      const yawRate = (this.speed / s.wheelBase) * Math.tan(this.steerAngle);
      this.heading += yawRate * dt;
    }

    // Move in world
    const dx = Math.sin(this.heading) * this.speed * dt;
    const dz = Math.cos(this.heading) * this.speed * dt;
    this.root.position.x += dx;
    this.root.position.z += dz;
    this.root.rotation.y = this.heading;

    // Spin wheels visually
    const rot = this.speed * dt / s.wheelRadius;
    for (let i = 0; i < this.wheels.length; i++) {
      this.wheels[i].rotation.x -= rot;
    }
    // Steer front wheels
    this.wheelGroups[0].rotation.y = this.steerAngle * 2.0;
    this.wheelGroups[1].rotation.y = this.steerAngle * 2.0;

    // RPM (for audio)
    this.rpm01 = clamp(Math.abs(this.speed) / maxSpeed * 0.85 + (throttle > 0 ? 0.15 : 0), 0, 1);

    // Brake lights
    const braking = brake > 0 && this.speed > 0.5;
    for (const m of this.brakeLightMeshes) {
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = braking ? 1.4 : 0.5;
    }
  }

  /** Turn headlights on/off. */
  setHeadlights(on: boolean) {
    for (const light of this.headlights) light.intensity = on ? 1.8 : 0;
    for (const m of this.headlightMeshes) {
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 1.4 : 0.1;
    }
  }

  /** Reset (for stage restart). */
  reset(pos: THREE.Vector3, heading = 0) {
    this.root.position.copy(pos);
    this.heading = heading;
    this.speed = 0;
    this.steerAngle = 0;
  }

  getSpeedKmh(): number {
    return this.speed * 3.6;
  }

  /** World-space position of the driver seat door (left side). */
  getDriverSeatPos(): THREE.Vector3 {
    const v = new THREE.Vector3(-this.spec.bodyW / 2 - 0.8, 0, 0);
    v.applyMatrix4(this.root.matrixWorld);
    v.y = 0;
    return v;
  }

  /** World-space position of the rear-door for passenger boarding. */
  getPassengerDoorPos(): THREE.Vector3 {
    const v = new THREE.Vector3(this.spec.bodyW / 2 + 0.7, 0, -this.spec.bodyL * 0.15);
    v.applyMatrix4(this.root.matrixWorld);
    v.y = 0;
    return v;
  }
}
