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
    // Airlock & EVA suit state
    this.suitEquipped = false;
    this.airlockPhase = null; // null, 'equipmentLock', 'suitingUp', 'prebreathing', 'crewLock', 'depressurizing', 'ready'
    this.suitUpProgress = 0;
    this.prebreathTimer = 0;
    this.depressureTimer = 0;
    this.interactionPoints = [];
    this._fKeyWasDown = false;
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
    this.scene.add(new THREE.HemisphereLight(0xddeeff, 0x556666, 0.4));

    // Additional point lights distributed along corridor for better visibility
    const lightPositions = [
      [-20, 2.5, 0], [-10, 2.5, 0], [0, 2.5, 0], [10, 2.5, 0], [20, 2.5, 0],
      [0, 2.5, 6], [0, 2.5, -6]
    ];
    lightPositions.forEach(([x, y, z]) => {
      const pl = new THREE.PointLight(0xddeeff, 0.5, 15);
      pl.position.set(x, y, z);
      this.scene.add(pl);
    });

    // Window view - stars
    this.starsOutside = createStarField(3000, 200);
    this.scene.add(this.starsOutside);

    // Earth visible through window
    this.earthOutside = createDetailedEarth(80);
    this.earthOutside.position.set(50, -100, -50);
    this.scene.add(this.earthOutside);

    // Reset floating objects
    this.floatingObjects = [];
    this._createFloatingObjects();

    // Create visible astronaut model (3rd person)
    this._createAstronaut();

    // Create interactive points in ISS sections
    this._createInteractionPoints();

    // Create Quest Airlock visual (at end of cross corridor, -Z direction)
    this._createAirlockVisual();

    // Reset all state
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
    this.suitEquipped = false;
    this.airlockPhase = null;
    this.suitUpProgress = 0;
    this.prebreathTimer = 0;
    this.depressureTimer = 0;
    this._fKeyWasDown = false;

    // Daily schedule
    this.dailySchedule = [
      { name: 'الاستيقاظ والاستعداد', icon: '☀️', duration: 5 },
      { name: 'فحص الأنظمة الصباحي', icon: '🔍', duration: 8, task: 'systemCheck' },
      { name: 'تجربة نمو النباتات', icon: '🌱', duration: 10, task: 'plantExperiment' },
      { name: 'اتصال مع مركز التحكم', icon: '📡', duration: 5 },
      { name: 'استراحة وتناول الطعام', icon: '🍽️', duration: 5 },
      { name: 'إصلاح وحدة الطاقة', icon: '🔧', duration: 10, task: 'powerRepair' },
      { name: 'إصلاح الأسلاك الكهربائية', icon: '⚡', duration: 10, task: 'wiringRepair' },
      { name: 'تصوير الأرض', icon: '📸', duration: 8, task: 'earthPhoto' },
      { name: 'ترتيب المعدات', icon: '📦', duration: 8, task: 'organizeEquipment' },
      { name: 'مراقبة الأرض من النافذة', icon: '🌍', duration: 5 },
      { name: 'نهاية اليوم', icon: '🌙', duration: 0 },
    ];
    this.scheduleIndex = 0;

    // Request pointer lock
    this._onClickLock = () => {
      this.gs.input.requestPointerLock(document.getElementById('game-canvas'));
    };
    document.getElementById('game-canvas')?.addEventListener('click', this._onClickLock);

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showChatButton();
    this.gs.ui.showCenterText('محطة الفضاء الدولية', 'مرحباً بك على متن المحطة', 3000);

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'مرحباً بك في المحطة! استكشف الأقسام المختلفة. استخدم F للتفاعل مع الأجهزة والأزرار. للخروج للفضاء توجه لغرفة القفل الهوائي (Quest Airlock) في نهاية الممر العرضي.', 8000);
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
      { key: 'F', action: 'تفاعل / تشغيل' },
    ]);

    if (data.task === 'repair') {
      setTimeout(() => this._startTask('powerRepair'), 4000);
    } else if (data.task === 'crisis') {
      setTimeout(() => this._startEmergency(), 4000);
    }
  }

  _createAstronaut() {
    this.astronaut = new THREE.Group();

    const suitMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, specular: 0x444444, shininess: 40 });

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.6, 8);
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
      const bootGeo = new THREE.BoxGeometry(0.1, 0.06, 0.15);
      const bootMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(side * 0.12, -0.78, 0.02);
      this.astronaut.add(boot);
    });

    // Flag patch
    const patchGeo = new THREE.BoxGeometry(0.08, 0.05, 0.01);
    const patchMat = new THREE.MeshPhongMaterial({ color: 0x006633, emissive: 0x003311, emissiveIntensity: 0.3 });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(0.35, 0.1, -0.07);
    this.astronaut.add(patch);

    this.astronaut.scale.setScalar(1.2);
    this.scene.add(this.astronaut);
  }

  _createInteractionPoints() {
    this.interactionPoints = [];

    const points = [
      // Control room buttons/panels
      { pos: new THREE.Vector3(20, 0, 0), name: 'لوحة التحكم الرئيسية', type: 'panel', section: 'تحكم',
        actions: ['فحص حالة المحطة', 'مراقبة المدار', 'التواصل مع الأرض', 'ضبط الملاحة'] },
      { pos: new THREE.Vector3(22, 0.5, 1.5), name: 'نظام الاتصالات', type: 'comms', section: 'تحكم',
        actions: ['إرسال تقرير للأرض', 'استقبال تعليمات', 'فحص الإشارة'] },

      // Lab equipment
      { pos: new THREE.Vector3(-20, 0, 0), name: 'محطة المجهر', type: 'microscope', section: 'مختبر',
        actions: ['فحص عينة بيولوجية', 'تسجيل النتائج', 'إعداد شريحة جديدة'] },
      { pos: new THREE.Vector3(-18, 0, 2), name: 'حاضنة التجارب', type: 'incubator', section: 'مختبر',
        actions: ['فحص درجة الحرارة', 'مراقبة النمو', 'تعديل الإعدادات'] },

      // Living quarters
      { pos: new THREE.Vector3(-5, 0, 0), name: 'منطقة الطعام', type: 'food', section: 'معيشة',
        actions: ['تناول وجبة', 'إعداد مشروب', 'فحص المخزون'] },
      { pos: new THREE.Vector3(-3, 0, 2), name: 'نظام إعادة تدوير المياه', type: 'water', section: 'معيشة',
        actions: ['فحص جودة المياه', 'تنظيف الفلتر', 'قراءة المؤشرات'] },

      // Maintenance
      { pos: new THREE.Vector3(5, 0, 0), name: 'صندوق الأدوات', type: 'tools', section: 'صيانة',
        actions: ['اختيار أداة', 'فحص المعدات', 'ترتيب الأدوات'] },
      { pos: new THREE.Vector3(7, 0, -2), name: 'لوحة الكهرباء', type: 'electrical', section: 'صيانة',
        actions: ['فحص الدوائر', 'إصلاح الأسلاك', 'اختبار التوصيلات'] },
      { pos: new THREE.Vector3(10, -1, 1), name: 'نظام تنقية الهواء', type: 'airSystem', section: 'صيانة',
        actions: ['فحص الفلتر', 'تبديل الفلتر', 'قراءة مستوى CO2'] },

      // Research
      { pos: new THREE.Vector3(0, 0, 8), name: 'محطة الزراعة الفضائية', type: 'plants', section: 'أبحاث',
        actions: ['سقي النباتات', 'قياس النمو', 'أخذ عينات'] },
      { pos: new THREE.Vector3(2, 0, 9), name: 'جهاز الطرد المركزي', type: 'centrifuge', section: 'أبحاث',
        actions: ['تشغيل الجهاز', 'فحص العينات', 'ضبط السرعة'] },

      // Observation (Cupola)
      { pos: new THREE.Vector3(0, 0, -8), name: 'قبة المراقبة (كوبولا)', type: 'cupola', section: 'مراقبة',
        actions: ['مراقبة الأرض', 'التقاط صور', 'رصد الطقس', 'تحديد المواقع الجغرافية'] },

      // Airlock entrance
      { pos: new THREE.Vector3(0, 0, -10.5), name: 'القفل الهوائي (Quest Airlock)', type: 'airlock', section: 'مراقبة',
        actions: ['دخول القفل الهوائي'] },
    ];

    points.forEach(pt => {
      // Visual marker (glowing interaction point)
      const markerGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const markerMat = new THREE.MeshBasicMaterial({
        color: pt.type === 'airlock' ? 0xff8800 : 0x00aaff,
        transparent: true, opacity: 0.6
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(pt.pos);
      this.scene.add(marker);
      pt.marker = marker;

      // Small floating label
      const ringGeo = new THREE.TorusGeometry(0.25, 0.02, 6, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pt.type === 'airlock' ? 0xff6600 : 0x0088ff,
        transparent: true, opacity: 0.4
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pt.pos);
      this.scene.add(ring);
      pt.ring = ring;

      this.interactionPoints.push(pt);
    });
  }

  _createAirlockVisual() {
    // Quest Airlock visual representation at Z = -11 area
    const airlockGroup = new THREE.Group();

    // Equipment Lock (larger room for suit donning)
    const eqLockGeo = new THREE.CylinderGeometry(2.5, 2.5, 4, 12, 1, true);
    const eqLockMat = new THREE.MeshPhongMaterial({ color: 0x556677, side: THREE.BackSide });
    const eqLock = new THREE.Mesh(eqLockGeo, eqLockMat);
    eqLock.rotation.x = Math.PI / 2;
    eqLock.position.set(0, 0, -12);
    airlockGroup.add(eqLock);

    // EMU suits on the wall (2 suits)
    [-1, 1].forEach(side => {
      const suitGroup = new THREE.Group();
      // Suit torso (Hard Upper Torso)
      const hutGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3);
      const hutMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
      suitGroup.add(new THREE.Mesh(hutGeo, hutMat));
      // Helmet
      const helGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const hel = new THREE.Mesh(helGeo, new THREE.MeshPhongMaterial({ color: 0xdddddd }));
      hel.position.y = 0.55;
      suitGroup.add(hel);
      // PLSS backpack
      const plssGeo = new THREE.BoxGeometry(0.5, 0.6, 0.25);
      const plss = new THREE.Mesh(plssGeo, new THREE.MeshPhongMaterial({ color: 0xcccccc }));
      plss.position.set(0, 0.05, -0.25);
      suitGroup.add(plss);

      suitGroup.position.set(side * 1.5, 0, -12.5);
      suitGroup.rotation.y = side > 0 ? -Math.PI / 6 : Math.PI / 6;
      airlockGroup.add(suitGroup);
    });

    // Crew Lock (smaller, with hatch)
    const crewLockGeo = new THREE.CylinderGeometry(2, 2, 3, 12, 1, true);
    const crewLockMat = new THREE.MeshPhongMaterial({ color: 0x445566, side: THREE.BackSide });
    const crewLock = new THREE.Mesh(crewLockGeo, crewLockMat);
    crewLock.rotation.x = Math.PI / 2;
    crewLock.position.set(0, 0, -15);
    airlockGroup.add(crewLock);

    // Outer hatch (circle)
    const hatchGeo = new THREE.CircleGeometry(1.5, 16);
    const hatchMat = new THREE.MeshPhongMaterial({
      color: 0x667788, side: THREE.DoubleSide,
      emissive: 0x112233, emissiveIntensity: 0.2
    });
    const hatch = new THREE.Mesh(hatchGeo, hatchMat);
    hatch.position.set(0, 0, -16.5);
    airlockGroup.add(hatch);

    // Airlock status light
    const statusLight = new THREE.PointLight(0x00ff00, 0.5, 5);
    statusLight.position.set(0, 2, -12);
    airlockGroup.add(statusLight);
    this.airlockStatusLight = statusLight;

    // Pressure gauge (visual)
    const gaugeGeo = new THREE.CircleGeometry(0.2, 16);
    const gaugeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
    gauge.position.set(1.8, 1, -12);
    gauge.rotation.y = -Math.PI / 4;
    airlockGroup.add(gauge);

    this.scene.add(airlockGroup);
  }

  _createFloatingObjects() {
    const items = [
      { geo: new THREE.SphereGeometry(0.05, 8, 8), color: 0x3366ff, pos: [2, 0.5, 1] },
      { geo: new THREE.BoxGeometry(0.08, 0.08, 0.08), color: 0xff6633, pos: [-3, 1, -0.5] },
      { geo: new THREE.SphereGeometry(0.04, 6, 6), color: 0x33ff66, pos: [5, -0.3, 0.8] },
      { geo: new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), color: 0xffff33, pos: [-8, 0.8, -1] },
      { geo: new THREE.BoxGeometry(0.1, 0.06, 0.03), color: 0xcccccc, pos: [10, 0.2, 0.5] },
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
      { label: 'مراقبة / قفل هوائي', x: 0, z: -8 },
    ];

    let closest = 0;
    let minDist = Infinity;
    sections.forEach((s, i) => {
      const d = Math.sqrt(Math.pow(this.playerPos.x - s.x, 2) + Math.pow(this.playerPos.z - s.z, 2));
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

  _showAirlockUI() {
    this.gs.ui.removeElement('airlock-panel');

    const suitStatus = this.suitEquipped ? '<span style="color:#00ff88;">✓ البدلة مرتداة</span>' : '<span style="color:#ff6644;">✗ البدلة غير مرتداة</span>';

    let content = '';
    if (!this.airlockPhase) {
      content = `
        <div style="font-family:'Orbitron',sans-serif;color:#ff8800;font-size:1.1rem;margin-bottom:12px;text-align:center;">
          🚪 القفل الهوائي — Quest Airlock
        </div>
        <div style="color:#cceeff;font-size:0.85rem;margin-bottom:8px;">حالة البدلة: ${suitStatus}</div>
        <hr style="border:none;border-top:1px solid rgba(255,136,0,0.2);margin:10px 0;">
        <div style="color:#88aabb;font-size:0.75rem;line-height:1.8;margin-bottom:12px;">
          القفل الهوائي يتكون من قسمين:<br>
          1. غرفة المعدات (Equipment Lock) — لارتداء بدلة EMU<br>
          2. غرفة الطاقم (Crew Lock) — لتفريغ الضغط قبل الخروج
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${!this.suitEquipped ? `
            <button class="btn-space btn-space-primary" style="padding:8px 20px;" id="btn-suit-up">
              🧑‍🚀 ارتداء بدلة EMU
            </button>
          ` : `
            <button class="btn-space btn-space-primary" style="padding:8px 20px;" id="btn-enter-crewlock">
              🚀 دخول غرفة الطاقم وبدء التفريغ
            </button>
          `}
          <button class="btn-space" style="padding:8px 20px;" id="btn-close-airlock">❌ إغلاق</button>
        </div>
      `;
    } else if (this.airlockPhase === 'suitingUp') {
      content = `
        <div style="font-family:'Orbitron',sans-serif;color:#ff8800;font-size:1rem;margin-bottom:12px;text-align:center;">
          🧑‍🚀 ارتداء بدلة EMU
        </div>
        <div style="color:#cceeff;font-size:0.8rem;line-height:1.8;margin-bottom:10px;">
          <div id="suit-step" style="color:#00d4ff;">جاري ارتداء البدلة...</div>
        </div>
        <div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;">
          <div id="suit-progress-bar" style="width:${this.suitUpProgress}%;height:100%;background:linear-gradient(90deg,#ff8800,#ffaa00);border-radius:4px;transition:width 0.3s;"></div>
        </div>
        <div style="text-align:center;color:#88aabb;font-size:0.7rem;margin-top:5px;">${Math.round(this.suitUpProgress)}%</div>
      `;
    } else if (this.airlockPhase === 'prebreathing') {
      const remaining = Math.max(0, 15 - this.prebreathTimer);
      content = `
        <div style="font-family:'Orbitron',sans-serif;color:#ff8800;font-size:1rem;margin-bottom:12px;text-align:center;">
          🫁 تنفس الأكسجين النقي
        </div>
        <div style="color:#cceeff;font-size:0.8rem;margin-bottom:10px;">
          لمنع مرض تخفيف الضغط، يجب تنفس أكسجين نقي قبل EVA
        </div>
        <div style="text-align:center;font-family:'Orbitron',monospace;color:#00d4ff;font-size:2rem;">
          ${Math.ceil(remaining)} ث
        </div>
        <div style="color:#557799;font-size:0.7rem;text-align:center;">متبقي من إجراء التنفس المسبق</div>
      `;
    } else if (this.airlockPhase === 'depressurizing') {
      const remaining = Math.max(0, 10 - this.depressureTimer);
      const pressure = Math.max(0, 14.7 * (1 - this.depressureTimer / 10));
      content = `
        <div style="font-family:'Orbitron',sans-serif;color:#ff4400;font-size:1rem;margin-bottom:12px;text-align:center;">
          🔻 تفريغ الضغط
        </div>
        <div style="color:#cceeff;font-size:0.8rem;margin-bottom:10px;">
          غرفة الطاقم — جاري إزالة الهواء
        </div>
        <div style="text-align:center;font-family:'Orbitron',monospace;color:#ff6600;font-size:1.5rem;">
          ${pressure.toFixed(1)} PSI
        </div>
        <div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;margin-top:8px;">
          <div style="width:${(this.depressureTimer / 10) * 100}%;height:100%;background:linear-gradient(90deg,#00ff88,#ff4400);border-radius:4px;transition:width 0.3s;"></div>
        </div>
        <div style="color:#557799;font-size:0.7rem;text-align:center;margin-top:5px;">متبقي: ${Math.ceil(remaining)} ث</div>
      `;
    } else if (this.airlockPhase === 'ready') {
      content = `
        <div style="font-family:'Orbitron',sans-serif;color:#00ff88;font-size:1rem;margin-bottom:12px;text-align:center;">
          ✓ القفل الهوائي مفتوح!
        </div>
        <div style="color:#cceeff;font-size:0.8rem;margin-bottom:12px;">
          الضغط صفر — الفتحة الخارجية مفتوحة. جاهز للخروج إلى الفضاء!
        </div>
        <button class="btn-space btn-space-primary" style="padding:10px 25px;width:100%;" id="btn-start-eva">
          🧑‍🚀 خروج إلى الفضاء (EVA)
        </button>
      `;
    }

    this.gs.ui.addElement('airlock-panel', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,15,30,0.95);border:1px solid rgba(255,136,0,0.3);border-radius:12px;
        padding:20px 30px;min-width:380px;direction:rtl;backdrop-filter:blur(15px);">
        ${content}
      </div>
    `);

    setTimeout(() => {
      document.getElementById('btn-suit-up')?.addEventListener('click', () => {
        this.gs.audio.playBeep();
        this._startSuitingUp();
      });
      document.getElementById('btn-enter-crewlock')?.addEventListener('click', () => {
        this.gs.audio.playBeep();
        this._startPrebreathing();
      });
      document.getElementById('btn-close-airlock')?.addEventListener('click', () => {
        this.gs.audio.playBeep();
        this.gs.ui.removeElement('airlock-panel');
        this.airlockPhase = null;
      });
      document.getElementById('btn-start-eva')?.addEventListener('click', () => {
        this.gs.audio.playConfirm();
        this.gs.ui.removeElement('airlock-panel');
        this.gs.switchScene('eva', { mode: this.mode, suitEquipped: true });
      });
    }, 100);
  }

  _startSuitingUp() {
    this.airlockPhase = 'suitingUp';
    this.suitUpProgress = 0;
    this._showAirlockUI();

    const steps = [
      'ارتداء طبقة التبريد الداخلية (LCVG)',
      'دخول الجزء السفلي من البدلة',
      'تركيب الجزء العلوي الصلب (HUT)',
      'توصيل خراطيم الأكسجين والمياه',
      'ارتداء القفازات وتأمينها',
      'تركيب الخوذة وإغلاقها',
      'فحص نظام دعم الحياة (PLSS)',
      'اختبار ضغط البدلة — 4.3 PSI',
    ];

    let stepIndex = 0;
    this._suitingInterval = setInterval(() => {
      if (stepIndex >= steps.length) {
        clearInterval(this._suitingInterval);
        this._suitingInterval = null;
        this.suitEquipped = true;
        this.suitUpProgress = 100;
        this.airlockPhase = null;
        this.gs.audio.playSuccess();
        this.gs.ui.showMessage('✓ بدلة EMU مرتداة بالكامل!', 3000, 'success');
        this.gs.ui.showComm('مركز التحكم', 'بدلة EMU جاهزة. جميع الأنظمة تعمل. يمكنك الآن دخول غرفة الطاقم لبدء التفريغ.', 5000);
        this._showAirlockUI();
        return;
      }

      this.suitUpProgress = ((stepIndex + 1) / steps.length) * 100;
      const stepEl = document.getElementById('suit-step');
      const barEl = document.getElementById('suit-progress-bar');
      if (stepEl) stepEl.textContent = steps[stepIndex];
      if (barEl) barEl.style.width = `${this.suitUpProgress}%`;

      this.gs.audio.playBeep();
      stepIndex++;
    }, 1200);
  }

  _startPrebreathing() {
    this.airlockPhase = 'prebreathing';
    this.prebreathTimer = 0;
    this._showAirlockUI();
    this.gs.ui.showComm('مركز التحكم', 'بدء إجراء التنفس المسبق بالأكسجين النقي. هذا يمنع مرض تخفيف الضغط عند الانتقال من 14.7 PSI إلى 4.3 PSI.', 6000);
  }

  _startDepressurization() {
    this.airlockPhase = 'depressurizing';
    this.depressureTimer = 0;
    this._showAirlockUI();
    this.gs.audio.playWarning();
    this.gs.ui.showComm('مركز التحكم', 'بدء تفريغ ضغط غرفة الطاقم. الضغط ينخفض من 14.7 PSI إلى الفراغ. لا تقلق — البدلة تحميك!', 6000);
  }

  _showInteractionMenu(point) {
    this.gs.ui.removeElement('interact-menu');

    const actionsHTML = point.actions.map((a, i) =>
      `<button class="btn-space" style="padding:6px 15px;font-size:0.8rem;width:100%;text-align:right;" id="interact-btn-${i}">
        ${a}
      </button>`
    ).join('');

    this.gs.ui.addElement('interact-menu', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,15,30,0.92);border:1px solid rgba(0,212,255,0.3);border-radius:12px;
        padding:20px 25px;min-width:300px;direction:rtl;backdrop-filter:blur(10px);">
        <div style="font-family:'Orbitron',sans-serif;color:#00d4ff;font-size:0.95rem;margin-bottom:12px;text-align:center;">
          ${point.name}
        </div>
        <div style="color:#557799;font-size:0.7rem;margin-bottom:10px;">القسم: ${point.section}</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${actionsHTML}
        </div>
        <div style="text-align:center;margin-top:12px;">
          <button class="btn-space" style="padding:6px 20px;font-size:0.75rem;" id="interact-close">إغلاق</button>
        </div>
      </div>
    `);

    setTimeout(() => {
      point.actions.forEach((action, i) => {
        document.getElementById(`interact-btn-${i}`)?.addEventListener('click', () => {
          this.gs.audio.playBeep();
          this.gs.ui.removeElement('interact-menu');
          this.gs.ui.showMessage(`⚙️ ${action} — جاري التنفيذ...`, 2000, 'info');
          setTimeout(() => {
            this.gs.audio.playConfirm();
            this.gs.ui.showMessage(`✓ ${action} — تم بنجاح!`, 2000, 'success');
          }, 2000);
        });
      });
      document.getElementById('interact-close')?.addEventListener('click', () => {
        this.gs.audio.playBeep();
        this.gs.ui.removeElement('interact-menu');
      });
    }, 100);
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
      wiringRepair: {
        title: '⚡ إصلاح الأسلاك الكهربائية',
        steps: ['تحديد الدائرة المعطلة', 'قطع التيار عن القسم', 'فصل الأسلاك التالفة', 'توصيل أسلاك جديدة', 'اختبار التوصيل', 'إعادة التيار'],
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
          <button class="btn-space btn-space-primary" style="padding:10px 25px;" id="btn-eva">🧑‍🚀 القفل الهوائي (EVA)</button>
          <button class="btn-space" style="padding:10px 25px;" id="btn-return">🌍 بدء العودة إلى الأرض</button>
          <button class="btn-space" style="padding:10px 25px;" id="btn-explore">🔭 استمرار الاستكشاف</button>
        </div>
      `);
      setTimeout(() => {
        document.getElementById('btn-eva')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          // Go to airlock instead of directly to EVA
          this.gs.ui.removeElement('day-end');
          this.gs.ui.removeElement('center-text');
          this.playerPos.set(0, 0, -9);
          this._showAirlockUI();
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
    const inMainCorridor = Math.abs(p.z) <= 2.8;
    const inCrossCorridor = Math.abs(p.x) <= 2.8;

    if (inMainCorridor) {
      p.x = THREE.MathUtils.clamp(p.x, -26, 26);
    }
    if (inCrossCorridor) {
      p.z = THREE.MathUtils.clamp(p.z, -11, 11);
    }

    if (!inMainCorridor && !inCrossCorridor) {
      const distToMainZ = Math.abs(p.z) - 2.8;
      const distToCrossX = Math.abs(p.x) - 2.8;
      if (distToMainZ < distToCrossX) {
        p.z = THREE.MathUtils.clamp(p.z, -2.8, 2.8);
      } else {
        p.x = THREE.MathUtils.clamp(p.x, -2.8, 2.8);
      }
    }

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

    this.playerVel.multiplyScalar(0.95);
    this.playerPos.add(this.playerVel.clone().multiplyScalar(delta * 10));
    this._clampPlayerPosition();

    // Mouse look
    if (this.gs.input.pointerLocked) {
      this.yaw -= this.gs.input.mouseDX * 0.002;
      this.pitch -= this.gs.input.mouseDY * 0.002;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 3, Math.PI / 3);
      this.gs.input.resetMouseDelta();
    }

    // Update astronaut
    if (this.astronaut) {
      this.astronaut.position.copy(this.playerPos);
      this.astronaut.rotation.y = this.yaw + Math.PI;
      this.astronaut.position.y += Math.sin(this.time * 1.5) * 0.02;
      this.astronaut.rotation.z = Math.sin(this.time * 0.8) * 0.03;
    }

    // 3rd person camera
    const camDistance = 2.0;
    const camHeight = 0.8;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const targetCamPos = this.playerPos.clone()
      .sub(fwd.clone().multiplyScalar(camDistance))
      .add(new THREE.Vector3(0, camHeight, 0));

    const inMainForCam = Math.abs(targetCamPos.z) <= 2.8;
    const inCrossForCam = Math.abs(targetCamPos.x) <= 2.8;
    if (inMainForCam) targetCamPos.x = THREE.MathUtils.clamp(targetCamPos.x, -26, 26);
    if (inCrossForCam) targetCamPos.z = THREE.MathUtils.clamp(targetCamPos.z, -11, 11);
    if (!inMainForCam && !inCrossForCam) {
      if (Math.abs(targetCamPos.z) - 2.8 < Math.abs(targetCamPos.x) - 2.8) {
        targetCamPos.z = THREE.MathUtils.clamp(targetCamPos.z, -2.8, 2.8);
      } else {
        targetCamPos.x = THREE.MathUtils.clamp(targetCamPos.x, -2.8, 2.8);
      }
    }
    targetCamPos.y = THREE.MathUtils.clamp(targetCamPos.y, -2.3, 2.5);

    this.camera.position.lerp(targetCamPos, delta * 8);
    const lookTarget = this.playerPos.clone().add(new THREE.Vector3(0, 0.3, 0));
    this.camera.lookAt(lookTarget);
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

    // Interaction point markers pulse
    this.interactionPoints.forEach(pt => {
      if (pt.marker) {
        pt.marker.material.opacity = 0.4 + Math.sin(this.time * 3) * 0.2;
      }
      if (pt.ring) {
        pt.ring.rotation.x = this.time;
        pt.ring.rotation.z = this.time * 0.5;
      }
    });

    // Check nearby interaction points
    let nearPoint = null;
    let nearDist = Infinity;
    this.interactionPoints.forEach(pt => {
      const d = this.playerPos.distanceTo(pt.pos);
      if (d < 3 && d < nearDist) {
        nearDist = d;
        nearPoint = pt;
      }
    });

    // Show proximity hint
    this.gs.ui.removeElement('interact-hint');
    if (nearPoint && !this.activeTask && !this.airlockPhase) {
      this.gs.ui.addElement('interact-hint', `
        <div style="position:fixed;bottom:120px;left:50%;transform:translateX(-50%);
          background:rgba(0,15,30,0.8);border:1px solid rgba(0,212,255,0.3);border-radius:8px;
          padding:8px 15px;direction:rtl;">
          <span style="color:#00d4ff;font-size:0.8rem;">اضغط F — ${nearPoint.name}</span>
        </div>
      `);
    }

    // F key for interaction (only on key-down)
    const fKeyDown = input.isKey('KeyF');
    if (fKeyDown && !this._fKeyWasDown && !this.activeTask) {
      if (nearPoint) {
        if (nearPoint.type === 'airlock') {
          this._showAirlockUI();
        } else {
          this._showInteractionMenu(nearPoint);
        }
      } else {
        const schedule = this.dailySchedule[this.scheduleIndex];
        if (schedule && schedule.task) {
          this._startTask(schedule.task);
        } else if (schedule && !schedule.task) {
          this.gs.ui.showMessage(`${schedule.icon} ${schedule.name}`, 1500, 'info');
          this._advanceSchedule();
        }
      }
    }
    this._fKeyWasDown = fKeyDown;

    // Airlock phase timers
    if (this.airlockPhase === 'prebreathing') {
      this.prebreathTimer += delta;
      if (Math.floor(this.prebreathTimer) % 3 === 0 && Math.floor(this.prebreathTimer) !== Math.floor(this.prebreathTimer - delta)) {
        this._showAirlockUI();
      }
      if (this.prebreathTimer >= 15) {
        this.gs.audio.playConfirm();
        this.gs.ui.showMessage('✓ إجراء التنفس المسبق مكتمل!', 2000, 'success');
        this._startDepressurization();
      }
    }

    if (this.airlockPhase === 'depressurizing') {
      this.depressureTimer += delta;
      if (Math.floor(this.depressureTimer) % 2 === 0 && Math.floor(this.depressureTimer) !== Math.floor(this.depressureTimer - delta)) {
        this._showAirlockUI();
      }
      // Airlock status light changes to red during depressurization
      if (this.airlockStatusLight) {
        this.airlockStatusLight.color.setHex(0xff0000);
      }
      if (this.depressureTimer >= 10) {
        this.airlockPhase = 'ready';
        this.gs.audio.playSuccess();
        this.gs.ui.showComm('مركز التحكم', 'الضغط صفر! الفتحة الخارجية مفتوحة. يمكنك الخروج الآن. حظاً سعيداً!', 5000);
        this._showAirlockUI();
      }
    }

    // Emergency oxygen drain
    if (this.emergencyActive) {
      this.gs.playerData.oxygen -= delta * 0.5;
      if (this.gs.playerData.oxygen <= 0) {
        this.gs.playerData.oxygen = 0;
        if (!this._oxygenCriticalWarnTime || this.time - this._oxygenCriticalWarnTime > 3) {
          this._oxygenCriticalWarnTime = this.time;
          this.gs.ui.showMessage('⚠️ مستوى الأكسجين حرج!', 2000, 'danger');
        }
      }
    }

    // Suit status indicator
    this.gs.ui.removeElement('suit-status');
    if (this.suitEquipped) {
      this.gs.ui.addElement('suit-status', `
        <div style="position:fixed;top:70px;left:15px;background:rgba(0,50,0,0.5);
          border:1px solid rgba(0,255,0,0.3);border-radius:6px;padding:5px 10px;">
          <span style="color:#00ff88;font-size:0.7rem;">🧑‍🚀 بدلة EMU — نشطة</span>
        </div>
      `);
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
    if (this._suitingInterval) {
      clearInterval(this._suitingInterval);
      this._suitingInterval = null;
    }
    if (document.pointerLockElement) document.exitPointerLock();
    this.gs.ui.clear();
  }
}
