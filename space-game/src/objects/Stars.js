import * as THREE from 'three';

export function createStarField(count = 5000, radius = 500) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.8 + Math.random() * 0.2);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const starType = Math.random();
    if (starType < 0.6) {
      colors[i * 3] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 2] = 1;
    } else if (starType < 0.8) {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.6 + Math.random() * 0.2;
    } else if (starType < 0.95) {
      colors[i * 3] = 0.7 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.1;
      colors[i * 3 + 2] = 1;
    } else {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.2 + Math.random() * 0.1;
    }

    sizes[i] = 0.3 + Math.random() * 1.5;
    if (Math.random() < 0.02) sizes[i] = 2 + Math.random() * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

export function createSun() {
  const group = new THREE.Group();

  const sunGeo = new THREE.SphereGeometry(20, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xffdd44
  });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  group.add(sun);

  const glowGeo = new THREE.SphereGeometry(25, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffaa22,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  group.add(glow);

  const sunLight = new THREE.DirectionalLight(0xfff5e6, 2);
  sunLight.castShadow = true;
  group.add(sunLight);

  const ambient = new THREE.AmbientLight(0x111122, 0.3);
  group.add(ambient);

  group.userData.sunLight = sunLight;
  return group;
}

export function createMilkyWay(radius = 490) {
  const geometry = new THREE.BufferGeometry();
  const count = 3000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const bandWidth = 0.3 + Math.random() * 0.2;
    const phi = Math.PI / 2 + (Math.random() - 0.5) * bandWidth;
    const r = radius;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const brightness = 0.2 + Math.random() * 0.3;
    colors[i * 3] = brightness * 0.8;
    colors[i * 3 + 1] = brightness * 0.7;
    colors[i * 3 + 2] = brightness;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}
