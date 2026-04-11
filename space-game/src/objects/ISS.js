import * as THREE from 'three';

export function createISS() {
  const group = new THREE.Group();
  const moduleMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, specular: 0x444444, shininess: 60 });
  const detailMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const goldMat = new THREE.MeshPhongMaterial({ color: 0xccaa44, specular: 0xffdd88, shininess: 80 });

  // Main truss
  const trussGeo = new THREE.BoxGeometry(50, 1.2, 1.2);
  const truss = new THREE.Mesh(trussGeo, detailMat);
  group.add(truss);

  // Central modules (pressurized)
  const modules = [
    { l: 8, r: 2, y: 0, z: 0, x: 0, color: 0xdddddd },    // Destiny lab
    { l: 6, r: 1.8, y: 0, z: 0, x: -5, color: 0xcccccc },  // Unity node
    { l: 7, r: 1.8, y: 0, z: 0, x: 5, color: 0xbbbbbb },   // Harmony node
    { l: 6, r: 1.8, y: 0, z: 3.5, x: 0, color: 0xddddcc }, // Columbus
    { l: 6, r: 1.8, y: 0, z: -3.5, x: 0, color: 0xccddcc },// Kibo
    { l: 5, r: 1.6, y: 0, z: 0, x: -9, color: 0xccccbb },  // Zarya
    { l: 5, r: 1.6, y: 0, z: 0, x: -13, color: 0xbbbbaa },  // Zvezda
    { l: 4, r: 1.5, y: 0, z: 3, x: -5, color: 0xddccbb },  // Quest airlock
    { l: 4, r: 1.5, y: 2.5, z: 0, x: 2, color: 0xccdddd }, // Cupola area
  ];

  modules.forEach(m => {
    const geo = new THREE.CylinderGeometry(m.r, m.r, m.l, 16);
    const mat = new THREE.MeshPhongMaterial({ color: m.color, specular: 0x444444, shininess: 50 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(m.x, m.y, m.z);
    group.add(mesh);

    // Add connecting nodes
    const nodeGeo = new THREE.SphereGeometry(m.r * 0.6, 12, 12);
    if (m.z !== 0 || m.y !== 0) {
      const node = new THREE.Mesh(nodeGeo, detailMat);
      node.position.set(m.x, 0, 0);
      group.add(node);
    }
  });

  // Solar panels (8 arrays)
  const solarGeo = new THREE.BoxGeometry(6, 0.05, 15);
  const solarMat = new THREE.MeshPhongMaterial({
    color: 0x1a237e, specular: 0x3333ff, shininess: 100,
    emissive: 0x0a0a3e, emissiveIntensity: 0.1
  });

  const panelPositions = [
    { x: -20, z: 0 }, { x: -14, z: 0 },
    { x: 14, z: 0 }, { x: 20, z: 0 },
  ];

  panelPositions.forEach(pos => {
    const panel1 = new THREE.Mesh(solarGeo, solarMat);
    panel1.position.set(pos.x, 1, pos.z + 8);
    group.add(panel1);
    const panel2 = new THREE.Mesh(solarGeo, solarMat);
    panel2.position.set(pos.x, 1, pos.z - 8);
    group.add(panel2);

    // Panel support
    const supportGeo = new THREE.CylinderGeometry(0.1, 0.1, 16, 6);
    const support = new THREE.Mesh(supportGeo, detailMat);
    support.position.set(pos.x, 1, pos.z);
    support.rotation.x = Math.PI / 2;
    group.add(support);
  });

  // Radiators (gold colored)
  const radGeo = new THREE.BoxGeometry(4, 0.05, 8);
  [{ x: -10, y: -1.5 }, { x: 10, y: -1.5 }].forEach(pos => {
    const rad = new THREE.Mesh(radGeo, goldMat);
    rad.position.set(pos.x, pos.y, 0);
    group.add(rad);
  });

  // Cupola (observation dome)
  const cupolaGeo = new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const cupolaMat = new THREE.MeshPhongMaterial({
    color: 0x88bbff, transparent: true, opacity: 0.5,
    specular: 0xffffff, shininess: 100
  });
  const cupola = new THREE.Mesh(cupolaGeo, cupolaMat);
  cupola.position.set(2, -2.5, 0);
  cupola.rotation.x = Math.PI;
  group.add(cupola);

  // Docking ports
  const dockGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 12);
  const dockMat = new THREE.MeshPhongMaterial({ color: 0x666666, emissive: 0x111111 });
  const dockPositions = [
    { x: 8.5, y: 0, z: 0, rx: 0, rz: Math.PI / 2 },
    { x: -16, y: 0, z: 0, rx: 0, rz: Math.PI / 2 },
    { x: 2, y: 3.5, z: 0, rx: 0, rz: 0 },
  ];
  const dockPorts = [];
  dockPositions.forEach(pos => {
    const dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.set(pos.x, pos.y, pos.z);
    dock.rotation.set(pos.rx, 0, pos.rz);
    group.add(dock);
    dockPorts.push(dock);

    // Docking ring
    const ringGeo = new THREE.TorusGeometry(0.5, 0.08, 8, 16);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x004400 }));
    ring.position.copy(dock.position);
    if (pos.rz) {
      ring.rotation.y = Math.PI / 2;
      ring.position.x += pos.x > 0 ? 0.8 : -0.8;
    } else {
      ring.rotation.x = Math.PI / 2;
      ring.position.y += 0.8;
    }
    group.add(ring);
  });

  // Canadarm2
  const armSegGeo = new THREE.CylinderGeometry(0.08, 0.08, 8, 6);
  const armMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
  const arm1 = new THREE.Mesh(armSegGeo, armMat);
  arm1.position.set(5, 2, 2);
  arm1.rotation.z = Math.PI / 6;
  group.add(arm1);
  const arm2 = new THREE.Mesh(armSegGeo, armMat);
  arm2.position.set(8, 4, 2);
  arm2.rotation.z = -Math.PI / 4;
  group.add(arm2);

  // Antenna
  const antennaGeo = new THREE.CylinderGeometry(0.03, 0.03, 3, 6);
  const antennaMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
  for (let i = 0; i < 4; i++) {
    const ant = new THREE.Mesh(antennaGeo, antennaMat);
    ant.position.set(-5 + i * 3, 3, 0);
    group.add(ant);
    const dishGeo = new THREE.CircleGeometry(0.4, 12);
    const dish = new THREE.Mesh(dishGeo, moduleMat);
    dish.position.set(-5 + i * 3, 4.5, 0);
    group.add(dish);
  }

  group.userData.dockPorts = dockPorts;
  return group;
}

export function createISSInterior() {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshPhongMaterial({ color: 0xddddcc, side: THREE.BackSide });
  const floorMat = new THREE.MeshPhongMaterial({ color: 0x999988, side: THREE.BackSide });
  const panelMat = new THREE.MeshPhongMaterial({ color: 0x445566 });
  const screenMat = new THREE.MeshPhongMaterial({ color: 0x112233, emissive: 0x003366, emissiveIntensity: 0.5 });
  const pipeMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const cableMat = new THREE.MeshPhongMaterial({ color: 0x334455 });

  // Main corridor
  const corridorGeo = new THREE.CylinderGeometry(3, 3, 40, 16, 1, true);
  const corridor = new THREE.Mesh(corridorGeo, wallMat);
  corridor.rotation.z = Math.PI / 2;
  group.add(corridor);

  // Floor grid
  for (let x = -18; x <= 18; x += 2) {
    const stripGeo = new THREE.BoxGeometry(0.05, 0.01, 5);
    const strip = new THREE.Mesh(stripGeo, new THREE.MeshPhongMaterial({ color: 0x666655 }));
    strip.position.set(x, -2.9, 0);
    group.add(strip);
  }

  // Panels on walls
  for (let x = -16; x <= 16; x += 4) {
    // Equipment racks
    const rackGeo = new THREE.BoxGeometry(3.5, 0.3, 2);
    [-1, 1].forEach(side => {
      const rack = new THREE.Mesh(rackGeo, panelMat);
      rack.position.set(x, side * 2.5, 0);
      rack.rotation.z = side * 0.2;
      group.add(rack);

      // Rack details (switches, indicators)
      for (let j = 0; j < 3; j++) {
        const detailGeo = new THREE.BoxGeometry(0.8, 0.1, 0.4);
        const detail = new THREE.Mesh(detailGeo, new THREE.MeshPhongMaterial({
          color: [0x003366, 0x336600, 0x663300][j],
          emissive: [0x001133, 0x113300, 0x331100][j],
          emissiveIntensity: 0.3
        }));
        detail.position.set(x - 1 + j, side * 2.3, 0.3);
        group.add(detail);
      }
    });

    // Screens
    if (x % 8 === 0) {
      const sGeo = new THREE.BoxGeometry(1.5, 0.05, 1);
      const screen = new THREE.Mesh(sGeo, screenMat);
      screen.position.set(x, 0, 2.8);
      screen.rotation.x = 0.1;
      group.add(screen);

      // Screen frame
      const frameGeo = new THREE.BoxGeometry(1.6, 0.06, 0.06);
      const frameMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
      [0.52, -0.52].forEach(zOff => {
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(x, 0, 2.8 + zOff);
        group.add(frame);
      });
    }
  }

  // Pipes and cables along ceiling
  for (let z = -2; z <= 2; z += 1.5) {
    const pipeGeo = new THREE.CylinderGeometry(0.05, 0.05, 38, 6);
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 2.7, z);
    group.add(pipe);
  }

  // Cable bundles
  for (let i = 0; i < 6; i++) {
    const cableGeo = new THREE.CylinderGeometry(0.08, 0.08, 35, 6);
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0, -2.7 + (i % 2) * 0.2, -2 + i * 0.8);
    group.add(cable);
  }

  // Handrails
  const railMat = new THREE.MeshPhongMaterial({ color: 0xcccc00 });
  for (let side = -1; side <= 1; side += 2) {
    const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 38, 6);
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 0, side * 2.8);
    group.add(rail);
  }

  // Lighting strips
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let x = -18; x <= 18; x += 6) {
    const lightGeo = new THREE.BoxGeometry(4, 0.05, 0.3);
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(x, 2.95, 0);
    group.add(light);

    const pointLight = new THREE.PointLight(0xffeedd, 0.4, 8);
    pointLight.position.set(x, 2.5, 0);
    group.add(pointLight);
  }

  // Lab equipment area
  const labTable = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.1, 2),
    new THREE.MeshPhongMaterial({ color: 0x556677 })
  );
  labTable.position.set(0, -1, 0);
  group.add(labTable);

  // Microscope
  const microscopeBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.3, 0.3),
    new THREE.MeshPhongMaterial({ color: 0x333333 })
  );
  microscopeBase.position.set(0.5, -0.75, 0);
  group.add(microscopeBase);
  const microscopeArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8),
    new THREE.MeshPhongMaterial({ color: 0x444444 })
  );
  microscopeArm.position.set(0.5, -0.25, 0);
  group.add(microscopeArm);

  // Plant growth experiment
  const plantBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.3, 0.4),
    new THREE.MeshPhongMaterial({ color: 0x4a6741 })
  );
  plantBox.position.set(-1, -0.75, 0.5);
  group.add(plantBox);

  // Section labels using small colored panels
  const sections = [
    { x: -15, color: 0x003366, label: 'مختبر' },
    { x: -8, color: 0x336600, label: 'معيشة' },
    { x: 0, color: 0x663300, label: 'أبحاث' },
    { x: 8, color: 0x330066, label: 'اتصالات' },
    { x: 15, color: 0x660033, label: 'صيانة' },
  ];

  sections.forEach(s => {
    const markerGeo = new THREE.BoxGeometry(0.1, 0.5, 0.5);
    const marker = new THREE.Mesh(markerGeo, new THREE.MeshPhongMaterial({
      color: s.color, emissive: s.color, emissiveIntensity: 0.3
    }));
    marker.position.set(s.x, 2.7, 2.5);
    group.add(marker);
  });

  // Window (Cupola-like)
  const windowGeo = new THREE.CircleGeometry(1.2, 24);
  const windowMat = new THREE.MeshPhongMaterial({
    color: 0x88ccff, transparent: true, opacity: 0.3,
    emissive: 0x224466, emissiveIntensity: 0.2, side: THREE.DoubleSide
  });
  const window1 = new THREE.Mesh(windowGeo, windowMat);
  window1.position.set(8, -2.95, 0);
  window1.rotation.x = Math.PI / 2;
  group.add(window1);

  // Storage bags
  for (let i = 0; i < 5; i++) {
    const bagGeo = new THREE.BoxGeometry(0.5, 0.5, 0.3);
    const bagMat = new THREE.MeshPhongMaterial({
      color: [0x336699, 0x996633, 0x339966, 0x993366, 0x669933][i]
    });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(-12 + i * 2, 2, 2.5);
    group.add(bag);
  }

  group.userData.sections = sections;
  return group;
}
