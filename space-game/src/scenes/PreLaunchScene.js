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
    this.boardingPhase = 'elevator';
    this._groundOffset = 1.87;
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
      new THREE.Vector3(5, 2.5, -25), // On pad, heading to tower
      new THREE.Vector3(10, 2.5, -25), // At tower/elevator base
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
    this._boardMsg2 = false;
    this._boardMsg3 = false;
    this.boardingPhase = 'elevator';

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

    // Face visible through visor (skin tone)
    const faceGeo = new THREE.SphereGeometry(0.16, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const faceMat = new THREE.MeshPhongMaterial({ color: 0xd4a574 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 0.56, 0.04);
    face.rotation.x = Math.PI * 0.15;
    this.astronaut.add(face);

    // PLSS backpack (life support system)
    const backpackGeo = new THREE.BoxGeometry(0.38, 0.42, 0.16);
    const backpackMat = new THREE.MeshPhongMaterial({ color: 0xdd5500 });
    const backpack = new THREE.Mesh(backpackGeo, backpackMat);
    backpack.position.set(0, 0.10, 0.27);
    this.astronaut.add(backpack);
    // Backpack straps
    [-1, 1].forEach(side => {
      const strapGeo = new THREE.BoxGeometry(0.03, 0.55, 0.025);
      const strap = new THREE.Mesh(strapGeo, darkMat);
      strap.position.set(side * 0.12, 0.15, 0.12);
      this.astronaut.add(strap);
    });
    // Backpack top handle
    const handleGeo = new THREE.TorusGeometry(0.06, 0.015, 6, 12, Math.PI);
    const handle = new THREE.Mesh(handleGeo, neckRingMat);
    handle.position.set(0, 0.33, 0.27);
    this.astronaut.add(handle);

    // Utility belt
    const beltGeo = new THREE.TorusGeometry(0.27, 0.025, 6, 24);
    const beltMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = -0.30;
    belt.rotation.x = Math.PI / 2;
    this.astronaut.add(belt);

    // Belt pouches
    [-1, 1].forEach(side => {
      const pouchGeo = new THREE.BoxGeometry(0.06, 0.08, 0.05);
      const pouch = new THREE.Mesh(pouchGeo, darkMat);
      pouch.position.set(side * 0.25, -0.30, -0.08);
      this.astronaut.add(pouch);
    });

    // Shoulder communication antenna
    const antennaGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 6);
    const antennaMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(-0.30, 0.50, 0);
    antenna.rotation.z = Math.PI * 0.15;
    this.astronaut.add(antenna);
    const antennaTipGeo = new THREE.SphereGeometry(0.015, 6, 6);
    const antennaTip = new THREE.Mesh(antennaTipGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    antennaTip.position.set(-0.32, 0.57, 0);
    this.astronaut.add(antennaTip);

    this.astronaut.scale.setScalar(1.6);
    this.astronaut.position.copy(this.walkPath[0]);
    this.astronaut.position.y += this._groundOffset;
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
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.5) 100%);pointer-events:none;"></div>
        <div style="background:rgba(0,0,0,0.9);border:1px solid rgba(255,149,0,0.2);
          border-top:2px solid #ff9500;border-radius:2px;
          padding:28px 36px;max-width:520px;color:rgba(200,210,220,0.85);position:relative;z-index:2;
          box-shadow:0 8px 40px rgba(0,0,0,0.5);">
          <div style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.3rem;margin-bottom:14px;
            text-align:center;letter-spacing:2px;text-shadow:0 0 30px rgba(255,149,0,0.3);">
            📋 إحاطة المهمة
          </div>
          <div style="font-size:1.05rem;color:#fff;margin-bottom:10px;text-align:center;
            font-family:'Tajawal',sans-serif;font-weight:600;">${missionName}</div>
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,149,0,0.15),transparent);margin:14px 0;"></div>
          <div style="line-height:1.9;font-size:0.88rem;font-family:'Tajawal',sans-serif;">
            <div>🎯 <strong>الهدف:</strong> الوصول إلى محطة الفضاء الدولية وتنفيذ المهام العلمية</div>
            <div>🚀 <strong>المركبة:</strong> كبسولة فضائية متعددة المراحل</div>
            <div>⏱️ <strong>مدة المهمة:</strong> ${this.mode === 'free' ? 'غير محددة' : '72 ساعة'}</div>
            <div>👨‍🚀 <strong>رائد الفضاء:</strong> ${this.gs.playerData.name}</div>
          </div>
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,149,0,0.15),transparent);margin:14px 0;"></div>
          <div style="font-size:0.8rem;color:rgba(0,255,120,0.6);">
            <div>✓ البدلة — تم الارتداء</div>
            <div>✓ الفحص الطبي — مكتمل</div>
            <div>✓ الحقيبة المدارية — جاهزة</div>
            <div>✓ أنظمة المركبة — فحص أرضي مكتمل</div>
          </div>
          <div style="text-align:center;margin-top:18px;">
            <button class="menu-btn menu-btn-primary" style="display:inline-flex;width:auto;padding:11px 32px;" id="btn-start-boarding">
              <div class="menu-btn-icon" style="font-size:1rem;">🛗</div>
              <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.95rem;">ركوب المصعد إلى الكبسولة</div></div>
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

    this.gs.ui.showCenterText('ركوب المصعد', 'الصعود إلى مستوى ذراع الوصول...', 3000);
    this.gs.ui.showComm('فني المنصة', 'المصعد جاهز. سنصعد إلى ذراع الوصول — ارتفاع 65 متر.', 5000);

    // Create elevator cage visual
    this._elevatorCage = new THREE.Group();
    const cageFloor = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.1, 3),
      new THREE.MeshPhongMaterial({ color: 0x666655 })
    );
    this._elevatorCage.add(cageFloor);
    // Cage railing posts
    const railMat = new THREE.MeshPhongMaterial({ color: 0x888877 });
    [[-1.4, 0], [1.4, 0], [-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(([x, z]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), railMat);
      post.position.set(x, 1.5, z);
      this._elevatorCage.add(post);
    });
    // Cage top
    const cageTop = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.08, 3),
      new THREE.MeshPhongMaterial({ color: 0x666655 })
    );
    cageTop.position.y = 3;
    this._elevatorCage.add(cageTop);
    this._elevatorCage.position.set(10, 2.5, -25);
    this.scene.add(this._elevatorCage);
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
        background:rgba(0,0,0,0.9);border:1px solid rgba(255,149,0,0.2);
        border-top:2px solid #ff9500;border-radius:2px;
        padding:24px 32px;min-width:420px;direction:rtl;
        box-shadow:0 8px 40px rgba(0,0,0,0.5);">
        <div style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.1rem;margin-bottom:14px;
          text-align:center;letter-spacing:2px;text-shadow:0 0 30px rgba(255,149,0,0.3);">
          🔍 فحص أنظمة ما قبل الإطلاق
        </div>
        <div id="check-list" style="font-size:0.85rem;line-height:2;font-family:'Tajawal',sans-serif;"></div>
        <div id="check-status" style="text-align:center;margin-top:10px;color:rgba(100,150,200,0.5);font-size:0.78rem;
          font-family:'Tajawal',sans-serif;">جاري الفحص...</div>
      </div>
    `);

    this._systemsCheckInterval = setInterval(() => {
      if (checkIndex >= checks.length) {
        clearInterval(this._systemsCheckInterval);
        this._systemsCheckInterval = null;
        const statusEl = document.getElementById('check-status');
        if (statusEl) {
          statusEl.innerHTML = '<span style="color:rgba(0,255,120,0.8);">جميع الأنظمة جاهزة للإطلاق ✓</span>';
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
        listEl.innerHTML += `<div style="color:rgba(0,255,120,0.7);">${check.icon} ${check.name} — <span style="color:rgba(100,255,150,0.8);">${check.status}</span></div>`;
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
        <div style="font-family:'Orbitron',sans-serif;color:rgba(255,120,0,0.7);font-size:0.8rem;margin-bottom:10px;
          letter-spacing:4px;text-transform:uppercase;">LAUNCH COUNTDOWN</div>
        <div style="font-family:'Tajawal',sans-serif;color:rgba(255,200,100,0.6);font-size:0.85rem;margin-bottom:15px;">
          العد التنازلي للإقلاع
        </div>
        <div id="countdown-num" style="font-family:'Orbitron',sans-serif;font-size:9rem;color:#fff;font-weight:900;
          text-shadow:0 0 80px rgba(255,100,0,0.6), 0 0 160px rgba(255,50,0,0.3);">10</div>
        <div id="countdown-status" style="color:rgba(255,200,80,0.8);font-size:0.9rem;margin-top:12px;
          font-family:'Tajawal',sans-serif;">T-10 — جميع الأنظمة GO</div>
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
      this.astronaut.position.y = pos.y + this._groundOffset + Math.abs(Math.sin(this.time * 5)) * 0.05; // Walking bounce + height offset

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
          <div style="background:rgba(0,0,0,0.85);padding:10px 20px;border-radius:2px;border:1px solid rgba(255,149,0,0.15);">
            <div style="color:rgba(255,200,150,0.7);font-size:0.8rem;margin-bottom:6px;
              font-family:'Tajawal',sans-serif;">المسافة إلى منصة الإطلاق</div>
            <div style="width:220px;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin:0 auto;">
              <div style="width:${this.walkProgress * 100}%;height:100%;
                background:linear-gradient(90deg,rgba(255,149,0,0.3),#ff9500,rgba(255,149,0,0.3));
                border-radius:2px;transition:width 0.3s;box-shadow:0 0 8px rgba(255,149,0,0.4);"></div>
            </div>
            <div style="color:rgba(255,149,0,0.3);font-size:0.65rem;margin-top:5px;
              font-family:'Tajawal',sans-serif;">اضغط W للمشي أسرع</div>
          </div>
        </div>
      `);

      // Reached the rocket
      if (this.walkProgress >= 1) {
        this.gs.ui.removeElement('walk-progress');
        this.gs.audio.playConfirm();
        this.gs.ui.showCenterText('وصلت إلى برج الإطلاق', 'جاري تحضير إحاطة المهمة...', 3000);
        this.phase = 'arrived';

        setTimeout(() => {
          this._showBriefing();
        }, 3500);
      }
    }

    if (this.phase === 'boarding') {
      this.boardingProgress += delta * 0.12;

      if (this.boardingPhase === 'elevator') {
        // Elevator ride up the launch tower
        const startY = 2.5;
        const endY = 32;
        const t = Math.min(1, this.boardingProgress);
        // Smooth ease-in-out
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const elevatorY = THREE.MathUtils.lerp(startY, endY, eased);

        this.astronaut.position.set(10, elevatorY + this._groundOffset, -25);
        this.astronaut.rotation.y = -Math.PI / 2; // Face outward

        // Move elevator cage with astronaut
        if (this._elevatorCage) {
          this._elevatorCage.position.y = elevatorY;
        }

        // Standing still in elevator — reset limbs
        if (this._legs) this._legs.forEach(l => { l.rotation.x = 0; });
        if (this._arms) this._arms.forEach(a => { a.rotation.x = 0; a.rotation.z = a.userData.side * 0.05; });

        // Camera follows elevator from the side
        this.camera.position.lerp(new THREE.Vector3(22, elevatorY + 5, -15), delta * 2);
        this.camera.lookAt(new THREE.Vector3(10, elevatorY, -25));

        if (!this._boardMsg1 && this.boardingProgress > 0.2) {
          this._boardMsg1 = true;
          this.gs.ui.showComm('فني المنصة', 'نصعد الآن... الارتفاع ' + Math.floor(elevatorY) + ' متر. منظر رائع من هنا!', 4000);
        }

        // Show elevator progress
        this.gs.ui.removeElement('boarding-progress');
        this.gs.ui.addElement('boarding-progress', `
          <div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);text-align:center;direction:rtl;">
            <div style="background:rgba(0,0,0,0.85);padding:10px 20px;border-radius:2px;border:1px solid rgba(255,149,0,0.15);">
              <div style="color:rgba(255,200,150,0.7);font-size:0.8rem;margin-bottom:6px;
                font-family:'Tajawal',sans-serif;">🛗 المصعد — الارتفاع: ${Math.floor(elevatorY)} متر</div>
              <div style="width:220px;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin:0 auto;">
                <div style="width:${t * 100}%;height:100%;
                  background:linear-gradient(90deg,rgba(255,149,0,0.3),#ff9500,rgba(255,149,0,0.3));
                  border-radius:2px;box-shadow:0 0 8px rgba(255,149,0,0.4);"></div>
              </div>
            </div>
          </div>
        `);

        if (this.boardingProgress >= 1) {
          this.boardingPhase = 'access_arm';
          this.boardingProgress = 0;
          this.gs.ui.removeElement('boarding-progress');
          this.gs.audio.playConfirm();
          this.gs.ui.showCenterText('ذراع الوصول', 'المشي عبر ذراع الوصول إلى فتحة الكبسولة', 3000);
          // Remove elevator cage
          if (this._elevatorCage) {
            this.scene.remove(this._elevatorCage);
            this._elevatorCage = null;
          }
        }
      }

      else if (this.boardingPhase === 'access_arm') {
        // Walk across crew access arm from tower (x=10) to near capsule (x=2)
        const t = Math.min(1, this.boardingProgress * 1.5);
        const armX = THREE.MathUtils.lerp(10, 2, t);
        this.astronaut.position.set(armX, 32 + this._groundOffset, -25);
        this.astronaut.rotation.y = Math.PI; // Face toward capsule

        // Walking animation on the arm
        const walkCycle = this.time * 4.5;
        if (this._legs) {
          this._legs.forEach(leg => {
            leg.rotation.x = Math.sin(walkCycle + leg.userData.side * Math.PI) * 0.30;
          });
        }
        if (this._arms) {
          this._arms.forEach(arm => {
            arm.rotation.x = Math.sin(walkCycle + arm.userData.side * Math.PI + Math.PI) * 0.20;
            arm.rotation.z = arm.userData.side * 0.08;
          });
        }
        this.astronaut.rotation.z = Math.sin(walkCycle) * 0.015;

        // Camera from the side showing the walk across the arm
        this.camera.position.lerp(new THREE.Vector3(15, 35, -18), delta * 1.5);
        this.camera.lookAt(new THREE.Vector3(5, 32, -25));

        if (!this._boardMsg2 && this.boardingProgress > 0.3) {
          this._boardMsg2 = true;
          this.gs.ui.showComm('فني المنصة', 'الكبسولة أمامك مباشرة. استعد لدخول الفتحة.', 4000);
        }

        if (this.boardingProgress >= 0.7) {
          this.boardingPhase = 'entering';
          this.boardingProgress = 0;
          this.gs.ui.showCenterText('دخول الكبسولة', 'الدخول عبر فتحة الكبسولة وتأمين المقعد', 3000);
        }
      }

      else if (this.boardingPhase === 'entering') {
        // Astronaut enters the capsule hatch
        const t = Math.min(1, this.boardingProgress * 1.5);
        const enterScale = THREE.MathUtils.lerp(1.6, 0.3, t);

        // Move toward capsule center and shrink (entering hatch)
        this.astronaut.position.set(
          THREE.MathUtils.lerp(2, 0, t),
          THREE.MathUtils.lerp(32 + this._groundOffset, 33, t * 0.5),
          -25
        );
        this.astronaut.scale.setScalar(enterScale);
        this.astronaut.rotation.x = t * -0.6; // Lean forward to duck into hatch
        this.astronaut.rotation.z = 0;

        // Stop limb animation — reaching forward
        if (this._legs) this._legs.forEach(l => { l.rotation.x = 0; });
        if (this._arms) this._arms.forEach(a => { a.rotation.x = -0.3 * t; a.rotation.z = a.userData.side * 0.15; });

        // Camera zooms in on hatch area
        this.camera.position.lerp(new THREE.Vector3(8, 34, -20), delta * 2);
        this.camera.lookAt(new THREE.Vector3(1, 32, -25));

        if (!this._boardMsg3 && this.boardingProgress > 0.2) {
          this._boardMsg3 = true;
          this.gs.ui.showComm('فني المنصة', 'مرحباً بك في الكبسولة! سأساعدك في تأمين أحزمة الأمان.', 5000);
        }

        if (this.boardingProgress >= 0.7) {
          // Astronaut inside rocket
          this.astronaut.visible = false;
          this.astronaut.scale.setScalar(1.6); // Reset scale
          this.astronaut.rotation.x = 0;
          this.gs.audio.playConfirm();
          this.gs.ui.showCenterText('داخل الكبسولة', 'إغلاق الفتحة — بدء فحص الأنظمة', 3000);

          this.phase = 'seated';
          setTimeout(() => {
            this.gs.ui.showComm('مركز التحكم', 'الفتحة مغلقة ومؤمنة. بدء فحص أنظمة ما قبل الإطلاق.', 5000);
            this._startSystemsCheck();
          }, 4000);
        }
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
    if (this._systemsCheckInterval) {
      clearInterval(this._systemsCheckInterval);
      this._systemsCheckInterval = null;
    }
    if (this._elevatorCage) {
      this.scene.remove(this._elevatorCage);
      this._elevatorCage = null;
    }
    this.gs.ui.clear();
  }
}
