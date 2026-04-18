import * as THREE from 'three';

/** Shared materials (reused across many buildings). */
const palette = {
  wallColors: [0xd9c49a, 0xc8a880, 0xb89a72, 0xdfc8a0, 0xf0dec0, 0xe8d5a6, 0xa8886b, 0xe5d0aa],
  roofColors: [0x6b3b2a, 0x7a4a34, 0x52362a, 0x8a4d38, 0x3b2b22],
  doorColor: 0x4a2d1a,
  windowColor: 0x83b4d4,
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const mats = {
  wall: (color: number) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0 }),
  roof: (color: number) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.0 }),
  door: () => new THREE.MeshStandardMaterial({ color: palette.doorColor, roughness: 0.7 }),
  window: () =>
    new THREE.MeshStandardMaterial({
      color: palette.windowColor,
      roughness: 0.2,
      metalness: 0.3,
      emissive: new THREE.Color(0x112233),
      emissiveIntensity: 0.2,
    }),
  wood: () => new THREE.MeshStandardMaterial({ color: 0x8a6239, roughness: 0.9 }),
};

/** Flags on buildings are mounted so we can detect them later. */
export interface BuildingMeta {
  type: 'house' | 'apartment' | 'office' | 'gas' | 'shop';
  doorWorldPos: THREE.Vector3;
  sizeX: number;
  sizeZ: number;
}

export type BuildingGroup = THREE.Group & { meta: BuildingMeta };

function windowGrid(
  group: THREE.Group,
  w: number,
  h: number,
  cols: number,
  rows: number,
  faceNormal: 'x+' | 'x-' | 'z+' | 'z-',
  offset: number
) {
  const winW = (w / (cols + 1)) * 0.55;
  const winH = (h / (rows + 1)) * 0.6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const geo = new THREE.BoxGeometry(
        faceNormal === 'x+' || faceNormal === 'x-' ? 0.05 : winW,
        winH,
        faceNormal === 'z+' || faceNormal === 'z-' ? 0.05 : winW
      );
      const m = new THREE.Mesh(geo, mats.window());
      const x = ((c + 1) / (cols + 1) - 0.5) * w;
      const y = ((r + 1) / (rows + 1)) * h;
      switch (faceNormal) {
        case 'x+': m.position.set(offset, y, x); break;
        case 'x-': m.position.set(-offset, y, x); break;
        case 'z+': m.position.set(x, y, offset); break;
        case 'z-': m.position.set(x, y, -offset); break;
      }
      m.castShadow = false;
      m.receiveShadow = false;
      group.add(m);
    }
  }
}

/** Generic house with variations. */
export function makeHouse(
  width = 7,
  depth = 8,
  height = 4,
  options: { withGarage?: boolean; twoStory?: boolean; style?: number } = {}
): BuildingGroup {
  const g = new THREE.Group() as BuildingGroup;
  const wallColor = pick(palette.wallColors);
  const roofColor = pick(palette.roofColors);

  const storyCount = options.twoStory ? 2 : 1;
  const storyH = height;

  // Main body
  for (let s = 0; s < storyCount; s++) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, storyH, depth), mats.wall(wallColor));
    body.position.y = storyH / 2 + s * storyH;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // Windows
    windowGrid(g, width, storyH, 2, 1, 'z+', depth / 2 + 0.01 + (s === 0 ? 0 : 0));
    windowGrid(g, width, storyH, 2, 1, 'z-', depth / 2 + 0.01);
    windowGrid(g, depth, storyH, 2, 1, 'x+', width / 2 + 0.01);
    windowGrid(g, depth, storyH, 2, 1, 'x-', width / 2 + 0.01);

    // Offset windows up per story
    g.children.slice(-8).forEach((w) => (w.position.y += s * storyH));
  }

  // Roof (triangular/hip-ish)
  const totalH = storyH * storyCount;
  const roofH = 2.2;
  const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.75, roofH, 4);
  const roof = new THREE.Mesh(roofGeo, mats.roof(roofColor));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = totalH + roofH / 2;
  roof.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
  roof.castShadow = true;
  roof.receiveShadow = true;
  g.add(roof);

  // Door (front = +z)
  const doorW = 1.0;
  const doorH = 2.0;
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.12), mats.door());
  door.position.set(0, doorH / 2, depth / 2 + 0.06);
  door.castShadow = true;
  g.add(door);

  // Small porch/step
  const step = new THREE.Mesh(
    new THREE.BoxGeometry(doorW + 0.8, 0.2, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 })
  );
  step.position.set(0, 0.1, depth / 2 + 0.5);
  step.castShadow = true;
  step.receiveShadow = true;
  g.add(step);

  // Optional garage
  if (options.withGarage) {
    const garage = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.8, 4.5),
      mats.wall(wallColor)
    );
    garage.position.set(width / 2 + 1.6, 1.4, depth / 2 - 2);
    garage.castShadow = true;
    garage.receiveShadow = true;
    g.add(garage);

    const garageDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 2.4, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.5, metalness: 0.4 })
    );
    garageDoor.position.set(width / 2 + 1.6, 1.2, depth / 2 + 0.06);
    g.add(garageDoor);
  }

  // Chimney (randomly)
  if (Math.random() < 0.5) {
    const chim = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.2, 0.6),
      mats.wall(0x775544)
    );
    chim.position.set(width * 0.25, totalH + roofH * 0.7, -depth * 0.1);
    chim.castShadow = true;
    g.add(chim);
  }

  g.meta = {
    type: 'house',
    doorWorldPos: new THREE.Vector3(0, 0, depth / 2 + 1.5),
    sizeX: width,
    sizeZ: depth,
  };
  return g;
}

/** Apartment block (taller, more windows). */
export function makeApartment(width = 12, depth = 12, stories = 4): BuildingGroup {
  const g = new THREE.Group() as BuildingGroup;
  const wallColor = pick([0xd0c4a8, 0xb8a890, 0xc8b89c, 0xdcc9a0]);
  const storyH = 3.2;
  const totalH = storyH * stories;

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, totalH, depth), mats.wall(wallColor));
  body.position.y = totalH / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  for (let s = 0; s < stories; s++) {
    const y = s * storyH;
    const subGroup = new THREE.Group();
    subGroup.position.y = y;
    windowGrid(subGroup, width, storyH, 3, 1, 'z+', depth / 2 + 0.01);
    windowGrid(subGroup, width, storyH, 3, 1, 'z-', depth / 2 + 0.01);
    windowGrid(subGroup, depth, storyH, 3, 1, 'x+', width / 2 + 0.01);
    windowGrid(subGroup, depth, storyH, 3, 1, 'x-', width / 2 + 0.01);
    g.add(subGroup);
  }

  // Flat roof with edge
  const roofEdge = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.3, 0.3, depth + 0.3),
    mats.wall(0x999999)
  );
  roofEdge.position.y = totalH + 0.15;
  roofEdge.castShadow = true;
  g.add(roofEdge);

  // Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 0.12), mats.door());
  door.position.set(0, 1.2, depth / 2 + 0.06);
  g.add(door);

  g.meta = {
    type: 'apartment',
    doorWorldPos: new THREE.Vector3(0, 0, depth / 2 + 1.5),
    sizeX: width,
    sizeZ: depth,
  };
  return g;
}

/** Office (destination building) — tall, distinctive. */
export function makeOffice(): BuildingGroup {
  const g = new THREE.Group() as BuildingGroup;
  const width = 16;
  const depth = 14;
  const stories = 6;
  const storyH = 3.4;
  const totalH = stories * storyH;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, totalH, depth),
    new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.4, metalness: 0.2 })
  );
  body.position.y = totalH / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Glass facade strips
  for (let s = 0; s < stories; s++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.95, 1.5, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x66aacc,
        metalness: 0.7,
        roughness: 0.15,
        emissive: 0x113355,
        emissiveIntensity: 0.25,
      })
    );
    strip.position.set(0, s * storyH + storyH * 0.55, depth / 2 + 0.05);
    g.add(strip);
    const strip2 = strip.clone();
    strip2.position.z = -depth / 2 - 0.05;
    g.add(strip2);
  }

  // Entrance canopy
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.3, 3),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 })
  );
  canopy.position.set(0, 3.0, depth / 2 + 1.4);
  canopy.castShadow = true;
  g.add(canopy);

  // Pillars
  for (const x of [-2.5, 2.5]) {
    const p = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 3.0, 12),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.4 })
    );
    p.position.set(x, 1.5, depth / 2 + 2.7);
    g.add(p);
  }

  // Door entry
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.8, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x88bbdd, metalness: 0.5, roughness: 0.2 })
  );
  door.position.set(0, 1.4, depth / 2 + 0.08);
  g.add(door);

  // Sign
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const ctx = signCanvas.getContext('2d')!;
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#ffcc33';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OFFICE • مقر العمل', 256, 64);
  const tex = new THREE.CanvasTexture(signCanvas);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  sign.position.set(0, 4.3, depth / 2 + 1.5);
  g.add(sign);

  // Rooftop vent
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1.5, 3),
    new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 })
  );
  roof.position.set(0, totalH + 0.75, -2);
  roof.castShadow = true;
  g.add(roof);

  g.meta = {
    type: 'office',
    doorWorldPos: new THREE.Vector3(0, 0, depth / 2 + 4.0),
    sizeX: width,
    sizeZ: depth,
  };
  return g;
}

/** Gas station. */
export function makeGasStation(): BuildingGroup {
  const g = new THREE.Group() as BuildingGroup;

  // Shop
  const shop = new THREE.Mesh(
    new THREE.BoxGeometry(10, 4, 7),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 })
  );
  shop.position.set(-7, 2, 0);
  shop.castShadow = true;
  shop.receiveShadow = true;
  g.add(shop);

  // Shop sign
  const sc = document.createElement('canvas');
  sc.width = 512; sc.height = 160;
  const cx = sc.getContext('2d')!;
  cx.fillStyle = '#ff3322'; cx.fillRect(0, 0, 512, 160);
  cx.fillStyle = '#fff'; cx.font = 'bold 80px Arial';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText('⛽ GAS STATION', 256, 80);
  const tex = new THREE.CanvasTexture(sc);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 2.4),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  sign.position.set(-7, 5.5, 3.6);
  g.add(sign);

  // Canopy (covers pumps)
  const canopyRoof = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.5, 9),
    new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.6 })
  );
  canopyRoof.position.set(5, 5.5, 0);
  canopyRoof.castShadow = true;
  g.add(canopyRoof);

  // Canopy trim (red)
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(14.1, 0.8, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xdd2211, roughness: 0.6 })
  );
  trim.position.set(5, 5.1, 4.5);
  g.add(trim);
  const trim2 = trim.clone(); trim2.position.z = -4.5; g.add(trim2);

  // 4 pillars
  for (const [x, z] of [[-1, 4], [11, 4], [-1, -4], [11, -4]]) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 5.5, 10),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.5 })
    );
    pole.position.set(x, 2.75, z);
    pole.castShadow = true;
    g.add(pole);
  }

  // Pumps (2)
  for (const px of [2, 8]) {
    const pump = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xdd2211, roughness: 0.5 })
    );
    base.position.y = 0.9;
    base.castShadow = true;
    pump.add(base);
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.3, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    top.position.y = 2.0;
    pump.add(top);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x33ff88 })
    );
    screen.position.set(0, 1.4, 0.37);
    pump.add(screen);
    pump.position.set(px, 0, 0);
    g.add(pump);
  }

  // Ground platform around pumps (dark asphalt)
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.08, 9),
    new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 1 })
  );
  pad.position.set(5, 0.04, 0);
  pad.receiveShadow = true;
  g.add(pad);

  g.meta = {
    type: 'gas',
    doorWorldPos: new THREE.Vector3(5, 0, 0), // pump area center
    sizeX: 22,
    sizeZ: 10,
  };
  return g;
}

/** Small shop (visual variety). */
export function makeShop(): BuildingGroup {
  const g = new THREE.Group() as BuildingGroup;
  const width = 8, depth = 6, height = 3.5;
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: pick([0xffcc66, 0x66ccaa, 0x66aaff, 0xff7788]), roughness: 0.7 })
  );
  wall.position.y = height / 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  g.add(wall);
  // Storefront glass
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.85, 2.0, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x88ccee, metalness: 0.5, roughness: 0.15 })
  );
  glass.position.set(0, 1.2, depth / 2 + 0.05);
  g.add(glass);
  // Awning
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.9, 0.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x223355 })
  );
  awning.position.set(0, 2.6, depth / 2 + 0.6);
  g.add(awning);
  // Flat roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.2, 0.2, depth + 0.2),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  roof.position.y = height + 0.1;
  g.add(roof);
  g.meta = {
    type: 'shop',
    doorWorldPos: new THREE.Vector3(0, 0, depth / 2 + 1),
    sizeX: width,
    sizeZ: depth,
  };
  return g;
}
