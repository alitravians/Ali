import * as THREE from 'three';
import { createDetailedEarth } from '../objects/Earth.js';
import { createStarField, createSun, createMilkyWay } from '../objects/Stars.js';

export class MainMenuScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.earth = null;
    this.time = 0;
    this.iss = null;
    this.issOrbitAngle = 0;
    this.shootingStars = [];
    this.nebulaClouds = [];
  }

  async init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.camera.position.set(0, 30, 120);
    this.camera.lookAt(0, 0, 0);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    this.scene.background = new THREE.Color(0x020408);

    this.scene.add(createStarField(12000, 1500));
    this.scene.add(createStarField(4000, 800));
    this.scene.add(createMilkyWay());

    this._createNebulaClouds();

    const sun = createSun();
    sun.position.set(300, 150, -500);
    this.scene.add(sun);

    this.earth = createDetailedEarth(50);
    this.earth.position.set(0, -25, 0);
    this.scene.add(this.earth);

    this._createMiniISS();
    this._initShootingStars();

    this.scene.fog = new THREE.FogExp2(0x020408, 0.0006);

    this.gs.ui.addGlobalStyles();
    this.gs.ui.clear();
    this._showMenu();
    this.time = 0;
  }

  _createNebulaClouds() {
    const nebulaColors = [
      { color: 0x1a0520, pos: [200, 100, -400] },
      { color: 0x0a1520, pos: [-300, -50, -500] },
      { color: 0x150a05, pos: [100, -100, -600] },
    ];
    nebulaColors.forEach(n => {
      const geo = new THREE.SphereGeometry(80, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: n.color, transparent: true, opacity: 0.12,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...n.pos);
      mesh.scale.set(2, 1, 1.5);
      this.scene.add(mesh);
      this.nebulaClouds.push(mesh);
    });
  }

  _createMiniISS() {
    this.iss = new THREE.Group();
    const trussMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, specular: 0x666666, shininess: 60 });
    const truss = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 0.15), trussMat);
    this.iss.add(truss);
    const modMat = new THREE.MeshPhongMaterial({ color: 0xeeeedd, specular: 0x444444, shininess: 40 });
    [0, -0.5, 0.5].forEach(z => {
      const mod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8), modMat);
      mod.position.set(0, 0, z);
      mod.rotation.x = Math.PI / 2;
      this.iss.add(mod);
    });
    const panelMat = new THREE.MeshPhongMaterial({
      color: 0x2244aa, specular: 0x88aaff, shininess: 100,
      emissive: 0x111133, emissiveIntensity: 0.3
    });
    [-2.5, -1.5, 1.5, 2.5].forEach(x => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.5), panelMat);
      panel.position.set(x, 0, 0);
      this.iss.add(panel);
    });
    const radMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x222222 });
    [-1, 1].forEach(x => {
      const rad = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.01, 0.3), radMat);
      rad.position.set(x, 0.1, 0);
      this.iss.add(rad);
    });
    this.iss.scale.setScalar(0.6);
    this.scene.add(this.iss);
  }

  _initShootingStars() {
    for (let i = 0; i < 3; i++) {
      this._addShootingStar();
    }
  }

  _addShootingStar() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xff9500, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.shootingStars.push({
      line, timer: Math.random() * 20 + 5,
      active: false, life: 0, maxLife: 0.8 + Math.random() * 0.5,
      startPos: new THREE.Vector3(), dir: new THREE.Vector3(), speed: 200 + Math.random() * 300
    });
  }

  _showMenu() {
    this.gs.ui.clear();
    this.gs.ui.addElement('main-menu', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;
        align-items:center;justify-content:center;direction:rtl;">
        
        <!-- Top bar -->
        <div style="position:fixed;top:0;left:0;right:0;height:36px;background:rgba(0,0,0,0.85);
          border-bottom:1px solid rgba(255,149,0,0.15);display:flex;align-items:center;
          justify-content:space-between;padding:0 20px;z-index:5;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:#00ff88;font-size:0.4rem;">●</span>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:rgba(255,149,0,0.5);
              letter-spacing:2px;">SYSTEM ONLINE</span>
          </div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:rgba(255,149,0,0.3);
            letter-spacing:1px;">ISS EXPEDITION 72 — v3.0</div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:rgba(255,149,0,0.3);
            letter-spacing:1px;">ALT: 408km — INC: 51.6°</div>
        </div>

        <!-- Title -->
        <div style="text-align:center;margin-bottom:40px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:rgba(255,149,0,0.3);
            letter-spacing:4px;margin-bottom:6px;">INTERNATIONAL SPACE STATION</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:3rem;color:#ff9500;
            text-shadow:0 0 50px rgba(255,149,0,0.3), 0 0 100px rgba(255,149,0,0.1);
            letter-spacing:8px;margin-bottom:6px;font-weight:900;">
            ISS MISSION
          </div>
          <div style="width:180px;height:2px;background:linear-gradient(90deg,transparent,#ff9500,transparent);
            margin:0 auto 10px;"></div>
          <div style="font-family:'Tajawal',sans-serif;font-size:1.3rem;color:rgba(200,180,150,0.6);
            font-weight:300;letter-spacing:1px;">
            رحلة إلى محطة الفضاء الدولية
          </div>
        </div>

        <!-- Mission select buttons -->
        <div style="display:flex;flex-direction:column;gap:8px;align-items:center;width:380px;position:relative;z-index:2;">
          <button class="menu-btn menu-btn-primary" id="btn-story">
            <div class="menu-btn-icon">🚀</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">نمط القصة</div>
              <div class="menu-btn-desc">رحلة متكاملة من الأرض إلى الفضاء والعودة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(255,149,0,0.3);letter-spacing:1px;">STORY</span>
          </button>
          <button class="menu-btn" id="btn-missions">
            <div class="menu-btn-icon">🎯</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">نمط المهمات</div>
              <div class="menu-btn-desc">6 مهمات مستقلة متنوعة الصعوبة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(255,149,0,0.3);letter-spacing:1px;">MISSIONS</span>
          </button>
          <button class="menu-btn" id="btn-free">
            <div class="menu-btn-icon">🌍</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">المحاكاة الحرة</div>
              <div class="menu-btn-desc">استكشف الفضاء والمحطة بحرية كاملة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(255,149,0,0.3);letter-spacing:1px;">FREE</span>
          </button>
          <button class="menu-btn" id="btn-challenge">
            <div class="menu-btn-icon">🏆</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">نمط التحديات</div>
              <div class="menu-btn-desc">التحام دقيق • إصلاح سريع • هبوط آمن</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(255,149,0,0.3);letter-spacing:1px;">CHALLENGE</span>
          </button>
        </div>

        <!-- Bottom controls -->
        <div style="margin-top:20px;display:flex;gap:10px;position:relative;z-index:2;">
          <button class="menu-btn-small" id="btn-settings">⚙ الإعدادات</button>
          <button class="menu-btn-small" id="btn-help">◈ دليل اللعبة</button>
        </div>

        <!-- Footer -->
        <div style="position:fixed;bottom:10px;left:0;right:0;display:flex;justify-content:center;z-index:2;">
          <div style="background:rgba(0,0,0,0.7);border:1px solid rgba(255,149,0,0.08);border-radius:2px;
            padding:5px 15px;display:flex;gap:15px;">
            <span style="color:rgba(255,149,0,0.25);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
              WASD MOVE</span>
            <span style="color:rgba(255,149,0,0.15);font-size:0.55rem;">|</span>
            <span style="color:rgba(255,149,0,0.25);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
              SPACE/Q UP</span>
            <span style="color:rgba(255,149,0,0.15);font-size:0.55rem;">|</span>
            <span style="color:rgba(255,149,0,0.25);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
              SHIFT/E DOWN</span>
            <span style="color:rgba(255,149,0,0.15);font-size:0.55rem;">|</span>
            <span style="color:rgba(255,149,0,0.25);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
              F INTERACT</span>
          </div>
        </div>
      </div>
    `);

    setTimeout(() => {
      document.getElementById('btn-story')?.addEventListener('click', () => {
        this.gs.audio.init();
        this.gs.audio.playConfirm();
        this.gs.switchScene('preLaunch', { mode: 'story' });
      });
      document.getElementById('btn-missions')?.addEventListener('click', () => {
        this.gs.audio.init();
        this.gs.audio.playConfirm();
        this._showMissions();
      });
      document.getElementById('btn-free')?.addEventListener('click', () => {
        this.gs.audio.init();
        this.gs.audio.playConfirm();
        this.gs.switchScene('preLaunch', { mode: 'free' });
      });
      document.getElementById('btn-challenge')?.addEventListener('click', () => {
        this.gs.audio.init();
        this.gs.audio.playConfirm();
        this._showChallenges();
      });
      document.getElementById('btn-settings')?.addEventListener('click', () => {
        this.gs.audio.init();
        this._showSettings();
      });
      document.getElementById('btn-help')?.addEventListener('click', () => {
        this.gs.audio.init();
        this._showHelp();
      });
    }, 100);
  }

  _showMissions() {
    this.gs.ui.clear();
    this.gs.ui.addElement('missions-menu', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%);pointer-events:none;"></div>
        
        <div style="text-align:center;margin-bottom:20px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.3);
            letter-spacing:3px;margin-bottom:4px;">SELECT MISSION</div>
          <h2 style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.5rem;
            text-shadow:0 0 20px rgba(255,149,0,0.2);letter-spacing:3px;font-weight:700;">
            اختر المهمة
          </h2>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;width:420px;max-height:60vh;overflow-y:auto;padding:8px;position:relative;z-index:2;">
          ${[
            { id: 'mission-1', name: 'مهمة التدريب الأولى', desc: 'تعلم أساسيات الطيران والالتحام', diff: 'سهل', icon: '🎓', tag: 'TRAINING' },
            { id: 'mission-2', name: 'إصلاح الألواح الشمسية', desc: 'خروج إلى الفضاء لإصلاح لوح شمسي', diff: 'متوسط', icon: '🔧', tag: 'REPAIR' },
            { id: 'mission-3', name: 'تجربة نمو النباتات', desc: 'إجراء تجارب في مختبر المحطة', diff: 'سهل', icon: '🌱', tag: 'SCIENCE' },
            { id: 'mission-4', name: 'إنقاذ المحطة', desc: 'التعامل مع تسرب هواء طارئ', diff: 'صعب', icon: '⚠️', tag: 'EMERGENCY' },
            { id: 'mission-5', name: 'مهمة الإمداد', desc: 'استقبال وتفريغ مركبة شحن', diff: 'متوسط', icon: '📦', tag: 'LOGISTICS' },
            { id: 'mission-6', name: 'العودة الطارئة', desc: 'هبوط اضطراري في ظروف صعبة', diff: 'صعب', icon: '🔥', tag: 'ABORT' },
          ].map(m => `
            <button class="menu-btn" style="width:100%;" id="${m.id}">
              <div class="menu-btn-icon">${m.icon}</div>
              <div class="menu-btn-text" style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="menu-btn-title">${m.name}</span>
                  <span style="font-size:0.55rem;padding:2px 8px;border-radius:2px;
                    font-family:'Share Tech Mono',monospace;letter-spacing:1px;
                    background:${m.diff === 'سهل' ? 'rgba(0,255,100,0.06)' : m.diff === 'متوسط' ? 'rgba(255,180,0,0.06)' : 'rgba(255,50,50,0.06)'};
                    color:${m.diff === 'سهل' ? '#00ff88' : m.diff === 'متوسط' ? '#ffb800' : '#ff4444'};
                    border:1px solid ${m.diff === 'سهل' ? 'rgba(0,255,100,0.15)' : m.diff === 'متوسط' ? 'rgba(255,180,0,0.15)' : 'rgba(255,50,50,0.15)'};">
                    ${m.diff}</span>
                </div>
                <div class="menu-btn-desc">${m.desc}</div>
              </div>
              <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">${m.tag}</span>
            </button>
          `).join('')}
        </div>
        <button class="menu-btn-small" style="margin-top:14px;position:relative;z-index:2;" id="btn-back-missions">↩ العودة</button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('btn-back-missions')?.addEventListener('click', () => { this.gs.audio.playBeep(); this._showMenu(); });
      ['mission-1','mission-2','mission-3','mission-4','mission-5','mission-6'].forEach((id, i) => {
        document.getElementById(id)?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('preLaunch', { mode: 'mission', missionId: i + 1 });
        });
      });
    }, 100);
  }

  _showChallenges() {
    this.gs.ui.clear();
    this.gs.ui.addElement('challenges-menu', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%);pointer-events:none;"></div>

        <div style="text-align:center;margin-bottom:20px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.3);
            letter-spacing:3px;margin-bottom:4px;">SELECT CHALLENGE</div>
          <h2 style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.5rem;
            text-shadow:0 0 20px rgba(255,149,0,0.2);letter-spacing:3px;font-weight:700;">
            التحديات
          </h2>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;width:380px;position:relative;z-index:2;">
          <button class="menu-btn" style="width:100%;" id="ch-dock">
            <div class="menu-btn-icon">🎯</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي الالتحام الدقيق</div>
              <div class="menu-btn-desc">التحم بالمحطة بأعلى دقة ممكنة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">DOCK</span>
          </button>
          <button class="menu-btn" style="width:100%;" id="ch-repair">
            <div class="menu-btn-icon">🔧</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي أسرع إصلاح</div>
              <div class="menu-btn-desc">أكمل إصلاحات المحطة بأسرع وقت</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">REPAIR</span>
          </button>
          <button class="menu-btn" style="width:100%;" id="ch-land">
            <div class="menu-btn-icon">🪂</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي الهبوط الناجح</div>
              <div class="menu-btn-desc">اهبط بأمان على سطح المحيط</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">LAND</span>
          </button>
          <button class="menu-btn" style="width:100%;" id="ch-crisis">
            <div class="menu-btn-icon">⚠️</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي إدارة الأزمات</div>
              <div class="menu-btn-desc">تعامل مع حالة طوارئ على المحطة</div>
            </div>
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(255,149,0,0.2);letter-spacing:1px;">CRISIS</span>
          </button>
        </div>
        <button class="menu-btn-small" style="margin-top:14px;position:relative;z-index:2;" id="btn-back-ch">↩ العودة</button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('btn-back-ch')?.addEventListener('click', () => { this.gs.audio.playBeep(); this._showMenu(); });
      document.getElementById('ch-dock')?.addEventListener('click', () => {
        this.gs.audio.playConfirm();
        this.gs.switchScene('docking', { mode: 'challenge' });
      });
      document.getElementById('ch-repair')?.addEventListener('click', () => {
        this.gs.audio.playConfirm();
        this.gs.switchScene('issInterior', { mode: 'challenge', task: 'repair' });
      });
      document.getElementById('ch-land')?.addEventListener('click', () => {
        this.gs.audio.playConfirm();
        this.gs.switchScene('reEntry', { mode: 'challenge' });
      });
      document.getElementById('ch-crisis')?.addEventListener('click', () => {
        this.gs.audio.playConfirm();
        this.gs.switchScene('issInterior', { mode: 'challenge', task: 'crisis' });
      });
    }, 100);
  }

  _showSettings() {
    this.gs.ui.clear();
    this.gs.ui.addElement('settings-menu', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%);pointer-events:none;"></div>

        <div style="text-align:center;margin-bottom:20px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.3);
            letter-spacing:3px;margin-bottom:4px;">CONFIGURATION</div>
          <h2 style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.4rem;
            text-shadow:0 0 20px rgba(255,149,0,0.2);letter-spacing:3px;font-weight:700;">
            الإعدادات
          </h2>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;width:350px;
          background:rgba(0,0,0,0.85);border:1px solid rgba(255,149,0,0.15);
          padding:24px;border-radius:2px;position:relative;z-index:2;
          box-shadow:0 4px 30px rgba(0,0,0,0.5);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(200,180,150,0.7);font-family:'Tajawal',sans-serif;font-size:0.9rem;">المؤثرات الصوتية</span>
            <button class="menu-btn-small" id="toggle-sfx">${this.gs.settings.soundEnabled ? '🔊 مفعّل' : '🔇 مغلق'}</button>
          </div>
          <div style="height:1px;background:rgba(255,149,0,0.08);"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(200,180,150,0.7);font-family:'Tajawal',sans-serif;font-size:0.9rem;">الصعوبة</span>
            <button class="menu-btn-small" id="toggle-diff">${this.gs.settings.difficulty === 'easy' ? 'سهل' : this.gs.settings.difficulty === 'normal' ? 'عادي' : 'صعب'}</button>
          </div>
        </div>
        <button class="menu-btn-small" style="margin-top:14px;position:relative;z-index:2;" id="btn-back-settings">↩ العودة</button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('btn-back-settings')?.addEventListener('click', () => { this.gs.audio.playBeep(); this._showMenu(); });
      document.getElementById('toggle-sfx')?.addEventListener('click', () => {
        this.gs.settings.soundEnabled = !this.gs.settings.soundEnabled;
        this.gs.audio.setMasterVolume(this.gs.settings.soundEnabled ? 1 : 0);
        this._showSettings();
      });
      document.getElementById('toggle-diff')?.addEventListener('click', () => {
        const diffs = ['easy', 'normal', 'hard'];
        const idx = diffs.indexOf(this.gs.settings.difficulty);
        this.gs.settings.difficulty = diffs[(idx + 1) % 3];
        this._showSettings();
      });
    }, 100);
  }

  _showHelp() {
    this.gs.ui.clear();
    this.gs.ui.addElement('help-menu', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%);pointer-events:none;"></div>

        <div style="text-align:center;margin-bottom:16px;position:relative;z-index:2;">
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.3);
            letter-spacing:3px;margin-bottom:4px;">MISSION GUIDE</div>
          <h2 style="font-family:'Orbitron',sans-serif;color:#ff9500;font-size:1.4rem;
            text-shadow:0 0 20px rgba(255,149,0,0.2);letter-spacing:3px;font-weight:700;">
            دليل اللعبة
          </h2>
        </div>
        <div style="max-width:520px;max-height:60vh;overflow-y:auto;
          background:rgba(0,0,0,0.85);border:1px solid rgba(255,149,0,0.15);
          padding:24px;border-radius:2px;
          line-height:1.9;color:rgba(200,210,220,0.7);position:relative;z-index:2;
          box-shadow:0 4px 30px rgba(0,0,0,0.5);font-family:'Tajawal',sans-serif;">
          
          <h3 style="color:#ff9500;margin-bottom:10px;font-size:0.95rem;font-weight:600;">
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.4);margin-left:8px;">CTRL</span>
            التحكم
          </h3>
          <div style="background:rgba(255,149,0,0.03);padding:10px 14px;border-radius:2px;margin-bottom:16px;font-size:0.82rem;
            border:1px solid rgba(255,149,0,0.08);">
            <div style="display:grid;grid-template-columns:70px 1fr;gap:5px 10px;">
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">W / ↑</span><span>التحرك للأمام</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">S / ↓</span><span>التحرك للخلف</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">A / ←</span><span>التحرك لليسار</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">D / →</span><span>التحرك لليمين</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">Q / Space</span><span>الصعود</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">E / Shift</span><span>النزول</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">F</span><span>التفاعل</span>
              <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">الفأرة</span><span>توجيه الكاميرا</span>
            </div>
          </div>

          <h3 style="color:#ff9500;margin-bottom:10px;font-size:0.95rem;font-weight:600;">
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.4);margin-left:8px;">PHASES</span>
            مراحل المهمة
          </h3>
          <div style="font-size:0.82rem;margin-bottom:16px;">
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">01</span>
              الاستعداد والتوجه لمنصة الإطلاق</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">02</span>
              الإقلاع وصعود الصاروخ</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">03</span>
              الملاحة في الفضاء نحو المحطة</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">04</span>
              الالتحام بمحطة الفضاء الدولية</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">05</span>
              استكشاف المحطة وتنفيذ المهام</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">06</span>
              ارتداء بدلة EVA والخروج للفضاء</div>
            <div style="padding:3px 0;border-bottom:1px solid rgba(255,149,0,0.05);">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">07</span>
              دخول الغلاف الجوي والاحتراق</div>
            <div style="padding:3px 0;">
              <span style="color:rgba(255,149,0,0.4);font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:6px;">08</span>
              الهبوط في المحيط والإنقاذ</div>
          </div>

          <h3 style="color:#ff9500;margin-bottom:10px;font-size:0.95rem;font-weight:600;">
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(255,149,0,0.4);margin-left:8px;">TIPS</span>
            نصائح
          </h3>
          <div style="font-size:0.82rem;">
            <div style="padding:2px 0;"><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> راقب الأكسجين والوقود باستمرار</div>
            <div style="padding:2px 0;"><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> اتبع تعليمات مركز التحكم في هيوستن</div>
            <div style="padding:2px 0;"><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> اقترب ببطء أثناء الالتحام</div>
            <div style="padding:2px 0;"><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> حافظ على زاوية الدخول الصحيحة عند العودة</div>
          </div>
        </div>
        <button class="menu-btn-small" style="margin-top:14px;position:relative;z-index:2;" id="btn-back-help">↩ العودة</button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('btn-back-help')?.addEventListener('click', () => { this.gs.audio.playBeep(); this._showMenu(); });
    }, 100);
  }

  update(delta) {
    this.time += delta;

    if (this.earth) {
      this.earth.rotation.y += delta * 0.03;
    }

    if (this.iss) {
      this.issOrbitAngle += delta * 0.15;
      const orbitRadius = 58;
      this.iss.position.set(
        Math.cos(this.issOrbitAngle) * orbitRadius,
        -25 + Math.sin(this.issOrbitAngle * 0.7) * 5 + 8,
        Math.sin(this.issOrbitAngle) * orbitRadius * 0.6
      );
      this.iss.rotation.y = -this.issOrbitAngle + Math.PI / 2;
    }

    const camRadius = 120;
    const camAngle = this.time * 0.04;
    this.camera.position.x = Math.sin(camAngle) * camRadius * 0.15;
    this.camera.position.y = 30 + Math.sin(this.time * 0.08) * 8;
    this.camera.position.z = camRadius + Math.sin(this.time * 0.06) * 10;
    this.camera.lookAt(0, -10, 0);

    this.nebulaClouds.forEach((cloud, i) => {
      cloud.rotation.y += delta * 0.005 * (i + 1);
      cloud.material.opacity = 0.1 + Math.sin(this.time * 0.3 + i * 2) * 0.03;
    });

    this.shootingStars.forEach(ss => {
      if (!ss.active) {
        ss.timer -= delta;
        if (ss.timer <= 0) {
          ss.active = true;
          ss.life = 0;
          ss.startPos.set(
            (Math.random() - 0.5) * 600,
            100 + Math.random() * 200,
            -200 - Math.random() * 300
          );
          ss.dir.set(
            (Math.random() - 0.5) * 0.5,
            -0.5 - Math.random() * 0.5,
            (Math.random() - 0.5) * 0.3
          ).normalize();
        }
      } else {
        ss.life += delta;
        if (ss.life > ss.maxLife) {
          ss.active = false;
          ss.timer = 5 + Math.random() * 15;
          ss.line.material.opacity = 0;
        } else {
          const t = ss.life / ss.maxLife;
          ss.line.material.opacity = t < 0.3 ? t / 0.3 : (1 - t) / 0.7;
          ss.line.material.opacity *= 0.6;
          const headPos = ss.startPos.clone().add(ss.dir.clone().multiplyScalar(ss.speed * ss.life));
          const tailPos = headPos.clone().sub(ss.dir.clone().multiplyScalar(30));
          const positions = ss.line.geometry.attributes.position.array;
          positions[0] = headPos.x; positions[1] = headPos.y; positions[2] = headPos.z;
          positions[3] = tailPos.x; positions[4] = tailPos.y; positions[5] = tailPos.z;
          ss.line.geometry.attributes.position.needsUpdate = true;
        }
      }
    });
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    this.gs.ui.clear();
  }
}
