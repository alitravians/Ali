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
    this.dailySchedule = [];
    this.scheduleIndex = 0;
    this.dayTime = 0;
    this.emergencyActive = false;
    this.floatingObjects = [];
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

    // Ambient light
    this.scene.add(new THREE.AmbientLight(0x445566, 0.3));

    // Window view - stars
    this.starsOutside = createStarField(3000, 200);
    this.scene.add(this.starsOutside);

    // Earth visible through window
    this.earthOutside = createDetailedEarth(80);
    this.earthOutside.position.set(50, -100, -50);
    this.scene.add(this.earthOutside);

    // Floating objects (zero gravity feel)
    this._createFloatingObjects();

    // Player start position
    this.playerPos.set(0, 0, 0);
    this.playerVel.set(0, 0, 0);
    this.yaw = Math.PI;
    this.pitch = 0;
    this.tasksCompleted = 0;
    this.time = 0;
    this.dayTime = 0;

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
      this.gs.ui.showComm('مركز التحكم', 'مرحباً بك في المحطة! ابدأ بتنفيذ جدول المهام اليومي. انقر على الشاشة للتحكم بالكاميرا.', 6000);
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

  _createFloatingObjects() {
    const items = [
      { geo: new THREE.SphereGeometry(0.05, 8, 8), color: 0x3366ff, pos: [2, 0.5, 1] },
      { geo: new THREE.BoxGeometry(0.08, 0.08, 0.08), color: 0xff6633, pos: [-3, 1, -0.5] },
      { geo: new THREE.SphereGeometry(0.04, 6, 6), color: 0x33ff66, pos: [5, -0.3, 0.8] },
      { geo: new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), color: 0xffff33, pos: [-8, 0.8, -1] },
      { geo: new THREE.BoxGeometry(0.1, 0.06, 0.03), color: 0xcccccc, pos: [10, 0.2, 0.5] },
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
    const current = this.dailySchedule[this.scheduleIndex];
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
    const sections = ['مختبر', 'معيشة', 'أبحاث', 'اتصالات', 'صيانة'];
    const sectionX = [-15, -8, 0, 8, 15];
    let closest = 0;
    let minDist = Infinity;
    sectionX.forEach((x, i) => {
      const d = Math.abs(this.playerPos.x - x);
      if (d < minDist) { minDist = d; closest = i; }
    });
    this.currentSection = closest;

    const bar = sections.map((s, i) =>
      `<span style="padding:4px 12px;border-radius:12px;font-size:0.75rem;
        ${i === closest ? 'background:rgba(0,212,255,0.3);color:#00d4ff;border:1px solid rgba(0,212,255,0.4);' : 'color:#556677;'}">${s}</span>`
    ).join('');

    this.gs.ui.addElement('sections-bar', `
      <div style="position:fixed;bottom:60px;left:50%;transform:translateX(-50%);
        display:flex;gap:8px;background:rgba(0,10,20,0.7);padding:6px 12px;border-radius:20px;
        direction:rtl;">${bar}</div>
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

    // Clamp inside station
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, -18, 18);
    this.playerPos.y = THREE.MathUtils.clamp(this.playerPos.y, -2.5, 2.5);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, -2.5, 2.5);

    // Mouse look
    if (this.gs.input.pointerLocked) {
      this.yaw -= this.gs.input.mouseDX * 0.002;
      this.pitch -= this.gs.input.mouseDY * 0.002;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 3, Math.PI / 3);
      this.gs.input.resetMouseDelta();
    }

    // Camera
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

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
    if (Math.floor(this.time) % 3 === 0) this._showISSSections();

    // F key for interaction
    if (input.isKey('KeyF') && !this.activeTask) {
      const schedule = this.dailySchedule[this.scheduleIndex];
      if (schedule && schedule.task) {
        this._startTask(schedule.task);
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
      health: this.gs.playerData.health
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
