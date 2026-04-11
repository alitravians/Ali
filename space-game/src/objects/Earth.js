import * as THREE from 'three';

export function createEarth(radius = 50) {
  const group = new THREE.Group();

  const earthGeo = new THREE.SphereGeometry(radius, 64, 64);
  const earthCanvas = document.createElement('canvas');
  earthCanvas.width = 2048;
  earthCanvas.height = 1024;
  const ctx = earthCanvas.getContext('2d');

  // Deep ocean base with realistic gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  oceanGrad.addColorStop(0, '#0a1e3d');
  oceanGrad.addColorStop(0.15, '#0d2847');
  oceanGrad.addColorStop(0.3, '#164773');
  oceanGrad.addColorStop(0.45, '#1a5a8a');
  oceanGrad.addColorStop(0.55, '#1a5a8a');
  oceanGrad.addColorStop(0.7, '#164773');
  oceanGrad.addColorStop(0.85, '#0d2847');
  oceanGrad.addColorStop(1, '#0a1e3d');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Realistic continent shapes (approximate Mercator positions)
  const continents = [
    // North America
    { points: [[280,180],[320,170],[400,180],[440,220],[450,280],[440,340],[400,370],[350,380],[300,360],[250,300],[240,250],[260,200]], color: '#2d5a3a' },
    // South America
    { points: [[420,400],[450,380],[480,400],[490,450],[500,520],[490,580],[460,640],[430,680],[400,650],[380,580],[370,500],[390,430]], color: '#3a6b44' },
    // Europe
    { points: [[900,180],[950,170],[1000,180],[1020,200],[1010,240],[980,260],[940,250],[920,230],[900,210]], color: '#4a7a4a' },
    // Africa
    { points: [[900,280],[960,270],[1020,290],[1050,340],[1060,400],[1050,460],[1020,520],[980,560],[940,560],[910,520],[890,460],[880,400],[880,340],[890,300]], color: '#5a8040' },
    // Asia (large)
    { points: [[1020,140],[1100,120],[1200,130],[1350,150],[1450,180],[1500,220],[1520,280],[1480,320],[1400,340],[1300,350],[1200,330],[1100,300],[1050,260],[1030,220],[1020,180]], color: '#3d6b3d' },
    // India
    { points: [[1200,320],[1240,310],[1270,340],[1260,400],[1230,440],[1200,420],[1190,370]], color: '#4a7540' },
    // Southeast Asia / Indonesia
    { points: [[1350,340],[1400,330],[1440,350],[1460,380],[1440,400],[1400,390],[1360,370]], color: '#3a6838' },
    // Australia
    { points: [[1450,480],[1520,470],[1580,490],[1600,530],[1590,570],[1550,590],[1490,580],[1460,550],[1450,510]], color: '#7a6830' },
    // Greenland
    { points: [[560,100],[620,90],[670,100],[680,140],[660,170],[610,170],[570,150],[560,120]], color: '#d8dce0' },
    // Antarctica
    { points: [[100,900],[400,890],[700,895],[1000,890],[1300,895],[1600,890],[1900,900],[1900,1024],[100,1024]], color: '#e0e8f0' },
    // Arctic
    { points: [[800,0],[1200,0],[1400,20],[1200,50],[800,40],[600,20]], color: '#dde5ed' },
    // Japan/Korea
    { points: [[1480,220],[1500,210],[1510,240],[1500,270],[1485,260]], color: '#4a7a4a' },
    // UK/Ireland
    { points: [[880,180],[900,175],[910,195],[900,210],[885,205]], color: '#4a7a50' },
    // Madagascar
    { points: [[1060,500],[1075,490],[1080,530],[1070,550],[1058,530]], color: '#4a7540' },
    // New Zealand
    { points: [[1650,560],[1665,550],[1670,580],[1660,600],[1648,585]], color: '#3a6838' },
  ];

  continents.forEach(cont => {
    ctx.fillStyle = cont.color;
    ctx.beginPath();
    // Draw with slight organic noise for natural coastlines
    cont.points.forEach((p, i) => {
      const nx = p[0] + (Math.random() - 0.5) * 8;
      const ny = p[1] + (Math.random() - 0.5) * 6;
      if (i === 0) ctx.moveTo(nx, ny);
      else {
        // Use quadratic curves for smoother coastlines
        const prev = cont.points[i - 1];
        const cpx = (prev[0] + nx) / 2 + (Math.random() - 0.5) * 15;
        const cpy = (prev[1] + ny) / 2 + (Math.random() - 0.5) * 10;
        ctx.quadraticCurveTo(cpx, cpy, nx, ny);
      }
    });
    ctx.closePath();
    ctx.fill();

    // Add terrain variation within continents
    ctx.save();
    ctx.clip();
    for (let k = 0; k < 30; k++) {
      const shade = Math.random() > 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
      ctx.fillStyle = shade;
      ctx.beginPath();
      const rx = cont.points[0][0] + (Math.random() - 0.3) * 200;
      const ry = cont.points[0][1] + (Math.random() - 0.3) * 200;
      ctx.ellipse(rx, ry, 10 + Math.random() * 40, 8 + Math.random() * 25, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Mountain ranges (darker streaks)
    if (cont.points.length > 5 && Math.random() > 0.3) {
      ctx.strokeStyle = 'rgba(30,50,30,0.15)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const start = cont.points[Math.floor(Math.random() * cont.points.length)];
      const end = cont.points[Math.floor(Math.random() * cont.points.length)];
      ctx.moveTo(start[0], start[1]);
      ctx.quadraticCurveTo(
        (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 30,
        (start[1] + end[1]) / 2 + (Math.random() - 0.5) * 20,
        end[0], end[1]
      );
      ctx.stroke();
    }
  });

  // Desert regions
  const deserts = [
    { x: 920, y: 320, w: 120, h: 60 },  // Sahara
    { x: 1150, y: 300, w: 80, h: 50 },   // Arabian
    { x: 1480, y: 510, w: 80, h: 40 },   // Australian Outback
  ];
  deserts.forEach(d => {
    ctx.fillStyle = 'rgba(180,150,80,0.25)';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.w, d.h, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Cloud layer with realistic patterns
  for (let i = 0; i < 200; i++) {
    const alpha = 0.06 + Math.random() * 0.18;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    const cx = Math.random() * 2048;
    const cy = Math.random() * 1024;
    ctx.beginPath();
    // Elongated cloud wisps
    ctx.ellipse(cx, cy, 15 + Math.random() * 80, 5 + Math.random() * 20,
      Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tropical storm patterns (spiral clouds)
  for (let s = 0; s < 3; s++) {
    const sx = 200 + Math.random() * 1600;
    const sy = 350 + Math.random() * 300;
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 2;
      const r = 15 + a * 3;
      ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.06})`;
      ctx.beginPath();
      ctx.ellipse(sx + Math.cos(angle) * r, sy + Math.sin(angle) * r,
        8 + Math.random() * 15, 4 + Math.random() * 8, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const earthTex = new THREE.CanvasTexture(earthCanvas);
  const earthMat = new THREE.MeshPhongMaterial({
    map: earthTex,
    specular: new THREE.Color(0x222244),
    shininess: 20,
    bumpScale: 0.5,
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  group.add(earthMesh);

  // Atmosphere glow (improved shader)
  const atmosGeo = new THREE.SphereGeometry(radius * 1.015, 64, 64);
  const atmosMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
    uniforms: {
      glowColor: { value: new THREE.Color(0x4488ff) },
      viewVector: { value: new THREE.Vector3(0, 0, 1) }
    },
    vertexShader: `
      varying float intensity;
      uniform vec3 viewVector;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.65 - dot(vNormal, vNormel), 3.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying float intensity;
      void main() {
        vec3 glow = glowColor * intensity;
        gl_FragColor = vec4(glow, intensity * 0.55);
      }
    `
  });
  const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  group.add(atmosMesh);

  // Outer atmosphere haze
  const hazeGeo = new THREE.SphereGeometry(radius * 1.04, 32, 32);
  const hazeMat = new THREE.MeshBasicMaterial({
    color: 0x3366aa, transparent: true, opacity: 0.04,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide
  });
  group.add(new THREE.Mesh(hazeGeo, hazeMat));

  group.userData.earthMesh = earthMesh;
  group.userData.atmosMesh = atmosMesh;
  group.userData.atmosMat = atmosMat;

  return group;
}

export function createDetailedEarth(radius = 50) {
  const earth = createEarth(radius);

  // Night-side city lights
  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = 2048;
  nightCanvas.height = 1024;
  const nctx = nightCanvas.getContext('2d');
  nctx.fillStyle = '#000';
  nctx.fillRect(0, 0, 2048, 1024);

  // Major city light clusters (based on real population centers)
  const cityRegions = [
    // North America
    { x: 310, y: 240, density: 70, spread: 100 },  // East Coast USA
    { x: 250, y: 260, density: 40, spread: 60 },   // Midwest
    { x: 200, y: 250, density: 50, spread: 50 },   // West Coast
    // Europe
    { x: 920, y: 210, density: 90, spread: 80 },   // Western Europe
    { x: 980, y: 200, density: 60, spread: 70 },   // Central Europe
    { x: 1040, y: 200, density: 40, spread: 50 },  // Eastern Europe
    // Asia
    { x: 1200, y: 250, density: 50, spread: 80 },  // Middle East
    { x: 1300, y: 280, density: 80, spread: 100 },  // India
    { x: 1420, y: 230, density: 100, spread: 90 },  // China coast
    { x: 1490, y: 240, density: 70, spread: 40 },   // Japan
    { x: 1400, y: 280, density: 50, spread: 60 },   // SE Asia
    // South America
    { x: 430, y: 550, density: 40, spread: 50 },    // Brazil coast
    // Africa
    { x: 960, y: 370, density: 25, spread: 40 },    // West Africa
    { x: 1020, y: 500, density: 20, spread: 30 },   // South Africa
    // Australia
    { x: 1530, y: 540, density: 30, spread: 40 },   // SE Australia
  ];

  cityRegions.forEach(region => {
    for (let i = 0; i < region.density; i++) {
      const x = region.x + (Math.random() - 0.5) * region.spread;
      const y = region.y + (Math.random() - 0.5) * region.spread * 0.6;
      const brightness = 0.4 + Math.random() * 0.6;
      // Warm city light colors
      const r = 255;
      const g = 180 + Math.floor(Math.random() * 50);
      const b = 80 + Math.floor(Math.random() * 40);
      nctx.fillStyle = `rgba(${r},${g},${b},${brightness})`;
      const size = 1 + Math.random() * 2.5;
      nctx.fillRect(x, y, size, size);
    }
  });

  const nightTex = new THREE.CanvasTexture(nightCanvas);
  earth.userData.earthMesh.material.emissiveMap = nightTex;
  earth.userData.earthMesh.material.emissive = new THREE.Color(0xffcc66);
  earth.userData.earthMesh.material.emissiveIntensity = 0.25;

  return earth;
}
