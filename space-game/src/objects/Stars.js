import * as THREE from 'three';

export function createStarField(count = 8000, radius = 500) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.85 + Math.random() * 0.15);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Realistic star color distribution (spectral classes)
    const starType = Math.random();
    if (starType < 0.55) {
      // White/blue-white (A/F type) — most visible
      const t = Math.random() * 0.15;
      colors[i * 3] = 0.85 + t;
      colors[i * 3 + 1] = 0.88 + t;
      colors[i * 3 + 2] = 1;
    } else if (starType < 0.75) {
      // Yellow/white (G type — like our Sun)
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.92 + Math.random() * 0.08;
      colors[i * 3 + 2] = 0.75 + Math.random() * 0.15;
    } else if (starType < 0.88) {
      // Blue (O/B type)
      colors[i * 3] = 0.6 + Math.random() * 0.15;
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.15;
      colors[i * 3 + 2] = 1;
    } else if (starType < 0.96) {
      // Orange (K type)
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.65 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.15;
    } else {
      // Red (M type — red dwarfs)
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.35 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.2 + Math.random() * 0.1;
    }

    // Dim most stars, make a few bright
    const brightness = Math.random();
    if (brightness > 0.97) {
      // Bright stars
      colors[i * 3] *= 1.2;
      colors[i * 3 + 1] *= 1.2;
      colors[i * 3 + 2] *= 1.2;
    } else {
      const dim = 0.3 + brightness * 0.7;
      colors[i * 3] *= dim;
      colors[i * 3 + 1] *= dim;
      colors[i * 3 + 2] *= dim;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

export function createSun() {
  const group = new THREE.Group();

  // Sun core
  const sunGeo = new THREE.SphereGeometry(20, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4e0 });
  group.add(new THREE.Mesh(sunGeo, sunMat));

  // Inner glow
  const glow1Geo = new THREE.SphereGeometry(24, 32, 32);
  const glow1Mat = new THREE.MeshBasicMaterial({
    color: 0xffdd66, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  group.add(new THREE.Mesh(glow1Geo, glow1Mat));

  // Outer glow
  const glow2Geo = new THREE.SphereGeometry(35, 32, 32);
  const glow2Mat = new THREE.MeshBasicMaterial({
    color: 0xffaa22, transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  group.add(new THREE.Mesh(glow2Geo, glow2Mat));

  // Corona
  const coronaGeo = new THREE.SphereGeometry(50, 32, 32);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xff8800, transparent: true, opacity: 0.04,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  group.add(new THREE.Mesh(coronaGeo, coronaMat));

  // Directional light from sun
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
  sunLight.castShadow = true;
  group.add(sunLight);

  // Subtle ambient
  group.add(new THREE.AmbientLight(0x0a0a18, 0.25));

  group.userData.sunLight = sunLight;
  return group;
}

export function createMilkyWay(radius = 490) {
  const geometry = new THREE.BufferGeometry();
  const count = 5000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    // Concentrated band with Gaussian-like distribution
    const bandSpread = 0.12 + Math.pow(Math.random(), 2) * 0.25;
    const phi = Math.PI / 2 + (Math.random() - 0.5) * bandSpread;
    const r = radius * (0.95 + Math.random() * 0.05);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Milky Way has bluish-white core with warm edges
    const dist = Math.abs(phi - Math.PI / 2) / 0.3;
    const brightness = (0.15 + Math.random() * 0.25) * (1 - dist * 0.5);
    colors[i * 3] = brightness * (0.75 + Math.random() * 0.2);
    colors[i * 3 + 1] = brightness * (0.7 + Math.random() * 0.2);
    colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.1);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.7,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}
