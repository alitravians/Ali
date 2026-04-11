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
    this.particles = [];
  }

  async init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.camera.position.set(0, 60, 100);
    this.camera.lookAt(0, 0, 0);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    this.scene.background = new THREE.Color(0x030810);

    // Deep space star layers
    this.scene.add(createStarField(15000, 2000));
    this.scene.add(createStarField(5000, 1000));
    this.scene.add(createMilkyWay());

    this._createNebulaClouds();
    this._createFloatingParticles();

    const sun = createSun();
    sun.position.set(400, 200, -600);
    this.scene.add(sun);

    // Larger Earth, positioned lower for dramatic framing
    this.earth = createDetailedEarth(55);
    this.earth.position.set(0, -30, 0);
    this.scene.add(this.earth);

    // Atmospheric glow ring around Earth
    const glowGeo = new THREE.RingGeometry(55.5, 58, 64);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4a8af4, transparent: true, opacity: 0.08,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(this.earth.position);
    glow.lookAt(this.camera.position);
    this.scene.add(glow);
    this._earthGlow = glow;

    this._createMiniISS();
    this._initShootingStars();

    this.scene.fog = new THREE.FogExp2(0x030810, 0.0005);

    // Ambient + directional lighting
    const ambientLight = new THREE.AmbientLight(0x4060a0, 0.4);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(400, 200, -600);
    this.scene.add(dirLight);

    this.gs.ui.addGlobalStyles();
    this.gs.ui.clear();
    this._showMenu();
    this.time = 0;
  }

  _createNebulaClouds() {
    const nebulaColors = [
      { color: 0x1a1540, pos: [250, 120, -500] },
      { color: 0x0a1a30, pos: [-350, -60, -600] },
      { color: 0x1a0a20, pos: [150, -120, -700] },
      { color: 0x0a2030, pos: [-200, 80, -450] },
    ];
    nebulaColors.forEach(n => {
      const geo = new THREE.SphereGeometry(100, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: n.color, transparent: true, opacity: 0.1,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...n.pos);
      mesh.scale.set(2.5, 1.2, 1.8);
      this.scene.add(mesh);
      this.nebulaClouds.push(mesh);
    });
  }

  _createFloatingParticles() {
    const count = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x6090d0, size: 0.3, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._floatingDust = new THREE.Points(geo, mat);
    this.scene.add(this._floatingDust);
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
      color: 0x3355bb, specular: 0x88aaff, shininess: 100,
      emissive: 0x111144, emissiveIntensity: 0.3
    });
    [-2.5, -1.5, 1.5, 2.5].forEach(x => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.5), panelMat);
      panel.position.set(x, 0, 0);
      this.iss.add(panel);
    });
    this.iss.scale.setScalar(0.7);
    this.scene.add(this.iss);
  }

  _initShootingStars() {
    for (let i = 0; i < 4; i++) this._addShootingStar();
  }

  _addShootingStar() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x8ab4f8, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.shootingStars.push({
      line, timer: Math.random() * 15 + 3,
      active: false, life: 0, maxLife: 0.6 + Math.random() * 0.4,
      startPos: new THREE.Vector3(), dir: new THREE.Vector3(), speed: 250 + Math.random() * 350
    });
  }

  _showMenu() {
    this.gs.ui.clear();
    this.gs.ui.addElement('main-menu', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;direction:rtl;">
        
        <!-- LEFT PANEL — 3D Viewport overlay (just text overlays, 3D is behind) -->
        <div style="flex:1;position:relative;display:flex;flex-direction:column;justify-content:flex-end;padding:40px;">
          
          <!-- Title at bottom-left of viewport -->
          <div style="position:relative;z-index:2;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:rgba(138,180,248,0.35);
              letter-spacing:5px;margin-bottom:8px;">EXPEDITION 72 — SIMULATION</div>
            <div style="font-family:'Exo 2','Orbitron',sans-serif;font-size:3.5rem;font-weight:900;
              background:linear-gradient(135deg,#e0e8ff 0%,#8ab4f8 40%,#c0d0ff 100%);
              -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
              letter-spacing:4px;line-height:1.1;margin-bottom:6px;">
              ISS<br>MISSION
            </div>
            <div style="font-family:'Tajawal',sans-serif;font-size:1.2rem;color:rgba(180,200,235,0.5);
              font-weight:300;margin-bottom:16px;">
              رحلة إلى محطة الفضاء الدولية
            </div>
            <div style="display:flex;gap:16px;margin-bottom:20px;">
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:5px;height:5px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade8066;"></div>
                <span style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(74,222,128,0.5);
                  letter-spacing:2px;">SYSTEMS ONLINE</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:5px;height:5px;border-radius:50%;background:#38bdf8;box-shadow:0 0 6px #38bdf866;"></div>
                <span style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(56,189,248,0.5);
                  letter-spacing:2px;">ORBIT STABLE</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL — Mission Select -->
        <div style="width:420px;background:linear-gradient(270deg,rgba(3,8,16,0.95) 0%,rgba(3,8,16,0.7) 100%);
          border-right:1px solid rgba(100,160,255,0.06);
          display:flex;flex-direction:column;justify-content:center;padding:30px 24px;
          backdrop-filter:blur(8px);position:relative;z-index:3;">
          
          <!-- Section label -->
          <div style="margin-bottom:20px;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(138,180,248,0.3);
              letter-spacing:4px;margin-bottom:6px;">SELECT MODE</div>
            <div style="font-family:'Tajawal',sans-serif;font-size:1.3rem;color:rgba(220,230,255,0.8);
              font-weight:600;">اختر وضع اللعب</div>
            <div style="width:40px;height:2px;background:linear-gradient(90deg,#4a8af4,transparent);
              margin-top:8px;border-radius:1px;"></div>
          </div>

          <!-- Mode buttons -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="menu-card menu-card-primary" id="btn-story">
              <div class="menu-card-icon">🚀</div>
              <div class="menu-card-text">
                <div class="menu-card-title">نمط القصة</div>
                <div class="menu-card-desc">رحلة متكاملة من الأرض إلى المحطة والعودة</div>
              </div>
              <span class="menu-card-tag">STORY</span>
            </button>

            <button class="menu-card" id="btn-missions">
              <div class="menu-card-icon">🎯</div>
              <div class="menu-card-text">
                <div class="menu-card-title">نمط المهمات</div>
                <div class="menu-card-desc">6 مهمات مستقلة متنوعة الصعوبة</div>
              </div>
              <span class="menu-card-tag">MISSIONS</span>
            </button>

            <button class="menu-card" id="btn-free">
              <div class="menu-card-icon">🌍</div>
              <div class="menu-card-text">
                <div class="menu-card-title">المحاكاة الحرة</div>
                <div class="menu-card-desc">استكشف الفضاء والمحطة بحرية كاملة</div>
              </div>
              <span class="menu-card-tag">FREE</span>
            </button>

            <button class="menu-card" id="btn-challenge">
              <div class="menu-card-icon">🏆</div>
              <div class="menu-card-text">
                <div class="menu-card-title">نمط التحديات</div>
                <div class="menu-card-desc">التحام دقيق • إصلاح سريع • هبوط آمن</div>
              </div>
              <span class="menu-card-tag">CHALLENGE</span>
            </button>
          </div>

          <!-- Bottom controls -->
          <div style="margin-top:20px;display:flex;gap:8px;">
            <button class="glass-btn glass-btn-small" id="btn-settings" style="flex:1;">⚙ الإعدادات</button>
            <button class="glass-btn glass-btn-small" id="btn-help" style="flex:1;">◈ الدليل</button>
          </div>
        </div>

        <!-- Footer bar -->
        <div style="position:fixed;bottom:0;left:0;right:0;height:32px;
          background:linear-gradient(0deg,rgba(3,8,16,0.9) 0%,transparent 100%);
          display:flex;align-items:center;justify-content:center;gap:20px;padding:0 20px;z-index:4;">
          ${['WASD تحرك', 'SPACE صعود', 'SHIFT نزول', 'F تفاعل', 'الفأرة كاميرا'].map(c => `
            <span style="color:rgba(120,150,200,0.2);font-size:0.55rem;font-family:'Share Tech Mono',monospace;
              letter-spacing:1px;">${c}</span>
          `).join('<span style="color:rgba(100,140,200,0.08);font-size:0.5rem;">|</span>')}
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
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          background:radial-gradient(ellipse at 30% 50%,transparent 30%,rgba(3,8,16,0.8) 100%);pointer-events:none;"></div>
        
        <div style="max-width:500px;width:90%;position:relative;z-index:2;">
          <div style="text-align:center;margin-bottom:20px;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(138,180,248,0.3);
              letter-spacing:4px;margin-bottom:6px;">SELECT MISSION</div>
            <div style="font-family:'Exo 2',sans-serif;font-size:1.5rem;font-weight:700;color:rgba(220,230,255,0.9);
              letter-spacing:2px;">اختر المهمة</div>
            <div style="width:40px;height:2px;background:linear-gradient(90deg,transparent,#4a8af4,transparent);
              margin:8px auto 0;border-radius:1px;"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow-y:auto;padding:4px;">
            ${[
              { id: 'mission-1', name: 'مهمة التدريب الأولى', desc: 'تعلم أساسيات الطيران والالتحام', diff: 'سهل', icon: '🎓', tag: 'TRAINING' },
              { id: 'mission-2', name: 'إصلاح الألواح الشمسية', desc: 'خروج إلى الفضاء لإصلاح لوح شمسي', diff: 'متوسط', icon: '🔧', tag: 'REPAIR' },
              { id: 'mission-3', name: 'تجربة نمو النباتات', desc: 'إجراء تجارب في مختبر المحطة', diff: 'سهل', icon: '🌱', tag: 'SCIENCE' },
              { id: 'mission-4', name: 'إنقاذ المحطة', desc: 'التعامل مع تسرب هواء طارئ', diff: 'صعب', icon: '⚠️', tag: 'EMERGENCY' },
              { id: 'mission-5', name: 'مهمة الإمداد', desc: 'استقبال وتفريغ مركبة شحن', diff: 'متوسط', icon: '📦', tag: 'LOGISTICS' },
              { id: 'mission-6', name: 'العودة الطارئة', desc: 'هبوط اضطراري في ظروف صعبة', diff: 'صعب', icon: '🔥', tag: 'ABORT' },
            ].map(m => `
              <button class="menu-card" id="${m.id}">
                <div class="menu-card-icon">${m.icon}</div>
                <div class="menu-card-text" style="flex:1;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="menu-card-title">${m.name}</span>
                    <span style="font-size:0.55rem;padding:2px 10px;border-radius:6px;
                      font-family:'Tajawal',sans-serif;font-weight:500;
                      background:${m.diff === 'سهل' ? 'rgba(74,222,128,0.06)' : m.diff === 'متوسط' ? 'rgba(251,191,36,0.06)' : 'rgba(248,113,113,0.06)'};
                      color:${m.diff === 'سهل' ? '#4ade80' : m.diff === 'متوسط' ? '#fbbf24' : '#f87171'};
                      border:1px solid ${m.diff === 'سهل' ? 'rgba(74,222,128,0.12)' : m.diff === 'متوسط' ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)'};">
                      ${m.diff}</span>
                  </div>
                  <div class="menu-card-desc">${m.desc}</div>
                </div>
                <span class="menu-card-tag">${m.tag}</span>
              </button>
            `).join('')}
          </div>
          <div style="text-align:center;margin-top:14px;">
            <button class="glass-btn glass-btn-small" id="btn-back-missions">↩ العودة</button>
          </div>
        </div>
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
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          background:radial-gradient(ellipse at 30% 50%,transparent 30%,rgba(3,8,16,0.8) 100%);pointer-events:none;"></div>

        <div style="max-width:460px;width:90%;position:relative;z-index:2;">
          <div style="text-align:center;margin-bottom:20px;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(138,180,248,0.3);
              letter-spacing:4px;margin-bottom:6px;">SELECT CHALLENGE</div>
            <div style="font-family:'Exo 2',sans-serif;font-size:1.5rem;font-weight:700;color:rgba(220,230,255,0.9);
              letter-spacing:2px;">التحديات</div>
            <div style="width:40px;height:2px;background:linear-gradient(90deg,transparent,#4a8af4,transparent);
              margin:8px auto 0;border-radius:1px;"></div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <button class="menu-card" style="flex-direction:column;align-items:center;text-align:center;padding:20px 14px;" id="ch-dock">
              <div style="font-size:2rem;margin-bottom:8px;filter:drop-shadow(0 0 10px rgba(100,180,255,0.3));">🎯</div>
              <div class="menu-card-title" style="margin-bottom:4px;">الالتحام الدقيق</div>
              <div class="menu-card-desc">التحم بالمحطة بأعلى دقة</div>
            </button>

            <button class="menu-card" style="flex-direction:column;align-items:center;text-align:center;padding:20px 14px;" id="ch-repair">
              <div style="font-size:2rem;margin-bottom:8px;filter:drop-shadow(0 0 10px rgba(100,180,255,0.3));">🔧</div>
              <div class="menu-card-title" style="margin-bottom:4px;">أسرع إصلاح</div>
              <div class="menu-card-desc">أكمل الإصلاحات بأسرع وقت</div>
            </button>

            <button class="menu-card" style="flex-direction:column;align-items:center;text-align:center;padding:20px 14px;" id="ch-land">
              <div style="font-size:2rem;margin-bottom:8px;filter:drop-shadow(0 0 10px rgba(100,180,255,0.3));">🪂</div>
              <div class="menu-card-title" style="margin-bottom:4px;">الهبوط الآمن</div>
              <div class="menu-card-desc">اهبط بأمان على المحيط</div>
            </button>

            <button class="menu-card" style="flex-direction:column;align-items:center;text-align:center;padding:20px 14px;" id="ch-crisis">
              <div style="font-size:2rem;margin-bottom:8px;filter:drop-shadow(0 0 10px rgba(100,180,255,0.3));">⚠️</div>
              <div class="menu-card-title" style="margin-bottom:4px;">إدارة الأزمات</div>
              <div class="menu-card-desc">تعامل مع حالة طوارئ</div>
            </button>
          </div>

          <div style="text-align:center;margin-top:14px;">
            <button class="glass-btn glass-btn-small" id="btn-back-ch">↩ العودة</button>
          </div>
        </div>
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
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          background:radial-gradient(ellipse at 30% 50%,transparent 30%,rgba(3,8,16,0.8) 100%);pointer-events:none;"></div>

        <div style="max-width:400px;width:90%;position:relative;z-index:2;">
          <div style="text-align:center;margin-bottom:20px;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(138,180,248,0.3);
              letter-spacing:4px;margin-bottom:6px;">CONFIGURATION</div>
            <div style="font-family:'Exo 2',sans-serif;font-size:1.4rem;font-weight:700;color:rgba(220,230,255,0.9);
              letter-spacing:2px;">الإعدادات</div>
            <div style="width:40px;height:2px;background:linear-gradient(90deg,transparent,#4a8af4,transparent);
              margin:8px auto 0;border-radius:1px;"></div>
          </div>

          <div style="background:rgba(3,8,16,0.8);border:1px solid rgba(100,160,255,0.08);
            backdrop-filter:blur(16px);padding:24px;border-radius:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <span style="color:rgba(200,215,240,0.7);font-family:'Tajawal',sans-serif;font-size:0.9rem;">المؤثرات الصوتية</span>
              <button class="glass-btn glass-btn-small" id="toggle-sfx">${this.gs.settings.soundEnabled ? '🔊 مفعّل' : '🔇 مغلق'}</button>
            </div>
            <div style="height:1px;background:rgba(100,160,255,0.06);margin-bottom:14px;"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:rgba(200,215,240,0.7);font-family:'Tajawal',sans-serif;font-size:0.9rem;">الصعوبة</span>
              <button class="glass-btn glass-btn-small" id="toggle-diff">${this.gs.settings.difficulty === 'easy' ? 'سهل' : this.gs.settings.difficulty === 'normal' ? 'عادي' : 'صعب'}</button>
            </div>
          </div>

          <div style="text-align:center;margin-top:14px;">
            <button class="glass-btn glass-btn-small" id="btn-back-settings">↩ العودة</button>
          </div>
        </div>
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
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;direction:rtl;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;
          background:radial-gradient(ellipse at 30% 50%,transparent 30%,rgba(3,8,16,0.8) 100%);pointer-events:none;"></div>

        <div style="max-width:560px;width:90%;position:relative;z-index:2;">
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:0.55rem;color:rgba(138,180,248,0.3);
              letter-spacing:4px;margin-bottom:6px;">MISSION GUIDE</div>
            <div style="font-family:'Exo 2',sans-serif;font-size:1.4rem;font-weight:700;color:rgba(220,230,255,0.9);
              letter-spacing:2px;">دليل اللعبة</div>
            <div style="width:40px;height:2px;background:linear-gradient(90deg,transparent,#4a8af4,transparent);
              margin:8px auto 0;border-radius:1px;"></div>
          </div>

          <div style="max-height:60vh;overflow-y:auto;
            background:rgba(3,8,16,0.8);border:1px solid rgba(100,160,255,0.08);
            backdrop-filter:blur(16px);padding:24px;border-radius:12px;
            line-height:1.9;color:rgba(200,215,240,0.65);font-family:'Tajawal',sans-serif;">
            
            <h3 style="color:#8ab4f8;margin-bottom:10px;font-size:0.95rem;font-weight:600;
              display:flex;align-items:center;gap:8px;">
              <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(138,180,248,0.35);
                letter-spacing:2px;">CTRL</span> التحكم
            </h3>
            <div style="background:rgba(100,160,255,0.03);padding:10px 14px;border-radius:8px;
              margin-bottom:16px;font-size:0.82rem;border:1px solid rgba(100,160,255,0.06);">
              <div style="display:grid;grid-template-columns:70px 1fr;gap:5px 10px;">
                <span style="color:#8ab4f8;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">W / ↑</span><span>التحرك للأمام</span>
                <span style="color:#8ab4f8;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">S / ↓</span><span>التحرك للخلف</span>
                <span style="color:#8ab4f8;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">A / ←</span><span>التحرك لليسار</span>
                <span style="color:#8ab4f8;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">D / →</span><span>التحرك لليمين</span>
                <span style="color:#8ab4f8;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">Q / Space</span><span>الصعود</span>
                <span style="color:#8ab4f8;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">E / Shift</span><span>النزول</span>
                <span style="color:#8ab4f8;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">F</span><span>التفاعل</span>
                <span style="color:#8ab4f8;font-family:'Share Tech Mono',monospace;font-size:0.7rem;">الفأرة</span><span>توجيه الكاميرا</span>
              </div>
            </div>

            <h3 style="color:#8ab4f8;margin-bottom:10px;font-size:0.95rem;font-weight:600;
              display:flex;align-items:center;gap:8px;">
              <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(138,180,248,0.35);
                letter-spacing:2px;">PHASES</span> مراحل المهمة
            </h3>
            <div style="font-size:0.82rem;margin-bottom:16px;">
              ${['الاستعداد والتوجه لمنصة الإطلاق','الإقلاع وصعود الصاروخ','الملاحة في الفضاء نحو المحطة','الالتحام بمحطة الفضاء الدولية','استكشاف المحطة وتنفيذ المهام','ارتداء بدلة EVA والخروج للفضاء','دخول الغلاف الجوي والاحتراق','الهبوط في المحيط والإنقاذ'].map((p, i) => `
                <div style="padding:4px 0;border-bottom:1px solid rgba(100,160,255,0.04);">
                  <span style="color:rgba(138,180,248,0.3);font-family:'Share Tech Mono',monospace;font-size:0.6rem;
                    margin-left:8px;">0${i+1}</span>${p}
                </div>
              `).join('')}
            </div>

            <h3 style="color:#8ab4f8;margin-bottom:10px;font-size:0.95rem;font-weight:600;
              display:flex;align-items:center;gap:8px;">
              <span style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(138,180,248,0.35);
                letter-spacing:2px;">TIPS</span> نصائح
            </h3>
            <div style="font-size:0.82rem;">
              ${['راقب الأكسجين والوقود باستمرار','اتبع تعليمات مركز التحكم في هيوستن','اقترب ببطء أثناء الالتحام','حافظ على زاوية الدخول الصحيحة عند العودة'].map(t => `
                <div style="padding:3px 0;">
                  <span style="color:#8ab4f8;font-size:0.4rem;margin-left:8px;">◆</span> ${t}
                </div>
              `).join('')}
            </div>
          </div>

          <div style="text-align:center;margin-top:14px;">
            <button class="glass-btn glass-btn-small" id="btn-back-help">↩ العودة</button>
          </div>
        </div>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('btn-back-help')?.addEventListener('click', () => { this.gs.audio.playBeep(); this._showMenu(); });
    }, 100);
  }

  update(delta) {
    this.time += delta;

    if (this.earth) {
      this.earth.rotation.y += delta * 0.025;
    }

    if (this.iss) {
      this.issOrbitAngle += delta * 0.12;
      const orbitRadius = 62;
      this.iss.position.set(
        Math.cos(this.issOrbitAngle) * orbitRadius,
        -30 + Math.sin(this.issOrbitAngle * 0.7) * 6 + 10,
        Math.sin(this.issOrbitAngle) * orbitRadius * 0.5
      );
      this.iss.rotation.y = -this.issOrbitAngle + Math.PI / 2;
    }

    // Cinematic slow camera orbit
    const camAngle = this.time * 0.03;
    this.camera.position.x = Math.sin(camAngle) * 20;
    this.camera.position.y = 55 + Math.sin(this.time * 0.06) * 10;
    this.camera.position.z = 105 + Math.sin(this.time * 0.04) * 8;
    this.camera.lookAt(0, -15, 0);

    // Update Earth glow ring to face camera
    if (this._earthGlow) {
      this._earthGlow.lookAt(this.camera.position);
    }

    // Floating dust rotation
    if (this._floatingDust) {
      this._floatingDust.rotation.y += delta * 0.008;
      this._floatingDust.rotation.x += delta * 0.003;
    }

    // Nebula drift
    this.nebulaClouds.forEach((cloud, i) => {
      cloud.rotation.y += delta * 0.004 * (i + 1);
      cloud.material.opacity = 0.08 + Math.sin(this.time * 0.2 + i * 2) * 0.03;
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
          ss.timer = 3 + Math.random() * 12;
          ss.line.material.opacity = 0;
        } else {
          const t = ss.life / ss.maxLife;
          ss.line.material.opacity = t < 0.3 ? t / 0.3 : (1 - t) / 0.7;
          ss.line.material.opacity *= 0.5;
          const headPos = ss.startPos.clone().add(ss.dir.clone().multiplyScalar(ss.speed * ss.life));
          const tailPos = headPos.clone().sub(ss.dir.clone().multiplyScalar(25));
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
