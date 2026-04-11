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
    this.totalTasks = 5;
    this.mode = 'story';
    this.evaTaskList = [];
    this.suitEquipped = true;
    this.suitPressure = 4.3; // PSI
    this.suitBattery = 100;
    this.suitCO2 = 0;
    this.currentTool = 'wrench';
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.suitEquipped = data.suitEquipped ?? true;
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

    // EVA repair tasks (more detailed and realistic)
    this.evaTaskList = [
      {
        name: 'إصلاح اللوح الشمسي — أسلاك مقطوعة',
        type: 'wiring',
        pos: new THREE.Vector3(18, 2, 8),
        done: false,
        steps: ['فحص الأسلاك التالفة', 'قص الأسلاك المحروقة', 'تعرية الأطراف الجديدة', 'توصيل الأسلاك', 'اختبار التيار'],
        currentStep: 0,
        tool: 'wire_cutter'
      },
      {
        name: 'استبدال وحدة الاتصال — لوحة إلكترونية',
        type: 'electronics',
        pos: new THREE.Vector3(-5, 4, 0),
        done: false,
        steps: ['فك البراغي', 'سحب اللوحة القديمة', 'تنظيف الموصلات', 'تركيب اللوحة الجديدة', 'تأمين البراغي'],
        currentStep: 0,
        tool: 'screwdriver'
      },
      {
        name: 'تركيب مستشعر حراري جديد',
        type: 'sensor',
        pos: new THREE.Vector3(10, 3, -5),
        done: false,
        steps: ['إزالة المستشعر القديم', 'تنظيف نقطة التركيب', 'تركيب المستشعر الجديد', 'توصيل الكابل', 'معايرة المستشعر'],
        currentStep: 0,
        tool: 'wrench'
      },
      {
        name: 'إصلاح أنبوب تبريد — تسرب سائل',
        type: 'plumbing',
        pos: new THREE.Vector3(5, -2, 10),
        done: false,
        steps: ['تحديد موقع التسرب', 'إغلاق صمام السائل', 'تطبيق مادة لاصقة فضائية', 'انتظار التجفيف', 'فتح الصمام واختبار'],
        currentStep: 0,
        tool: 'sealant'
      },
      {
        name: 'تبديل بطارية خارجية',
        type: 'battery',
        pos: new THREE.Vector3(-12, 1, -3),
        done: false,
        steps: ['فصل كابلات الطاقة', 'فك مشابك التثبيت', 'سحب البطارية القديمة', 'إدخال البطارية الجديدة', 'توصيل الكابلات', 'اختبار الجهد'],
        currentStep: 0,
        tool: 'wrench'
      }
    ];

    this.totalTasks = this.evaTaskList.length;

    // Create markers for each task
    this.evaTaskList.forEach(task => {
      // Task marker (glowing)
      const markerGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const markerColor = {
        wiring: 0xff6600,
        electronics: 0x0066ff,
        sensor: 0x00ff66,
        plumbing: 0xff0066,
        battery: 0xffff00
      }[task.type] || 0xff3300;

      const markerMat = new THREE.MeshBasicMaterial({
        color: markerColor, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(task.pos);
      this.scene.add(marker);
      task.marker = marker;

      // Tool icon ring
      const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: markerColor, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(task.pos);
      this.scene.add(ring);
      task.ring = ring;

      // Wire/cable visual near wiring tasks
      if (task.type === 'wiring') {
        for (let i = 0; i < 5; i++) {
          const wireGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 4);
          const wireColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
          const wireMat = new THREE.MeshPhongMaterial({ color: wireColors[i] });
          const wire = new THREE.Mesh(wireGeo, wireMat);
          wire.position.set(
            task.pos.x + (i - 2) * 0.1,
            task.pos.y + 0.5,
            task.pos.z
          );
          wire.rotation.z = Math.PI / 2;
          this.scene.add(wire);
        }
      }
    });

    // Tether line
    this.tetherGeo = new THREE.BufferGeometry();
    const tetherMat = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.6 });
    this.tether = new THREE.Line(this.tetherGeo, tetherMat);
    this.scene.add(this.tether);

    // Player astronaut model
    this.astronaut = this._createAstronaut();
    this.scene.add(this.astronaut);

    // Toolbox attached to astronaut (visible)
    this.toolbox = this._createToolbox();
    this.scene.add(this.toolbox);

    // Init state
    this.playerPos.set(12, 5, 5);
    this.playerVel.set(0, 0, 0);
    this.yaw = -Math.PI / 2;
    this.pitch = 0;
    this.oxygenTimer = 100;
    this.suitBattery = 100;
    this.suitCO2 = 0;
    this.tasksCompleted = 0;
    this.time = 0;
    this.repairProgress = 0;

    this._onClickLock = () => {
      this.gs.input.requestPointerLock(document.getElementById('game-canvas'));
    };
    document.getElementById('game-canvas')?.addEventListener('click', this._onClickLock);

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showChatButton();
    this.gs.ui.showCenterText('خروج إلى الفضاء', 'EVA — نشاط خارج المركبة', 3000);
    this.gs.ui.showObjective('أصلح المواقع المحددة على المحطة — أسلاك، إلكترونيات، مستشعرات');

    this.gs.ui.showControls([
      { key: 'W/↑', action: 'أمام' },
      { key: 'S/↓', action: 'خلف' },
      { key: 'A/←', action: 'يسار' },
      { key: 'D/→', action: 'يمين' },
      { key: 'Q/مسافة', action: 'أعلى' },
      { key: 'E/Shift', action: 'أسفل' },
      { key: 'F (مع الاستمرار)', action: 'إصلاح (عند الهدف)' },
    ]);

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'بدء نشاط خارج المركبة. لديك 5 مهام إصلاح. كل مهمة تتطلب عدة خطوات. راقب الأكسجين والبطارية. حظاً سعيداً!', 7000);
    }, 3500);
  }

  _createAstronaut() {
    const group = new THREE.Group();
    const suitMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, specular: 0x444444 });

    // Body (EMU suit - bulkier for EVA)
    const bodyGeo = new THREE.BoxGeometry(0.9, 1.1, 0.6);
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

    // Gold visor
    const visorGeo = new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const visorMat = new THREE.MeshPhongMaterial({
      color: 0xcc8800, transparent: true, opacity: 0.5, specular: 0xffaa00
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.7, 0.15);
    visor.rotation.x = Math.PI / 4;
    group.add(visor);

    // PLSS Backpack (Primary Life Support System - larger for EVA)
    const packGeo = new THREE.BoxGeometry(0.7, 0.9, 0.35);
    const pack = new THREE.Mesh(packGeo, suitMat);
    pack.position.set(0, 0, -0.45);
    group.add(pack);

    // PLSS oxygen tanks
    const tankGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const tankMat = new THREE.MeshPhongMaterial({ color: 0xaabbcc });
    [-0.2, 0.2].forEach(x => {
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(x, -0.1, -0.65);
      group.add(tank);
    });

    // Arms (bulkier for EVA gloves)
    const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.6, 6);
    [-1, 1].forEach(side => {
      const arm = new THREE.Mesh(armGeo, suitMat);
      arm.position.set(side * 0.55, -0.1, 0);
      arm.rotation.z = side * 0.2;
      group.add(arm);
    });

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.7, 6);
    [-1, 1].forEach(side => {
      const leg = new THREE.Mesh(legGeo, suitMat);
      leg.position.set(side * 0.2, -0.85, 0);
      group.add(leg);
    });

    // SAFER jetpack module (for emergency maneuvering)
    const saferGeo = new THREE.BoxGeometry(0.8, 0.2, 0.1);
    const saferMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const safer = new THREE.Mesh(saferGeo, saferMat);
    safer.position.set(0, -0.5, -0.65);
    group.add(safer);

    // NASA patch
    const patchGeo = new THREE.CircleGeometry(0.08, 12);
    const patchMat = new THREE.MeshBasicMaterial({ color: 0x0033aa });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(0.2, 0.3, 0.31);
    group.add(patch);

    group.scale.setScalar(0.8);
    return group;
  }

  _createToolbox() {
    const group = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.3, 0.15, 0.15);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
    group.add(new THREE.Mesh(boxGeo, boxMat));

    // Tools sticking out
    const toolGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4);
    const toolMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    for (let i = 0; i < 3; i++) {
      const tool = new THREE.Mesh(toolGeo, toolMat);
      tool.position.set(-0.1 + i * 0.1, 0.1, 0);
      tool.rotation.z = (Math.random() - 0.5) * 0.5;
      group.add(tool);
    }

    return group;
  }

  update(delta) {
    this.time += delta;
    const input = this.gs.input;

    // Suit systems drain
    this.oxygenTimer = Math.max(0, this.oxygenTimer - delta * 0.25);
    this.suitBattery = Math.max(0, this.suitBattery - delta * 0.08);
    this.suitCO2 = Math.min(5, this.suitCO2 + delta * 0.03);

    // CO2 scrubber activates periodically
    if (this.suitCO2 > 3) {
      this.suitCO2 = Math.max(0, this.suitCO2 - delta * 0.5);
    }

    if (this.oxygenTimer < 20) {
      if (!this._oxygenWarnTime || this.time - this._oxygenWarnTime > 3) {
        this._oxygenWarnTime = this.time;
        this.gs.ui.showMessage('⚠️ أكسجين منخفض! عد إلى المحطة!', 2000, 'danger');
      }
    }

    if (this.suitBattery < 15) {
      if (!this._batteryWarnTime || this.time - this._batteryWarnTime > 5) {
        this._batteryWarnTime = this.time;
        this.gs.ui.showMessage('🔋 بطارية البدلة منخفضة!', 2000, 'warning');
      }
    }

    // Movement in space (zero-G with SAFER thruster feel)
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

    // Astronaut visual
    this.astronaut.position.copy(this.playerPos);
    this.astronaut.rotation.y = this.yaw + Math.PI;
    this.astronaut.visible = true;
    this.astronaut.rotation.z = Math.sin(this.time * 0.8) * 0.05;

    // Toolbox follows astronaut
    this.toolbox.position.copy(this.playerPos).add(new THREE.Vector3(0.5, -0.3, 0));
    this.toolbox.rotation.y = this.yaw;

    // 3rd person camera
    const camDist = 3;
    const camHeight = 1.5;
    const camTarget = this.playerPos.clone()
      .sub(forward.clone().multiplyScalar(camDist))
      .add(new THREE.Vector3(0, camHeight, 0));
    this.camera.position.lerp(camTarget, delta * 6);
    this.camera.lookAt(this.playerPos.clone().add(new THREE.Vector3(0, 0.3, 0)));
    this.camera.rotation.x += this.pitch * 0.5;

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
      }
    });

    // Show proximity hint
    this.gs.ui.removeElement('eva-hint');
    if (nearTarget && !nearTarget.done) {
      const stepName = nearTarget.steps[nearTarget.currentStep];
      this.gs.ui.addElement('eva-hint', `
        <div style="position:fixed;bottom:130px;left:50%;transform:translateX(-50%);
          background:rgba(5,12,25,0.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
          border:1px solid rgba(255,136,0,0.08);border-radius:10px;
          padding:8px 16px;direction:rtl;text-align:center;">
          <div style="color:rgba(255,136,0,0.85);font-size:0.78rem;font-family:'Tajawal',sans-serif;">${nearTarget.name}</div>
          <div style="color:rgba(0,200,255,0.8);font-size:0.72rem;margin-top:3px;">استمر بالضغط على F — ${stepName}</div>
          <div style="color:rgba(100,140,180,0.4);font-size:0.62rem;">خطوة ${nearTarget.currentStep + 1} من ${nearTarget.steps.length}</div>
        </div>
      `);
    }

    // Reset progress when switching to a different task
    if (nearTarget !== this._activeRepairTask) {
      this.repairProgress = 0;
      this._activeRepairTask = nearTarget;
    }

    // F key for repair (hold to progress through steps)
    if (input.isKey('KeyF') && nearTarget && !nearTarget.done) {
      this.repairProgress += delta * 25;

      this.gs.ui.removeElement('repair-bar');
      const stepProgress = this.repairProgress % 100;
      this.gs.ui.addElement('repair-bar', `
        <div style="position:fixed;top:60%;left:50%;transform:translateX(-50%);text-align:center;">
          <div style="color:#ffcc00;font-size:0.85rem;margin-bottom:5px;">
            ${nearTarget.steps[nearTarget.currentStep]} — ${Math.round(stepProgress)}%
          </div>
          <div style="width:200px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;">
            <div style="width:${stepProgress}%;height:100%;background:linear-gradient(90deg,#ff8800,#ffcc00);border-radius:3px;transition:width 0.1s;"></div>
          </div>
          <div style="color:#557799;font-size:0.65rem;margin-top:3px;">
            🔧 أداة: ${this._getToolName(nearTarget.tool)}
          </div>
        </div>
      `);

      // Complete current step
      if (this.repairProgress >= 100) {
        this.repairProgress = 0;
        nearTarget.currentStep++;
        this.gs.audio.playBeep();

        if (nearTarget.currentStep >= nearTarget.steps.length) {
          // Task complete
          nearTarget.done = true;
          nearTarget.marker.material.color.setHex(0x00ff00);
          nearTarget.marker.material.opacity = 0.3;
          nearTarget.ring.material.color.setHex(0x00ff00);
          this.tasksCompleted++;
          this.gs.audio.playSuccess();
          this.gs.ui.removeElement('repair-bar');
          this.gs.ui.showMessage(`✓ ${nearTarget.name} — تم بنجاح!`, 3000, 'success');
          this.gs.ui.showComm('مركز التحكم', `إصلاح ممتاز! ${this.tasksCompleted}/${this.totalTasks} مهام مكتملة.`, 4000);

          if (this.tasksCompleted >= this.totalTasks) {
            this._evaComplete();
          }
        } else {
          this.gs.ui.showMessage(`✓ ${nearTarget.steps[nearTarget.currentStep - 1]} — تمت الخطوة`, 1500, 'info');
        }
      }
    } else {
      this.repairProgress = Math.max(0, this.repairProgress - delta * 10);
      this.gs.ui.removeElement('repair-bar');
    }

    // Earth rotation
    if (this.earth) this.earth.rotation.y += delta * 0.005;

    // Enhanced HUD with suit systems
    this.gs.ui.showHUD({
      oxygen: Math.max(0, this.oxygenTimer),
      energy: Math.max(0, this.suitBattery),
      health: this.gs.playerData.health
    });

    // EVA tasks panel
    this.gs.ui.removeElement('eva-tasks');
    this.gs.ui.addElement('eva-tasks', `
      <div style="position:fixed;top:70px;right:15px;background:rgba(5,12,25,0.65);
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
        border:1px solid rgba(0,150,255,0.08);border-radius:10px;padding:10px 14px;direction:rtl;max-width:220px;">
        <div style="color:rgba(0,180,255,0.8);font-size:0.7rem;margin-bottom:5px;
          font-family:'Orbitron',monospace;letter-spacing:1px;">🧑‍🚀 مهام EVA (${this.tasksCompleted}/${this.totalTasks})</div>
        ${this.evaTaskList.map(t => {
          const typeIcons = { wiring: '⚡', electronics: '🔌', sensor: '📡', plumbing: '🔧', battery: '🔋' };
          const icon = typeIcons[t.type] || '○';
          return `<div style="color:${t.done ? 'rgba(0,255,120,0.6)' : 'rgba(255,100,60,0.7)'};font-size:0.68rem;padding:1px 0;font-family:'Tajawal',sans-serif;">
            ${t.done ? '✓' : icon} ${t.name.split('—')[0].trim()}
            ${!t.done && t.currentStep > 0 ? `<span style="color:#ffaa00;font-size:0.6rem;">(${t.currentStep}/${t.steps.length})</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    `);

    // Suit systems panel
    this.gs.ui.removeElement('suit-systems');
    this.gs.ui.addElement('suit-systems', `
      <div style="position:fixed;top:70px;left:15px;background:rgba(5,12,25,0.65);
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
        border:1px solid rgba(0,100,50,0.08);border-radius:10px;padding:10px 14px;direction:rtl;">
        <div style="color:rgba(0,255,120,0.7);font-size:0.68rem;margin-bottom:5px;
          font-family:'Orbitron',monospace;letter-spacing:1px;">🧑‍🚀 أنظمة البدلة (EMU)</div>
        <div style="color:${this.oxygenTimer > 30 ? '#88ff88' : '#ff4444'};font-size:0.65rem;">O₂: ${Math.round(this.oxygenTimer)}%</div>
        <div style="color:${this.suitBattery > 20 ? '#88ff88' : '#ff4444'};font-size:0.65rem;">🔋 بطارية: ${Math.round(this.suitBattery)}%</div>
        <div style="color:${this.suitCO2 < 3 ? '#88ff88' : '#ffaa00'};font-size:0.65rem;">CO₂: ${this.suitCO2.toFixed(1)}%</div>
        <div style="color:#88aabb;font-size:0.65rem;">الضغط: ${this.suitPressure} PSI</div>
        <div style="color:#88aabb;font-size:0.65rem;">الحبل: ${this.tethered ? '✓ متصل' : '✗ منفصل'}</div>
      </div>
    `);
  }

  _getToolName(tool) {
    const names = {
      wrench: 'مفتاح ربط',
      wire_cutter: 'قاطعة أسلاك',
      screwdriver: 'مفك براغي',
      sealant: 'مادة لاصقة فضائية',
    };
    return names[tool] || tool;
  }

  _evaComplete() {
    this.gs.ui.showCenterText('EVA مكتملة!', 'جميع الإصلاحات تمت بنجاح — عمل ممتاز!', 0);
    this.gs.ui.showComm('مركز التحكم', 'عمل رائع يا رائد الفضاء! جميع الإصلاحات الخارجية اكتملت. الألواح الشمسية والاتصالات والمستشعرات تعمل بشكل مثالي. عد إلى القفل الهوائي.', 7000);

    setTimeout(() => {
      this.gs.ui.addElement('eva-continue', `
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:10px;">
          <button class="menu-btn menu-btn-primary" style="display:inline-flex;width:auto;padding:10px 22px;" id="btn-to-return">
            <div class="menu-btn-icon">🌍</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.88rem;">العودة إلى الأرض</div></div>
          </button>
          <button class="menu-btn" style="display:inline-flex;width:auto;padding:10px 22px;" id="btn-back-iss">
            <div class="menu-btn-icon">🏠</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.88rem;">العودة للمحطة</div></div>
          </button>
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
