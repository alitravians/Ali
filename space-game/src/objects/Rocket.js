import * as THREE from 'three';

export function createRocket() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(1.2, 1.5, 18, 16);
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, specular: 0x444444, shininess: 60 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 9;
  group.add(body);

  const noseGeo = new THREE.ConeGeometry(1.2, 5, 16);
  const noseMat = new THREE.MeshPhongMaterial({ color: 0xff3300, specular: 0x333333, shininess: 40 });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.y = 20.5;
  group.add(nose);

  const bandGeo = new THREE.CylinderGeometry(1.55, 1.55, 0.5, 16);
  const bandMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  [4, 8, 12, 16].forEach(y => {
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = y;
    group.add(band);
  });

  const engineGeo = new THREE.CylinderGeometry(1.3, 1.8, 3, 16);
  const engineMat = new THREE.MeshPhongMaterial({ color: 0x555555, specular: 0x222222 });
  const engine = new THREE.Mesh(engineGeo, engineMat);
  engine.position.y = -0.5;
  group.add(engine);

  const nozzleGeo = new THREE.CylinderGeometry(0.8, 1.2, 2, 12);
  const nozzleMat = new THREE.MeshPhongMaterial({ color: 0x333333, emissive: 0x110000 });
  for (let i = 0; i < 3; i++) {
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    const angle = (i / 3) * Math.PI * 2;
    nozzle.position.set(Math.cos(angle) * 0.6, -1.5, Math.sin(angle) * 0.6);
    group.add(nozzle);
  }

  const finGeo = new THREE.BoxGeometry(0.15, 5, 3);
  const finMat = new THREE.MeshPhongMaterial({ color: 0xcc2200 });
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(finGeo, finMat);
    const angle = (i / 4) * Math.PI * 2;
    fin.position.set(Math.cos(angle) * 1.6, 1.5, Math.sin(angle) * 1.6);
    fin.rotation.y = angle;
    group.add(fin);
  }

  const boosterGeo = new THREE.CylinderGeometry(0.6, 0.7, 14, 12);
  const boosterMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
  const boosterNoseGeo = new THREE.ConeGeometry(0.6, 2, 12);
  const boosters = [];
  for (let i = 0; i < 2; i++) {
    const boosterGroup = new THREE.Group();
    const booster = new THREE.Mesh(boosterGeo, boosterMat);
    booster.position.y = 7;
    boosterGroup.add(booster);
    const boosterNose = new THREE.Mesh(boosterNoseGeo, noseMat);
    boosterNose.position.y = 15;
    boosterGroup.add(boosterNose);
    const angle = i === 0 ? -Math.PI / 2 : Math.PI / 2;
    boosterGroup.position.set(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5);
    group.add(boosterGroup);
    boosters.push(boosterGroup);
  }

  group.userData.boosters = boosters;
  group.userData.body = body;
  group.userData.nose = nose;
  group.userData.engine = engine;

  return group;
}

export function createSpacecraft() {
  const group = new THREE.Group();

  const capsuleGeo = new THREE.SphereGeometry(2.5, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const capsuleMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, specular: 0x555555, shininess: 80 });
  const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
  capsule.rotation.x = Math.PI;
  group.add(capsule);

  const baseGeo = new THREE.CylinderGeometry(2.5, 2.2, 1.5, 24);
  const baseMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -1;
  group.add(base);

  const shieldGeo = new THREE.CylinderGeometry(2.3, 2.5, 0.3, 24);
  const shieldMat = new THREE.MeshPhongMaterial({ color: 0x443322, emissive: 0x110000, emissiveIntensity: 0.2 });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.y = -1.8;
  group.add(shield);

  const windowGeo = new THREE.CircleGeometry(0.4, 16);
  const windowMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, emissive: 0x224466, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 3; i++) {
    const win = new THREE.Mesh(windowGeo, windowMat);
    const angle = (i / 3) * Math.PI * 2;
    win.position.set(Math.cos(angle) * 2.3, 0.5, Math.sin(angle) * 2.3);
    win.lookAt(win.position.clone().multiplyScalar(2));
    group.add(win);
  }

  const dockGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16);
  const dockMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
  const dock = new THREE.Mesh(dockGeo, dockMat);
  dock.position.y = 2;
  group.add(dock);

  const solarGeo = new THREE.BoxGeometry(4, 0.05, 1.5);
  const solarMat = new THREE.MeshPhongMaterial({ color: 0x1a237e, specular: 0x4444ff, shininess: 100 });
  const solar1 = new THREE.Mesh(solarGeo, solarMat);
  solar1.position.set(3.5, 0.5, 0);
  group.add(solar1);
  const solar2 = new THREE.Mesh(solarGeo, solarMat);
  solar2.position.set(-3.5, 0.5, 0);
  group.add(solar2);

  group.userData.shield = shield;
  group.userData.shieldMat = shieldMat;

  return group;
}

export function createExhaustParticles(count = 500) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = -Math.random() * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

    const t = Math.random();
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 0.3 + t * 0.5;
    colors[i * 3 + 2] = t * 0.2;

    sizes[i] = 0.5 + Math.random() * 1.5;
    velocities.push({
      x: (Math.random() - 0.5) * 2,
      y: -5 - Math.random() * 15,
      z: (Math.random() - 0.5) * 2
    });
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 1,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  points.userData.velocities = velocities;
  points.userData.count = count;

  return points;
}

export function updateExhaustParticles(particles, delta, intensity = 1) {
  const positions = particles.geometry.attributes.position.array;
  const colors = particles.geometry.attributes.color.array;
  const velocities = particles.userData.velocities;
  const count = particles.userData.count;

  for (let i = 0; i < count; i++) {
    positions[i * 3] += velocities[i].x * delta * intensity;
    positions[i * 3 + 1] += velocities[i].y * delta * intensity;
    positions[i * 3 + 2] += velocities[i].z * delta * intensity;

    if (positions[i * 3 + 1] < -20 * intensity) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
      colors[i * 3 + 2] = Math.random() * 0.3;
    } else {
      colors[i * 3 + 1] *= 0.99;
      colors[i * 3 + 2] *= 0.98;
    }
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.color.needsUpdate = true;
}
