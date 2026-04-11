import * as THREE from 'three';
import { createSpacecraft } from '../objects/Rocket.js';

export class LandingScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.spacecraft = null;
    this.time = 0;
    this.altitude = 10000; // meters
    this.verticalSpeed = -230; // m/s realistic drogue speed
    this.phase = 'drogue'; // drogue, main, final, retro, splashdown, recovery
    this.parachutes = [];
    this.drogueChutes = [];
    this.landed = false;
    this.mode = 'story';
    this.swayAngle = 0;
    this.windEffect = 0;
    this.splashParticles = null;
    this.recoveryHelicopters = [];
    this.dyeMarkerActive = false;
    this.retroFired = false;
    this.retroParticles = null;
    this.divers = [];
    this.missionStartTime = Date.now();
    this.bobbingPhase = 0;
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();

    // Reset arrays
    this.parachutes = [];
    this.drogueChutes = [];
    this.recoveryHelicopters = [];
    this.divers = [];

    // Sky gradient (atmospheric, getting bluer as we descend)
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 2;
    skyCanvas.height = 512;
    const sctx = skyCanvas.getContext('2d');
    const grad = sctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#1a3a6e');
    grad.addColorStop(0.2, '#2a5aaa');
    grad.addColorStop(0.4, '#3a7bd5');
    grad.addColorStop(0.6, '#5b9ce6');
    grad.addColorStop(0.8, '#87ceeb');
    grad.addColorStop(1, '#b0d4f1');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 2, 512);
    this.scene.background = new THREE.CanvasTexture(skyCanvas);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50000);
    this.camera.position.set(12, 8, 18);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
    sunLight.position.set(50, 100, 30);
    this.scene.add(sunLight);
    this.scene.add(new THREE.AmbientLight(0x88aacc, 0.5));
    this.scene.add(new THREE.HemisphereLight(0x88bbff, 0x446688, 0.3));

    // Ocean (larger, more detailed waves)
    const oceanGeo = new THREE.PlaneGeometry(10000, 10000, 150, 150);
    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0x006994,
      specular: 0x4488aa,
      shininess: 60,
      transparent: true,
      opacity: 0.9
    });
    const positions = oceanGeo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] = Math.sin(positions[i] * 0.05) * Math.cos(positions[i + 1] * 0.05) * 2;
    }
    oceanGeo.computeVertexNormals();
    this.ocean = new THREE.Mesh(oceanGeo, oceanMat);
    this.ocean.rotation.x = -Math.PI / 2;
    this.ocean.position.y = -5;
    this.scene.add(this.ocean);

    // Spacecraft capsule (scaled, no solar panels)
    this.spacecraft = createSpacecraft();
    this.spacecraft.scale.setScalar(1.8);
    this.spacecraft.position.set(0, 50, 0);
    if (this.spacecraft.userData.solarPanels) {
      this.spacecraft.userData.solarPanels.forEach(p => { p.visible = false; });
    }
    this.scene.add(this.spacecraft);

    // Create drogue chutes (smaller, 2 of them)
    this._createDrogueChutes();

    // Main parachutes (created but initially small/hidden)
    this._createMainParachutes();

    // Clouds at various altitudes
    this._createClouds();

    // Recovery fleet
    this._createRecoveryFleet();

    // Splash effect particles (hidden until splashdown)
    this.splashParticles = this._createSplashParticles();
    this.splashParticles.visible = false;
    this.scene.add(this.splashParticles);

    // Retro rocket particles (hidden until final phase)
    this.retroParticles = this._createRetroParticles();
    this.retroParticles.visible = false;
    this.scene.add(this.retroParticles);

    // State
    this.altitude = 10000;
    this.verticalSpeed = -230; // realistic drogue speed
    this.phase = 'drogue';
    this.landed = false;
    this.time = 0;
    this.swayAngle = 0;
    this.retroFired = false;
    this.dyeMarkerActive = false;
    this.bobbingPhase = 0;

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('مظلات الكبح', 'Drogue Chutes — إبطاء السرعة', 2500);
    this.gs.ui.showObjective('الهبوط بسلام في المحيط الهادئ');

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم — هيوستن', 'مظلات الكبح مفتوحة بنجاح! السرعة تنخفض من 230 م/ث إلى 80 م/ث. فتح المظلات الرئيسية على ارتفاع 3 كم.', 6000);
    }, 3000);

    // Show chat button during landing
    this.gs.ui.showChatButton();
  }

  _createDrogueChutes() {
    const colors = [0xff6600, 0xffffff];
    colors.forEach((color, i) => {
      const chuteGeo = new THREE.ConeGeometry(2, 3.5, 12, 1, true);
      const chuteMat = new THREE.MeshPhongMaterial({
        color, side: THREE.DoubleSide, transparent: true, opacity: 0.8
      });
      const chute = new THREE.Mesh(chuteGeo, chuteMat);
      const angle = (i / 2) * Math.PI * 2;
      chute.position.set(Math.cos(angle) * 1.5, 60, Math.sin(angle) * 1.5);
      chute.rotation.x = Math.PI;
      this.scene.add(chute);
      this.drogueChutes.push(chute);

      // Drogue suspension lines
      for (let j = 0; j < 6; j++) {
        const lineAngle = (j / 6) * Math.PI * 2;
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(lineAngle) * 1.8, 3.5, Math.sin(lineAngle) * 1.8),
          new THREE.Vector3(0, -2, 0)
        ]);
        const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x444444 }));
        line.position.copy(chute.position);
        this.scene.add(line);
        chute.userData.lines = chute.userData.lines || [];
        chute.userData.lines.push(line);
      }
    });
  }

  _createMainParachutes() {
    const chuteColors = [0xff4444, 0xffffff, 0xff4444];
    chuteColors.forEach((color, i) => {
      const chuteGeo = new THREE.ConeGeometry(5, 7, 20, 1, true);
      const chuteMat = new THREE.MeshPhongMaterial({
        color, side: THREE.DoubleSide, transparent: true, opacity: 0
      });
      const chute = new THREE.Mesh(chuteGeo, chuteMat);
      const angle = (i / 3) * Math.PI * 2;
      chute.position.set(Math.cos(angle) * 4, 65, Math.sin(angle) * 4);
      chute.rotation.x = Math.PI;
      chute.scale.setScalar(0.1); // Start tiny
      this.scene.add(chute);
      this.parachutes.push(chute);

      // Main chute suspension lines (more of them for realism)
      for (let j = 0; j < 12; j++) {
        const lineAngle = (j / 12) * Math.PI * 2;
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(lineAngle) * 4.5, 7, Math.sin(lineAngle) * 4.5),
          new THREE.Vector3(0, -4, 0)
        ]);
        const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0 }));
        line.position.copy(chute.position);
        this.scene.add(line);
        chute.userData.lines = chute.userData.lines || [];
        chute.userData.lines.push(line);
      }
    });
  }

  _createClouds() {
    for (let i = 0; i < 40; i++) {
      const cloudGeo = new THREE.SphereGeometry(25 + Math.random() * 50, 8, 8);
      const cloudMat = new THREE.MeshPhongMaterial({
        color: 0xffffff, transparent: true, opacity: 0.3 + Math.random() * 0.3
      });
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 3000,
        15 + Math.random() * 35,
        (Math.random() - 0.5) * 3000
      );
      cloud.scale.set(1 + Math.random(), 0.3, 1 + Math.random());
      this.scene.add(cloud);
    }
  }

  _createRecoveryFleet() {
    // USS recovery ships (3 ships at different distances)
    for (let i = 0; i < 3; i++) {
      const shipGroup = new THREE.Group();

      // Hull
      const hullGeo = new THREE.BoxGeometry(4, 1.2, 10);
      const hullMat = new THREE.MeshPhongMaterial({ color: 0x445566 });
      shipGroup.add(new THREE.Mesh(hullGeo, hullMat));

      // Deck
      const deckGeo = new THREE.BoxGeometry(4.5, 0.2, 11);
      const deckMat = new THREE.MeshPhongMaterial({ color: 0x667788 });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.position.y = 0.7;
      shipGroup.add(deck);

      // Bridge
      const bridgeGeo = new THREE.BoxGeometry(2.5, 2, 2.5);
      const bridge = new THREE.Mesh(bridgeGeo, new THREE.MeshPhongMaterial({ color: 0x778899 }));
      bridge.position.set(0, 1.8, -3);
      shipGroup.add(bridge);

      // Crane on main ship (for capsule recovery)
      if (i === 0) {
        const craneGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 6);
        const crane = new THREE.Mesh(craneGeo, new THREE.MeshPhongMaterial({ color: 0xcc8800 }));
        crane.position.set(-1, 3.5, 2);
        shipGroup.add(crane);
        const craneArmGeo = new THREE.BoxGeometry(0.15, 0.15, 5);
        const craneArm = new THREE.Mesh(craneArmGeo, new THREE.MeshPhongMaterial({ color: 0xcc8800 }));
        craneArm.position.set(-1, 6.5, 4);
        shipGroup.add(craneArm);

        // Helipad
        const helipadGeo = new THREE.CircleGeometry(2, 16);
        const helipadMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const helipad = new THREE.Mesh(helipadGeo, helipadMat);
        helipad.rotation.x = -Math.PI / 2;
        helipad.position.set(0, 0.8, 3);
        shipGroup.add(helipad);

        // H marking
        const hGeo = new THREE.PlaneGeometry(1, 0.2);
        const hMat = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        const h1 = new THREE.Mesh(hGeo, hMat);
        h1.rotation.x = -Math.PI / 2;
        h1.position.set(0, 0.81, 3);
        shipGroup.add(h1);

        // US flag on bridge
        const flagGeo = new THREE.PlaneGeometry(0.8, 0.5);
        const flagMat = new THREE.MeshBasicMaterial({ color: 0x0033aa, side: THREE.DoubleSide });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(0, 3.2, -3);
        shipGroup.add(flag);
      }

      const angle = (i / 3) * Math.PI * 2 + 0.5;
      const dist = 80 + i * 30;
      shipGroup.position.set(Math.cos(angle) * dist, -4.5, Math.sin(angle) * dist);
      shipGroup.rotation.y = angle + Math.PI;
      this.scene.add(shipGroup);
    }

    // Recovery helicopter
    const heli = this._createHelicopter();
    heli.position.set(60, 20, 40);
    this.scene.add(heli);
    this.recoveryHelicopters.push(heli);

    // Second helicopter
    const heli2 = this._createHelicopter();
    heli2.position.set(-50, 25, 30);
    this.scene.add(heli2);
    this.recoveryHelicopters.push(heli2);
  }

  _createHelicopter() {
    const group = new THREE.Group();
    // Body
    const bodyGeo = new THREE.BoxGeometry(1, 0.8, 3);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x445566 });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));
    // Cockpit
    const cockpitGeo = new THREE.SphereGeometry(0.6, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const cockpitMat = new THREE.MeshPhongMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5 });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.2, 1.2);
    group.add(cockpit);
    // Main rotor
    const rotorGeo = new THREE.BoxGeometry(6, 0.05, 0.3);
    const rotorMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.y = 0.8;
    rotor.userData.isRotor = true;
    group.add(rotor);
    // Second rotor blade
    const rotor2 = new THREE.Mesh(rotorGeo, rotorMat);
    rotor2.position.y = 0.8;
    rotor2.rotation.y = Math.PI / 2;
    rotor2.userData.isRotor = true;
    group.add(rotor2);
    // Tail boom
    const tailGeo = new THREE.CylinderGeometry(0.15, 0.1, 3, 6);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0, -2.5);
    tail.rotation.x = Math.PI / 2;
    group.add(tail);
    // Tail rotor
    const tailRotorGeo = new THREE.BoxGeometry(1.5, 0.03, 0.15);
    const tailRotor = new THREE.Mesh(tailRotorGeo, rotorMat);
    tailRotor.position.set(0, 0.3, -4);
    tailRotor.userData.isRotor = true;
    group.add(tailRotor);
    return group;
  }

  _createSplashParticles() {
    const count = 500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = -4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      velocities.push({
        x: (Math.random() - 0.5) * 12,
        y: 4 + Math.random() * 10,
        z: (Math.random() - 0.5) * 12
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.35, color: 0xaaddff, transparent: true, opacity: 0.8
    });
    const points = new THREE.Points(geo, mat);
    points.userData.velocities = velocities;
    return points;
  }

  _createRetroParticles() {
    const count = 200;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = -3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      // Orange/yellow flame colors
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.4 + Math.random() * 0.5;
      colors[i * 3 + 2] = Math.random() * 0.2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.5, vertexColors: true, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false
    });

    return new THREE.Points(geo, mat);
  }

  _createDivers() {
    // Create rescue divers in the water near capsule
    for (let i = 0; i < 4; i++) {
      const diverGroup = new THREE.Group();
      
      // Diver body (wetsuit)
      const bodyGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.5, 6);
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
      diverGroup.add(new THREE.Mesh(bodyGeo, bodyMat));

      // Head
      const headGeo = new THREE.SphereGeometry(0.1, 6, 6);
      const headMat = new THREE.MeshPhongMaterial({ color: 0xddbb88 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.35;
      diverGroup.add(head);

      // Mask
      const maskGeo = new THREE.BoxGeometry(0.12, 0.06, 0.08);
      const maskMat = new THREE.MeshPhongMaterial({ color: 0x222222, specular: 0x888888 });
      const mask = new THREE.Mesh(maskGeo, maskMat);
      mask.position.set(0, 0.35, -0.08);
      diverGroup.add(mask);

      // Arms
      [-1, 1].forEach(side => {
        const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 4);
        const arm = new THREE.Mesh(armGeo, bodyMat);
        arm.position.set(side * 0.15, 0.1, 0);
        arm.rotation.z = side * 0.5;
        diverGroup.add(arm);
      });

      const angle = (i / 4) * Math.PI * 2;
      const dist = 5 + Math.random() * 3;
      diverGroup.position.set(
        Math.cos(angle) * dist,
        -4.3,
        Math.sin(angle) * dist
      );
      diverGroup.visible = false;
      this.scene.add(diverGroup);
      this.divers.push(diverGroup);
    }
  }

  update(delta) {
    if (this.phase === 'recovery') {
      this.time += delta;
      this.bobbingPhase += delta;

      // Capsule bobbing in water
      this.spacecraft.position.y = -3.5 + Math.sin(this.bobbingPhase * 1.5) * 0.3;
      this.spacecraft.rotation.z = Math.sin(this.bobbingPhase * 0.8) * 0.05;
      this.spacecraft.rotation.x = Math.cos(this.bobbingPhase * 0.6) * 0.03;

      // Animate recovery helicopters
      this.recoveryHelicopters.forEach((heli, idx) => {
        heli.children.forEach(c => {
          if (c.userData.isRotor) c.rotation.y += delta * 25;
        });
        const targetPos = idx === 0
          ? new THREE.Vector3(5, 8, 5)
          : new THREE.Vector3(-8, 12, -5);
        heli.position.lerp(targetPos, delta * 0.3);
      });

      // Animate divers swimming toward capsule
      this.divers.forEach((diver, i) => {
        if (!diver.visible) return;
        const targetDist = 2 + i * 0.5;
        const angle = (i / 4) * Math.PI * 2 + this.time * 0.1;
        const targetPos = new THREE.Vector3(
          this.spacecraft.position.x + Math.cos(angle) * targetDist,
          -4.3 + Math.sin(this.time * 2 + i) * 0.1,
          this.spacecraft.position.z + Math.sin(angle) * targetDist
        );
        diver.position.lerp(targetPos, delta * 0.5);
        diver.rotation.y = angle + Math.PI;
      });

      // Gentle camera
      this.camera.position.lerp(new THREE.Vector3(15, 3, 20), delta * 0.5);
      this.camera.lookAt(this.spacecraft.position);
      // Ocean waves
      this._animateOcean(delta);
      return;
    }
    if (this.landed) return;
    this.time += delta;

    // Phase transitions
    if (this.altitude < 3000 && this.phase === 'drogue') {
      this.phase = 'main';
      this.gs.audio.playConfirm();
      this.gs.ui.showCenterText('فتح المظلات الرئيسية', '3 مظلات رئيسية — إبطاء إلى 7 م/ث', 3000);
      this.gs.ui.showComm('مركز التحكم — هيوستن', 'المظلات الرئيسية الثلاث مفتوحة بنجاح! انفصال مظلات الكبح. السرعة تنخفض إلى 7 م/ث. الكبسولة مستقرة.', 5000);

      // Hide drogue chutes
      this.drogueChutes.forEach(d => {
        d.visible = false;
        if (d.userData.lines) d.userData.lines.forEach(l => l.visible = false);
      });

      // Deploy main chutes (animate opening)
      this.parachutes.forEach(p => {
        p.material.opacity = 0.9;
        if (p.userData.lines) p.userData.lines.forEach(l => l.material.opacity = 0.6);
      });

      this.verticalSpeed = -25; // main chutes slow to ~25 m/s initially
    }

    if (this.altitude < 300 && this.phase === 'main') {
      this.phase = 'final';
      this.verticalSpeed = -8; // final approach speed
      this.gs.ui.showComm('مركز التحكم — هيوستن', 'الارتفاع أقل من 300 متر! استعد للاصطدام بالماء. إطلاق 6 صواريخ هبوط ناعم على ارتفاع متر واحد فوق السطح.', 5000);
    }

    // Descent with gradual deceleration
    if (this.phase === 'main') {
      // Gradually slow down as main chutes fully inflate, clamp at -8 m/s
      this.verticalSpeed += delta * 3;
      if (this.verticalSpeed > -8) this.verticalSpeed = -8;
    }
    this.altitude += this.verticalSpeed * delta;
    const displayAlt = Math.max(0, Math.round(this.altitude));

    // Main parachute opening animation
    if (this.phase === 'main' || this.phase === 'final') {
      this.parachutes.forEach(p => {
        const targetScale = 1.8;
        p.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);
      });
    }

    // Capsule position
    const capsuleY = Math.max(-4, this.altitude * 0.005);
    this.spacecraft.position.y = capsuleY;

    // Swaying motion (more pronounced under main chutes)
    this.swayAngle += delta * (this.phase === 'main' ? 1.8 : 1.2);
    this.spacecraft.rotation.z = Math.sin(this.swayAngle) * (this.phase === 'drogue' ? 0.08 : 0.04);
    this.spacecraft.rotation.x = Math.cos(this.swayAngle * 0.7) * 0.03;
    this.spacecraft.position.x = Math.sin(this.swayAngle * 0.3) * (this.phase === 'drogue' ? 3 : 1.5);

    // Drogue chutes follow
    this.drogueChutes.forEach((d, i) => {
      if (!d.visible) return;
      const angle = (i / 2) * Math.PI * 2 + this.swayAngle * 0.3;
      d.position.set(
        this.spacecraft.position.x + Math.cos(angle) * 1.5,
        capsuleY + 8,
        Math.sin(angle) * 1.5
      );
      d.rotation.z = Math.sin(this.swayAngle + i) * 0.1;
      if (d.userData.lines) {
        d.userData.lines.forEach(line => line.position.copy(d.position));
      }
    });

    // Main parachutes follow
    this.parachutes.forEach((p, i) => {
      const angle = (i / 3) * Math.PI * 2 + this.swayAngle * 0.15;
      p.position.set(
        this.spacecraft.position.x + Math.cos(angle) * 4,
        capsuleY + 14,
        Math.sin(angle) * 4
      );
      p.rotation.z = Math.sin(this.swayAngle + i * 2) * 0.06;
      if (p.userData.lines) {
        p.userData.lines.forEach(line => line.position.copy(p.position));
      }
    });

    // Camera
    const camRadius = this.phase === 'final' ? 8 : 12;
    const camHeight = this.phase === 'final' ? 3 : 6;
    this.camera.position.set(
      camRadius + Math.sin(this.time * 0.15) * 2,
      capsuleY + camHeight,
      camRadius + Math.cos(this.time * 0.12) * 2
    );
    this.camera.lookAt(this.spacecraft.position);

    // Helicopter rotor animation
    this.recoveryHelicopters.forEach((heli, idx) => {
      heli.children.forEach(c => {
        if (c.userData.isRotor) c.rotation.y += delta * 20;
      });
      // Helicopter circles near landing zone
      if (this.altitude < 2000) {
        const hAngle = this.time * 0.3 + idx * Math.PI;
        const dist = 35 + idx * 15;
        heli.position.set(
          Math.cos(hAngle) * dist,
          12 + Math.sin(this.time + idx) * 3 + idx * 5,
          Math.sin(hAngle) * dist
        );
        heli.rotation.y = hAngle + Math.PI / 2;
      }
    });

    // Ocean wave animation
    this._animateOcean(delta);

    // Retro-rockets at 1 meter (like real Soyuz — 6 soft-landing engines)
    if (this.altitude <= 5 && !this.retroFired && this.phase === 'final') {
      this.retroFired = true;
      this.verticalSpeed = -1.5; // Retro rockets cushion to 1.5 m/s like real Soyuz
      this.gs.audio.playConfirm();
      this.gs.ui.showCenterText('صواريخ الهبوط الناعم', '6 محركات — إبطاء إلى 1.5 م/ث', 2000);
      this.gs.ui.showComm('مركز التحكم — هيوستن', 'صواريخ الهبوط الناعم أُطلقت! 6 محركات صلبة أبطأت السرعة إلى 5 كم/ساعة. استعد للاصطدام!', 3000);

      // Show retro rocket effect
      this.retroParticles.visible = true;
      this.retroParticles.position.copy(this.spacecraft.position);
      this.retroParticles.position.y -= 2;

      // Retro rocket light
      this.retroLight = new THREE.PointLight(0xff6600, 5, 15);
      this.retroLight.position.copy(this.spacecraft.position);
      this.retroLight.position.y -= 3;
      this.scene.add(this.retroLight);
    }

    // Animate retro particles
    if (this.retroParticles.visible) {
      const pos = this.retroParticles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += (Math.random() - 0.5) * 0.3;
        pos[i + 1] -= delta * (8 + Math.random() * 5);
        pos[i + 2] += (Math.random() - 0.5) * 0.3;
        if (pos[i + 1] < -8) {
          pos[i] = this.spacecraft.position.x + (Math.random() - 0.5) * 1.5;
          pos[i + 1] = this.spacecraft.position.y - 2;
          pos[i + 2] = this.spacecraft.position.z + (Math.random() - 0.5) * 1.5;
        }
      }
      this.retroParticles.geometry.attributes.position.needsUpdate = true;
      this.retroParticles.position.set(0, 0, 0); // particles use world coords now
    }

    // HUD
    this.gs.ui.showHUD({
      speed: Math.round(Math.abs(this.verticalSpeed)),
      altitude: displayAlt
    });

    // Phase indicator
    this.gs.ui.removeElement('landing-phase');
    const phaseText = {
      drogue: '🪂 مظلات الكبح — 2 مظلات',
      main: '🪂🪂🪂 المظلات الرئيسية — 3 مظلات',
      final: '⚡ الهبوط النهائي',
    }[this.phase] || '';
    if (phaseText) {
      this.gs.ui.addElement('landing-phase', `
        <div style="position:fixed;top:70px;right:15px;background:rgba(0,15,30,0.85);
          border:1px solid rgba(0,212,255,0.2);border-radius:8px;padding:10px 15px;direction:rtl;">
          <div style="color:#00d4ff;font-size:0.85rem;">${phaseText}</div>
          <div style="color:#88aabb;font-size:0.7rem;">السرعة: ${Math.abs(this.verticalSpeed).toFixed(1)} م/ث</div>
          <div style="color:#88aabb;font-size:0.7rem;">الارتفاع: ${displayAlt} م</div>
          ${this.retroFired ? '<div style="color:#ff8800;font-size:0.7rem;animation:pulse 0.5s infinite;">🔥 صواريخ الكبح — نشطة</div>' : ''}
        </div>
      `);
    }

    // Splashdown
    if (this.altitude <= 0) {
      this.landed = true;
      this.altitude = 0;
      this.spacecraft.position.y = -3.5;
      this.gs.audio.playSuccess();

      // Hide retro effects
      this.retroParticles.visible = false;
      if (this.retroLight) this.retroLight.intensity = 0;

      // Splash effect
      this.splashParticles.visible = true;
      this.splashParticles.position.copy(this.spacecraft.position);

      // Dye marker (green dye in water)
      this.dyeMarkerActive = true;
      const dyeGeo = new THREE.CircleGeometry(8, 24);
      const dyeMat = new THREE.MeshBasicMaterial({
        color: 0x00ff44, transparent: true, opacity: 0.3, side: THREE.DoubleSide
      });
      const dye = new THREE.Mesh(dyeGeo, dyeMat);
      dye.rotation.x = -Math.PI / 2;
      dye.position.set(this.spacecraft.position.x, -4.9, this.spacecraft.position.z);
      this.scene.add(dye);

      // Create rescue divers
      this._createDivers();

      // Hide parachutes (collapsed in water)
      setTimeout(() => {
        this.parachutes.forEach(p => {
          p.scale.setScalar(0.5);
          p.position.y = -4;
          p.material.opacity = 0.4;
        });
      }, 2000);

      this._showLandingSequence();
    }
  }

  _animateOcean(delta) {
    if (!this.ocean) return;
    const pos = this.ocean.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] = Math.sin(pos[i] * 0.05 + this.time) * Math.cos(pos[i + 1] * 0.05 + this.time * 0.7) * 1.5
        + Math.sin(pos[i] * 0.02 + this.time * 0.3) * 0.8;
    }
    this.ocean.geometry.attributes.position.needsUpdate = true;
    this.ocean.geometry.computeVertexNormals();
  }

  _showLandingSequence() {
    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('هبوط ناجح!', 'Splashdown — المحيط الهادئ', 0);

    // Sequence of realistic recovery messages
    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم — هيوستن', 'هيوستن تؤكد: هبوط ناجح! الكبسولة مستقرة في وضع عمودي. إشارة البيكون نشطة. سفن الإنقاذ USS تتجه إليك.', 7000);
    }, 2000);

    setTimeout(() => {
      // Show divers
      this.divers.forEach(d => { d.visible = true; });
      this.gs.ui.showComm('قائد فريق الإنقاذ', 'فريق الغطاسين البحرية في الماء! نقترب من الكبسولة. تأمين طوق الطفو حول الكبسولة.', 6000);
    }, 8000);

    setTimeout(() => {
      this.gs.ui.showComm('سفينة الإنقاذ USS', 'الرافعة جاهزة لسحب الكبسولة. فتح الفتحة خلال دقائق. الفريق الطبي على أهبة الاستعداد.', 6000);
    }, 14000);

    setTimeout(() => {
      this.gs.ui.showComm('وكالة ناسا — مدير المهمة', 'مبروك يا رائد الفضاء! مهمة ناجحة بالكامل. أنت بطل! فريق الاستقبال الطبي جاهز على سطح السفينة. أحسنت!', 8000);
    }, 20000);

    // Start recovery phase
    setTimeout(() => {
      this.phase = 'recovery';
    }, 5000);

    // Show professional game ending after recovery sequence
    setTimeout(() => {
      const missionDuration = Math.round((Date.now() - this.missionStartTime) / 60000);
      this.gs.ui.showGameEnding({
        missionTime: missionDuration > 0 ? `${missionDuration} دقيقة` : '4 ساعات و 23 دقيقة',
        maxAltitude: '408 كم',
        maxSpeed: '27,576 كم/ساعة',
        maxGForce: '4.2G',
        maxHeat: '1,600°C',
        experiments: 3,
        evaTime: '45 دقيقة'
      });

      setTimeout(() => {
        document.getElementById('btn-new-mission')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('preLaunch', { mode: 'story' });
        });
        document.getElementById('btn-free-mode')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('preLaunch', { mode: 'free' });
        });
        document.getElementById('btn-main-menu')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('mainMenu');
        });
      }, 100);
    }, 28000);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    this.gs.ui.clear();
  }
}
