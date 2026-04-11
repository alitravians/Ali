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
    this.verticalSpeed = -80; // m/s (after drogue)
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
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();

    // Reset arrays
    this.parachutes = [];
    this.drogueChutes = [];
    this.recoveryHelicopters = [];

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

    // State
    this.altitude = 10000;
    this.verticalSpeed = -80;
    this.phase = 'drogue';
    this.landed = false;
    this.time = 0;
    this.swayAngle = 0;
    this.retroFired = false;
    this.dyeMarkerActive = false;

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('مظلات الكبح', 'Drogue Chutes — إبطاء السرعة', 2500);
    this.gs.ui.showObjective('الهبوط بسلام في المحيط الهادئ');

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'مظلات الكبح مفتوحة بنجاح! السرعة تنخفض من 230 م/ث إلى 80 م/ث. فتح المظلات الرئيسية على ارتفاع 3 كم.', 6000);
    }, 3000);
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
    // USS recovery ship
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

      // Crane on deck (for capsule recovery)
      if (i === 0) {
        const craneGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 6);
        const crane = new THREE.Mesh(craneGeo, new THREE.MeshPhongMaterial({ color: 0xcc8800 }));
        crane.position.set(-1, 3.5, 2);
        shipGroup.add(crane);
        const craneArmGeo = new THREE.BoxGeometry(0.15, 0.15, 5);
        const craneArm = new THREE.Mesh(craneArmGeo, new THREE.MeshPhongMaterial({ color: 0xcc8800 }));
        craneArm.position.set(-1, 6.5, 4);
        shipGroup.add(craneArm);
      }

      // Helipad on main ship
      if (i === 0) {
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
    // Tail boom
    const tailGeo = new THREE.CylinderGeometry(0.15, 0.1, 3, 6);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0, -2.5);
    tail.rotation.x = Math.PI / 2;
    group.add(tail);
    return group;
  }

  _createSplashParticles() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = -4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      velocities.push({
        x: (Math.random() - 0.5) * 8,
        y: 3 + Math.random() * 8,
        z: (Math.random() - 0.5) * 8
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.3, color: 0xaaddff, transparent: true, opacity: 0.7
    });
    const points = new THREE.Points(geo, mat);
    points.userData.velocities = velocities;
    return points;
  }

  update(delta) {
    if (this.phase === 'recovery') {
      this.time += delta;
      // Animate recovery helicopters
      this.recoveryHelicopters.forEach(heli => {
        heli.children.forEach(c => {
          if (c.userData.isRotor) c.rotation.y += delta * 20;
        });
        heli.position.lerp(new THREE.Vector3(5, 8, 5), delta * 0.3);
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
      this.gs.ui.showComm('مركز التحكم', 'المظلات الرئيسية الثلاث مفتوحة بنجاح! انفصال مظلات الكبح. السرعة تنخفض إلى 7 م/ث.', 5000);

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

      this.verticalSpeed = -15;
    }

    if (this.altitude < 300 && this.phase === 'main') {
      this.phase = 'final';
      this.verticalSpeed = -7;
      this.gs.ui.showComm('مركز التحكم', 'الارتفاع أقل من 300 متر! استعد للاصطدام بالماء. إطلاق صواريخ الكبح على ارتفاع متر واحد.', 5000);
    }

    // Descent
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
    this.recoveryHelicopters.forEach(heli => {
      heli.children.forEach(c => {
        if (c.userData.isRotor) c.rotation.y += delta * 15;
      });
      // Helicopter circles near landing zone
      if (this.altitude < 2000) {
        const hAngle = this.time * 0.3;
        heli.position.set(
          Math.cos(hAngle) * 40,
          15 + Math.sin(this.time) * 2,
          Math.sin(hAngle) * 40
        );
        heli.rotation.y = hAngle + Math.PI / 2;
      }
    });

    // Ocean wave animation
    this._animateOcean(delta);

    // Retro-rockets at 1 meter (like real Soyuz)
    if (this.altitude <= 5 && !this.retroFired && this.phase === 'final') {
      this.retroFired = true;
      this.verticalSpeed = -1.5; // Retro rockets slow to 1.5 m/s
      this.gs.audio.playConfirm();
      this.gs.ui.showCenterText('🔥 صواريخ الكبح', 'Soft Landing Engines — إبطاء إلى 1.5 م/ث', 2000);
    }

    // HUD
    this.gs.ui.showHUD({
      speed: Math.round(Math.abs(this.verticalSpeed)),
      altitude: displayAlt
    });

    // Phase indicator
    this.gs.ui.removeElement('landing-phase');
    const phaseText = {
      drogue: '🪂 مظلات الكبح',
      main: '🪂🪂🪂 المظلات الرئيسية',
      final: '⚡ الهبوط النهائي',
    }[this.phase] || '';
    if (phaseText) {
      this.gs.ui.addElement('landing-phase', `
        <div style="position:fixed;top:70px;right:15px;background:rgba(0,15,30,0.85);
          border:1px solid rgba(0,212,255,0.2);border-radius:8px;padding:10px 15px;direction:rtl;">
          <div style="color:#00d4ff;font-size:0.85rem;">${phaseText}</div>
          <div style="color:#88aabb;font-size:0.7rem;">السرعة: ${Math.abs(this.verticalSpeed).toFixed(1)} م/ث</div>
          <div style="color:#88aabb;font-size:0.7rem;">الارتفاع: ${displayAlt} م</div>
        </div>
      `);
    }

    // Splashdown
    if (this.altitude <= 0) {
      this.landed = true;
      this.altitude = 0;
      this.spacecraft.position.y = -3.5;
      this.gs.audio.playSuccess();

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

      // Hide parachutes (collapsed in water)
      setTimeout(() => {
        this.parachutes.forEach(p => {
          p.scale.setScalar(0.5);
          p.position.y = -4;
          p.material.opacity = 0.4;
        });
      }, 2000);

      this._showLandingComplete();
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

  _showLandingComplete() {
    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('هبوط ناجح!', 'Splashdown — المحيط الهادئ', 0);

    // Sequence of recovery messages
    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'هبوط ناجح! الكبسولة مستقرة في الماء. سفن الإنقاذ في طريقها إليك!', 6000);
    }, 2000);

    setTimeout(() => {
      this.gs.ui.showComm('سفينة الإنقاذ', 'نراك على الرادار! فريق الغطاسين جاهز. الوصول خلال 5 دقائق.', 5000);
    }, 8000);

    setTimeout(() => {
      this.gs.ui.showComm('وكالة ناسا', 'مبروك يا رائد الفضاء! مهمة ناجحة بالكامل. فريق الاستقبال الطبي بانتظارك على السفينة.', 8000);
    }, 14000);

    // Start recovery phase
    setTimeout(() => {
      this.phase = 'recovery';
    }, 5000);

    setTimeout(() => {
      this.gs.ui.addElement('landing-results', `
        <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
          background:rgba(0,15,30,0.92);border:1px solid rgba(0,212,255,0.3);border-radius:15px;
          padding:30px 40px;text-align:center;direction:rtl;backdrop-filter:blur(15px);max-width:500px;">
          <div style="font-size:2rem;margin-bottom:10px;">🏆</div>
          <div style="font-family:'Orbitron',sans-serif;color:#00d4ff;font-size:1.5rem;margin-bottom:15px;">
            المهمة مكتملة بنجاح!
          </div>
          <div style="color:#cceeff;font-size:0.9rem;line-height:2;margin-bottom:15px;">
            <div>🚀 إطلاق ناجح من مركز كينيدي</div>
            <div>🛸 ملاحة فضائية ومناورة مدارية</div>
            <div>🔗 التحام دقيق بمحطة الفضاء الدولية</div>
            <div>🔬 تنفيذ المهام العلمية والأبحاث</div>
            <div>🧑‍🚀 خروج ناجح إلى الفضاء (EVA)</div>
            <div>🔥 دخول الغلاف الجوي (1600°C)</div>
            <div>🪂 هبوط بالمظلات وصواريخ الكبح</div>
            <div>🌊 هبوط في المحيط الهادئ</div>
          </div>
          <div style="color:#88aabb;font-size:0.8rem;margin-bottom:15px;border-top:1px solid rgba(0,212,255,0.2);padding-top:12px;">
            <div>📋 التقرير: سيتم نقلك لسفينة الإنقاذ</div>
            <div>🏥 فحص طبي أولي على السفينة</div>
            <div>📸 مؤتمر صحفي في مركز جونسون الفضائي</div>
          </div>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button class="btn-space btn-space-primary" style="padding:10px 25px;" id="btn-new-mission">🚀 مهمة جديدة</button>
            <button class="btn-space" style="padding:10px 25px;" id="btn-main-menu">🏠 القائمة الرئيسية</button>
          </div>
        </div>
      `);

      setTimeout(() => {
        document.getElementById('btn-new-mission')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('preLaunch', { mode: 'story' });
        });
        document.getElementById('btn-main-menu')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('mainMenu');
        });
      }, 100);
    }, 18000);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    this.gs.ui.clear();
  }
}
