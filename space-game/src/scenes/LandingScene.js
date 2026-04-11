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
    this.verticalSpeed = -50;
    this.phase = 'drogue'; // drogue, main, final, landed
    this.parachutes = [];
    this.landed = false;
    this.mode = 'story';
    this.swayAngle = 0;
    this.windEffect = 0;
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();

    // Reset parachutes array to prevent duplicates on replay
    this.parachutes = [];

    // Sky gradient
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 2;
    skyCanvas.height = 512;
    const sctx = skyCanvas.getContext('2d');
    const grad = sctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#1a3a6e');
    grad.addColorStop(0.3, '#3a7bd5');
    grad.addColorStop(0.6, '#5b9ce6');
    grad.addColorStop(0.8, '#87ceeb');
    grad.addColorStop(1, '#b0d4f1');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 2, 512);
    this.scene.background = new THREE.CanvasTexture(skyCanvas);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50000);
    this.camera.position.set(15, 5, 20);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
    sunLight.position.set(50, 100, 30);
    this.scene.add(sunLight);
    this.scene.add(new THREE.AmbientLight(0x88aacc, 0.5));

    // Ocean
    const oceanGeo = new THREE.PlaneGeometry(10000, 10000, 100, 100);
    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0x006994,
      specular: 0x4488aa,
      shininess: 50,
      transparent: true,
      opacity: 0.9
    });
    // Add waves
    const positions = oceanGeo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] = Math.sin(positions[i] * 0.05) * Math.cos(positions[i + 1] * 0.05) * 2;
    }
    oceanGeo.computeVertexNormals();
    this.ocean = new THREE.Mesh(oceanGeo, oceanMat);
    this.ocean.rotation.x = -Math.PI / 2;
    this.ocean.position.y = -5;
    this.scene.add(this.ocean);

    // Spacecraft (capsule coming down)
    this.spacecraft = createSpacecraft();
    this.spacecraft.position.set(0, 50, 0);
    this.scene.add(this.spacecraft);

    // Parachutes
    this._createParachutes();

    // Clouds
    this._createClouds();

    // Recovery ships
    this._createRecoveryShips();

    // State
    this.altitude = 10000;
    this.verticalSpeed = -50;
    this.phase = 'drogue';
    this.landed = false;
    this.time = 0;
    this.swayAngle = 0;

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('فتح مظلات الكبح', 'Drogue Chutes Deployed', 2500);
    this.gs.ui.showObjective('الهبوط بسلام في المحيط');

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'مظلات الكبح مفتوحة. الهبوط جارٍ. سفن الإنقاذ في انتظارك.', 5000);
    }, 3000);
  }

  _createParachutes() {
    const chuteColors = [0xff4444, 0xffffff, 0xff4444];
    chuteColors.forEach((color, i) => {
      const chuteGeo = new THREE.ConeGeometry(4, 6, 16, 1, true);
      const chuteMat = new THREE.MeshPhongMaterial({
        color, side: THREE.DoubleSide, transparent: true, opacity: 0.85
      });
      const chute = new THREE.Mesh(chuteGeo, chuteMat);
      const angle = (i / 3) * Math.PI * 2;
      chute.position.set(Math.cos(angle) * 3, 60, Math.sin(angle) * 3);
      chute.rotation.x = Math.PI;
      this.scene.add(chute);
      this.parachutes.push(chute);

      // Suspension lines
      for (let j = 0; j < 8; j++) {
        const lineAngle = (j / 8) * Math.PI * 2;
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(lineAngle) * 3.5, 6, Math.sin(lineAngle) * 3.5),
          new THREE.Vector3(0, -3, 0)
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
        const line = new THREE.Line(lineGeo, lineMat);
        line.position.copy(chute.position);
        this.scene.add(line);
        chute.userData.lines = chute.userData.lines || [];
        chute.userData.lines.push(line);
      }
    });
  }

  _createClouds() {
    for (let i = 0; i < 30; i++) {
      const cloudGeo = new THREE.SphereGeometry(20 + Math.random() * 40, 8, 8);
      const cloudMat = new THREE.MeshPhongMaterial({
        color: 0xffffff, transparent: true, opacity: 0.4 + Math.random() * 0.3
      });
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 2000,
        20 + Math.random() * 30,
        (Math.random() - 0.5) * 2000
      );
      cloud.scale.set(1, 0.3, 1);
      this.scene.add(cloud);
    }
  }

  _createRecoveryShips() {
    for (let i = 0; i < 3; i++) {
      const shipGroup = new THREE.Group();

      const hullGeo = new THREE.BoxGeometry(3, 1, 8);
      const hullMat = new THREE.MeshPhongMaterial({ color: 0x334455 });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      shipGroup.add(hull);

      const deckGeo = new THREE.BoxGeometry(3.5, 0.2, 9);
      const deckMat = new THREE.MeshPhongMaterial({ color: 0x556677 });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.position.y = 0.6;
      shipGroup.add(deck);

      const bridgeGeo = new THREE.BoxGeometry(2, 1.5, 2);
      const bridge = new THREE.Mesh(bridgeGeo, deckMat);
      bridge.position.set(0, 1.4, -2);
      shipGroup.add(bridge);

      const angle = (i / 3) * Math.PI * 2;
      shipGroup.position.set(Math.cos(angle) * 100, -4, Math.sin(angle) * 100);
      shipGroup.rotation.y = angle + Math.PI;
      this.scene.add(shipGroup);
    }
  }

  update(delta) {
    if (this.landed) return;
    this.time += delta;

    // Phase transitions
    if (this.altitude < 5000 && this.phase === 'drogue') {
      this.phase = 'main';
      this.verticalSpeed = -15;
      this.gs.audio.playConfirm();
      this.gs.ui.showCenterText('فتح المظلات الرئيسية', 'Main Chutes Deployed', 2500);
      this.parachutes.forEach(p => {
        p.scale.setScalar(1.8);
        p.material.opacity = 0.9;
      });
    }

    if (this.altitude < 500 && this.phase === 'main') {
      this.phase = 'final';
      this.verticalSpeed = -5;
      this.gs.ui.showComm('مركز التحكم', 'الارتفاع أقل من 500 متر! استعد للاصطدام بالماء.', 4000);
    }

    // Descent
    this.altitude += this.verticalSpeed * delta;
    const displayAlt = Math.max(0, Math.round(this.altitude));

    // Capsule position
    const capsuleY = Math.max(-4, this.altitude * 0.005);
    this.spacecraft.position.y = capsuleY;

    // Swaying motion
    this.swayAngle += delta * 1.5;
    this.spacecraft.rotation.z = Math.sin(this.swayAngle) * 0.05;
    this.spacecraft.rotation.x = Math.cos(this.swayAngle * 0.7) * 0.03;
    this.spacecraft.position.x = Math.sin(this.swayAngle * 0.3) * 2;

    // Parachutes follow
    this.parachutes.forEach((p, i) => {
      const angle = (i / 3) * Math.PI * 2 + this.swayAngle * 0.2;
      p.position.set(
        this.spacecraft.position.x + Math.cos(angle) * 3,
        capsuleY + 10,
        Math.sin(angle) * 3
      );
      p.rotation.z = Math.sin(this.swayAngle + i) * 0.1;

      if (p.userData.lines) {
        p.userData.lines.forEach(line => {
          line.position.copy(p.position);
        });
      }
    });

    // Camera
    this.camera.position.set(
      15 + Math.sin(this.time * 0.2) * 3,
      capsuleY + 8,
      20 + Math.cos(this.time * 0.15) * 3
    );
    this.camera.lookAt(this.spacecraft.position);

    // Ocean wave animation
    if (this.ocean) {
      const pos = this.ocean.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 2] = Math.sin(pos[i] * 0.05 + this.time) * Math.cos(pos[i + 1] * 0.05 + this.time * 0.7) * 1.5;
      }
      this.ocean.geometry.attributes.position.needsUpdate = true;
      this.ocean.geometry.computeVertexNormals();
    }

    // HUD
    this.gs.ui.showHUD({
      speed: Math.round(Math.abs(this.verticalSpeed * 10)),
      altitude: displayAlt
    });

    // Landing
    if (this.altitude <= 0) {
      this.landed = true;
      this.altitude = 0;
      this.spacecraft.position.y = -3;
      this.gs.audio.playSuccess();
      this._showLandingComplete();
    }
  }

  _showLandingComplete() {
    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('هبوط ناجح!', '🎊 مبروك! أكملت المهمة بنجاح', 0);

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'هبوط ناجح! مرحى! سفن الإنقاذ في طريقها إليك. عمل رائع يا رائد الفضاء!', 0);
    }, 2000);

    setTimeout(() => {
      this.gs.ui.addElement('landing-results', `
        <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
          background:rgba(0,15,30,0.92);border:1px solid rgba(0,212,255,0.3);border-radius:15px;
          padding:30px 40px;text-align:center;direction:rtl;backdrop-filter:blur(15px);max-width:450px;">
          <div style="font-size:2rem;margin-bottom:10px;">🏆</div>
          <div style="font-family:'Orbitron',sans-serif;color:#00d4ff;font-size:1.5rem;margin-bottom:15px;">
            المهمة مكتملة!
          </div>
          <div style="color:#cceeff;font-size:0.95rem;line-height:1.8;margin-bottom:20px;">
            <div>🚀 إطلاق ناجح من الأرض</div>
            <div>🛸 ملاحة فضائية دقيقة</div>
            <div>🔗 التحام ناجح بمحطة الفضاء</div>
            <div>🔬 تنفيذ المهام العلمية</div>
            <div>🧑‍🚀 خروج إلى الفضاء</div>
            <div>🌍 عودة آمنة إلى الأرض</div>
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
    }, 4000);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    this.gs.ui.clear();
  }
}
