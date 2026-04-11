import * as THREE from 'three';
import { createRocket, createExhaustParticles } from '../objects/Rocket.js';
import { createDetailedEarth } from '../objects/Earth.js';
import { createStarField } from '../objects/Stars.js';

export class PreLaunchScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.rocket = null;
    this.phase = 'walking'; // walking, boarding, briefing, systems, countdown
    this.countdownValue = 10;
    this.countdownTimer = 0;
    this.time = 0;
    this.mode = 'story';
    this.astronaut = null;
    this.walkProgress = 0; // 0 to 1
    this.walkPath = [];
    this.boardingProgress = 0;
    this.cameraShake = 0;
    this.engineGlow = null;
    this.smokeParticles = [];
    this.launchPadLights = [];
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(25, 8, 30);
    this.camera.lookAt(0, 5, 0);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // Sky gradient - dawn/sunrise feel
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 2;
    skyCanvas.height = 512;
    const sctx = skyCanvas.getContext('2d');
    const skyGrad = sctx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0, '#000011');
    skyGrad.addColorStop(0.2, '#001133');
    skyGrad.addColorStop(0.4, '#003366');
    skyGrad.addColorStop(0.6, '#1a5276');
    skyGrad.addColorStop(0.75, '#d35400');
    skyGrad.addColorStop(0.85, '#ff6600');
    skyGrad.addColorStop(1, '#ff8833');
    sctx.fillStyle = skyGrad;
    sctx.fillRect(0, 0, 2, 512);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    this.scene.background = skyTex;

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    sunLight.position.set(50, 30, 20);
    sunLight.castShadow = true;
    this.scene.add(sunLight);
    this.scene.add(new THREE.AmbientLight(0x334455, 0.6));
    this.scene.add(new THREE.HemisphereLight(0x88aacc, 0x443322, 0.4));

    // Ground - concrete launch facility
    const groundGeo = new THREE.PlaneGeometry(400, 400, 20, 20);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x555544 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Concrete road from crew building to pad
    const roadGeo = new THREE.PlaneGeometry(6, 120);
    const roadMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 30);
    this.scene.add(road);

    // Road markings
    for (let z = -25; z <= 85; z += 6) {
      const markGeo = new THREE.PlaneGeometry(0.3, 3);
      const markMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const mark = new THREE.Mesh(markGeo, markMat);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 0.03, z);
      this.scene.add(mark);
    }

    // Launch pad - elevated concrete platform
    const padBaseGeo = new THREE.BoxGeometry(20, 2, 20);
    const padBaseMat = new THREE.MeshPhongMaterial({ color: 0x777766 });
    const padBase = new THREE.Mesh(padBaseGeo, padBaseMat);
    padBase.position.set(0, 1, -25);
    this.scene.add(padBase);

    // Launch pad surface
    const padTopGeo = new THREE.BoxGeometry(22, 0.3, 22);
    const padTopMat = new THREE.MeshPhongMaterial({ color: 0x888877 });
    const padTop = new THREE.Mesh(padTopGeo, padTopMat);
    padTop.position.set(0, 2.15, -25);
    this.scene.add(padTop);

    // Flame trench
    const trenchGeo = new THREE.BoxGeometry(6, 3, 15);
    const trenchMat = new THREE.MeshPhongMaterial({ color: 0x333322, side: THREE.BackSide });
    const trench = new THREE.Mesh(trenchGeo, trenchMat);
    trench.position.set(0, 0.5, -25);
    this.scene.add(trench);

    // Launch tower (taller, more detailed)
    const towerGeo = new THREE.BoxGeometry(2, 50, 2);
    const towerMat = new THREE.MeshPhongMaterial({ color: 0x994422 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(10, 25, -25);
    this.scene.add(tower);

    // Tower cross beams
    for (let y = 5; y < 50; y += 8) {
      const beamGeo = new THREE.BoxGeometry(10, 0.5, 0.5);
      const beam = new THREE.Mesh(beamGeo, towerMat);
      beam.position.set(5, y, -25);
      this.scene.add(beam);
    }

    // Swing arm (access to rocket at top)
    const swingArmGeo = new THREE.BoxGeometry(10, 1, 2);
    const swingArm = new THREE.Mesh(swingArmGeo, new THREE.MeshPhongMaterial({ color: 0x886633 }));
    swingArm.position.set(5, 35, -25);
    this.scene.add(swingArm);
    this.swingArm = swingArm;

    // Crew access arm (white, cleaner)
    const accessArmGeo = new THREE.BoxGeometry(8, 0.8, 1.5);
    const accessArmMat = new THREE.MeshPhongMaterial({ color: 0xddddcc });
    const accessArm = new THREE.Mesh(accessArmGeo, accessArmMat);
    accessArm.position.set(4, 32, -25);
    this.scene.add(accessArm);

    // Lightning protection towers
    const lightningGeo = new THREE.CylinderGeometry(0.2, 0.3, 60, 6);
    const lightningMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    [[-15, -15], [15, -15], [-15, -35], [15, -35]].forEach(([x, z]) => {
      const lt = new THREE.Mesh(lightningGeo, lightningMat);
      lt.position.set(x, 30, z);
      this.scene.add(lt);
    });

    // Launch pad warning lights (flashing red)
    const warnLightGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const warnLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    [[-10, 2.5, -15], [10, 2.5, -15], [-10, 2.5, -35], [10, 2.5, -35]].forEach(([x, y, z]) => {
      const wl = new THREE.Mesh(warnLightGeo, warnLightMat);
      wl.position.set(x, y, z);
      this.scene.add(wl);
      this.launchPadLights.push(wl);
    });

    // Rocket (on the launch pad)
    this.rocket = createRocket();
    this.rocket.position.set(0, 2.5, -25);
    this.rocket.scale.setScalar(1.3);
    this.scene.add(this.rocket);

    // Water deluge system pipes
    for (let side = -1; side <= 1; side += 2) {
      const pipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
      const pipeMat = new THREE.MeshPhongMaterial({ color: 0x4477aa });
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(side * 8, 7.5, -25);
      this.scene.add(pipe);
    }

    // Crew preparation building
    const buildingGeo = new THREE.BoxGeometry(15, 8, 12);
    const buildingMat = new THREE.MeshPhongMaterial({ color: 0xccccbb });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(0, 4, 75);
    this.scene.add(building);

    // Building door
    const doorGeo = new THREE.BoxGeometry(3, 4, 0.2);
    const doorMat = new THREE.MeshPhongMaterial({ color: 0x666655 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 2.5, 69);
    this.scene.add(door);

    // NASA logo on building (blue circle)
    const logoGeo = new THREE.CircleGeometry(2, 24);
    const logoMat = new THREE.MeshBasicMaterial({ color: 0x0033aa });
    const logo = new THREE.Mesh(logoGeo, logoMat);
    logo.position.set(0, 6, 68.9);
    this.scene.add(logo);

    // Transport vehicle (crew van)
    const vanGroup = new THREE.Group();
    const vanBodyGeo = new THREE.BoxGeometry(3, 2, 5);
    const vanBodyMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
    const vanBody = new THREE.Mesh(vanBodyGeo, vanBodyMat);
    vanBody.position.y = 1.5;
    vanGroup.add(vanBody);
    // Van wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    [[-1.2, 0.4, -1.8], [1.2, 0.4, -1.8], [-1.2, 0.4, 1.8], [1.2, 0.4, 1.8]].forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, y, z);
      wheel.rotation.z = Math.PI / 2;
      vanGroup.add(wheel);
    });
    vanGroup.position.set(5, 0, 60);
    this.scene.add(vanGroup);

    // Spectator area with barriers
    for (let z = 40; z <= 80; z += 5) {
      const barrierGeo = new THREE.BoxGeometry(0.2, 1, 0.2);
      const barrierMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.position.set(15, 0.5, z);
      this.scene.add(barrier);
    }

    // Flood lights on towers
    for (let i = 0; i < 6; i++) {
      const floodLight = new THREE.SpotLight(0xffffdd, 2, 80, Math.PI / 6, 0.5);
      const angle = (i / 6) * Math.PI * 2;
      floodLight.position.set(Math.cos(angle) * 30, 15, -25 + Math.sin(angle) * 30);
      floodLight.target.position.set(0, 10, -25);
      this.scene.add(floodLight);
      this.scene.add(floodLight.target);
    }

    // Background buildings (VAB, processing facilities)
    const vabGeo = new THREE.BoxGeometry(25, 40, 20);
    const vabMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
    const vab = new THREE.Mesh(vabGeo, vabMat);
    vab.position.set(-60, 20, 30);
    this.scene.add(vab);
    // VAB flag
    const flagGeo = new THREE.PlaneGeometry(8, 5);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0x0033aa, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(-47.4, 30, 30);
    flag.rotation.y = Math.PI / 2;
    this.scene.add(flag);

    // More background structures
    for (let i = 0; i < 6; i++) {
      const bgGeo = new THREE.BoxGeometry(8 + Math.random() * 10, 4 + Math.random() * 8, 8 + Math.random() * 10);
      const bgMat = new THREE.MeshPhongMaterial({ color: 0x444433 + Math.floor(Math.random() * 0x222222) });
      const bg = new THREE.Mesh(bgGeo, bgMat);
      const angle = (i / 6) * Math.PI * 2;
      bg.position.set(Math.cos(angle) * (60 + Math.random() * 30), bgGeo.parameters.height / 2, Math.sin(angle) * (60 + Math.random() * 30));
      this.scene.add(bg);
    }

    // Define walking path: from crew building to launch pad (Bezier-like points)
    // MUST be defined before _createAstronaut() since it uses walkPath[0]
    this.walkPath = [
      new THREE.Vector3(0, 0, 65),    // Start: crew building exit
      new THREE.Vector3(0, 0, 50),    // Walking down road
      new THREE.Vector3(0, 0, 35),    // Midpoint
      new THREE.Vector3(0, 0, 15),    // Approaching pad
      new THREE.Vector3(0, 0, 0),     // Near pad base
      new THREE.Vector3(0, 0, -10),   // At pad entrance
      new THREE.Vector3(2, 2.5, -20), // Climbing stairs
      new THREE.Vector3(2, 2.5, -25), // On pad
      new THREE.Vector3(0, 2.5, -25), // At rocket base
    ];

    // Create astronaut character (after walkPath is defined)
    this._createAstronaut();

    this.phase = 'walking';
    this.walkProgress = 0;
    this.boardingProgress = 0;
    this.time = 0;
    this._walkMsg1 = false;
    this._walkMsg2 = false;
    this._boardMsg1 = false;

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();

    // Show initial walking instruction
    this.gs.ui.showCenterText('مركز كينيدي للفضاء', 'يوم الإطلاق — التوجه إلى منصة الإطلاق', 4000);

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'صباح الخير يا رائد الفضاء! حان وقت التوجه إلى منصة الإطلاق. الصاروخ جاهز ومنتظرك.', 6000);
    }, 2000);

    this.gs.ui.showControls([
      { key: 'W/↑', action: 'المشي للأمام' },
      { key: 'تلقائي', action: 'التوجه للصاروخ' },
    ]);
  }

  _createAstronaut() {
    this.astronaut = new THREE.Group();

    // Orange ACES (Advanced Crew Escape Suit) — worn to the pad
    const suitColor = 0xff6600;
    const suitMat = new THREE.MeshPhongMaterial({ color: suitColor, specular: 0x884400, shininess: 30 });
    const darkMat = new THREE.MeshPhongMaterial({ color: 0x333333 });

    // Torso (upper body)
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.85, 12);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    this.astronaut.add(torso);

    // Collar / neck ring
    const neckRingGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 16);
    const neckRingMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, metalness: 0.8 });
    const neckRing = new THREE.Mesh(neckRingGeo, neckRingMat);
    neckRing.position.y = 0.42;
    neckRing.rotation.x = Math.PI / 2;
    this.astronaut.add(neckRing);

    // Helmet (white, polycarbonate)
    const helmetGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const helmetMat = new THREE.MeshPhongMaterial({ color: 0xf0f0f0, specular: 0xaaaaaa, shininess: 120 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.58;
    this.astronaut.add(helmet);

    // Visor (gold-tinted for sun protection)
    const visorGeo = new THREE.SphereGeometry(0.21, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const visorMat = new THREE.MeshPhongMaterial({
      color: 0x223344, specular: 0x88aacc, shininess: 150,
      transparent: true, opacity: 0.55, envMapIntensity: 0.8
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.y = 0.6;
    visor.rotation.x = Math.PI * 0.25;
    this.astronaut.add(visor);

    // Comms cap inside helmet (visible through visor)
    const commCapGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const commCapMat = new THREE.MeshPhongMaterial({ color: 0x553311 });
    const commCap = new THREE.Mesh(commCapGeo, commCapMat);
    commCap.position.set(0, 0.56, -0.02);
    this.astronaut.add(commCap);

    // Arms with upper and lower segments for better animation
    this._arms = [];
    [-1, 1].forEach(side => {
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 0.35, 0.15, 0);
      armGroup.userData.side = side;
      armGroup.userData.isArm = true;

      // Upper arm
      const upperArmGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.32, 8);
      const upperArm = new THREE.Mesh(upperArmGeo, suitMat);
      upperArm.position.y = -0.16;
      armGroup.add(upperArm);

      // Lower arm
      const lowerArmGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.30, 8);
      const lowerArm = new THREE.Mesh(lowerArmGeo, suitMat);
      lowerArm.position.y = -0.40;
      armGroup.add(lowerArm);

      // Glove (black)
      const gloveGeo = new THREE.SphereGeometry(0.065, 8, 8);
      const glove = new THREE.Mesh(gloveGeo, darkMat);
      glove.position.y = -0.55;
      armGroup.add(glove);

      // Wrist ring
      const wristGeo = new THREE.TorusGeometry(0.06, 0.015, 6, 12);
      const wrist = new THREE.Mesh(wristGeo, neckRingMat);
      wrist.position.y = -0.47;
      wrist.rotation.x = Math.PI / 2;
      armGroup.add(wrist);

      this.astronaut.add(armGroup);
      this._arms.push(armGroup);
    });

    // Legs with upper and lower segments
    this._legs = [];
    [-1, 1].forEach(side => {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.14, -0.42, 0);
      legGroup.userData.side = side;
      legGroup.userData.isLeg = true;

      // Upper leg (thigh)
      const thighGeo = new THREE.CylinderGeometry(0.11, 0.10, 0.35, 8);
      const thigh = new THREE.Mesh(thighGeo, suitMat);
      thigh.position.y = -0.17;
      legGroup.add(thigh);

      // Lower leg (shin)
      const shinGeo = new THREE.CylinderGeometry(0.095, 0.085, 0.35, 8);
      const shin = new THREE.Mesh(shinGeo, suitMat);
      shin.position.y = -0.50;
      legGroup.add(shin);

      // Boot (bulkier)
      const bootGeo = new THREE.BoxGeometry(0.14, 0.10, 0.22);
      const boot = new THREE.Mesh(bootGeo, darkMat);
      boot.position.set(0, -0.70, 0.02);
      legGroup.add(boot);

      this.astronaut.add(legGroup);
      this._legs.push(legGroup);
    });

    // Suit details: pressure gauge on left wrist
    const gaugeGeo = new THREE.BoxGeometry(0.06, 0.04, 0.04);
    const gaugeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
    gauge.position.set(-0.45, -0.25, 0.06);
    this.astronaut.add(gauge);

    // NASA meatball patch on chest
    const patchGeo = new THREE.CircleGeometry(0.07, 16);
    const patchMat = new THREE.MeshBasicMaterial({ color: 0x0033aa });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(0.15, 0.18, -0.28);
    this.astronaut.add(patch);

    // American flag patch on left arm
    const flagGeo = new THREE.PlaneGeometry(0.08, 0.05);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xcc0000, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(-0.42, 0.08, 0);
    flag.rotation.y = Math.PI / 2;
    this.astronaut.add(flag);

    // Mission patch on right arm
    const missionPatchGeo = new THREE.CircleGeometry(0.05, 12);
    const missionPatchMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const missionPatch = new THREE.Mesh(missionPatchGeo, missionPatchMat);
    missionPatch.position.set(0.42, 0.08, 0);
    missionPatch.rotation.y = -Math.PI / 2;
    this.astronaut.add(missionPatch);

    // Life support connector on chest
    const connGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8);
    const connMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const conn = new THREE.Mesh(connGeo, connMat);
    conn.position.set(-0.1, 0.05, -0.3);
    conn.rotation.x = Math.PI / 2;
    this.astronaut.add(conn);

    this.astronaut.scale.setScalar(1.6);
    this.astronaut.position.copy(this.walkPath[0]);
    this.scene.add(this.astronaut);
  }

  _getPathPosition(t) {
    t = Math.max(0, Math.min(1, t));
    const totalSegments = this.walkPath.length - 1;
    const segment = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
    const segT = (t * totalSegments) - segment;
    const p1 = this.walkPath[segment];
    const p2 = this.walkPath[segment + 1];
    return new THREE.Vector3().lerpVectors(p1, p2, segT);
  }

  _showBriefing() {
    this.gs.ui.clear();
    const missionName = this.mode === 'free' ? 'مهمة حرة — استكشاف المحطة' : 'المهمة: رحلة إلى محطة الفضاء الدولية';
    this.gs.ui.addElement('briefing', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;direction:rtl;">
        <div style="background:rgba(0,15,30,0.92);border:1px solid rgba(0,212,255,0.3);border-radius:15px;
          padding:30px 40px;max-width:550px;backdrop-filter:blur(15px);color:#cceeff;">
          <div style="font-family:'Orbitron',sans-serif;color:#00d4ff;font-size:1.5rem;margin-bottom:15px;text-align:center;">
            📋 إحاطة المهمة
          </div>
          <div style="font-size:1.1rem;color:#fff;margin-bottom:10px;text-align:center;">${missionName}</div>
          <hr style="border:none;border-top:1px solid rgba(0,212,255,0.2);margin:15px 0;">
          <div style="line-height:1.8;font-size:0.9rem;">
            <div>🎯 <strong>الهدف:</strong> الوصول إلى محطة الفضاء الدولية وتنفيذ المهام العلمية</div>
            <div>🚀 <strong>المركبة:</strong> كبسولة فضائية متعددة المراحل</div>
            <div>⏱️ <strong>مدة المهمة:</strong> ${this.mode === 'free' ? 'غير محددة' : '72 ساعة'}</div>
            <div>👨‍🚀 <strong>رائد الفضاء:</strong> ${this.gs.playerData.name}</div>
          </div>
          <hr style="border:none;border-top:1px solid rgba(0,212,255,0.2);margin:15px 0;">
          <div style="font-size:0.85rem;color:#88aabb;">
            <div>✓ البدلة — تم الارتداء</div>
            <div>✓ الفحص الطبي — مكتمل</div>
            <div>✓ الحقيبة المدارية — جاهزة</div>
            <div>✓ أنظمة المركبة — فحص أرضي مكتمل</div>
          </div>
          <div style="text-align:center;margin-top:20px;">
            <button class="btn-space btn-space-primary" style="font-size:1.1rem;padding:12px 40px;" id="btn-start-boarding">
              ▶ صعود المركبة
            </button>
          </div>
        </div>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('btn-start-boarding')?.addEventListener('click', () => {
        this.gs.audio.playConfirm();
        this._startBoarding();
      });
    }, 100);
  }

  _startBoarding() {
    this.gs.ui.clear();
    this.phase = 'boarding';
    this.boardingProgress = 0;

    this.gs.ui.showCenterText('صعود المركبة', 'تسلق السلم نحو الكبسولة...', 3000);
    this.gs.ui.showComm('فني المنصة', 'مرحباً بك يا قائد! ساعدك في تأمين أحزمة الأمان. المركبة بحالة ممتازة.', 5000);
  }

  _startSystemsCheck() {
    this.gs.ui.clear();
    this.phase = 'systems';
    let checkIndex = 0;
    const checks = [
      { name: 'أنظمة الملاحة', status: 'جاهز', icon: '🧭' },
      { name: 'أنظمة الاتصالات', status: 'جاهز', icon: '📡' },
      { name: 'نظام دعم الحياة', status: 'جاهز', icon: '🫁' },
      { name: 'المحركات الرئيسية', status: 'جاهز', icon: '⚙️' },
      { name: 'المعززات الجانبية', status: 'جاهز', icon: '🔥' },
      { name: 'نظام الوقود (LOX/RP-1)', status: 'مكتمل 100%', icon: '⛽' },
      { name: 'الدرع الحراري (PICA-X)', status: 'سليم', icon: '🛡️' },
      { name: 'مظلات الهبوط (3 رئيسية + 2 كبح)', status: 'جاهز', icon: '🪂' },
      { name: 'نظام الطوارئ (LES)', status: 'مسلح', icon: '🚨' },
      { name: 'كبسولة الطاقم — ضغط المقصورة', status: '14.7 PSI', icon: '🔒' },
    ];

    this.gs.ui.addElement('systems-check', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,15,30,0.92);border:1px solid rgba(0,212,255,0.3);border-radius:12px;
        padding:25px 35px;min-width:450px;direction:rtl;">
        <div style="font-family:'Orbitron',sans-serif;color:#00d4ff;font-size:1.2rem;margin-bottom:15px;text-align:center;">
          🔍 فحص أنظمة ما قبل الإطلاق
        </div>
        <div id="check-list" style="font-size:0.9rem;line-height:2;"></div>
        <div id="check-status" style="text-align:center;margin-top:10px;color:#557799;font-size:0.8rem;">جاري الفحص...</div>
      </div>
    `);

    const interval = setInterval(() => {
      if (checkIndex >= checks.length) {
        clearInterval(interval);
        const statusEl = document.getElementById('check-status');
        if (statusEl) {
          statusEl.innerHTML = '<span style="color:#00ff88;">جميع الأنظمة جاهزة للإطلاق ✓</span>';
        }
        setTimeout(() => {
          this.gs.audio.playConfirm();
          this.gs.ui.showComm('مدير الإطلاق', 'جميع الأنظمة GO. بدء العد التنازلي النهائي!', 4000);
          this._startCountdown();
        }, 1500);
        return;
      }
      const check = checks[checkIndex];
      this.gs.audio.playBeep();
      const listEl = document.getElementById('check-list');
      if (listEl) {
        listEl.innerHTML += `<div style="color:#00ff88;">${check.icon} ${check.name} — <span style="color:#88ffaa;">${check.status}</span></div>`;
      }
      checkIndex++;
    }, 400);
  }

  _startCountdown() {
    this.gs.ui.clear();
    this.phase = 'countdown';
    this.countdownValue = 10;
    this.countdownTimer = 0;

    this.gs.ui.addElement('countdown', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="font-family:'Orbitron',sans-serif;color:#ff6600;font-size:0.9rem;margin-bottom:10px;letter-spacing:3px;">
          العد التنازلي للإقلاع
        </div>
        <div id="countdown-num" style="font-family:'Orbitron',sans-serif;font-size:8rem;color:#fff;
          text-shadow:0 0 60px rgba(255,100,0,0.8);">10</div>
        <div id="countdown-status" style="color:#ffcc00;font-size:1rem;margin-top:10px;">T-10 — جميع الأنظمة GO</div>
      </div>
    `);

    this.gs.ui.showComm('مركز التحكم', 'T-10 ثوانٍ. حظاً سعيداً يا رائد الفضاء! نراك في المدار.', 4000);
  }

  update(delta) {
    this.time += delta;

    // Flashing warning lights on pad
    this.launchPadLights.forEach(light => {
      light.material.opacity = Math.sin(this.time * 4) > 0 ? 1 : 0.2;
      light.material.transparent = true;
    });

    if (this.phase === 'walking') {
      // Auto-walk with ability to speed up with W
      const walkSpeed = this.gs.input.isForward() ? 0.08 : 0.04;
      this.walkProgress = Math.min(1, this.walkProgress + delta * walkSpeed);

      // Update astronaut position along path
      const pos = this._getPathPosition(this.walkProgress);
      this.astronaut.position.copy(pos);
      this.astronaut.position.y = pos.y + Math.abs(Math.sin(this.time * 5)) * 0.05; // Walking bounce

      // Realistic walking animation — smoother sinusoidal leg/arm swing
      const walkCycle = this.time * 4.5; // walking cadence
      if (this._legs) {
        this._legs.forEach(leg => {
          const phase = leg.userData.side * Math.PI;
          leg.rotation.x = Math.sin(walkCycle + phase) * 0.35;
        });
      }
      if (this._arms) {
        this._arms.forEach(arm => {
          const phase = arm.userData.side * Math.PI + Math.PI; // opposite to legs
          arm.rotation.x = Math.sin(walkCycle + phase) * 0.25;
          arm.rotation.z = arm.userData.side * 0.08; // slight outward angle
        });
      }
      // Subtle torso sway
      this.astronaut.rotation.z = Math.sin(walkCycle) * 0.02;

      // Astronaut faces forward along path
      if (this.walkProgress < 0.99) {
        const nextPos = this._getPathPosition(Math.min(1, this.walkProgress + 0.02));
        const dir = nextPos.clone().sub(pos);
        if (dir.length() > 0.01) {
          this.astronaut.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }

      // Camera follows astronaut from behind and above
      const camOffset = new THREE.Vector3(8, 4, 12);
      const targetCamPos = pos.clone().add(camOffset);
      this.camera.position.lerp(targetCamPos, delta * 2);
      this.camera.lookAt(pos.clone().add(new THREE.Vector3(0, 2, 0)));

      // Progress updates
      if (this.walkProgress > 0.3 && !this._walkMsg1) {
        this._walkMsg1 = true;
        this.gs.ui.showComm('مركز التحكم', 'رائد الفضاء في الطريق إلى المنصة. الطقس مثالي للإطلاق.', 4000);
      }
      if (this.walkProgress > 0.6 && !this._walkMsg2) {
        this._walkMsg2 = true;
        this.gs.ui.showComm('مركز التحكم', 'اقتربت من منصة الإطلاق. الصاروخ بانتظارك.', 4000);
      }

      // Show walk progress bar
      this.gs.ui.removeElement('walk-progress');
      this.gs.ui.addElement('walk-progress', `
        <div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);text-align:center;direction:rtl;">
          <div style="color:#cceeff;font-size:0.85rem;margin-bottom:5px;">المسافة إلى منصة الإطلاق</div>
          <div style="width:250px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;">
            <div style="width:${this.walkProgress * 100}%;height:100%;background:linear-gradient(90deg,#00d4ff,#0088ff);border-radius:3px;transition:width 0.3s;"></div>
          </div>
          <div style="color:#557799;font-size:0.7rem;margin-top:3px;">اضغط W للمشي أسرع</div>
        </div>
      `);

      // Reached the rocket
      if (this.walkProgress >= 1) {
        this.gs.ui.removeElement('walk-progress');
        this.gs.audio.playConfirm();
        this.gs.ui.showCenterText('وصلت إلى منصة الإطلاق', 'جاري تحضير إحاطة المهمة...', 3000);
        this.phase = 'arrived';

        setTimeout(() => {
          this._showBriefing();
        }, 3500);
      }
    }

    if (this.phase === 'boarding') {
      this.boardingProgress += delta * 0.15;

      // Animate astronaut climbing into rocket
      const boardY = 2.5 + this.boardingProgress * 30;
      this.astronaut.position.set(2, boardY, -25);
      this.astronaut.rotation.y = -Math.PI / 2;

      // Camera follows upward
      this.camera.position.lerp(new THREE.Vector3(12, boardY + 5, -15), delta * 2);
      this.camera.lookAt(new THREE.Vector3(0, boardY, -25));

      if (this.boardingProgress > 0.3 && !this._boardMsg1) {
        this._boardMsg1 = true;
        this.gs.ui.showComm('فني المنصة', 'أحزمة الأمان مثبتة. إغلاق الفتحة.', 4000);
      }

      if (this.boardingProgress >= 1) {
        // Astronaut inside rocket, hide astronaut
        this.astronaut.visible = false;
        this.gs.audio.playConfirm();
        this.gs.ui.showCenterText('داخل الكبسولة', 'إغلاق الفتحة — بدء فحص الأنظمة', 3000);

        this.phase = 'seated';
        setTimeout(() => {
          this.gs.ui.showComm('مركز التحكم', 'الفتحة مغلقة ومؤمنة. بدء فحص أنظمة ما قبل الإطلاق.', 5000);
          this._startSystemsCheck();
        }, 4000);
      }
    }

    if (this.phase === 'countdown') {
      this.countdownTimer += delta;
      if (this.countdownTimer >= 1) {
        this.countdownTimer = 0;
        this.countdownValue--;
        this.gs.audio.playCountdown();

        const numEl = document.getElementById('countdown-num');
        const statusEl = document.getElementById('countdown-status');
        if (numEl) numEl.textContent = Math.max(0, this.countdownValue);

        if (this.countdownValue === 7 && statusEl) {
          statusEl.textContent = 'T-7 — سحب ذراع الوصول';
          // Swing arm retracts
        }
        if (this.countdownValue === 5 && statusEl) {
          statusEl.textContent = 'T-5 — تشغيل المحركات الرئيسية';
          statusEl.style.color = '#ff8800';
          this.cameraShake = 0.3;
        }
        if (this.countdownValue === 3 && statusEl) {
          statusEl.textContent = 'T-3 — المحركات بالطاقة الكاملة';
          statusEl.style.color = '#ff4400';
          this.cameraShake = 0.8;
        }
        if (this.countdownValue === 1 && statusEl) {
          statusEl.textContent = 'T-1 — إطلاق المشابك!';
          statusEl.style.color = '#ff0000';
          this.cameraShake = 1.5;
        }

        if (this.countdownValue <= 0) {
          this.gs.audio.playConfirm();
          setTimeout(() => {
            this.gs.switchScene('launch', { mode: this.mode });
          }, 500);
        }
      }

      // Camera shake during countdown
      if (this.cameraShake > 0) {
        this.camera.position.x = 15 + (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y = 12 + (Math.random() - 0.5) * this.cameraShake;
      }
    }

    // Camera for briefing/systems/seated phases
    if (this.phase === 'briefing' || this.phase === 'systems' || this.phase === 'arrived' || this.phase === 'seated') {
      this.camera.position.lerp(new THREE.Vector3(15, 14, 20), delta * 0.5);
      this.camera.lookAt(0, 10, -25);
    } else if (this.phase === 'countdown') {
      if (this.countdownValue > 5) {
        this.camera.position.lerp(new THREE.Vector3(10, 10, -10), delta * 0.5);
        this.camera.lookAt(0, 12, -25);
      } else {
        this.camera.position.lerp(new THREE.Vector3(20, 5, -10), delta * 0.8);
        this.camera.lookAt(0, 8, -25);
      }
    }

    // Swing arm retraction during countdown
    if (this.swingArm && this.phase === 'countdown' && this.countdownValue <= 7) {
      this.swingArm.rotation.y = THREE.MathUtils.lerp(this.swingArm.rotation.y, Math.PI / 3, delta * 0.5);
    }
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    this.gs.ui.clear();
  }
}
