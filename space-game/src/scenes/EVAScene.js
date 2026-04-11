import * as THREE from 'three';
import { createISS } from '../objects/ISS.js';
import { createDetailedEarth } from '../objects/Earth.js';
import { createStarField, createSun } from '../objects/Stars.js';

export class EVAScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.iss = null;
    this.time = 0;
    this.playerPos = new THREE.Vector3(12, 5, 5);
    this.playerVel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.oxygenTimer = 100;
    this.tethered = true;
    this.repairTarget = null;
    this.repairProgress = 0;
    this.tasksCompleted = 0;
    this.totalTasks = 3;
    this.mode = 'story';
    this.evaTaskList = [];
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000003);
    this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.05, 3000);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // Space environment
    this.scene.add(createStarField(10000));

    const sun = createSun();
    sun.position.set(300, 100, -400);
    this.scene.add(sun);

    // Earth
    this.earth = createDetailedEarth(150);
    this.earth.position.set(0, -180, 50);
    this.scene.add(this.earth);

    // ISS exterior
    this.iss = createISS();
    this.iss.scale.setScalar(1);
    this.scene.add(this.iss);

    // Repair targets (glowing red spots on ISS)
    this.evaTaskList = [
      { name: 'إصلاح اللوح الشمسي', pos: new THREE.Vector3(18, 2, 8), done: false },
      { name: 'استبدال وحدة الاتصال', pos: new THREE.Vector3(-5, 4, 0), done: false },
      { name: 'تركيب مستشعر جديد', pos: new THREE.Vector3(10, 3, -5), done: false },
    ];

    this.evaTaskList.forEach(task => {
      const markerGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0xff3300, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(task.pos);
      this.scene.add(marker);
      task.marker = marker;

      // Pulsing ring
      const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(task.pos);
      this.scene.add(ring);
      task.ring = ring;
    });

    // Tether line
    this.tetherGeo = new THREE.BufferGeometry();
    const tetherMat = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.6 });
    this.tether = new THREE.Line(this.tetherGeo, tetherMat);
    this.scene.add(this.tether);

    // Player astronaut model (simple)
    this.astronaut = this._createAstronaut();
    this.scene.add(this.astronaut);

    // Init state
    this.playerPos.set(12, 5, 5);
    this.playerVel.set(0, 0, 0);
    this.yaw = -Math.PI / 2;
    this.pitch = 0;
    this.oxygenTimer = 100;
    this.tasksCompleted = 0;
    this.time = 0;

    this._onClickLock = () => {
      this.gs.input.requestPointerLock(document.getElementById('game-canvas'));
    };
    document.getElementById('game-canvas')?.addEventListener('click', this._onClickLock);

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('خروج إلى الفضاء', 'EVA — نشاط خارج المركبة', 3000);
    this.gs.ui.showObjective('أصلح المواقع المحددة بالأحمر على المحطة');

    this.gs.ui.showControls([
      { key: 'W/↑', action: 'أمام' },
      { key: 'S/↓', action: 'خلف' },
      { key: 'A/←', action: 'يسار' },
      { key: 'D/→', action: 'يمين' },
      { key: 'Q/مسافة', action: 'أعلى' },
      { key: 'E/Shift', action: 'أسفل' },
      { key: 'F', action: 'إصلاح (عند الهدف)' },
    ]);

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'بدء نشاط خارج المركبة. راقب مستوى الأكسجين وابق مربوطاً بالحبل. توجه للمواقع الحمراء للإصلاح.', 6000);
    }, 3500);
  }

  _createAstronaut() {
    const group = new THREE.Group();
    const suitMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, specular: 0x444444 });

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 1, 0.5);
    const body = new THREE.Mesh(bodyGeo, suitMat);
    group.add(body);

    // Helmet
    const helmetGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const helmetMat = new THREE.MeshPhongMaterial({
      color: 0xdddddd, specular: 0xffffff, shininess: 100
    });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.7;
    group.add(helmet);

    // Visor
    const visorGeo = new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const visorMat = new THREE.MeshPhongMaterial({
      color: 0xcc8800, transparent: true, opacity: 0.5, specular: 0xffaa00
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.7, 0.15);
    visor.rotation.x = Math.PI / 4;
    group.add(visor);

    // Backpack (life support)
    const packGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    const pack = new THREE.Mesh(packGeo, suitMat);
    pack.position.set(0, 0, -0.35);
    group.add(pack);

    group.scale.setScalar(0.5);
    return group;
  }

  update(delta) {
    this.time += delta;
    const input = this.gs.input;

    // Oxygen decreases
    this.oxygenTimer -= delta * 0.3;
    if (this.oxygenTimer < 20) {
      if (!this._oxygenWarnTime || this.time - this._oxygenWarnTime > 3) {
        this._oxygenWarnTime = this.time;
        this.gs.ui.showMessage('⚠️ أكسجين منخفض! عد إلى المحطة!', 2000, 'danger');
      }
    }

    // Movement in space (zero-G)
    const moveSpeed = 2;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    if (input.isForward()) this.playerVel.add(forward.clone().multiplyScalar(moveSpeed * delta));
    if (input.isBackward()) this.playerVel.add(forward.clone().multiplyScalar(-moveSpeed * delta));
    if (input.isLeft()) this.playerVel.add(right.clone().multiplyScalar(-moveSpeed * delta));
    if (input.isRight()) this.playerVel.add(right.clone().multiplyScalar(moveSpeed * delta));
    if (input.isUp()) this.playerVel.y += moveSpeed * delta;
    if (input.isDown()) this.playerVel.y -= moveSpeed * delta;

    this.playerVel.multiplyScalar(0.97);
    this.playerPos.add(this.playerVel.clone().multiplyScalar(delta * 5));

    // Tether limit
    const distFromISS = this.playerPos.length();
    if (distFromISS > 40) {
      this.playerPos.normalize().multiplyScalar(40);
      this.playerVel.multiplyScalar(-0.5);
      this.gs.ui.showMessage('⚠️ أقصى طول للحبل! لا يمكنك الابتعاد أكثر', 2000, 'warning');
    }

    // Mouse look
    if (this.gs.input.pointerLocked) {
      this.yaw -= this.gs.input.mouseDX * 0.002;
      this.pitch -= this.gs.input.mouseDY * 0.002;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2, Math.PI / 2);
      this.gs.input.resetMouseDelta();
    }

    // Camera
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Astronaut follows camera slightly behind
    this.astronaut.position.copy(this.playerPos);
    this.astronaut.position.add(forward.clone().multiplyScalar(-0.5));
    this.astronaut.position.y -= 0.3;
    this.astronaut.rotation.y = this.yaw;
    this.astronaut.visible = false; // First person

    // Tether update
    const tetherPoints = [new THREE.Vector3(0, 0, 0), this.playerPos.clone()];
    this.tetherGeo.setFromPoints(tetherPoints);

    // Check proximity to repair targets
    let nearTarget = null;
    this.evaTaskList.forEach(task => {
      if (task.done) return;
      const dist = this.playerPos.distanceTo(task.pos);
      task.marker.material.opacity = 0.5 + Math.sin(this.time * 3) * 0.3;
      task.ring.rotation.x = this.time;
      task.ring.rotation.y = this.time * 0.5;

      if (dist < 3) {
        nearTarget = task;
        this.gs.ui.showMessage(`اضغط F لـ${task.name}`, 500, 'info');
      }
    });

    // F key for repair
    if (input.isKey('KeyF') && nearTarget && !nearTarget.done) {
      this.repairProgress += delta * 30;
      this.gs.ui.removeElement('repair-bar');
      this.gs.ui.addElement('repair-bar', `
        <div style="position:fixed;top:60%;left:50%;transform:translateX(-50%);text-align:center;">
          <div style="color:#ffcc00;font-size:0.85rem;margin-bottom:5px;">جاري الإصلاح... ${Math.round(this.repairProgress)}%</div>
          <div style="width:200px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;">
            <div style="width:${this.repairProgress}%;height:100%;background:#ffcc00;border-radius:3px;transition:width 0.1s;"></div>
          </div>
        </div>
      `);

      if (this.repairProgress >= 100) {
        nearTarget.done = true;
        nearTarget.marker.material.color.setHex(0x00ff00);
        nearTarget.marker.material.opacity = 0.3;
        nearTarget.ring.material.color.setHex(0x00ff00);
        this.tasksCompleted++;
        this.repairProgress = 0;
        this.gs.audio.playSuccess();
        this.gs.ui.removeElement('repair-bar');
        this.gs.ui.showMessage(`✓ ${nearTarget.name} — تم بنجاح!`, 3000, 'success');

        if (this.tasksCompleted >= this.totalTasks) {
          this._evaComplete();
        }
      }
    } else {
      this.repairProgress = Math.max(0, this.repairProgress - delta * 10);
      this.gs.ui.removeElement('repair-bar');
    }

    // Earth rotation
    if (this.earth) this.earth.rotation.y += delta * 0.005;

    // ISS does not rotate since repair markers are in world space
    // this.iss.rotation.y += delta * 0.003;

    // HUD
    this.gs.ui.showHUD({
      oxygen: Math.max(0, this.oxygenTimer),
      energy: 90,
      health: this.gs.playerData.health
    });

    // Tasks remaining indicator
    this.gs.ui.removeElement('eva-tasks');
    this.gs.ui.addElement('eva-tasks', `
      <div style="position:fixed;top:70px;right:15px;background:rgba(0,15,30,0.85);
        border:1px solid rgba(0,212,255,0.2);border-radius:8px;padding:10px 15px;direction:rtl;">
        <div style="color:#00d4ff;font-size:0.75rem;margin-bottom:5px;">مهام EVA</div>
        ${this.evaTaskList.map(t =>
          `<div style="color:${t.done ? '#00ff88' : '#ff6644'};font-size:0.75rem;">
            ${t.done ? '✓' : '○'} ${t.name}
          </div>`
        ).join('')}
      </div>
    `);
  }

  _evaComplete() {
    this.gs.ui.showCenterText('EVA مكتملة!', 'عمل ممتاز! جميع الإصلاحات تمت بنجاح', 0);
    this.gs.ui.showComm('مركز التحكم', 'عمل رائع! عد إلى المحطة واستعد للعودة إلى الأرض.', 5000);

    setTimeout(() => {
      this.gs.ui.addElement('eva-continue', `
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:12px;">
          <button class="btn-space btn-space-primary" style="padding:10px 30px;" id="btn-to-return">🌍 العودة إلى الأرض</button>
          <button class="btn-space" style="padding:10px 30px;" id="btn-back-iss">🏠 العودة للمحطة</button>
        </div>
      `);
      setTimeout(() => {
        document.getElementById('btn-to-return')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('reEntry', { mode: this.mode });
        });
        document.getElementById('btn-back-iss')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('issInterior', { mode: this.mode });
        });
      }, 100);
    }, 3000);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    document.getElementById('game-canvas')?.removeEventListener('click', this._onClickLock);
    if (document.pointerLockElement) document.exitPointerLock();
    this.gs.ui.clear();
  }
}
