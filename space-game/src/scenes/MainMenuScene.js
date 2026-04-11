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

    // Deep space background
    this.scene.background = new THREE.Color(0x020510);

    // Enhanced star field with multiple layers for depth
    this.scene.add(createStarField(12000, 1500));
    this.scene.add(createStarField(4000, 800));
    this.scene.add(createMilkyWay());

    // Nebula clouds (colored fog patches in space)
    this._createNebulaClouds();

    // Sun with enhanced lens flare effect
    const sun = createSun();
    sun.position.set(300, 150, -500);
    this.scene.add(sun);

    // Detailed Earth
    this.earth = createDetailedEarth(50);
    this.earth.position.set(0, -25, 0);
    this.scene.add(this.earth);

    // Mini ISS orbiting Earth
    this._createMiniISS();

    // Shooting stars
    this._initShootingStars();

    // Subtle fog for depth
    this.scene.fog = new THREE.FogExp2(0x020510, 0.0006);

    this.gs.ui.addGlobalStyles();
    this.gs.ui.clear();
    this._showMenu();
    this.time = 0;
  }

  _createNebulaClouds() {
    const nebulaColors = [
      { color: 0x1a0033, pos: [200, 100, -400] },
      { color: 0x001a33, pos: [-300, -50, -500] },
      { color: 0x0a1a2a, pos: [100, -100, -600] },
    ];
    nebulaColors.forEach(n => {
      const geo = new THREE.SphereGeometry(80, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: n.color, transparent: true, opacity: 0.15,
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
    // Main truss
    const trussMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, specular: 0x666666, shininess: 60 });
    const truss = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 0.15), trussMat);
    this.iss.add(truss);
    // Modules
    const modMat = new THREE.MeshPhongMaterial({ color: 0xeeeedd, specular: 0x444444, shininess: 40 });
    [0, -0.5, 0.5].forEach(z => {
      const mod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8), modMat);
      mod.position.set(0, 0, z);
      mod.rotation.x = Math.PI / 2;
      this.iss.add(mod);
    });
    // Solar panels (gold-ish)
    const panelMat = new THREE.MeshPhongMaterial({
      color: 0x2244aa, specular: 0x88aaff, shininess: 100,
      emissive: 0x111133, emissiveIntensity: 0.3
    });
    [-2.5, -1.5, 1.5, 2.5].forEach(x => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.5), panelMat);
      panel.position.set(x, 0, 0);
      this.iss.add(panel);
    });
    // Radiators
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
      color: 0xffffff, transparent: true, opacity: 0,
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
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        
        <!-- Cinematic gradient overlay -->
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          background:linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 60%, rgba(0,5,15,0.5) 100%);
          pointer-events:none;"></div>

        <!-- Title section -->
        <div style="text-align:center;margin-bottom:50px;position:relative;z-index:2;">
          <div style="font-family:'Orbitron',sans-serif;font-size:3.2rem;color:#fff;
            text-shadow:0 0 80px rgba(0,180,255,0.3), 0 0 40px rgba(0,100,200,0.2);
            letter-spacing:10px;margin-bottom:8px;font-weight:700;">
            SPACE STATION
          </div>
          <div style="width:200px;height:1px;background:linear-gradient(90deg,transparent,rgba(0,180,255,0.5),transparent);
            margin:0 auto 12px;"></div>
          <div style="font-family:'Tajawal',sans-serif;font-size:1.4rem;color:rgba(160,210,255,0.85);
            font-weight:300;letter-spacing:1px;">
            رحلة إلى محطة الفضاء الدولية
          </div>
          <div style="font-family:'Orbitron',sans-serif;font-size:0.65rem;color:rgba(100,150,200,0.4);
            letter-spacing:5px;margin-top:6px;text-transform:uppercase;">
            ISS Expedition 72
          </div>
        </div>

        <!-- Main buttons -->
        <div style="display:flex;flex-direction:column;gap:10px;align-items:center;width:360px;position:relative;z-index:2;">
          <button class="menu-btn menu-btn-primary" id="btn-story">
            <div class="menu-btn-icon">🚀</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">نمط القصة</div>
              <div class="menu-btn-desc">رحلة متكاملة من الأرض إلى الفضاء والعودة</div>
            </div>
          </button>
          <button class="menu-btn" id="btn-missions">
            <div class="menu-btn-icon">🎯</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">نمط المهمات</div>
              <div class="menu-btn-desc">6 مهمات مستقلة متنوعة الصعوبة</div>
            </div>
          </button>
          <button class="menu-btn" id="btn-free">
            <div class="menu-btn-icon">🌍</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">المحاكاة الحرة</div>
              <div class="menu-btn-desc">استكشف الفضاء والمحطة بحرية كاملة</div>
            </div>
          </button>
          <button class="menu-btn" id="btn-challenge">
            <div class="menu-btn-icon">🏆</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">نمط التحديات</div>
              <div class="menu-btn-desc">التحام دقيق • إصلاح سريع • هبوط آمن</div>
            </div>
          </button>
        </div>

        <!-- Bottom buttons -->
        <div style="margin-top:25px;display:flex;gap:12px;position:relative;z-index:2;">
          <button class="menu-btn-small" id="btn-settings">⚙️ الإعدادات</button>
          <button class="menu-btn-small" id="btn-help">📖 دليل اللعبة</button>
        </div>

        <!-- Footer -->
        <div style="position:fixed;bottom:15px;color:rgba(80,120,160,0.4);font-size:0.65rem;
          text-align:center;font-family:'Orbitron',sans-serif;letter-spacing:2px;z-index:2;">
          <div>WASD / ARROWS — SPACE / Q — SHIFT / E — F INTERACT</div>
          <div style="margin-top:4px;">SIMULATION v2.0</div>
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
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.6) 100%);pointer-events:none;"></div>
        
        <h2 style="font-family:'Orbitron',sans-serif;color:rgba(0,200,255,0.9);margin-bottom:25px;font-size:1.6rem;
          text-shadow:0 0 30px rgba(0,180,255,0.3);letter-spacing:3px;position:relative;z-index:2;">
          اختر المهمة
        </h2>
        <div style="display:flex;flex-direction:column;gap:8px;width:400px;max-height:60vh;overflow-y:auto;padding:10px;position:relative;z-index:2;">
          ${[
            { id: 'mission-1', name: 'مهمة التدريب الأولى', desc: 'تعلم أساسيات الطيران والالتحام', diff: 'سهل', icon: '🎓' },
            { id: 'mission-2', name: 'إصلاح الألواح الشمسية', desc: 'خروج إلى الفضاء لإصلاح لوح شمسي', diff: 'متوسط', icon: '🔧' },
            { id: 'mission-3', name: 'تجربة نمو النباتات', desc: 'إجراء تجارب في مختبر المحطة', diff: 'سهل', icon: '🌱' },
            { id: 'mission-4', name: 'إنقاذ المحطة', desc: 'التعامل مع تسرب هواء طارئ', diff: 'صعب', icon: '⚠️' },
            { id: 'mission-5', name: 'مهمة الإمداد', desc: 'استقبال وتفريغ مركبة شحن', diff: 'متوسط', icon: '📦' },
            { id: 'mission-6', name: 'العودة الطارئة', desc: 'هبوط اضطراري في ظروف صعبة', diff: 'صعب', icon: '🔥' },
          ].map(m => `
            <button class="menu-btn" style="width:100%;" id="${m.id}">
              <div class="menu-btn-icon">${m.icon}</div>
              <div class="menu-btn-text" style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="menu-btn-title">${m.name}</span>
                  <span style="font-size:0.65rem;padding:2px 10px;border-radius:12px;
                    background:${m.diff === 'سهل' ? 'rgba(0,255,100,0.12)' : m.diff === 'متوسط' ? 'rgba(255,180,0,0.12)' : 'rgba(255,50,50,0.12)'};
                    color:${m.diff === 'سهل' ? '#55ff99' : m.diff === 'متوسط' ? '#ffcc44' : '#ff6666'};
                    border:1px solid ${m.diff === 'سهل' ? 'rgba(0,255,100,0.2)' : m.diff === 'متوسط' ? 'rgba(255,180,0,0.2)' : 'rgba(255,50,50,0.2)'};">
                    ${m.diff}</span>
                </div>
                <div class="menu-btn-desc">${m.desc}</div>
              </div>
            </button>
          `).join('')}
        </div>
        <button class="menu-btn-small" style="margin-top:18px;position:relative;z-index:2;" id="btn-back-missions">↩ العودة</button>
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
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.6) 100%);pointer-events:none;"></div>

        <h2 style="font-family:'Orbitron',sans-serif;color:rgba(255,200,0,0.9);margin-bottom:25px;font-size:1.6rem;
          text-shadow:0 0 30px rgba(255,180,0,0.3);letter-spacing:3px;position:relative;z-index:2;">
          التحديات
        </h2>
        <div style="display:flex;flex-direction:column;gap:10px;width:360px;position:relative;z-index:2;">
          <button class="menu-btn" style="width:100%;" id="ch-dock">
            <div class="menu-btn-icon">🎯</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي الالتحام الدقيق</div>
              <div class="menu-btn-desc">التحم بالمحطة بأعلى دقة ممكنة</div>
            </div>
          </button>
          <button class="menu-btn" style="width:100%;" id="ch-repair">
            <div class="menu-btn-icon">🔧</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي أسرع إصلاح</div>
              <div class="menu-btn-desc">أكمل إصلاحات المحطة بأسرع وقت</div>
            </div>
          </button>
          <button class="menu-btn" style="width:100%;" id="ch-land">
            <div class="menu-btn-icon">🪂</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي الهبوط الناجح</div>
              <div class="menu-btn-desc">اهبط بأمان على سطح المحيط</div>
            </div>
          </button>
          <button class="menu-btn" style="width:100%;" id="ch-crisis">
            <div class="menu-btn-icon">⚠️</div>
            <div class="menu-btn-text">
              <div class="menu-btn-title">تحدي إدارة الأزمات</div>
              <div class="menu-btn-desc">تعامل مع حالة طوارئ على المحطة</div>
            </div>
          </button>
        </div>
        <button class="menu-btn-small" style="margin-top:18px;position:relative;z-index:2;" id="btn-back-ch">↩ العودة</button>
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
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.6) 100%);pointer-events:none;"></div>

        <h2 style="font-family:'Orbitron',sans-serif;color:rgba(0,200,255,0.9);margin-bottom:25px;font-size:1.4rem;
          text-shadow:0 0 30px rgba(0,180,255,0.3);letter-spacing:3px;position:relative;z-index:2;">
          الإعدادات
        </h2>
        <div style="display:flex;flex-direction:column;gap:15px;width:340px;
          background:rgba(5,15,30,0.7);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          padding:30px;border-radius:16px;border:1px solid rgba(0,150,255,0.12);position:relative;z-index:2;
          box-shadow:0 8px 32px rgba(0,0,0,0.4);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(180,210,240,0.8);font-family:'Tajawal',sans-serif;font-size:0.95rem;">المؤثرات الصوتية</span>
            <button class="menu-btn-small" id="toggle-sfx">${this.gs.settings.soundEnabled ? '🔊 مفعّل' : '🔇 مغلق'}</button>
          </div>
          <div style="height:1px;background:rgba(255,255,255,0.05);"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(180,210,240,0.8);font-family:'Tajawal',sans-serif;font-size:0.95rem;">الصعوبة</span>
            <button class="menu-btn-small" id="toggle-diff">${this.gs.settings.difficulty === 'easy' ? 'سهل' : this.gs.settings.difficulty === 'normal' ? 'عادي' : 'صعب'}</button>
          </div>
        </div>
        <button class="menu-btn-small" style="margin-top:18px;position:relative;z-index:2;" id="btn-back-settings">↩ العودة</button>
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
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.6) 100%);pointer-events:none;"></div>

        <h2 style="font-family:'Orbitron',sans-serif;color:rgba(0,200,255,0.9);margin-bottom:20px;font-size:1.4rem;
          text-shadow:0 0 30px rgba(0,180,255,0.3);letter-spacing:3px;position:relative;z-index:2;">
          دليل اللعبة
        </h2>
        <div style="max-width:520px;max-height:60vh;overflow-y:auto;
          background:rgba(5,15,30,0.7);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          padding:28px;border-radius:16px;border:1px solid rgba(0,150,255,0.12);
          line-height:1.9;color:rgba(200,220,240,0.85);position:relative;z-index:2;
          box-shadow:0 8px 32px rgba(0,0,0,0.4);font-family:'Tajawal',sans-serif;">
          
          <h3 style="color:rgba(0,200,255,0.9);margin-bottom:12px;font-size:1rem;font-weight:600;">التحكم</h3>
          <div style="background:rgba(0,20,40,0.4);padding:12px 16px;border-radius:10px;margin-bottom:18px;font-size:0.85rem;
            border:1px solid rgba(0,100,200,0.1);">
            <div style="display:grid;grid-template-columns:80px 1fr;gap:6px 12px;">
              <span style="color:rgba(0,180,255,0.7);font-family:'Orbitron',monospace;font-size:0.75rem;">W / ↑</span><span>التحرك للأمام</span>
              <span style="color:rgba(0,180,255,0.7);font-family:'Orbitron',monospace;font-size:0.75rem;">S / ↓</span><span>التحرك للخلف</span>
              <span style="color:rgba(0,180,255,0.7);font-family:'Orbitron',monospace;font-size:0.75rem;">A / ←</span><span>التحرك لليسار</span>
              <span style="color:rgba(0,180,255,0.7);font-family:'Orbitron',monospace;font-size:0.75rem;">D / →</span><span>التحرك لليمين</span>
              <span style="color:rgba(0,180,255,0.7);font-family:'Orbitron',monospace;font-size:0.75rem;">Q / Space</span><span>الصعود</span>
              <span style="color:rgba(0,180,255,0.7);font-family:'Orbitron',monospace;font-size:0.75rem;">E / Shift</span><span>النزول</span>
              <span style="color:rgba(0,180,255,0.7);font-family:'Orbitron',monospace;font-size:0.75rem;">F</span><span>التفاعل</span>
              <span style="color:rgba(0,180,255,0.7);font-family:'Orbitron',monospace;font-size:0.75rem;">الفأرة</span><span>توجيه الكاميرا</span>
            </div>
          </div>

          <h3 style="color:rgba(0,200,255,0.9);margin-bottom:12px;font-size:1rem;font-weight:600;">مراحل المهمة</h3>
          <div style="font-size:0.85rem;margin-bottom:18px;">
            <div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">1. الاستعداد والتوجه لمنصة الإطلاق</div>
            <div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">2. الإقلاع وصعود الصاروخ</div>
            <div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">3. الملاحة في الفضاء نحو المحطة</div>
            <div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">4. الالتحام بمحطة الفضاء الدولية</div>
            <div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">5. استكشاف المحطة وتنفيذ المهام</div>
            <div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">6. ارتداء بدلة EVA والخروج للفضاء</div>
            <div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">7. دخول الغلاف الجوي والاحتراق</div>
            <div style="padding:4px 0;">8. الهبوط في المحيط والإنقاذ</div>
          </div>

          <h3 style="color:rgba(0,200,255,0.9);margin-bottom:12px;font-size:1rem;font-weight:600;">نصائح</h3>
          <div style="font-size:0.85rem;">
            <div style="padding:3px 0;">• راقب الأكسجين والوقود باستمرار</div>
            <div style="padding:3px 0;">• اتبع تعليمات مركز التحكم في هيوستن</div>
            <div style="padding:3px 0;">• اقترب ببطء أثناء الالتحام</div>
            <div style="padding:3px 0;">• حافظ على زاوية الدخول الصحيحة عند العودة</div>
          </div>
        </div>
        <button class="menu-btn-small" style="margin-top:18px;position:relative;z-index:2;" id="btn-back-help">↩ العودة</button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('btn-back-help')?.addEventListener('click', () => { this.gs.audio.playBeep(); this._showMenu(); });
    }, 100);
  }

  update(delta) {
    this.time += delta;

    // Earth rotation
    if (this.earth) {
      this.earth.rotation.y += delta * 0.03;
    }

    // ISS orbit around Earth
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

    // Cinematic camera orbit
    const camRadius = 120;
    const camAngle = this.time * 0.04;
    this.camera.position.x = Math.sin(camAngle) * camRadius * 0.15;
    this.camera.position.y = 30 + Math.sin(this.time * 0.08) * 8;
    this.camera.position.z = camRadius + Math.sin(this.time * 0.06) * 10;
    this.camera.lookAt(0, -10, 0);

    // Nebula clouds gentle animation
    this.nebulaClouds.forEach((cloud, i) => {
      cloud.rotation.y += delta * 0.005 * (i + 1);
      cloud.material.opacity = 0.12 + Math.sin(this.time * 0.3 + i * 2) * 0.04;
    });

    // Shooting stars
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
