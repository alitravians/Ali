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
  const panelMat = new THREE.MeshPhongMaterial({ color: 0x445566 });
  const screenMat = new THREE.MeshPhongMaterial({ color: 0x112233, emissive: 0x003366, emissiveIntensity: 0.5 });
  const pipeMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const cableMat = new THREE.MeshPhongMaterial({ color: 0x334455 });
  const frameMat = new THREE.MeshPhongMaterial({ color: 0x666655 });

  // ========== MAIN CORRIDOR (along X-axis, -28 to 28) ==========
  const mainCorridorGeo = new THREE.CylinderGeometry(3, 3, 56, 16, 1, true);
  const mainCorridor = new THREE.Mesh(mainCorridorGeo, wallMat);
  mainCorridor.rotation.z = Math.PI / 2;
  group.add(mainCorridor);

  // End caps for main corridor
  const endCapGeo = new THREE.CircleGeometry(3, 16);
  const endCapMat = new THREE.MeshPhongMaterial({ color: 0xbbbbaa, side: THREE.DoubleSide });
  const endCapL = new THREE.Mesh(endCapGeo, endCapMat);
  endCapL.position.set(-28, 0, 0);
  endCapL.rotation.y = Math.PI / 2;
  group.add(endCapL);
  const endCapR = new THREE.Mesh(endCapGeo, endCapMat);
  endCapR.position.set(28, 0, 0);
  endCapR.rotation.y = -Math.PI / 2;
  group.add(endCapR);

  // ========== CROSS CORRIDOR (along Z-axis, -12 to 12) ==========
  const crossCorridorGeo = new THREE.CylinderGeometry(3, 3, 24, 16, 1, true);
  const crossCorridor = new THREE.Mesh(crossCorridorGeo, wallMat);
  crossCorridor.rotation.x = Math.PI / 2;
  group.add(crossCorridor);

  // End caps for cross corridor
  const endCapF = new THREE.Mesh(endCapGeo, endCapMat);
  endCapF.position.set(0, 0, 12);
  group.add(endCapF);
  const endCapB = new THREE.Mesh(endCapGeo, endCapMat);
  endCapB.position.set(0, 0, -12);
  endCapB.rotation.y = Math.PI;
  group.add(endCapB);

  // ========== DOOR FRAMES at corridor intersection ==========
  const doorFrameMat = new THREE.MeshPhongMaterial({ color: 0x888877, emissive: 0x111100, emissiveIntensity: 0.1 });
  // Door frames where corridors meet (4 openings)
  [[-3, 0], [3, 0]].forEach(([x]) => {
    const frameGeo = new THREE.TorusGeometry(2.5, 0.15, 8, 16);
    const frame = new THREE.Mesh(frameGeo, doorFrameMat);
    frame.position.set(x, 0, 0);
    frame.rotation.y = Math.PI / 2;
    group.add(frame);
  });
  [[0, -3], [0, 3]].forEach(([x, z]) => {
    const frameGeo = new THREE.TorusGeometry(2.5, 0.15, 8, 16);
    const frame = new THREE.Mesh(frameGeo, doorFrameMat);
    frame.position.set(0, 0, z);
    group.add(frame);
  });

  // ========== FLOOR GRIDS (both corridors) ==========
  // Main corridor floor
  for (let x = -26; x <= 26; x += 2) {
    const stripGeo = new THREE.BoxGeometry(0.05, 0.01, 5);
    const strip = new THREE.Mesh(stripGeo, frameMat);
    strip.position.set(x, -2.9, 0);
    group.add(strip);
  }
  // Cross corridor floor
  for (let z = -11; z <= 11; z += 2) {
    const stripGeo = new THREE.BoxGeometry(5, 0.01, 0.05);
    const strip = new THREE.Mesh(stripGeo, frameMat);
    strip.position.set(0, -2.9, z);
    group.add(strip);
  }

  // ========== HANDRAILS (both corridors) ==========
  const railMat = new THREE.MeshPhongMaterial({ color: 0xcccc00 });
  // Main corridor handrails
  for (let side = -1; side <= 1; side += 2) {
    const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 54, 6);
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 0, side * 2.8);
    group.add(rail);
  }
  // Cross corridor handrails
  for (let side = -1; side <= 1; side += 2) {
    const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 22, 6);
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(side * 2.8, 0, 0);
    group.add(rail);
  }

  // ========== PIPES AND CABLES (both corridors) ==========
  for (let z = -2; z <= 2; z += 1.5) {
    const pipeGeo = new THREE.CylinderGeometry(0.05, 0.05, 54, 6);
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 2.7, z);
    group.add(pipe);
  }
  for (let x = -2; x <= 2; x += 1.5) {
    const pipeGeo = new THREE.CylinderGeometry(0.05, 0.05, 22, 6);
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, 2.7, 0);
    group.add(pipe);
  }

  // Cable bundles along main corridor
  for (let i = 0; i < 6; i++) {
    const cableGeo = new THREE.CylinderGeometry(0.08, 0.08, 54, 6);
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0, -2.7 + (i % 2) * 0.2, -2 + i * 0.8);
    group.add(cable);
  }

  // ========== LIGHTING (much brighter) ==========
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // Main corridor lights (every 4 units)
  for (let x = -26; x <= 26; x += 4) {
    const lightGeo = new THREE.BoxGeometry(3, 0.05, 0.4);
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(x, 2.95, 0);
    group.add(light);

    const pointLight = new THREE.PointLight(0xffeedd, 0.8, 10);
    pointLight.position.set(x, 2.5, 0);
    group.add(pointLight);

    // Side accent lights
    const accentLight = new THREE.PointLight(0xaaccff, 0.3, 6);
    accentLight.position.set(x, 0, 2.8);
    group.add(accentLight);
  }
  // Cross corridor lights
  for (let z = -10; z <= 10; z += 4) {
    if (Math.abs(z) < 3) continue; // skip intersection (already lit)
    const lightGeo = new THREE.BoxGeometry(0.4, 0.05, 3);
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(0, 2.95, z);
    group.add(light);

    const pointLight = new THREE.PointLight(0xffeedd, 0.8, 10);
    pointLight.position.set(0, 2.5, z);
    group.add(pointLight);
  }

  // ========== EQUIPMENT PANELS (main corridor walls) ==========
  for (let x = -24; x <= 24; x += 4) {
    if (Math.abs(x) < 4) continue; // skip intersection area
    const rackGeo = new THREE.BoxGeometry(3.5, 0.3, 2);
    [-1, 1].forEach(side => {
      const rack = new THREE.Mesh(rackGeo, panelMat);
      rack.position.set(x, side * 2.5, 0);
      rack.rotation.z = side * 0.2;
      group.add(rack);

      // Indicator lights on racks
      for (let j = 0; j < 3; j++) {
        const detailGeo = new THREE.BoxGeometry(0.8, 0.1, 0.4);
        const detail = new THREE.Mesh(detailGeo, new THREE.MeshPhongMaterial({
          color: [0x003366, 0x336600, 0x663300][j],
          emissive: [0x002244, 0x224400, 0x442200][j],
          emissiveIntensity: 0.5
        }));
        detail.position.set(x - 1 + j, side * 2.3, 0.3);
        group.add(detail);
      }
    });

    // Screens every 8 units
    if (x % 8 === 0) {
      const sGeo = new THREE.BoxGeometry(1.5, 0.05, 1);
      const screen = new THREE.Mesh(sGeo, screenMat);
      screen.position.set(x, 0, 2.8);
      screen.rotation.x = 0.1;
      group.add(screen);
    }
  }

  // ========== SECTION 1: CONTROL ROOM (x: 15 to 26) ==========
  // Multiple large screens
  for (let x = 16; x <= 24; x += 4) {
    const bigScreenGeo = new THREE.BoxGeometry(3, 0.06, 1.8);
    const bigScreen = new THREE.Mesh(bigScreenGeo, new THREE.MeshPhongMaterial({
      color: 0x0a1a2a, emissive: 0x004488, emissiveIntensity: 0.6
    }));
    bigScreen.position.set(x, 0.5, 2.75);
    group.add(bigScreen);

    // Screen glow
    const screenGlow = new THREE.PointLight(0x0066cc, 0.4, 4);
    screenGlow.position.set(x, 0.5, 2.2);
    group.add(screenGlow);
  }
  // Control console
  const consoleGeo = new THREE.BoxGeometry(8, 0.8, 2);
  const consoleMesh = new THREE.Mesh(consoleGeo, new THREE.MeshPhongMaterial({ color: 0x334455 }));
  consoleMesh.position.set(20, -1.5, 0);
  consoleMesh.rotation.x = -0.2;
  group.add(consoleMesh);
  // Console buttons
  for (let i = 0; i < 12; i++) {
    const btnGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const btnMat = new THREE.MeshPhongMaterial({
      color: [0xff3333, 0x33ff33, 0x3333ff, 0xffff33][i % 4],
      emissive: [0x440000, 0x004400, 0x000044, 0x444400][i % 4],
      emissiveIntensity: 0.5
    });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.position.set(17 + (i % 6), -1.1, -0.5 + Math.floor(i / 6) * 0.4);
    group.add(btn);
  }

  // ========== SECTION 2: LABORATORY (x: -26 to -15) ==========
  // Lab tables
  const labTableGeo = new THREE.BoxGeometry(4, 0.1, 2.5);
  const labTableMat = new THREE.MeshPhongMaterial({ color: 0x556677 });
  [-22, -18].forEach(x => {
    const table = new THREE.Mesh(labTableGeo, labTableMat);
    table.position.set(x, -1, 0);
    group.add(table);
  });

  // Microscope
  const microscopeBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.4, 0.4),
    new THREE.MeshPhongMaterial({ color: 0x333333 })
  );
  microscopeBase.position.set(-22, -0.7, 0);
  group.add(microscopeBase);
  const microscopeArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1, 8),
    new THREE.MeshPhongMaterial({ color: 0x444444 })
  );
  microscopeArm.position.set(-22, -0.1, 0);
  group.add(microscopeArm);
  const microscopeEye = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.08, 0.3, 8),
    new THREE.MeshPhongMaterial({ color: 0x222222 })
  );
  microscopeEye.position.set(-22, 0.5, 0.1);
  microscopeEye.rotation.x = -0.5;
  group.add(microscopeEye);

  // Plant growth chamber
  const plantBoxGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
  const plantBoxMat = new THREE.MeshPhongMaterial({ color: 0x4a6741, emissive: 0x112211, emissiveIntensity: 0.3 });
  const plantBox = new THREE.Mesh(plantBoxGeo, plantBoxMat);
  plantBox.position.set(-18, -0.5, 0.5);
  group.add(plantBox);
  // Plant light
  const plantLight = new THREE.PointLight(0x88ff44, 0.5, 3);
  plantLight.position.set(-18, 0.2, 0.5);
  group.add(plantLight);
  // Small plants inside
  for (let i = 0; i < 4; i++) {
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
    const stem = new THREE.Mesh(stemGeo, new THREE.MeshPhongMaterial({ color: 0x33aa33 }));
    stem.position.set(-18.3 + i * 0.2, -0.05, 0.5);
    group.add(stem);
  }

  // Sample containers
  for (let i = 0; i < 3; i++) {
    const sampleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8);
    const sampleMat = new THREE.MeshPhongMaterial({
      color: [0x3366aa, 0xaa3366, 0x66aa33][i],
      transparent: true, opacity: 0.7
    });
    const sample = new THREE.Mesh(sampleGeo, sampleMat);
    sample.position.set(-21 + i * 0.5, -0.7, -0.5);
    group.add(sample);
  }

  // ========== SECTION 3: LIVING QUARTERS (x: -8 to 8, top area) ==========
  // Sleep stations (on walls, like real ISS)
  const sleepMat = new THREE.MeshPhongMaterial({ color: 0x445566 });
  [-6, -2, 2, 6].forEach((x, i) => {
    // Sleep bag enclosure
    const sleepGeo = new THREE.BoxGeometry(1.5, 0.3, 2);
    const sleep = new THREE.Mesh(sleepGeo, sleepMat);
    sleep.position.set(x, i % 2 === 0 ? 2.3 : -2.3, 0);
    group.add(sleep);
    // Sleeping bag
    const bagGeo = new THREE.BoxGeometry(1.2, 0.15, 1.8);
    const bag = new THREE.Mesh(bagGeo, new THREE.MeshPhongMaterial({
      color: [0x336699, 0x996633, 0x339966, 0x663399][i]
    }));
    bag.position.set(x, i % 2 === 0 ? 2.1 : -2.1, 0);
    group.add(bag);
  });

  // ========== SECTION 4: RESEARCH LAB (cross corridor, z: 4 to 11) ==========
  // Research equipment racks
  for (let z = 5; z <= 10; z += 2.5) {
    const rackGeo = new THREE.BoxGeometry(2, 0.3, 2);
    [-1, 1].forEach(side => {
      const rack = new THREE.Mesh(rackGeo, panelMat);
      rack.position.set(side * 2.5, 0, z);
      rack.rotation.y = side * 0.2;
      group.add(rack);
    });
  }
  // Large experiment container
  const expGeo = new THREE.BoxGeometry(2, 1.5, 2);
  const expMat = new THREE.MeshPhongMaterial({ color: 0x556666, emissive: 0x112222, emissiveIntensity: 0.2 });
  const expBox = new THREE.Mesh(expGeo, expMat);
  expBox.position.set(0, -1.2, 8);
  group.add(expBox);
  // Status screen on experiment
  const expScreenGeo = new THREE.BoxGeometry(1, 0.05, 0.6);
  const expScreen = new THREE.Mesh(expScreenGeo, new THREE.MeshPhongMaterial({
    color: 0x0a2a1a, emissive: 0x00aa44, emissiveIntensity: 0.4
  }));
  expScreen.position.set(0, -0.3, 8);
  group.add(expScreen);

  // ========== SECTION 5: OBSERVATION & COMMS (cross corridor, z: -4 to -11) ==========
  // Large observation window (Cupola-style)
  const obsWindowGeo = new THREE.CircleGeometry(2, 24);
  const obsWindowMat = new THREE.MeshPhongMaterial({
    color: 0x88ccff, transparent: true, opacity: 0.3,
    emissive: 0x224466, emissiveIntensity: 0.3, side: THREE.DoubleSide
  });
  const obsWindow = new THREE.Mesh(obsWindowGeo, obsWindowMat);
  obsWindow.position.set(0, -2.95, -8);
  obsWindow.rotation.x = Math.PI / 2;
  group.add(obsWindow);
  // Window frame
  const obsFrameGeo = new THREE.TorusGeometry(2.1, 0.1, 8, 24);
  const obsFrame = new THREE.Mesh(obsFrameGeo, new THREE.MeshPhongMaterial({ color: 0x555555 }));
  obsFrame.position.set(0, -2.93, -8);
  obsFrame.rotation.x = Math.PI / 2;
  group.add(obsFrame);

  // Communication equipment
  const commGeo = new THREE.BoxGeometry(1.5, 2, 0.5);
  const commMat = new THREE.MeshPhongMaterial({ color: 0x444455, emissive: 0x111122, emissiveIntensity: 0.2 });
  [-2, 2].forEach(x => {
    const comm = new THREE.Mesh(commGeo, commMat);
    comm.position.set(x, 0, -10);
    group.add(comm);
    // Blinking light on comm equipment
    const blinkGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const blink = new THREE.Mesh(blinkGeo, new THREE.MeshPhongMaterial({
      color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8
    }));
    blink.position.set(x, 0.8, -9.7);
    group.add(blink);
  });

  // Camera for Earth photography
  const cameraMount = new THREE.Group();
  const cameraBod = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.3, 0.5),
    new THREE.MeshPhongMaterial({ color: 0x222222 })
  );
  cameraMount.add(cameraBod);
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.15, 0.3, 12),
    new THREE.MeshPhongMaterial({ color: 0x111111, specular: 0x444444 })
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.z = -0.35;
  cameraMount.add(lens);
  cameraMount.position.set(0, -1, -7);
  cameraMount.rotation.x = Math.PI / 4;
  group.add(cameraMount);

  // ========== SECTION 6: MAINTENANCE (x: 10 to 14 area) ==========
  // Tool storage
  const toolRackGeo = new THREE.BoxGeometry(0.3, 2, 1.5);
  const toolRack = new THREE.Mesh(toolRackGeo, new THREE.MeshPhongMaterial({ color: 0x554433 }));
  toolRack.position.set(12, 0, 2.7);
  group.add(toolRack);
  // Individual tools on rack
  for (let i = 0; i < 5; i++) {
    const toolGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
    const tool = new THREE.Mesh(toolGeo, new THREE.MeshPhongMaterial({
      color: [0xcccc00, 0xff6600, 0x00cccc, 0xff0066, 0x66ff00][i]
    }));
    tool.position.set(12.2, -0.6 + i * 0.3, 2.7);
    tool.rotation.z = Math.PI / 2;
    group.add(tool);
  }

  // Spare parts boxes
  for (let i = 0; i < 4; i++) {
    const boxGeo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
    const box = new THREE.Mesh(boxGeo, new THREE.MeshPhongMaterial({
      color: [0x995533, 0x559933, 0x335599, 0x993355][i]
    }));
    box.position.set(10 + i * 1.5, -2.2, 2);
    group.add(box);
  }

  // ========== STORAGE BAGS (throughout station) ==========
  for (let i = 0; i < 8; i++) {
    const bagGeo = new THREE.BoxGeometry(0.5, 0.5, 0.3);
    const bagMat = new THREE.MeshPhongMaterial({
      color: [0x336699, 0x996633, 0x339966, 0x993366, 0x669933, 0x663399, 0x339999, 0x999933][i]
    });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(-20 + i * 5, 2, 2.5);
    group.add(bag);
  }

  // ========== SECTION LABELS (colored markers on ceiling) ==========
  const sections = [
    { x: -20, z: 0, color: 0x003366, label: 'مختبر' },
    { x: -5, z: 0, color: 0x336600, label: 'معيشة' },
    { x: 5, z: 0, color: 0x663300, label: 'صيانة' },
    { x: 20, z: 0, color: 0x330066, label: 'تحكم' },
    { x: 0, z: 8, color: 0x006633, label: 'أبحاث' },
    { x: 0, z: -8, color: 0x660033, label: 'مراقبة' },
  ];

  sections.forEach(s => {
    const markerGeo = new THREE.BoxGeometry(s.z === 0 ? 0.1 : 0.5, 0.5, s.z === 0 ? 0.5 : 0.1);
    const marker = new THREE.Mesh(markerGeo, new THREE.MeshPhongMaterial({
      color: s.color, emissive: s.color, emissiveIntensity: 0.5
    }));
    marker.position.set(s.x, 2.7, s.z);
    group.add(marker);
  });

  // ========== FOOD/DRINK AREA (near center) ==========
  // Food packets
  for (let i = 0; i < 3; i++) {
    const foodGeo = new THREE.BoxGeometry(0.2, 0.15, 0.1);
    const food = new THREE.Mesh(foodGeo, new THREE.MeshPhongMaterial({
      color: [0xcc8833, 0x88cc33, 0x3388cc][i]
    }));
    food.position.set(-4 + i * 0.4, -0.8, 2.3);
    group.add(food);
  }
  // Water container
  const waterGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshPhongMaterial({
    color: 0x4488cc, transparent: true, opacity: 0.6
  }));
  water.position.set(-3, -0.6, 2.3);
  group.add(water);

  group.userData.sections = sections;
  return group;
}
