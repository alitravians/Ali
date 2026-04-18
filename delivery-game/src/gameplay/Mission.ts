import * as THREE from 'three';
import { City } from '../world/City';
import { NPC } from '../world/NPC';
import { Car } from '../vehicle/Car';
import { StageConfig } from './StageManager';

export interface Employee {
  npc: NPC;
  homePos: THREE.Vector3;
  picked: boolean;
  dropped: boolean;
  name: string;
}

export class Mission {
  public employees: Employee[] = [];
  public officePos = new THREE.Vector3();
  public gasPos = new THREE.Vector3();
  public gasPos2 = new THREE.Vector3();
  public currentTarget: 'employee' | 'gas' | 'office' = 'employee';
  public pickedCount = 0;
  public totalDistance = 0;
  private lastCarPos = new THREE.Vector3();
  public started = false;
  public completed = false;
  public elapsedTime = 0;
  public startFuel = 100;

  // Scoring
  public harshBrakes = 0;
  public hornUses = 0;

  constructor(public city: City, public stage: StageConfig) {
    this.officePos = city.getOfficeDropoff();
    this.gasPos = city.getGasPump(0);
    this.gasPos2 = city.getGasPump(1);
  }

  /** Assign employees to random houses. */
  assignEmployees(root: THREE.Group) {
    const houses = this.city.getHousePickupPositions();
    // Shuffle
    const shuffled = houses.slice().sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, this.stage.employees);
    const names = ['أحمد', 'سالم', 'محمد', 'خالد', 'فيصل', 'ناصر', 'يوسف', 'بدر', 'طارق', 'حمود'];

    this.employees = picks.map((p, i) => {
      const npc = new NPC();
      npc.root.position.copy(p);
      npc.root.visible = true;
      root.add(npc.root);
      return {
        npc,
        homePos: p.clone(),
        picked: false,
        dropped: false,
        name: names[i % names.length],
      };
    });
  }

  /** Return the currently active employee index, or -1 if all picked. */
  activeEmployeeIndex(): number {
    return this.employees.findIndex((e) => !e.picked);
  }

  currentObjectivePos(carPos: THREE.Vector3, fuelLow: boolean): THREE.Vector3 {
    if (fuelLow && this.currentTarget !== 'office') {
      // route to nearest gas pump
      const d1 = carPos.distanceTo(this.gasPos);
      const d2 = carPos.distanceTo(this.gasPos2);
      return d2 < d1 ? this.gasPos2 : this.gasPos;
    }
    const idx = this.activeEmployeeIndex();
    if (idx >= 0) return this.employees[idx].homePos;
    return this.officePos;
  }

  /** Update mission progress based on car position (when near target). */
  update(dt: number, car: Car): { pickedUpIndex?: number; droppedOff?: boolean } {
    this.elapsedTime += dt;
    const carXZ = car.root.position.clone();
    carXZ.y = 0;

    // Track distance
    if (this.lastCarPos.lengthSq() === 0) this.lastCarPos.copy(carXZ);
    this.totalDistance += this.lastCarPos.distanceTo(carXZ);
    this.lastCarPos.copy(carXZ);

    // Pickup logic
    const idx = this.activeEmployeeIndex();
    if (idx >= 0) {
      const e = this.employees[idx];
      const dist = carXZ.distanceTo(e.homePos);
      if (dist < 6 && Math.abs(car.speed) < 2.5) {
        // Pick up
        e.picked = true;
        this.pickedCount++;
        e.npc.setVisible(false);
        return { pickedUpIndex: idx };
      }
    } else {
      // Drop off at office
      const dist = carXZ.distanceTo(this.officePos);
      if (dist < 7 && Math.abs(car.speed) < 2.5 && !this.completed) {
        this.completed = true;
        for (const e of this.employees) e.dropped = true;
        return { droppedOff: true };
      }
    }

    return {};
  }

  /** Return scoring breakdown 0..5 stars */
  computeScore(fuelRemaining: number): {
    stars: number;
    timeScore: number;
    fuelScore: number;
    driveScore: number;
    bonus: number;
    total: number;
    reward: number;
  } {
    const time = this.elapsedTime;
    const underTime = Math.max(0, this.stage.timeLimit - time);
    const timeScore = Math.min(100, (underTime / this.stage.timeLimit) * 100);

    const fuelUsed = this.startFuel - fuelRemaining;
    const fuelScore = Math.max(0, 100 - fuelUsed * 0.8);

    const penalty = this.harshBrakes * 3 + this.hornUses * 0.3;
    const driveScore = Math.max(0, 100 - penalty);

    const total = Math.round((timeScore * 0.35) + (fuelScore * 0.35) + (driveScore * 0.3));
    const stars = Math.max(1, Math.min(5, Math.round(total / 20)));
    const bonus = stars >= 4 ? 20 : stars >= 3 ? 10 : 0;
    const reward = 40 + this.stage.num * 15 + stars * 8 + bonus;
    return { stars, timeScore, fuelScore, driveScore, bonus, total, reward };
  }
}
