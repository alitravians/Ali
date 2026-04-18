import * as THREE from 'three';
import { Car } from '../vehicle/Car';
import { CAR_CATALOG } from '../vehicle/CarCatalog';
import { City, ROAD_W, GRID, BLOCK } from './City';
import { randRange } from '../utils/math';

/**
 * Simple AI cars that drive along road lines between intersections.
 * Each car has a lane (left/right of road centerline) and a direction,
 * turns randomly at intersections, respects minimum inter-car distance.
 */
export class AICar {
  public car: Car;
  public lane: 1 | -1; // +1 right side of road when going positive dir
  public dir: 'x+' | 'x-' | 'z+' | 'z-' = 'x+';
  public speed = 6;
  public halfSize: number;

  constructor(color: number, halfSize: number) {
    const spec = {
      ...CAR_CATALOG[Math.floor(Math.random() * 3)],
      color,
    };
    this.car = new Car(spec);
    this.lane = Math.random() < 0.5 ? 1 : -1;
    this.halfSize = halfSize;
    this.randomizeStartPos();
    this.speed = randRange(4, 10);
  }

  private randomizeStartPos() {
    const laneOffset = (ROAD_W / 4) * this.lane;
    const isHorizontal = Math.random() < 0.5;
    const roadIdx = Math.floor(Math.random() * (GRID + 1));
    const roadCoord = -this.halfSize + ROAD_W / 2 + roadIdx * (BLOCK + ROAD_W);
    if (isHorizontal) {
      const x = randRange(-this.halfSize + 10, this.halfSize - 10);
      this.dir = Math.random() < 0.5 ? 'x+' : 'x-';
      this.car.root.position.set(x, 0, roadCoord + laneOffset);
      this.car.heading = this.dir === 'x+' ? Math.PI / 2 : -Math.PI / 2;
    } else {
      const z = randRange(-this.halfSize + 10, this.halfSize - 10);
      this.dir = Math.random() < 0.5 ? 'z+' : 'z-';
      this.car.root.position.set(roadCoord + laneOffset, 0, z);
      this.car.heading = this.dir === 'z+' ? 0 : Math.PI;
    }
    this.car.root.rotation.y = this.car.heading;
  }

  update(dt: number) {
    const p = this.car.root.position;
    switch (this.dir) {
      case 'x+': p.x += this.speed * dt; break;
      case 'x-': p.x -= this.speed * dt; break;
      case 'z+': p.z += this.speed * dt; break;
      case 'z-': p.z -= this.speed * dt; break;
    }
    // Wrap around if off-map
    if (p.x > this.halfSize) p.x = -this.halfSize;
    if (p.x < -this.halfSize) p.x = this.halfSize;
    if (p.z > this.halfSize) p.z = -this.halfSize;
    if (p.z < -this.halfSize) p.z = this.halfSize;

    // spin wheels
    const rot = this.speed * dt / this.car.spec.wheelRadius;
    for (const w of this.car.wheels) w.rotation.x -= rot;
  }
}

export class TrafficSystem {
  public cars: AICar[] = [];
  public root = new THREE.Group();
  private halfSize: number;

  constructor(private city: City, private density: number) {
    this.halfSize = (GRID * BLOCK + (GRID + 1) * ROAD_W) / 2;
    const count = Math.floor(5 + density * 20);
    const colors = [0xcc3333, 0x3388dd, 0xeeeeee, 0x222244, 0x33aa33, 0xeeaa33, 0xaa4488];
    for (let i = 0; i < count; i++) {
      const ai = new AICar(colors[i % colors.length], this.halfSize);
      this.cars.push(ai);
      this.root.add(ai.car.root);
    }
  }

  update(dt: number) {
    for (const ai of this.cars) ai.update(dt);
  }
}
