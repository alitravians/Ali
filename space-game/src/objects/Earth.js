import * as THREE from 'three';

export function createEarth(radius = 50) {
  const group = new THREE.Group();

  const earthGeo = new THREE.SphereGeometry(radius, 64, 64);
  const earthCanvas = document.createElement('canvas');
  earthCanvas.width = 2048;
  earthCanvas.height = 1024;
  const ectx = earthCanvas.getContext('2d');

  const grad = ectx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#1a3a5c');
  grad.addColorStop(0.2, '#1a5276');
  grad.addColorStop(0.4, '#2e86c1');
  grad.addColorStop(0.5, '#1a8a3a');
  grad.addColorStop(0.6, '#d4a017');
  grad.addColorStop(0.7, '#1a5276');
  grad.addColorStop(0.85, '#2e86c1');
  grad.addColorStop(1, '#1a3a5c');
  ectx.fillStyle = grad;
  ectx.fillRect(0, 0, 2048, 1024);

  const continents = [
    { x: 400, y: 300, w: 300, h: 250, c: '#2d6a4f' },
    { x: 750, y: 200, w: 500, h: 400, c: '#40916c' },
    { x: 900, y: 350, w: 200, h: 300, c: '#52b788' },
    { x: 1300, y: 250, w: 400, h: 350, c: '#2d6a4f' },
    { x: 1500, y: 500, w: 300, h: 200, c: '#d4a017' },
    { x: 200, y: 400, w: 250, h: 300, c: '#40916c' },
    { x: 1700, y: 200, w: 200, h: 250, c: '#52b788' },
    { x: 600, y: 600, w: 350, h: 200, c: '#2d6a4f' },
    { x: 100, y: 150, w: 200, h: 150, c: '#e8e8e8' },
    { x: 100, y: 800, w: 250, h: 100, c: '#e8e8e8' },
  ];

  continents.forEach(cont => {
    ectx.fillStyle = cont.c;
    ectx.beginPath();
    const cx = cont.x + cont.w / 2;
    const cy = cont.y + cont.h / 2;
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const rx = cont.w / 2 * (0.6 + Math.random() * 0.4);
      const ry = cont.h / 2 * (0.6 + Math.random() * 0.4);
      const px = cx + Math.cos(angle) * rx;
      const py = cy + Math.sin(angle) * ry;
      if (i === 0) ectx.moveTo(px, py);
      else ectx.lineTo(px, py);
    }
    ectx.closePath();
    ectx.fill();
  });

  for (let i = 0; i < 100; i++) {
    ectx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.4})`;
    const cx = Math.random() * 2048;
    const cy = Math.random() * 1024;
    ectx.beginPath();
    ectx.ellipse(cx, cy, 20 + Math.random() * 80, 10 + Math.random() * 30, Math.random() * Math.PI, 0, Math.PI * 2);
    ectx.fill();
  }

  const earthTex = new THREE.CanvasTexture(earthCanvas);
  const earthMat = new THREE.MeshPhongMaterial({
    map: earthTex,
    specular: new THREE.Color(0x333333),
    shininess: 25
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  group.add(earthMesh);

  const atmosGeo = new THREE.SphereGeometry(radius * 1.02, 64, 64);
  const atmosMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.FrontSide,
    uniforms: {
      glowColor: { value: new THREE.Color(0x00aaff) },
      viewVector: { value: new THREE.Vector3(0, 0, 1) }
    },
    vertexShader: `
      varying float intensity;
      uniform vec3 viewVector;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.7 - dot(vNormal, vNormel), 2.5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying float intensity;
      void main() {
        vec3 glow = glowColor * intensity;
        gl_FragColor = vec4(glow, intensity * 0.6);
      }
    `
  });
  const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  group.add(atmosMesh);

  group.userData.earthMesh = earthMesh;
  group.userData.atmosMesh = atmosMesh;
  group.userData.atmosMat = atmosMat;

  return group;
}

export function createDetailedEarth(radius = 50) {
  const earth = createEarth(radius);

  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = 2048;
  nightCanvas.height = 1024;
  const nctx = nightCanvas.getContext('2d');
  nctx.fillStyle = '#000';
  nctx.fillRect(0, 0, 2048, 1024);

  const cityRegions = [
    { x: 700, y: 280, density: 80 },
    { x: 850, y: 320, density: 60 },
    { x: 1400, y: 300, density: 70 },
    { x: 350, y: 350, density: 50 },
    { x: 1600, y: 350, density: 40 },
    { x: 900, y: 400, density: 30 },
    { x: 1300, y: 400, density: 35 },
  ];

  cityRegions.forEach(region => {
    for (let i = 0; i < region.density; i++) {
      const x = region.x + (Math.random() - 0.5) * 200;
      const y = region.y + (Math.random() - 0.5) * 100;
      const brightness = 0.5 + Math.random() * 0.5;
      nctx.fillStyle = `rgba(255,200,100,${brightness})`;
      nctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
  });

  const nightTex = new THREE.CanvasTexture(nightCanvas);
  earth.userData.earthMesh.material.emissiveMap = nightTex;
  earth.userData.earthMesh.material.emissive = new THREE.Color(0xffcc66);
  earth.userData.earthMesh.material.emissiveIntensity = 0.3;

  return earth;
}
