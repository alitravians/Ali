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
    this.approachSpeed = 0.5;
    this.distance = 30;
    this.docked = false;
    this.failed = false;
    this.mode = 'story';
    this.attempts = 0;
    this._timeouts = [];
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

    // Docking guide lights
    this.guideLight1 = new THREE.PointLight(0x00ff00, 1, 20);
    this.guideLight1.position.set(0, 0, -50);
    this.scene.add(this.guideLight1);
    this.guideLight2 = new THREE.PointLight(0xff0000, 0.5, 15);
    this.guideLight2.position.set(2, 2, -50);
    this.scene.add(this.guideLight2);

    // Crosshair / alignment guide
    const ringGeo = new THREE.TorusGeometry(1, 0.02, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    this.targetRing = new THREE.Mesh(ringGeo, ringMat);
    this.targetRing.position.set(0, 0, -48);
    this.scene.add(this.targetRing);

    // Reset state
    this.distance = 30;
    this.alignment = { x: 0, y: 0, rotation: 0 };
    this.approachSpeed = 0.3;
    this.docked = false;
    this.failed = false;
    this.time = 0;
    this.attempts = 0;

    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, -50);

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('الالتحام بالمحطة', 'محاذاة المركبة مع نقطة الالتحام', 3000);
    this.gs.ui.showObjective('وجّه المركبة نحو نقطة الالتحام الخضراء');

    this.gs.ui.showControls([
      { key: 'W/↑', action: 'أعلى' },
      { key: 'S/↓', action: 'أسفل' },
      { key: 'A/←', action: 'يسار' },
      { key: 'D/→', action: 'يمين' },
      { key: 'Q', action: 'تسريع الاقتراب' },
      { key: 'E', action: 'إبطاء الاقتراب' },
    ]);

    this._showDockingHUD();

    this._timeouts.push(setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'بدء إجراءات الالتحام. حافظ على المحاذاة مع الحلقة الخضراء واقترب ببطء.', 5000);
    }, 3500));
  }

  _showDockingHUD() {
    this.gs.ui.removeElement('dock-hud');
    const alignQuality = this._getAlignmentQuality();
    const color = alignQuality > 0.8 ? '#00ff88' : alignQuality > 0.5 ? '#ffcc00' : '#ff4444';
    const status = alignQuality > 0.8 ? 'ممتاز' : alignQuality > 0.5 ? 'مقبول' : 'غير متحاذي';

    this.gs.ui.addElement('dock-hud', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;">
        <div style="width:200px;height:200px;border:1px solid ${color}88;border-radius:50%;position:relative;
          box-shadow:0 0 30px ${color}18, inset 0 0 15px ${color}08;">
          <div style="position:absolute;top:50%;left:50%;width:3px;height:3px;background:${color};
            border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 12px ${color};"></div>
          <div style="position:absolute;top:50%;left:0;width:100%;height:1px;background:${color}22;"></div>
          <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:${color}22;"></div>
          <div style="position:absolute;border:1px solid ${color}33;border-radius:50%;
            width:100px;height:100px;top:50px;left:50px;"></div>
          <div style="position:absolute;width:6px;height:6px;background:rgba(255,149,0,0.8);border-radius:50%;
            top:${50 - this.alignment.y * 5}%;left:${50 + this.alignment.x * 5}%;
            transform:translate(-50%,-50%);box-shadow:0 0 12px rgba(255,149,0,0.4);transition:all 0.1s;"></div>
        </div>
      </div>
      <div style="position:fixed;top:12px;left:50%;transform:translateX(-50%);text-align:center;direction:rtl;">
        <div style="background:rgba(0,0,0,0.85);padding:10px 24px;border-radius:2px;border:1px solid rgba(255,149,0,0.2);box-shadow:0 2px 15px rgba(0,0,0,0.4);">
          <div style="font-family:'Orbitron',sans-serif;color:${color};font-size:0.85rem;letter-spacing:1px;">
            ALIGNMENT: <span style="color:#fff;">${Math.round(alignQuality * 100)}%</span>
            <span style="font-family:'Tajawal',sans-serif;font-size:0.8rem;color:rgba(200,220,240,0.6);margin-right:8px;">${status}</span>
          </div>
          <div style="font-family:'Share Tech Mono',monospace;color:rgba(255,149,0,0.5);font-size:0.75rem;margin-top:5px;letter-spacing:1px;">
            DIST: <span style="color:rgba(255,255,255,0.9);">${this.distance.toFixed(1)}m</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            SPD: <span style="color:rgba(255,255,255,0.9);">${this.approachSpeed.toFixed(2)}m/s</span>
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

    // Alignment controls
    const sensitivity = 3;
    if (input.isLeft()) this.alignment.x -= sensitivity * delta;
    if (input.isRight()) this.alignment.x += sensitivity * delta;
    if (input.isForward()) this.alignment.y += sensitivity * delta;
    if (input.isBackward()) this.alignment.y -= sensitivity * delta;

    // Speed control
    if (input.isUp()) this.approachSpeed = Math.min(1.5, this.approachSpeed + delta * 0.3);
    if (input.isDown()) this.approachSpeed = Math.max(0.05, this.approachSpeed - delta * 0.3);

    // Drift (slight random movement)
    this.alignment.x += (Math.random() - 0.5) * delta * 0.3;
    this.alignment.y += (Math.random() - 0.5) * delta * 0.3;

    // Clamp alignment
    this.alignment.x = THREE.MathUtils.clamp(this.alignment.x, -10, 10);
    this.alignment.y = THREE.MathUtils.clamp(this.alignment.y, -10, 10);

    // Approach
    this.distance -= this.approachSpeed * delta;

    // Update spacecraft position based on alignment
    this.spacecraft.position.x = this.alignment.x * 0.5;
    this.spacecraft.position.y = this.alignment.y * 0.5;
    this.spacecraft.position.z = -this.distance * 0.5;

    // Camera follows
    this.camera.position.set(
      this.spacecraft.position.x * 0.3,
      this.spacecraft.position.y * 0.3 + 2,
      this.spacecraft.position.z + 8
    );
    this.camera.lookAt(0, 0, -50);

    // Target ring pulse
    this.targetRing.material.opacity = 0.3 + Math.sin(this.time * 3) * 0.2;
    const quality = this._getAlignmentQuality();
    this.targetRing.material.color.setHex(quality > 0.8 ? 0x00ff00 : quality > 0.5 ? 0xffcc00 : 0xff4444);

    // Beep frequency increases as distance decreases
    if (this.distance < 15 && Math.floor(this.time * (2 + (15 - this.distance) * 0.5)) > Math.floor((this.time - delta) * (2 + (15 - this.distance) * 0.5))) {
      this.gs.audio.playDockingBeep();
    }

    // Update HUD
    this._showDockingHUD();

    // Warnings (throttled to avoid DOM spam)
    if (this.approachSpeed > 1 && this.distance < 10) {
      if (!this._speedWarnTime || this.time - this._speedWarnTime > 1.5) {
        this._speedWarnTime = this.time;
        this.gs.ui.showMessage('⚠️ سرعة الاقتراب عالية! أبطئ!', 1000, 'warning');
      }
    }

    // Check docking
    if (this.distance <= 0.5) {
      if (quality > 0.6 && this.approachSpeed < 1.0) {
        this._dockSuccess();
      } else {
        this._dockFail();
      }
    }

    // Earth rotation
    if (this.earthRef) this.earthRef.rotation.y += delta * 0.005;
  }

  _dockSuccess() {
    this.docked = true;
    this.gs.audio.playSuccess();
    this.gs.ui.clear();
    this.gs.ui.showCenterText('التحام ناجح!', 'أحسنت! تم الالتحام بمحطة الفضاء الدولية بنجاح', 0);

    this._timeouts.push(setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'عمل ممتاز! الالتحام تم بنجاح. يمكنك الآن دخول المحطة.', 5000);
    }, 2000));

    this._timeouts.push(setTimeout(() => {
      this.gs.ui.addElement('dock-continue', `
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);">
          <button class="menu-btn menu-btn-primary" style="display:inline-flex;width:auto;padding:11px 28px;" id="btn-enter-iss">
            <div class="menu-btn-icon">🚪</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.95rem;">دخول محطة الفضاء الدولية</div></div>
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
    const reason = this.approachSpeed >= 1.0 ? 'سرعة اقتراب عالية جداً' : 'محاذاة غير كافية';
    this.gs.ui.clear();
    this.gs.ui.showCenterText('فشل الالتحام', reason, 0);
    this.gs.ui.showMessage(`محاولة ${this.attempts} — ${reason}`, 3000, 'danger');

    this._timeouts.push(setTimeout(() => {
      this.gs.ui.addElement('retry', `
        <div style="position:fixed;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:12px;">
          <button class="menu-btn menu-btn-primary" style="display:inline-flex;width:auto;padding:10px 24px;" id="btn-retry">
            <div class="menu-btn-icon">🔄</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.9rem;">إعادة المحاولة</div></div>
          </button>
          <button class="menu-btn" style="display:inline-flex;width:auto;padding:10px 24px;" id="btn-auto-dock">
            <div class="menu-btn-icon">🤖</div>
            <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.9rem;">التحام تلقائي</div></div>
          </button>
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
          this.gs.ui.clear();
          this.gs.ui.addGlobalStyles();
          this.gs.ui.showObjective('وجّه المركبة نحو نقطة الالتحام');
          this.gs.ui.showControls([
            { key: 'W/↑', action: 'أعلى' },
            { key: 'S/↓', action: 'أسفل' },
            { key: 'A/←', action: 'يسار' },
            { key: 'D/→', action: 'يمين' },
            { key: 'Q', action: 'تسريع الاقتراب' },
            { key: 'E', action: 'إبطاء الاقتراب' },
          ]);
        });
        document.getElementById('btn-auto-dock')?.addEventListener('click', () => {
          this.gs.audio.playConfirm();
          this._dockSuccess();
        });
      }, 100));
    }, 2000));
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    this._timeouts.forEach(t => clearTimeout(t));
    this._timeouts = [];
    window.removeEventListener('resize', this._onResize);
    this.gs.ui.clear();
  }
}
