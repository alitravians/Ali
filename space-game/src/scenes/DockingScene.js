import * as THREE from 'three';
import { createSpacecraft } from '../objects/Rocket.js';
import { createISS } from '../objects/ISS.js';
import { createDetailedEarth } from '../objects/Earth.js';
import { createStarField, createSun } from '../objects/Stars.js';

export class DockingScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.spacecraft = null;
    this.iss = null;
    this.time = 0;
    this.dockingProgress = 0;
    this.alignment = { x: 0, y: 0, rotation: 0 };
    this.approachSpeed = 0.3;
    this.distance = 30;
    this.docked = false;
    this.failed = false;
    this.mode = 'story';
    this.attempts = 0;
    this._timeouts = [];
    this.capturePhase = null; // null, 'softCapture', 'hardCapture', 'pressurize'
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005);
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    this.scene.add(createStarField(5000));
    const sun = createSun();
    sun.position.set(200, 80, -300);
    this.scene.add(sun);

    const earth = createDetailedEarth(150);
    earth.position.set(0, -180, 50);
    this.scene.add(earth);
    this.earthRef = earth;

    // ISS
    this.iss = createISS();
    this.iss.position.set(0, 0, -50);
    this.scene.add(this.iss);

    // Spacecraft
    this.spacecraft = createSpacecraft();
    this.spacecraft.position.set(0, 0, 0);
    this.scene.add(this.spacecraft);

    this.scene.add(new THREE.AmbientLight(0x223344, 0.4));

    // Docking port lights
    this.guideLight1 = new THREE.PointLight(0x00ff00, 1, 20);
    this.guideLight1.position.set(0, 0, -50);
    this.scene.add(this.guideLight1);
    this.guideLight2 = new THREE.PointLight(0xff0000, 0.5, 15);
    this.guideLight2.position.set(2, 2, -50);
    this.scene.add(this.guideLight2);

    // Target ring
    const ringGeo = new THREE.TorusGeometry(1, 0.02, 8, 32);
    this.targetRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 }));
    this.targetRing.position.set(0, 0, -48);
    this.scene.add(this.targetRing);

    // Reset
    this.distance = 30;
    this.alignment = { x: 0, y: 0, rotation: 0 };
    this.approachSpeed = 0.3;
    this.docked = false;
    this.failed = false;
    this.time = 0;
    this.attempts = 0;
    this.capturePhase = null;
    this._speedWarnTime = 0;

    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, -50);

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showChatButton();
    this.gs.ui.showCenterText('إجراءات الالتحام', 'DOCKING PROCEDURE — KURS SYSTEM ACTIVE', 3500);
    this.gs.ui.showObjective('وجّه المركبة نحو نقطة الالتحام');

    this.gs.ui.showControls([
      { key: 'W/↑', action: 'أعلى' },
      { key: 'S/↓', action: 'أسفل' },
      { key: 'A/←', action: 'يسار' },
      { key: 'D/→', action: 'يمين' },
      { key: 'Q', action: 'تسريع' },
      { key: 'E', action: 'إبطاء' },
    ]);

    this._showDockingHUD();

    this._timeouts.push(setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'نظام KURS نشط. حافظ على المحاذاة مع الحلقة الخضراء. سرعة مثالية: 0.1-0.3 م/ث.', 6000);
    }, 4000));
  }

  _showDockingHUD() {
    this.gs.ui.removeElement('dock-hud');
    const quality = this._getAlignmentQuality();
    const color = quality > 0.8 ? '#4ade80' : quality > 0.5 ? '#fbbf24' : '#f87171';
    const status = quality > 0.8 ? 'ممتاز' : quality > 0.5 ? 'مقبول' : 'خطر';

    this.gs.ui.addElement('dock-hud', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;">
        <div style="width:220px;height:220px;border:1px solid ${color}55;border-radius:50%;position:relative;
          box-shadow:0 0 40px ${color}10, inset 0 0 20px ${color}05;">
          <div style="position:absolute;top:50%;left:50%;width:4px;height:4px;background:${color};
            border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 15px ${color};"></div>
          <div style="position:absolute;top:50%;left:0;width:100%;height:1px;background:${color}15;"></div>
          <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:${color}15;"></div>
          <div style="position:absolute;border:1px solid ${color}20;border-radius:50%;width:110px;height:110px;top:55px;left:55px;"></div>
          <div style="position:absolute;border:1px solid ${color}10;border-radius:50%;width:55px;height:55px;top:82.5px;left:82.5px;"></div>
          <div style="position:absolute;width:8px;height:8px;background:rgba(100,160,255,0.9);border-radius:50%;
            top:${50 - this.alignment.y * 4.5}%;left:${50 + this.alignment.x * 4.5}%;
            transform:translate(-50%,-50%);box-shadow:0 0 15px rgba(100,160,255,0.5);transition:all 0.08s;"></div>
        </div>
      </div>
      <div style="position:fixed;top:12px;left:50%;transform:translateX(-50%);direction:ltr;">
        <div style="background:rgba(5,12,30,0.92);padding:12px 28px;border-radius:10px;border:1px solid rgba(100,160,255,0.2);
          backdrop-filter:blur(10px);display:flex;gap:20px;align-items:center;">
          <div style="text-align:center;">
            <div style="color:rgba(150,180,220,0.5);font-size:0.55rem;font-family:monospace;letter-spacing:1px;">ALIGNMENT</div>
            <div style="font-family:'Share Tech Mono',monospace;color:${color};font-size:1rem;font-weight:bold;">${Math.round(quality * 100)}%</div>
          </div>
          <div style="width:1px;height:30px;background:rgba(100,160,255,0.15);"></div>
          <div style="text-align:center;">
            <div style="color:rgba(150,180,220,0.5);font-size:0.55rem;font-family:monospace;letter-spacing:1px;">RANGE</div>
            <div style="font-family:'Share Tech Mono',monospace;color:#e2e8f0;font-size:1rem;">${this.distance.toFixed(1)}m</div>
          </div>
          <div style="width:1px;height:30px;background:rgba(100,160,255,0.15);"></div>
          <div style="text-align:center;">
            <div style="color:rgba(150,180,220,0.5);font-size:0.55rem;font-family:monospace;letter-spacing:1px;">RANGE RATE</div>
            <div style="font-family:'Share Tech Mono',monospace;color:${this.approachSpeed > 0.8 ? '#f87171' : '#e2e8f0'};font-size:1rem;">${this.approachSpeed.toFixed(2)} m/s</div>
          </div>
          <div style="width:1px;height:30px;background:rgba(100,160,255,0.15);"></div>
          <div style="text-align:center;">
            <div style="color:rgba(150,180,220,0.5);font-size:0.55rem;font-family:monospace;letter-spacing:1px;">STATUS</div>
            <div style="font-family:'Tajawal',sans-serif;color:${color};font-size:0.85rem;">${status}</div>
          </div>
        </div>
      </div>
    `);
  }

  _getAlignmentQuality() {
    const offset = Math.sqrt(this.alignment.x * this.alignment.x + this.alignment.y * this.alignment.y);
    return Math.max(0, 1 - offset / 10);
  }

  update(delta) {
    if (this.docked || this.failed) return;
    this.time += delta;
    const input = this.gs.input;

    if (!this.capturePhase) {
      // Alignment controls
      const sensitivity = 3;
      if (input.isLeft()) this.alignment.x -= sensitivity * delta;
      if (input.isRight()) this.alignment.x += sensitivity * delta;
      if (input.isForward()) this.alignment.y += sensitivity * delta;
      if (input.isBackward()) this.alignment.y -= sensitivity * delta;

      // Speed control
      if (input.isUp()) this.approachSpeed = Math.min(1.5, this.approachSpeed + delta * 0.3);
      if (input.isDown()) this.approachSpeed = Math.max(0.05, this.approachSpeed - delta * 0.3);

      // Drift
      this.alignment.x += (Math.random() - 0.5) * delta * 0.3;
      this.alignment.y += (Math.random() - 0.5) * delta * 0.3;
      this.alignment.x = THREE.MathUtils.clamp(this.alignment.x, -10, 10);
      this.alignment.y = THREE.MathUtils.clamp(this.alignment.y, -10, 10);

      // Approach
      this.distance -= this.approachSpeed * delta;

      // Spacecraft position
      this.spacecraft.position.x = this.alignment.x * 0.5;
      this.spacecraft.position.y = this.alignment.y * 0.5;
      this.spacecraft.position.z = -this.distance * 0.5;

      // Camera
      this.camera.position.set(
        this.spacecraft.position.x * 0.3,
        this.spacecraft.position.y * 0.3 + 2,
        this.spacecraft.position.z + 8
      );
      this.camera.lookAt(0, 0, -50);

      // Target ring
      this.targetRing.material.opacity = 0.3 + Math.sin(this.time * 3) * 0.2;
      const quality = this._getAlignmentQuality();
      this.targetRing.material.color.setHex(quality > 0.8 ? 0x00ff00 : quality > 0.5 ? 0xffcc00 : 0xff4444);

      // Beep
      if (this.distance < 15 && Math.floor(this.time * (2 + (15 - this.distance) * 0.5)) > Math.floor((this.time - delta) * (2 + (15 - this.distance) * 0.5))) {
        this.gs.audio.playDockingBeep();
      }

      this._showDockingHUD();

      // Speed warning
      if (this.approachSpeed > 1 && this.distance < 10) {
        if (!this._speedWarnTime || this.time - this._speedWarnTime > 1.5) {
          this._speedWarnTime = this.time;
          this.gs.ui.showMessage('⚠️ سرعة الاقتراب عالية! أبطئ!', 1200, 'warning');
        }
      }

      // Check docking
      if (this.distance <= 0.5) {
        if (quality > 0.6 && this.approachSpeed < 1.0) {
          this._softCapture();
        } else {
          this._dockFail();
        }
      }
    }

    if (this.earthRef) this.earthRef.rotation.y += delta * 0.005;
  }

  _softCapture() {
    this.capturePhase = 'softCapture';
    this.gs.audio.playConfirm();
    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('التقاط ناعم!', 'SOFT CAPTURE — Petals Engaged', 3000);
    this.gs.ui.showComm('مركز التحكم', 'التقاط ناعم ناجح! بتلات الالتحام مُشتبكة. جارٍ بدء التقاط صلب...', 5000);

    this._timeouts.push(setTimeout(() => {
      this.capturePhase = 'hardCapture';
      this.gs.audio.playBeep();
      this.gs.ui.showCenterText('التقاط صلب', 'HARD CAPTURE — Hooks Engaged', 3000);
      this.gs.ui.showComm('مركز التحكم', 'خطاطيف الالتحام مغلقة. المركبة ثابتة. جارٍ معادلة الضغط...', 5000);
    }, 4000));

    this._timeouts.push(setTimeout(() => {
      this.capturePhase = 'pressurize';
      this.gs.ui.showCenterText('معادلة الضغط', 'PRESSURE EQUALIZATION', 3000);

      // Show pressure gauge
      let pressure = 0;
      this._pressInterval = setInterval(() => {
        pressure += 2;
        this.gs.ui.removeElement('pressure-gauge');
        this.gs.ui.addElement('pressure-gauge', `
          <div style="position:fixed;bottom:60px;left:50%;transform:translateX(-50%);text-align:center;">
            <div style="background:rgba(5,12,30,0.9);border:1px solid rgba(100,160,255,0.3);border-radius:10px;padding:16px 30px;backdrop-filter:blur(8px);">
              <div style="color:rgba(150,180,220,0.5);font-size:0.7rem;font-family:monospace;margin-bottom:6px;">PRESSURE EQUALIZATION</div>
              <div style="font-family:'Share Tech Mono',monospace;color:#4ade80;font-size:1.5rem;">${pressure.toFixed(1)} / 14.7 PSI</div>
              <div style="background:rgba(255,255,255,0.08);border-radius:4px;height:6px;margin-top:8px;overflow:hidden;">
                <div style="width:${(pressure / 14.7) * 100}%;height:100%;background:linear-gradient(90deg,#4a8af4,#4ade80);transition:width 0.3s;"></div>
              </div>
            </div>
          </div>
        `);

        if (pressure >= 14.7) {
          clearInterval(this._pressInterval);
          this._pressInterval = null;
          this._dockComplete();
        }
      }, 300);
    }, 8000));
  }

  _dockComplete() {
    this.docked = true;
    this.gs.audio.playSuccess();
    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('التحام ناجح!', 'DOCKING COMPLETE — Welcome to ISS', 0);
    this.gs.ui.showComm('مركز التحكم', 'التحام مثالي! الضغط متعادل. يمكنك فتح الفتحة ودخول محطة الفضاء الدولية. مرحباً بك على متنها!', 6000);

    this._timeouts.push(setTimeout(() => {
      this.gs.ui.addElement('dock-continue', `
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);">
          <button class="glass-btn glass-btn-primary" id="btn-enter-iss" style="padding:14px 32px;font-size:1rem;">
            🚪 فتح الفتحة ودخول المحطة
          </button>
        </div>
      `);
      this._timeouts.push(setTimeout(() => {
        document.getElementById('btn-enter-iss')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.gs.switchScene('issInterior', { mode: this.mode });
        });
      }, 100));
    }, 3000));
  }

  _dockFail() {
    this.failed = true;
    this.attempts++;
    this.gs.audio.playAlert();
    const reason = this.approachSpeed >= 1.0 ? 'سرعة اقتراب عالية — خطر تلف آلية الالتحام' : 'محاذاة غير كافية — إعادة المناورة مطلوبة';
    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('إجهاض الالتحام', 'DOCKING ABORT', 0);
    this.gs.ui.showMessage(`محاولة ${this.attempts} — ${reason}`, 3000, 'danger');
    this.gs.ui.showComm('مركز التحكم', `${reason}. ابتعد وأعد المحاولة.`, 5000);

    this._timeouts.push(setTimeout(() => {
      this.gs.ui.addElement('retry', `
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:12px;">
          <button class="glass-btn glass-btn-primary" id="btn-retry" style="padding:12px 24px;">🔄 إعادة المناورة</button>
          <button class="glass-btn" id="btn-auto-dock" style="padding:12px 24px;">🤖 التحام تلقائي</button>
        </div>
      `);
      this._timeouts.push(setTimeout(() => {
        document.getElementById('btn-retry')?.addEventListener('click', () => {
          this.gs.audio.playBeep();
          this.distance = 30;
          this.alignment = { x: 0, y: 0, rotation: 0 };
          this.approachSpeed = 0.3;
          this.docked = false;
          this.failed = false;
          this.capturePhase = null;
          this.gs.ui.clear();
          this.gs.ui.addGlobalStyles();
          this.gs.ui.showChatButton();
          this.gs.ui.showObjective('وجّه المركبة نحو نقطة الالتحام');
          this.gs.ui.showControls([
            { key: 'W/↑', action: 'أعلى' }, { key: 'S/↓', action: 'أسفل' },
            { key: 'A/←', action: 'يسار' }, { key: 'D/→', action: 'يمين' },
            { key: 'Q', action: 'تسريع' }, { key: 'E', action: 'إبطاء' },
          ]);
        });
        document.getElementById('btn-auto-dock')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this.failed = false;
          this._softCapture();
        });
      }, 100));
    }, 2500));
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    this._timeouts.forEach(t => clearTimeout(t));
    this._timeouts = [];
    if (this._pressInterval) {
      clearInterval(this._pressInterval);
      this._pressInterval = null;
    }
    window.removeEventListener('resize', this._onResize);
    this.gs.ui.clear();
  }
}
