import * as THREE from 'three';
import { makeApartment, makeGasStation, makeHouse, makeOffice, makeShop, BuildingGroup } from './Buildings';
import { TrafficLight } from './TrafficLights';

/**
 * City grid:
 * - block size = 36m
 * - road width = 8m
 * - 7x7 blocks (so the full city ~ 308m x 308m)
 * Streets run on grid lines (east-west + north-south). Blocks contain buildings.
 */
export const BLOCK = 36;
export const ROAD_W = 8;
export const GRID = 7; // 7x7 grid of blocks
export const CITY_SIZE = GRID * BLOCK + (GRID + 1) * ROAD_W;

export interface RoadSegment {
  x1: number; z1: number; x2: number; z2: number;
  dir: 'h' | 'v';
}

export interface Intersection { x: number; z: number; }

export class City {
  public root = new THREE.Group();
  public roads: RoadSegment[] = [];
  public intersections: Intersection[] = [];
  public houses: BuildingGroup[] = [];
  public apartments: BuildingGroup[] = [];
  public shops: BuildingGroup[] = [];
  public office!: BuildingGroup;
  public gasStation!: BuildingGroup;
  public gasStation2!: BuildingGroup;
  public trafficLights: TrafficLight[] = [];

  /** Bounding boxes for collision (with cars/player walking). */
  public buildingColliders: { x: number; z: number; sx: number; sz: number }[] = [];

  private halfSize = CITY_SIZE / 2;

  constructor() {
    this.buildGrid();
    this.buildBuildings();
    this.buildDecorations();
  }

  /** Convert grid index [0..GRID] to world coordinate of road centerline. */
  private roadLineCoord(i: number): number {
    // i=0 is first road; blocks between roads at i and i+1
    return -this.halfSize + ROAD_W / 2 + i * (BLOCK + ROAD_W);
  }

  /** Block center coord for block index [0..GRID-1]. */
  private blockCenterCoord(i: number): number {
    return -this.halfSize + ROAD_W + BLOCK / 2 + i * (BLOCK + ROAD_W);
  }

  /** Test if a world coordinate (x,z) is on a road. Useful for car AI/navigation. */
  public isOnRoad(x: number, z: number): boolean {
    for (let i = 0; i <= GRID; i++) {
      const c = this.roadLineCoord(i);
      if (Math.abs(x - c) < ROAD_W / 2 + 0.3) return true;
      if (Math.abs(z - c) < ROAD_W / 2 + 0.3) return true;
    }
    return false;
  }

  /** Nearest road point for spawning/navigation. */
  public nearestRoadPoint(x: number, z: number): THREE.Vector3 {
    let best = new THREE.Vector3(x, 0, z);
    let bestD = Infinity;
    for (let i = 0; i <= GRID; i++) {
      const c = this.roadLineCoord(i);
      // horizontal road at z=c
      const pH = new THREE.Vector3(x, 0, c);
      const dH = Math.abs(z - c);
      if (dH < bestD) { bestD = dH; best = pH; }
      // vertical road at x=c
      const pV = new THREE.Vector3(c, 0, z);
      const dV = Math.abs(x - c);
      if (dV < bestD) { bestD = dV; best = pV; }
    }
    return best;
  }

  private buildGrid() {
    // Ground asphalt plane under everything is already in Engine ground (grass).
    // We carve roads as dark asphalt quads.
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2e, roughness: 0.95, metalness: 0.0,
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xfff2a0, roughness: 0.8, emissiveIntensity: 0.0,
    });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x9c9c98, roughness: 0.9 });

    const roadLen = CITY_SIZE;

    for (let i = 0; i <= GRID; i++) {
      const c = this.roadLineCoord(i);

      // Horizontal road (along X axis), at z=c
      {
        const road = new THREE.Mesh(new THREE.PlaneGeometry(roadLen, ROAD_W), asphaltMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0.01, c);
        road.receiveShadow = true;
        this.root.add(road);
        this.roads.push({ x1: -roadLen / 2, z1: c, x2: roadLen / 2, z2: c, dir: 'h' });

        // Dashed center line
        const dashLen = 1.8, gap = 1.6;
        for (let x = -roadLen / 2 + 2; x < roadLen / 2 - 2; x += dashLen + gap) {
          const dash = new THREE.Mesh(new THREE.PlaneGeometry(dashLen, 0.15), stripeMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(x + dashLen / 2, 0.015, c);
          this.root.add(dash);
        }
      }

      // Vertical road (along Z axis), at x=c
      {
        const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, roadLen), asphaltMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(c, 0.012, 0);
        road.receiveShadow = true;
        this.root.add(road);
        this.roads.push({ x1: c, z1: -roadLen / 2, x2: c, z2: roadLen / 2, dir: 'v' });

        const dashLen = 1.8, gap = 1.6;
        for (let z = -roadLen / 2 + 2; z < roadLen / 2 - 2; z += dashLen + gap) {
          const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.15, dashLen), stripeMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(c, 0.016, z + dashLen / 2);
          this.root.add(dash);
        }
      }

      // Intersections
      for (let j = 0; j <= GRID; j++) {
        const cj = this.roadLineCoord(j);
        this.intersections.push({ x: this.roadLineCoord(i), z: cj });
      }
    }

    // Sidewalks around each block
    for (let bi = 0; bi < GRID; bi++) {
      for (let bj = 0; bj < GRID; bj++) {
        const cx = this.blockCenterCoord(bi);
        const cz = this.blockCenterCoord(bj);
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(BLOCK, 0.12, BLOCK),
          sidewalkMat
        );
        pad.position.set(cx, 0.06, cz);
        pad.receiveShadow = true;
        this.root.add(pad);

        // Inner grass on each block
        const grass = new THREE.Mesh(
          new THREE.PlaneGeometry(BLOCK - 4, BLOCK - 4),
          new THREE.MeshStandardMaterial({ color: 0x6aa24a, roughness: 1.0 })
        );
        grass.rotation.x = -Math.PI / 2;
        grass.position.set(cx, 0.13, cz);
        grass.receiveShadow = true;
        this.root.add(grass);
      }
    }

    // Traffic lights at intersections (sample some, not all, to avoid clutter)
    for (let i = 1; i < GRID; i += 2) {
      for (let j = 1; j < GRID; j += 2) {
        const cx = this.roadLineCoord(i);
        const cz = this.roadLineCoord(j);
        const tl = new TrafficLight(Math.random() * 10);
        tl.group.position.set(cx + ROAD_W * 0.7, 0, cz + ROAD_W * 0.7);
        this.trafficLights.push(tl);
        this.root.add(tl.group);
      }
    }
  }

  private buildBuildings() {
    // Assign roles per block. Office and gas stations at fixed positions.
    const officeBi = Math.floor(GRID / 2);
    const officeBj = Math.floor(GRID / 2);
    const gasBlocks: [number, number][] = [
      [1, 1],
      [GRID - 2, GRID - 2],
    ];

    for (let bi = 0; bi < GRID; bi++) {
      for (let bj = 0; bj < GRID; bj++) {
        const cx = this.blockCenterCoord(bi);
        const cz = this.blockCenterCoord(bj);

        if (bi === officeBi && bj === officeBj) {
          const off = makeOffice();
          off.position.set(cx, 0, cz);
          off.rotation.y = Math.PI; // face south
          this.office = off;
          this.root.add(off);
          this.buildingColliders.push({ x: cx, z: cz, sx: off.meta.sizeX, sz: off.meta.sizeZ });
          continue;
        }

        const gasIdx = gasBlocks.findIndex(([a, b]) => a === bi && b === bj);
        if (gasIdx !== -1) {
          const gs = makeGasStation();
          gs.position.set(cx - 5, 0, cz);
          gs.rotation.y = 0;
          if (gasIdx === 0) this.gasStation = gs;
          else this.gasStation2 = gs;
          this.root.add(gs);
          this.buildingColliders.push({ x: cx - 2, z: cz, sx: 22, sz: 10 });
          continue;
        }

        // Otherwise place 2-4 small buildings in the block
        const slots = this.getBlockSlots(cx, cz);
        for (const slot of slots) {
          // 65% house, 20% apartment, 15% shop
          const r = Math.random();
          let b: BuildingGroup;
          if (r < 0.65) {
            b = makeHouse(
              6 + Math.random() * 3,
              7 + Math.random() * 3,
              3.5 + Math.random() * 0.8,
              { twoStory: Math.random() < 0.4, withGarage: Math.random() < 0.5 }
            );
            this.houses.push(b);
          } else if (r < 0.85) {
            b = makeApartment(10 + Math.random() * 3, 10 + Math.random() * 3, 3 + Math.floor(Math.random() * 3));
            this.apartments.push(b);
          } else {
            b = makeShop();
            this.shops.push(b);
          }
          b.position.set(slot.x, 0, slot.z);
          b.rotation.y = slot.rot;
          this.root.add(b);
          this.buildingColliders.push({ x: slot.x, z: slot.z, sx: b.meta.sizeX, sz: b.meta.sizeZ });
        }
      }
    }
  }

  /** 4 slots around block (north/south/east/west) facing outward to street. */
  private getBlockSlots(cx: number, cz: number): { x: number; z: number; rot: number }[] {
    const offset = BLOCK / 2 - 5;
    return [
      { x: cx, z: cz + offset, rot: 0 },           // south side faces -z? Door is +z — fine
      { x: cx, z: cz - offset, rot: Math.PI },
      { x: cx + offset, z: cz, rot: -Math.PI / 2 },
      { x: cx - offset, z: cz, rot: Math.PI / 2 },
    ];
  }

  private buildDecorations() {
    // Street lamps, trees
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff0a0,
      emissive: 0xffcc33,
      emissiveIntensity: 0.15,
    });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3c7a36, roughness: 1 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e3a24, roughness: 1 });

    for (let i = 0; i <= GRID; i++) {
      const c = this.roadLineCoord(i);
      // Lamps along each road
      for (let k = -this.halfSize + 8; k < this.halfSize; k += 20) {
        for (const side of [-1, 1]) {
          const lamp = new THREE.Group();
          const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 4.5, 8),
            lampMat
          );
          pole.position.y = 2.25;
          pole.castShadow = true;
          lamp.add(pole);
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.08), lampMat);
          arm.position.set(0.3 * -side, 4.3, 0);
          lamp.add(arm);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), bulbMat);
          bulb.position.set(0.55 * -side, 4.15, 0);
          lamp.add(bulb);

          if (Math.random() < 0.8) {
            // 50/50 horizontal/vertical road lamp
            if (i % 2 === 0) {
              lamp.position.set(k, 0, c + (ROAD_W / 2 + 1.2) * side);
              lamp.rotation.y = 0;
            } else {
              lamp.position.set(c + (ROAD_W / 2 + 1.2) * side, 0, k);
              lamp.rotation.y = Math.PI / 2;
            }
            this.root.add(lamp);
          }

          // Trees occasionally
          if (Math.random() < 0.22) {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 2.2, 8), trunkMat);
            trunk.position.y = 1.1;
            trunk.castShadow = true;
            tree.add(trunk);
            const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), leafMat);
            leaves.position.y = 2.8;
            leaves.castShadow = true;
            tree.add(leaves);
            if (i % 2 === 0) tree.position.set(k + 1, 0, c + (ROAD_W / 2 + 2.2) * side);
            else tree.position.set(c + (ROAD_W / 2 + 2.2) * side, 0, k + 1);
            this.root.add(tree);
          }
        }
      }
    }
  }

  /** Collects positions for employee spawn (near house doors). */
  public getHousePickupPositions(): THREE.Vector3[] {
    const list: THREE.Vector3[] = [];
    for (const h of this.houses) {
      const p = h.meta.doorWorldPos.clone();
      // Transform by building world matrix
      const world = new THREE.Vector3();
      p.applyMatrix4(h.matrixWorld);
      world.copy(p);
      world.y = 0;
      list.push(world);
    }
    return list;
  }

  /** Office drop-off point in world space. */
  public getOfficeDropoff(): THREE.Vector3 {
    const p = this.office.meta.doorWorldPos.clone();
    p.applyMatrix4(this.office.matrixWorld);
    p.y = 0;
    return p;
  }

  /** Gas station pump position in world space. */
  public getGasPump(index = 0): THREE.Vector3 {
    const g = index === 0 ? this.gasStation : (this.gasStation2 || this.gasStation);
    const p = g.meta.doorWorldPos.clone();
    p.applyMatrix4(g.matrixWorld);
    p.y = 0;
    return p;
  }

  public update(dt: number) {
    for (const tl of this.trafficLights) tl.update(dt);
  }

  /** Force matrix updates so we can read world positions of building doors. */
  public forceUpdate() {
    this.root.updateMatrixWorld(true);
  }
}
