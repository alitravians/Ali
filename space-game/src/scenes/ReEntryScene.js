import * as THREE from 'three';
import { createSpacecraft } from '../objects/Rocket.js';
import { createDetailedEarth } from '../objects/Earth.js';
import { createStarField, createSun } from '../objects/Stars.js';

export class ReEntryScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.spacecraft = null;
    this.earth = null;
    this.time = 0;
    this.phase = 'undocking'; // undocking, deorbit, reentry, heating, descent
    this.altitude = 408;
    this.speed = 0;
    this.entryAngle = 0;
    this.heatLevel = 0;
    this.shakeIntensity = 0;
    this.mode = 'story';
    this.fireParticles = null;
    this.rumbleSound = null;
    this.warningShown = false;
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000003);
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.camera.position.set(0, 5, 16);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    this.scene.add(createStarField(6000));

    const sun = createSun();
    sun.position.set(200, 100, -300);
    this.scene.add(sun);

    // Earth
    this.earth = createDetailedEarth(200);
    this.earth.position.set(0, -250, -100);
    this.scene.add(this.earth);

    // Spacecraft (scaled up for visibility)
    this.spacecraft = createSpacecraft();
    this.spacecraft.scale.setScalar(1.5);
    this.scene.add(this.spacecraft);

    // Heat shield glow effect
    this.heatGlow = new THREE.PointLight(0xff4400, 0, 20);
    this.heatGlow.position.set(0, -2, 0);
    this.scene.add(this.heatGlow);

    // Fire/plasma particles for reentry
    this.fireParticles = this._createFireParticles();
    this.fireParticles.visible = false;
    this.scene.add(this.fireParticles);

    // Plasma trail
    this.plasmaTrail = this._createPlasmaTrail();
    this.plasmaTrail.visible = false;
    this.scene.add(this.plasmaTrail);

    this.scene.add(new THREE.AmbientLight(0x223344, 0.3));

    // State
    this.phase = 'undocking';
    this.altitude = 408;
    this.speed = 7.66; // km/s orbital speed
    this.entryAngle = 0;
    this.heatLevel = 0;
    this.shakeIntensity = 0;
    this.time = 0;
    this.warningShown = false;

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();

    if (this.mode === 'challenge') {
      this.phase = 'deorbit';
      this.altitude = 200;
      this.gs.ui.showCenterText('تحدي الهبوط', 'حافظ على زاوية الدخول الصحيحة!', 3000);
    } else {
      this.gs.ui.showCenterText('العودة إلى الأرض', 'بدء إجراءات الانفصال عن المحطة', 3000);
    }

    this.gs.ui.showControls([
      { key: 'W/↑', action: 'رفع المقدمة' },
      { key: 'S/↓', action: 'خفض المقدمة' },
      { key: 'A/←', action: 'ميل يسار' },
      { key: 'D/→', action: 'ميل يمين' },
    ]);

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'بدء إجراءات العودة. استعد لانفصال المركبة وحرق الكبح.', 5000);
    }, 3500);

    // Auto-progress from undocking
    if (this.phase === 'undocking') {
      setTimeout(() => {
        this.gs.audio.playConfirm();
        this.gs.ui.showCenterText('انفصال عن المحطة', 'Undocking Complete', 2000);
        this.phase = 'deorbit';

        setTimeout(() => {
          this.gs.ui.showComm('مركز التحكم', 'حرق الكبح... تخفيض المدار للدخول إلى الغلاف الجوي.', 4000);
          this.gs.ui.showCenterText('حرق الكبح', 'Deorbit Burn', 2000);
        }, 3000);

        setTimeout(() => {
          this.phase = 'reentry';
          this.gs.audio.playWarning();
          this.gs.ui.showCenterText('دخول الغلاف الجوي', '⚠️ حافظ على زاوية الدخول', 3000);
          this.gs.ui.showComm('مركز التحكم', 'بداية الدخول في الغلاف الجوي! حافظ على زاوية الدخول بين -1° و -3°. زاوية خاطئة قد تكون خطيرة!', 6000);
          this.rumbleSound = this.gs.audio.playReEntryRumble(25);
        }, 8000);
      }, 4000);
    }
  }

  _createFireParticles() {
    const count = 600;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = -2 + Math.random() * -8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;

      const t = Math.random();
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.2 + t * 0.6;
      colors[i * 3 + 2] = t * 0.1;

      velocities.push({
        x: (Math.random() - 0.5) * 3,
        y: 5 + Math.random() * 10,
        z: (Math.random() - 0.5) * 3
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    points.userData.velocities = velocities;
    points.userData.count = count;
    return points;
  }

  _createPlasmaTrail() {
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = 3 + Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.5, vertexColors: true, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
  }

  _updateFireParticles(delta) {
    const pos = this.fireParticles.geometry.attributes.position.array;
    const colors = this.fireParticles.geometry.attributes.color.array;
    const vels = this.fireParticles.userData.velocities;
    const count = this.fireParticles.userData.count;

    for (let i = 0; i < count; i++) {
      pos[i * 3] += vels[i].x * delta;
      pos[i * 3 + 1] += vels[i].y * delta * this.heatLevel;
      pos[i * 3 + 2] += vels[i].z * delta;

      if (pos[i * 3 + 1] > 15) {
        pos[i * 3] = (Math.random() - 0.5) * 4 * this.heatLevel;
        pos[i * 3 + 1] = -2;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 4 * this.heatLevel;
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.3 + Math.random() * 0.5;
        colors[i * 3 + 2] = Math.random() * 0.2;
      }
    }
    this.fireParticles.geometry.attributes.position.needsUpdate = true;
    this.fireParticles.geometry.attributes.color.needsUpdate = true;
  }

  update(delta) {
    this.time += delta;
    const input = this.gs.input;

    if (this.phase === 'deorbit') {
      this.altitude -= delta * 5;
      this.speed = 7.66;

      if (this.altitude <= 120) {
        this.phase = 'reentry';
        this.gs.audio.playWarning();
        this.gs.ui.showCenterText('دخول الغلاف الجوي', '⚠️ منطقة الاحتكاك', 3000);
        this.rumbleSound = this.gs.audio.playReEntryRumble(20);
      }
    }

    if (this.phase === 'reentry' || this.phase === 'heating') {
      // Player controls entry angle
      if (input.isForward()) this.entryAngle = Math.min(5, this.entryAngle + delta * 2);
      if (input.isBackward()) this.entryAngle = Math.max(-8, this.entryAngle - delta * 2);

      // Descent
      this.altitude -= delta * (3 + Math.abs(this.entryAngle) * 2);
      this.speed -= delta * 0.3;

      // Heat calculation based on altitude and speed
      if (this.altitude < 100 && this.altitude > 30) {
        this.heatLevel = Math.min(1, (100 - this.altitude) / 50 * (this.speed / 5));
        this.phase = 'heating';
        this.fireParticles.visible = true;
        this.plasmaTrail.visible = true;
        this.shakeIntensity = this.heatLevel * 3;

        // Heat glow
        this.heatGlow.intensity = this.heatLevel * 5;
        this.heatGlow.color.setHex(this.heatLevel > 0.7 ? 0xff2200 : 0xff6600);

        // Shield color change
        const shield = this.spacecraft.userData.shield;
        if (shield) {
          const shieldMat = this.spacecraft.userData.shieldMat;
          shieldMat.emissive.setHex(this.heatLevel > 0.5 ? 0xff4400 : 0xff8800);
          shieldMat.emissiveIntensity = this.heatLevel;
        }

        // Entry angle warnings
        const angleOk = this.entryAngle >= -4 && this.entryAngle <= -0.5;
        if (!angleOk && !this.warningShown) {
          this.warningShown = true;
          if (this.entryAngle > -0.5) {
            this.gs.ui.showMessage('⚠️ زاوية ضحلة جداً! المركبة سترتد! اخفض المقدمة (S)', 3000, 'danger');
          } else {
            this.gs.ui.showMessage('⚠️ زاوية حادة جداً! حرارة مفرطة! ارفع المقدمة (W)', 3000, 'danger');
          }
          setTimeout(() => { this.warningShown = false; }, 4000);
        }
      }

      if (this.altitude <= 30) {
        this.phase = 'descent';
        this.heatLevel = 0;
        this.fireParticles.visible = false;
        this.plasmaTrail.visible = false;
        this.heatGlow.intensity = 0;
        this.shakeIntensity = 0.5;
        this.gs.audio.playConfirm();
        this.gs.ui.showCenterText('اجتياز منطقة التسخين', 'فتح المظلات...', 3000);
        this.gs.ui.showComm('مركز التحكم', 'اجتزت منطقة الاحتكاك بنجاح! بدء تسلسل المظلات.', 5000);

        setTimeout(() => {
          this.gs.switchScene('landing', { mode: this.mode, entryAngle: this.entryAngle });
        }, 4000);
      }
    }

    // Update fire particles
    if (this.fireParticles.visible) {
      this._updateFireParticles(delta);
    }

    // Spacecraft tilt based on entry angle
    this.spacecraft.rotation.x = THREE.MathUtils.lerp(this.spacecraft.rotation.x, this.entryAngle * 0.1, delta * 2);

    // Camera shake
    if (this.shakeIntensity > 0) {
      this.camera.position.x = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y = 5 + (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.z = 16 + (Math.random() - 0.5) * this.shakeIntensity * 0.5;
    }
    this.camera.lookAt(this.spacecraft.position);

    // Earth gets closer
    const earthScale = 1 + (408 - this.altitude) / 408 * 2;
    this.earth.position.y = -250 + (408 - this.altitude) * 0.5;
    this.earth.rotation.y += delta * 0.005;

    // Background color change
    if (this.altitude < 80) {
      const t = Math.max(0, (80 - this.altitude) / 80);
      const bg = new THREE.Color().lerpColors(new THREE.Color(0x000003), new THREE.Color(0x112244), t);
      this.scene.background = bg;
    }

    // HUD
    this.gs.ui.showHUD({
      fuel: 30,
      oxygen: 85,
      energy: 70,
      speed: Math.round(this.speed * 1000),
      altitude: Math.round(this.altitude)
    });

    // Entry angle display
    this.gs.ui.removeElement('angle-display');
    const angleColor = (this.entryAngle >= -4 && this.entryAngle <= -0.5) ? '#00ff88' : '#ff4444';
    this.gs.ui.addElement('angle-display', `
      <div style="position:fixed;bottom:100px;left:50%;transform:translateX(-50%);text-align:center;direction:rtl;">
        <div style="font-family:'Orbitron',monospace;color:${angleColor};font-size:1.2rem;">
          زاوية الدخول: ${this.entryAngle.toFixed(1)}°
        </div>
        <div style="color:#557799;font-size:0.7rem;">المطلوب: من -0.5° إلى -4.0°</div>
        ${this.heatLevel > 0 ? `
          <div style="margin-top:8px;">
            <div style="color:#ff6600;font-size:0.8rem;">الحرارة: ${Math.round(this.heatLevel * 100)}%</div>
            <div style="width:150px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin:3px auto;">
              <div style="width:${this.heatLevel * 100}%;height:100%;background:linear-gradient(90deg,#ff8800,#ff2200);border-radius:2px;"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    try { if (this.rumbleSound) this.rumbleSound.source.stop(); } catch(e) {}
    this.gs.ui.clear();
  }
}
