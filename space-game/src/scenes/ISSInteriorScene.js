import * as THREE from 'three';
import { createISSInterior } from '../objects/ISS.js';
import { createDetailedEarth } from '../objects/Earth.js';
import { createStarField } from '../objects/Stars.js';

export class ISSInteriorScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.interior = null;
    this.time = 0;
    this.mode = 'story';
    this.playerPos = new THREE.Vector3(0, 0, 0);
    this.playerVel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.currentSection = 0;
    this.tasksCompleted = 0;
    this.totalTasks = 5;
    this.activeTask = null;
    this.currentTaskData = null;
    this.dailySchedule = [];
    this.scheduleIndex = 0;
    this.dayTime = 0;
    this.emergencyActive = false;
    this.floatingObjects = [];
    this.astronaut = null;
    this.currentRoom = '';
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111115);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 500);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // ISS Interior
    this.interior = createISSInterior();
    this.scene.add(this.interior);

    // Much brighter ambient lighting
    this.scene.add(new THREE.AmbientLight(0x889aaa, 0.7));
    // Hemisphere light for natural feel
    this.scene.add(new THREE.HemisphereLight(0xddeeff, 0x556666, 0.4));

    // Window view - stars
    this.starsOutside = createStarField(3000, 200);
    this.scene.add(this.starsOutside);

    // Earth visible through window
    this.earthOutside = createDetailedEarth(80);
    this.earthOutside.position.set(50, -100, -50);
    this.scene.add(this.earthOutside);

    // Reset floating objects array to prevent duplicates on replay
    this.floatingObjects = [];
    this._createFloatingObjects();

    // Create visible astronaut model (3rd person)
    this._createAstronaut();

    // Reset all state for clean re-entry
    this.playerPos.set(0, 0, 0);
    this.playerVel.set(0, 0, 0);
    this.yaw = Math.PI;
    this.pitch = 0;
    this.tasksCompleted = 0;
    this.time = 0;
    this.dayTime = 0;
    this.emergencyActive = false;
    this.activeTask = null;
    this.currentTaskData = null;
    this.currentRoom = 'معيشة';

    // Daily schedule
    this.dailySchedule = [
      { name: 'الاستيقاظ والاستعداد', icon: '☀️', duration: 5 },
      { name: 'فحص الأنظمة الصباحي', icon: '🔍', duration: 8, task: 'systemCheck' },
      { name: 'تجربة نمو النباتات', icon: '🌱', duration: 10, task: 'plantExperiment' },
      { name: 'اتصال مع مركز التحكم', icon: '📡', duration: 5 },
      { name: 'استراحة وتناول الطعام', icon: '🍽️', duration: 5 },
      { name: 'إصلاح وحدة الطاقة', icon: '🔧', duration: 10, task: 'powerRepair' },
      { name: 'تصوير الأرض', icon: '📸', duration: 8, task: 'earthPhoto' },
      { name: 'ترتيب المعدات', icon: '📦', duration: 8, task: 'organizeEquipment' },
      { name: 'مراقبة الأرض من النافذة', icon: '🌍', duration: 5 },
      { name: 'نهاية اليوم', icon: '🌙', duration: 0 },
    ];
    this.scheduleIndex = 0;

    // Request pointer lock on click
    this._onClickLock = () => {
      this.gs.input.requestPointerLock(document.getElementById('game-canvas'));
    };
    document.getElementById('game-canvas')?.addEventListener('click', this._onClickLock);

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('محطة الفضاء الدولية', 'مرحباً بك على متن المحطة', 3000);

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'مرحباً بك في المحطة! استكشف الأقسام المختلفة. الممر الرئيسي يمتد يميناً ويساراً، والممر العرضي يمتد أماماً وخلفاً.', 7000);
      this._showSchedule();
      this._showISSSections();
    }, 3500);

    this.gs.ui.showControls([
      { key: 'W/↑', action: 'أمام' },
      { key: 'S/↓', action: 'خلف' },
      { key: 'A/←', action: 'يسار' },
      { key: 'D/→', action: 'يمين' },
      { key: 'Q/مسافة', action: 'أعلى (انعدام الجاذبية)' },
      { key: 'E/Shift', action: 'أسفل' },
      { key: 'F', action: 'تفاعل' },
    ]);

    // Handle challenge mode
    if (data.task === 'repair') {
      setTimeout(() => this._startTask('powerRepair'), 4000);
    } else if (data.task === 'crisis') {
      setTimeout(() => this._startEmergency(), 4000);
    }
  }

  _createAstronaut() {
    this.astronaut = new THREE.Group();

    // Spacesuit body (torso)
    const torsoGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.6, 8);
    const suitMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, specular: 0x444444, shininess: 40 });
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    this.astronaut.add(torso);

    // Helmet
    const helmetGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const helmetMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, specular: 0x888888, shininess: 100 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.45;
    this.astronaut.add(helmet);

    // Gold visor
    const visorGeo = new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const visorMat = new THREE.MeshPhongMaterial({
      color: 0xcc8800, specular: 0xffaa00, shininess: 150,
      transparent: true, opacity: 0.7
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.y = 0.48;
    visor.rotation.x = Math.PI * 0.3;
    this.astronaut.add(visor);

    // Life support backpack
    const packGeo = new THREE.BoxGeometry(0.3, 0.4, 0.15);
    const packMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 0.05, 0.2);
    this.astronaut.add(pack);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.5, 6);
    [-1, 1].forEach(side => {
      const arm = new THREE.Mesh(armGeo, suitMat);
      arm.position.set(side * 0.32, -0.05, 0);
      arm.rotation.z = side * 0.3;
      this.astronaut.add(arm);

      // Gloves
      const gloveGeo = new THREE.SphereGeometry(0.06, 6, 6);
      const gloveMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
      const glove = new THREE.Mesh(gloveGeo, gloveMat);
      glove.position.set(side * 0.4, -0.28, 0);
      this.astronaut.add(glove);
    });

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.5, 6);
    [-1, 1].forEach(side => {
      const leg = new THREE.Mesh(legGeo, suitMat);
      leg.position.set(side * 0.12, -0.52, 0);
      this.astronaut.add(leg);

      // Boots
      const bootGeo = new THREE.BoxGeometry(0.1, 0.06, 0.15);
      const bootMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(side * 0.12, -0.78, 0.02);
      this.astronaut.add(boot);
    });

    // Flag patch (small colored square on arm)
    const patchGeo = new THREE.BoxGeometry(0.08, 0.05, 0.01);
    const patchMat = new THREE.MeshPhongMaterial({ color: 0x006633, emissive: 0x003311, emissiveIntensity: 0.3 });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(0.35, 0.1, -0.07);
    this.astronaut.add(patch);

    this.astronaut.scale.setScalar(1.2);
    this.scene.add(this.astronaut);
  }

  _createFloatingObjects() {
    const items = [
      { geo: new THREE.SphereGeometry(0.05, 8, 8), color: 0x3366ff, pos: [2, 0.5, 1] },
      { geo: new THREE.BoxGeometry(0.08, 0.08, 0.08), color: 0xff6633, pos: [-3, 1, -0.5] },
      { geo: new THREE.SphereGeometry(0.04, 6, 6), color: 0x33ff66, pos: [5, -0.3, 0.8] },
      { geo: new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), color: 0xffff33, pos: [-8, 0.8, -1] },
      { geo: new THREE.BoxGeometry(0.1, 0.06, 0.03), color: 0xcccccc, pos: [10, 0.2, 0.5] },
      // More floating objects in cross corridor
      { geo: new THREE.SphereGeometry(0.03, 6, 6), color: 0xff33ff, pos: [0, 0.4, 6] },
      { geo: new THREE.BoxGeometry(0.06, 0.06, 0.06), color: 0x33ffff, pos: [1, -0.2, -5] },
      { geo: new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), color: 0xff9933, pos: [-1, 0.6, 8] },
    ];
    items.forEach(item => {
      const mesh = new THREE.Mesh(item.geo, new THREE.MeshPhongMaterial({ color: item.color }));
      mesh.position.set(...item.pos);
      mesh.userData.floatSpeed = { x: Math.random() * 0.3, y: Math.random() * 0.2, z: Math.random() * 0.3 };
      mesh.userData.floatPhase = Math.random() * Math.PI * 2;
      this.scene.add(mesh);
      this.floatingObjects.push(mesh);
    });
  }

  _showSchedule() {
    this.gs.ui.removeElement('schedule');
    const items = this.dailySchedule.map((s, i) => {
      const state = i < this.scheduleIndex ? 'done' : i === this.scheduleIndex ? 'current' : 'pending';
      const color = state === 'done' ? '#00ff88' : state === 'current' ? '#00d4ff' : '#556677';
      const icon = state === 'done' ? '✓' : s.icon;
      return `<div style="color:${color};font-size:0.7rem;padding:2px 0;${state === 'current' ? 'font-weight:bold;' : ''}">${icon} ${s.name}</div>`;
    }).join('');

    this.gs.ui.addElement('schedule', `
      <div style="position:fixed;top:70px;right:15px;background:rgba(0,15,30,0.85);
        border:1px solid rgba(0,212,255,0.2);border-radius:8px;padding:10px 15px;
        max-width:200px;direction:rtl;backdrop-filter:blur(5px);">
        <div style="color:#00d4ff;font-size:0.75rem;margin-bottom:5px;font-family:'Orbitron',monospace;">📋 جدول اليوم</div>
        ${items}
      </div>
    `);
  }

  _showISSSections() {
    this.gs.ui.removeElement('sections-bar');
    const sections = [
      { label: 'مختبر', x: -20, z: 0 },
      { label: 'معيشة', x: -5, z: 0 },
      { label: 'صيانة', x: 5, z: 0 },
      { label: 'تحكم', x: 20, z: 0 },
      { label: 'أبحاث', x: 0, z: 8 },
      { label: 'مراقبة', x: 0, z: -8 },
    ];

    let closest = 0;
    let minDist = Infinity;
    sections.forEach((s, i) => {
      const d = Math.sqrt(
        Math.pow(this.playerPos.x - s.x, 2) +
        Math.pow(this.playerPos.z - s.z, 2)
      );
      if (d < minDist) { minDist = d; closest = i; }
    });
    this.currentSection = closest;
    this.currentRoom = sections[closest].label;

    const bar = sections.map((s, i) =>
      `<span style="padding:4px 12px;border-radius:12px;font-size:0.75rem;
        ${i === closest ? 'background:rgba(0,212,255,0.3);color:#00d4ff;border:1px solid rgba(0,212,255,0.4);' : 'color:#556677;'}">${s.label}</span>`
    ).join('');

    this.gs.ui.addElement('sections-bar', `
      <div style="position:fixed;bottom:60px;left:50%;transform:translateX(-50%);
        display:flex;gap:8px;background:rgba(0,10,20,0.7);padding:6px 12px;border-radius:20px;
        direction:rtl;flex-wrap:wrap;justify-content:center;">${bar}</div>
    `);
  }

  _startTask(taskType) {
    this.activeTask = taskType;
    this.gs.ui.removeElement('task-panel');

    const tasks = {
      systemCheck: {
        title: '🔍 فحص الأنظمة',
        steps: ['فحص ضغط الهواء', 'فحص مستوى الأكسجين', 'فحص درجة الحرارة', 'فحص الاتصالات'],
        current: 0
      },
      plantExperiment: {
        title: '🌱 تجربة النباتات',
        steps: ['سقي النباتات', 'قياس النمو', 'تسجيل الملاحظات', 'التقاط صور'],
        current: 0
      },
      powerRepair: {
        title: '🔧 إصلاح وحدة الطاقة',
        steps: ['تحديد العطل', 'فصل الوحدة المعطلة', 'تركيب البديل', 'اختبار التشغيل'],
        current: 0
      },
      earthPhoto: {
        title: '📸 تصوير الأرض',
        steps: ['التوجه للنافذة', 'ضبط الكاميرا', 'التقاط الصور', 'إرسال للأرض'],
        current: 0
      },
      organizeEquipment: {
        title: '📦 ترتيب المعدات',
        steps: ['فرز المعدات', 'تخزين العينات', 'تحديث السجل', 'تأمين الحمولة'],
        current: 0
      }
    };

    const task = tasks[taskType];
    if (!task) return;

    this.currentTaskData = task;
    this._renderTaskPanel(task);
  }

  _renderTaskPanel(task) {
    this.gs.ui.removeElement('task-panel');
    const stepsHTML = task.steps.map((s, i) => {
      const state = i < task.current ? '✓' : i === task.current ? '▶' : '○';
      const color = i < task.current ? '#00ff88' : i === task.current ? '#00d4ff' : '#556677';
      return `<div style="color:${color};font-size:0.85rem;padding:3px 0;">${state} ${s}</div>`;
    }).join('');

    this.gs.ui.addElement('task-panel', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,15,30,0.92);border:1px solid rgba(0,212,255,0.3);border-radius:12px;
        padding:20px 30px;min-width:320px;direction:rtl;backdrop-filter:blur(10px);">
        <div style="font-family:'Orbitron',sans-serif;color:#00d4ff;font-size:1.1rem;margin-bottom:12px;text-align:center;">
          ${task.title}
        </div>
        ${stepsHTML}
        <div style="text-align:center;margin-top:15px;">
          ${task.current < task.steps.length ?
            `<button class="btn-space btn-space-primary" style="padding:8px 25px;" id="btn-do-step">
              تنفيذ: ${task.steps[task.current]}
            </button>` :
            `<div style="color:#00ff88;font-size:1rem;margin:10px 0;">✓ المهمة مكتملة!</div>
            <button class="btn-space" style="padding:8px 25px;" id="btn-close-task">إغلاق</button>`
          }
        </div>
      </div>
    `);

    setTimeout(() => {
      document.getElementById('btn-do-step')?.addEventListener('click', () => {
        this.gs.audio.playBeep();
        task.current++;
        if (task.current >= task.steps.length) {
          this.tasksCompleted++;
          this.gs.audio.playSuccess();
          this.gs.ui.showMessage('✓ تم إكمال المهمة بنجاح!', 2000, 'success');
          // Stop emergency if repair was the emergency task
          if (this.emergencyActive) {
            this.emergencyActive = false;
            this.gs.playerData.oxygen = Math.max(this.gs.playerData.oxygen, 70);
            this.gs.ui.showComm('مركز التحكم', 'تم إصلاح التسرب بنجاح! مستوى الأكسجين مستقر.', 4000);
          }
          this._advanceSchedule();
        }
        this._renderTaskPanel(task);
      });
      document.getElementById('btn-close-task')?.addEventListener('click', () => {
        this.gs.ui.removeElement('task-panel');
        this.activeTask = null;
      });
    }, 100);
  }

  _advanceSchedule() {
    this.scheduleIndex++;
    // Skip non-task items automatically
    while (this.scheduleIndex < this.dailySchedule.length - 1 && !this.dailySchedule[this.scheduleIndex].task) {
      const skipped = this.dailySchedule[this.scheduleIndex];
      this.gs.ui.showMessage(`${skipped.icon} ${skipped.name}`, 1500, 'info');
      this.scheduleIndex++;
    }
    if (this.scheduleIndex >= this.dailySchedule.length - 1) {
      this._showDayComplete();
    } else {
      this._showSchedule();
      const next = this.dailySchedule[this.scheduleIndex];
      if (next.task) {
        setTimeout(() => {
          this.gs.ui.showComm('مركز التحكم', `المهمة التالية: ${next.name}. اضغط F للتفاعل.`, 4000);
        }, 1000);
      }
    }
  }

  _showDayComplete() {
    this.gs.ui.removeElement('schedule');
    this.gs.ui.showCenterText('انتهى اليوم', `أكملت ${this.tasksCompleted} مهام`, 0);

    setTimeout(() => {
      this.gs.ui.addElement('day-end', `
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
          <button class="btn-space btn-space-primary" style="padding:10px 25px;" id="btn-eva">🧑‍🚀 خروج إلى الفضاء (EVA)</button>
          <button class="btn-space" style="padding:10px 25px;" id="btn-return">🌍 بدء العودة إلى الأرض</button>
          <button class="btn-space" style="padding:10px 25px;" id="btn-explore">🔭 استمرار الاستكشاف</button>
        </div>
      `);
      setTimeout(() => {
        document.getElementById('btn-eva')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('eva', { mode: this.mode });
        });
        document.getElementById('btn-return')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('reEntry', { mode: this.mode });
        });
        document.getElementById('btn-explore')?.addEventListener('click', () => {
          this.gs.audio.playBeep();
          this.gs.ui.removeElement('day-end');
          this.gs.ui.removeElement('center-text');
          this.scheduleIndex = 0;
          this.tasksCompleted = 0;
          this._showSchedule();
        });
      }, 100);
    }, 2000);
  }

  _startEmergency() {
    this.emergencyActive = true;
    this.gs.audio.playWarning();
    this.gs.ui.showMessage('⚠️ تنبيه! تسرب هواء في قسم الصيانة!', 5000, 'danger');
    this.gs.ui.showObjective('أصلح التسرب قبل انخفاض الأكسجين!');
    this.gs.playerData.oxygen = 85;

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'تسرب هواء! توجه فوراً إلى قسم الصيانة واستخدم مجموعة الإصلاح!', 5000);
    }, 1000);

    this._startTask('powerRepair');
  }

  _clampPlayerPosition() {
    const p = this.playerPos;

    // Cross-shaped station: main corridor along X, cross corridor along Z
    const inMainCorridor = Math.abs(p.z) <= 2.8;
    const inCrossCorridor = Math.abs(p.x) <= 2.8;

    if (inMainCorridor) {
      p.x = THREE.MathUtils.clamp(p.x, -26, 26);
    }
    if (inCrossCorridor) {
      p.z = THREE.MathUtils.clamp(p.z, -11, 11);
    }

    // If player is outside both corridors, push back to nearest valid position
    if (!inMainCorridor && !inCrossCorridor) {
      // Find closest corridor and snap to it
      const distToMainZ = Math.abs(p.z) - 2.8;
      const distToCrossX = Math.abs(p.x) - 2.8;
      if (distToMainZ < distToCrossX) {
        p.z = THREE.MathUtils.clamp(p.z, -2.8, 2.8);
      } else {
        p.x = THREE.MathUtils.clamp(p.x, -2.8, 2.8);
      }
    }

    // Keep within cylinder radius (roughly)
    const distFromCenter = Math.sqrt(p.y * p.y +
      (inMainCorridor ? p.z * p.z : 0) +
      (inCrossCorridor && !inMainCorridor ? p.x * p.x : 0)
    );

    p.y = THREE.MathUtils.clamp(p.y, -2.5, 2.5);
  }

  update(delta) {
    this.time += delta;
    this.dayTime += delta;
    const input = this.gs.input;

    // Zero-gravity movement
    const moveSpeed = 3;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    if (input.isForward()) this.playerVel.add(forward.clone().multiplyScalar(moveSpeed * delta));
    if (input.isBackward()) this.playerVel.add(forward.clone().multiplyScalar(-moveSpeed * delta));
    if (input.isLeft()) this.playerVel.add(right.clone().multiplyScalar(-moveSpeed * delta));
    if (input.isRight()) this.playerVel.add(right.clone().multiplyScalar(moveSpeed * delta));
    if (input.isUp()) this.playerVel.y += moveSpeed * delta;
    if (input.isDown()) this.playerVel.y -= moveSpeed * delta;

    // Zero-G damping (slow float)
    this.playerVel.multiplyScalar(0.95);

    // Apply velocity
    this.playerPos.add(this.playerVel.clone().multiplyScalar(delta * 10));

    // Cross-shaped station bounds
    this._clampPlayerPosition();

    // Mouse look
    if (this.gs.input.pointerLocked) {
      this.yaw -= this.gs.input.mouseDX * 0.002;
      this.pitch -= this.gs.input.mouseDY * 0.002;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 3, Math.PI / 3);
      this.gs.input.resetMouseDelta();
    }

    // Update astronaut position and rotation
    if (this.astronaut) {
      this.astronaut.position.copy(this.playerPos);
      this.astronaut.rotation.y = this.yaw + Math.PI; // face forward direction

      // Gentle floating animation for zero-G feel
      this.astronaut.position.y += Math.sin(this.time * 1.5) * 0.02;
      this.astronaut.rotation.z = Math.sin(this.time * 0.8) * 0.03;
    }

    // 3rd person camera - behind and above the astronaut
    const camDistance = 2.0;
    const camHeight = 0.8;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const targetCamPos = this.playerPos.clone()
      .sub(fwd.clone().multiplyScalar(camDistance))
      .add(new THREE.Vector3(0, camHeight, 0));

    // Clamp camera inside station too
    const inMainForCam = Math.abs(targetCamPos.z) <= 2.8;
    const inCrossForCam = Math.abs(targetCamPos.x) <= 2.8;
    if (inMainForCam) {
      targetCamPos.x = THREE.MathUtils.clamp(targetCamPos.x, -26, 26);
    }
    if (inCrossForCam) {
      targetCamPos.z = THREE.MathUtils.clamp(targetCamPos.z, -11, 11);
    }
    if (!inMainForCam && !inCrossForCam) {
      if (Math.abs(targetCamPos.z) - 2.8 < Math.abs(targetCamPos.x) - 2.8) {
        targetCamPos.z = THREE.MathUtils.clamp(targetCamPos.z, -2.8, 2.8);
      } else {
        targetCamPos.x = THREE.MathUtils.clamp(targetCamPos.x, -2.8, 2.8);
      }
    }
    targetCamPos.y = THREE.MathUtils.clamp(targetCamPos.y, -2.3, 2.5);

    // Smooth camera follow
    this.camera.position.lerp(targetCamPos, delta * 8);

    // Camera looks at player with slight pitch offset
    const lookTarget = this.playerPos.clone().add(new THREE.Vector3(0, 0.3, 0));
    this.camera.lookAt(lookTarget);

    // Apply pitch to camera
    this.camera.rotation.x += this.pitch * 0.5;

    // Floating objects animation
    this.floatingObjects.forEach(obj => {
      const s = obj.userData.floatSpeed;
      const p = obj.userData.floatPhase;
      obj.position.y += Math.sin(this.time * s.y + p) * 0.001;
      obj.position.x += Math.sin(this.time * s.x + p) * 0.0005;
      obj.rotation.x += delta * s.x;
      obj.rotation.z += delta * s.z;
    });

    // Earth rotation outside
    if (this.earthOutside) this.earthOutside.rotation.y += delta * 0.01;

    // Sections update
    if (Math.floor(this.time * 2) % 3 === 0) this._showISSSections();

    // F key for interaction
    if (input.isKey('KeyF') && !this.activeTask) {
      const schedule = this.dailySchedule[this.scheduleIndex];
      if (schedule && schedule.task) {
        this._startTask(schedule.task);
      } else if (schedule && !schedule.task) {
        this.gs.ui.showMessage(`${schedule.icon} ${schedule.name}`, 1500, 'info');
        this._advanceSchedule();
      }
    }

    // Emergency oxygen drain
    if (this.emergencyActive) {
      this.gs.playerData.oxygen -= delta * 0.5;
      if (this.gs.playerData.oxygen <= 0) {
        this.gs.playerData.oxygen = 0;
        this.gs.ui.showMessage('⚠️ مستوى الأكسجين حرج!', 2000, 'danger');
      }
    }

    // HUD
    this.gs.ui.showHUD({
      oxygen: this.gs.playerData.oxygen,
      energy: 95,
      health: this.gs.playerData.health,
      section: this.currentRoom
    });
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
