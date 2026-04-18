import * as THREE from 'three';

export class TrafficLight {
  public group: THREE.Group;
  public state: 'red' | 'yellow' | 'green' = 'red';
  private red: THREE.Mesh;
  private yellow: THREE.Mesh;
  private green: THREE.Mesh;
  private timer = 0;
  private cycle = [
    { s: 'green' as const, d: 8 },
    { s: 'yellow' as const, d: 2 },
    { s: 'red' as const, d: 6 },
  ];
  private phase: number;

  constructor(phase = 0) {
    this.group = new THREE.Group();
    this.phase = phase;
    this.timer = phase;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 4.0, 10),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 })
    );
    pole.position.y = 2.0;
    pole.castShadow = true;
    this.group.add(pole);

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 })
    );
    arm.position.set(0.5, 3.8, 0);
    this.group.add(arm);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 1.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })
    );
    box.position.set(1.0, 3.4, 0);
    box.castShadow = true;
    this.group.add(box);

    const makeBulb = (color: number, y: number) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.2,
          roughness: 0.3,
        })
      );
      m.position.set(1.22, y, 0);
      this.group.add(m);
      return m;
    };
    this.red = makeBulb(0xff2222, 3.85);
    this.yellow = makeBulb(0xffbb22, 3.4);
    this.green = makeBulb(0x22ff55, 2.95);

    this.updateState(this.state);
  }

  private updateState(s: 'red' | 'yellow' | 'green') {
    this.state = s;
    const setBulb = (m: THREE.Mesh, on: boolean) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = on ? 1.2 : 0.04;
    };
    setBulb(this.red, s === 'red');
    setBulb(this.yellow, s === 'yellow');
    setBulb(this.green, s === 'green');
  }

  update(dt: number) {
    this.timer += dt;
    let total = 0;
    for (const p of this.cycle) total += p.d;
    const t = this.timer % total;
    let acc = 0;
    for (const p of this.cycle) {
      if (t < acc + p.d) {
        if (this.state !== p.s) this.updateState(p.s);
        break;
      }
      acc += p.d;
    }
  }
}
