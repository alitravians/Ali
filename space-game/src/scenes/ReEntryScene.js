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
    this.phase = 'undocking'; // undocking, separation, deorbit, reentry, heating, blackout, descent
    this.altitude = 408;
    this.speed = 7.66; // km/s orbital speed
    this.entryAngle = 0;
    this.heatLevel = 0;
    this.shakeIntensity = 0;
    this.mode = 'story';
    this.fireParticles = null;
    this.rumbleSound = null;
    this.warningShown = false;
    this.gForce = 1;
    this.blackoutTimer = 0;
    this.isBlackout = false;
    this.heatShieldTemp = 20; // Celsius
    this.modulesSeparated = false;
    this.drogueDeployed = false;
    this.ionTrail = null;
    this.shockwave = null;
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

    // Earth (larger, more detailed)
    this.earth = createDetailedEarth(200);
    this.earth.position.set(0, -250, -100);
    this.scene.add(this.earth);

    // Spacecraft (scaled up for visibility)
    this.spacecraft = createSpacecraft();
    this.spacecraft.scale.setScalar(1.5);
    this.scene.add(this.spacecraft);

    // Service module (will be jettisoned)
    this.serviceModule = this._createServiceModule();
    this.serviceModule.position.set(0, -4, 0);
    this.scene.add(this.serviceModule);

    // Heat shield glow effect (multiple for more realism)
    this.heatGlow = new THREE.PointLight(0xff4400, 0, 25);
    this.heatGlow.position.set(0, -2, 0);
    this.scene.add(this.heatGlow);

    this.heatGlow2 = new THREE.PointLight(0xff8800, 0, 15);
    this.heatGlow2.position.set(0, -3, 0);
    this.scene.add(this.heatGlow2);

    // Fire/plasma particles for reentry (more particles)
    this.fireParticles = this._createFireParticles();
    this.fireParticles.visible = false;
    this.scene.add(this.fireParticles);

    // Plasma trail
    this.plasmaTrail = this._createPlasmaTrail();
    this.plasmaTrail.visible = false;
    this.scene.add(this.plasmaTrail);

    // Ionization trail (blue/purple)
    this.ionTrail = this._createIonTrail();
    this.ionTrail.visible = false;
    this.scene.add(this.ionTrail);

    // Shockwave cone effect
    this.shockwave = this._createShockwave();
    this.shockwave.visible = false;
    this.scene.add(this.shockwave);

    // Debris particles (paint flecks, insulation bits)
    this.debrisParticles = this._createDebris();
    this.debrisParticles.visible = false;
    this.scene.add(this.debrisParticles);

    this.scene.add(new THREE.AmbientLight(0x223344, 0.3));

    // State reset
    this.phase = 'undocking';
    this.altitude = 408;
    this.speed = 7.66;
    this.entryAngle = 0;
    this.heatLevel = 0;
    this.shakeIntensity = 0;
    this.time = 0;
    this.warningShown = false;
    this.gForce = 1;
    this.blackoutTimer = 0;
    this.isBlackout = false;
    this.heatShieldTemp = 20;
    this.modulesSeparated = false;
    this.drogueDeployed = false;
    this._transitioning = false;

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showChatButton();

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
    ]);

    // Realistic undocking to re-entry sequence
    this._timeouts = [];
    if (this.phase === 'undocking') {
      this._timeouts.push(setTimeout(() => {
        this.gs.ui.showComm('مركز التحكم', 'بدء إجراءات الانفصال. فتح المشابك... فصل خراطيم الأمبيليكال.', 5000);
      }, 2000));

      this._timeouts.push(setTimeout(() => {
        this.gs.audio.playConfirm();
        this.gs.ui.showCenterText('انفصال عن المحطة', 'Undocking Complete', 2500);
        this.phase = 'separation';
        this.gs.ui.showComm('مركز التحكم', 'الانفصال ناجح. ابتعاد 20 متر عن المحطة. استعداد لحرق الكبح.', 5000);
      }, 6000));

      this._timeouts.push(setTimeout(() => {
        this.phase = 'deorbit';
        this.gs.audio.playBeep();
        this.gs.ui.showCenterText('حرق الكبح', 'Deorbit Burn — تخفيض السرعة المدارية', 3000);
        this.gs.ui.showComm('مركز التحكم', 'حرق الكبح لمدة 4 دقائق و 40 ثانية. تخفيض السرعة بـ 128 م/ث. مسار الدخول محسوب.', 6000);
      }, 13000));

      this._timeouts.push(setTimeout(() => {
        // Module separation
        this.modulesSeparated = true;
        this.gs.audio.playConfirm();
        this.gs.ui.showCenterText('فصل الوحدات', 'انفصال وحدة الخدمة ووحدة المدار', 3000);
        this.gs.ui.showComm('مركز التحكم', 'وحدة الخدمة والوحدة المدارية انفصلتا. كبسولة الهبوط وحدها الآن. توجيه الدرع الحراري للأمام.', 6000);
      }, 20000));

      this._timeouts.push(setTimeout(() => {
        this.phase = 'reentry';
        this.gs.audio.playWarning();
        this.gs.ui.showCenterText('⚠️ دخول الغلاف الجوي', 'ارتفاع 122 كم — بداية الاحتكاك', 3000);
        this.gs.ui.showComm('مركز التحكم', 'بداية الدخول في الغلاف الجوي! السرعة 28,000 كم/ساعة. حافظ على زاوية الدخول بين -1° و -3°! زاوية خاطئة قد تؤدي للارتداد عن الغلاف أو الاحتراق!', 8000);
        this.rumbleSound = this.gs.audio.playReEntryRumble(30);
      }, 26000));
    }
  }

  _createServiceModule() {
    const group = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Solar panels on service module
    const panelGeo = new THREE.BoxGeometry(4, 0.05, 1);
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x1a237e, specular: 0x3333ff });
    [-1, 1].forEach(side => {
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(side * 3, 0, 0);
      group.add(panel);
    });

    // Engine nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.4, 0.6, 0.8, 12);
    const nozzleMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.y = -1.8;
    group.add(nozzle);

    return group;
  }

  _createFireParticles() {
    const count = 1200;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = -2 + Math.random() * -12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const t = Math.random();
      if (t < 0.3) {
        // White-hot core
        colors[i * 3] = 1; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.8;
      } else if (t < 0.6) {
        // Orange flames
        colors[i * 3] = 1; colors[i * 3 + 1] = 0.4 + t * 0.4; colors[i * 3 + 2] = t * 0.1;
      } else {
        // Red/dark trailing
        colors[i * 3] = 0.8 + t * 0.2; colors[i * 3 + 1] = 0.1 + t * 0.2; colors[i * 3 + 2] = 0;
      }

      sizes[i] = 0.3 + Math.random() * 1.2;

      velocities.push({
        x: (Math.random() - 0.5) * 4,
        y: 6 + Math.random() * 14,
        z: (Math.random() - 0.5) * 4
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    points.userData.velocities = velocities;
    points.userData.count = count;
    return points;
  }

  _createPlasmaTrail() {
    const count = 600;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 1] = 3 + Math.random() * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
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

  _createIonTrail() {
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = 5 + Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      // Blue/purple ionization
      colors[i * 3] = 0.3 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.3, vertexColors: true, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
  }

  _createShockwave() {
    const geo = new THREE.ConeGeometry(5, 8, 16, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff6600, transparent: true, opacity: 0.15,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const cone = new THREE.Mesh(geo, mat);
    cone.rotation.x = Math.PI;
    cone.position.y = -5;
    return cone;
  }

  _createDebris() {
    const count = 100;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      const c = 0.5 + Math.random() * 0.5;
      colors[i * 3] = c; colors[i * 3 + 1] = c * 0.8; colors[i * 3 + 2] = c * 0.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.15, vertexColors: true, transparent: true, opacity: 0.7
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

      if (pos[i * 3 + 1] > 20) {
        pos[i * 3] = (Math.random() - 0.5) * 5 * this.heatLevel;
        pos[i * 3 + 1] = -2;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 5 * this.heatLevel;
        const t = Math.random();
        if (this.heatLevel > 0.7) {
          colors[i * 3] = 1; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.7;
        } else {
          colors[i * 3] = 1; colors[i * 3 + 1] = 0.3 + Math.random() * 0.5; colors[i * 3 + 2] = t * 0.2;
        }
      }
    }
    this.fireParticles.geometry.attributes.position.needsUpdate = true;
    this.fireParticles.geometry.attributes.color.needsUpdate = true;
  }

  _updateIonTrail(delta) {
    const pos = this.ionTrail.geometry.attributes.position.array;
    const count = pos.length / 3;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += (8 + Math.random() * 5) * delta * this.heatLevel;
      if (pos[i * 3 + 1] > 35) {
        pos[i * 3] = (Math.random() - 0.5) * 3 * this.heatLevel;
        pos[i * 3 + 1] = 5;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 3 * this.heatLevel;
      }
    }
    this.ionTrail.geometry.attributes.position.needsUpdate = true;
  }

  update(delta) {
    this.time += delta;
    const input = this.gs.input;

    // Service module separation animation
    if (this.modulesSeparated && this.serviceModule.visible) {
      this.serviceModule.position.y -= delta * 3;
      this.serviceModule.rotation.x += delta * 0.5;
      this.serviceModule.rotation.z += delta * 0.3;
      if (this.serviceModule.position.y < -30) {
        this.serviceModule.visible = false;
      }
    }

    if (this.phase === 'separation') {
      this.altitude -= delta * 0.5;
    }

    if (this.phase === 'deorbit') {
      this.altitude -= delta * 8;
      this.speed = 7.66;

      if (this.altitude <= 122) {
        this.phase = 'reentry';
        this.gs.audio.playWarning();
        this.gs.ui.showCenterText('⚠️ دخول الغلاف الجوي', 'Entry Interface — 122 كم', 3000);
        this.rumbleSound = this.gs.audio.playReEntryRumble(25);
      }
    }

    if (this.phase === 'reentry' || this.phase === 'heating' || this.phase === 'blackout') {
      // Player controls entry angle
      if (input.isForward()) this.entryAngle = Math.min(5, this.entryAngle + delta * 2);
      if (input.isBackward()) this.entryAngle = Math.max(-8, this.entryAngle - delta * 2);

      // Descent rate depends on angle and altitude
      const descentRate = 5 + Math.abs(this.entryAngle) * 4;
      this.altitude -= delta * descentRate;
      this.speed = Math.max(0, this.speed - delta * 0.4);

      // G-force calculation (realistic: peaks at 4-5G during re-entry)
      if (this.altitude < 100 && this.altitude > 25) {
        const altFactor = 1 - Math.abs(this.altitude - 55) / 45;
        this.gForce = 1 + altFactor * 4.5 * (this.speed / 7);
      } else {
        this.gForce = Math.max(1, this.gForce - delta * 0.5);
      }

      // Heat calculation based on altitude and speed (realistic heating zone: 100km to 30km)
      if (this.altitude < 100 && this.altitude > 25) {
        this.heatLevel = Math.min(1, (100 - this.altitude) / 45 * (this.speed / 5));
        this.heatShieldTemp = 20 + this.heatLevel * 1580; // Up to 1600°C like real Soyuz

        if (this.phase !== 'blackout') this.phase = 'heating';
        this.fireParticles.visible = true;
        this.plasmaTrail.visible = true;
        this.ionTrail.visible = this.heatLevel > 0.3;
        this.shockwave.visible = this.heatLevel > 0.4;
        this.debrisParticles.visible = this.heatLevel > 0.2;
        this.shakeIntensity = this.heatLevel * 4;

        // Heat glow intensities
        this.heatGlow.intensity = this.heatLevel * 6;
        this.heatGlow2.intensity = this.heatLevel * 3;
        this.heatGlow.color.setHex(this.heatLevel > 0.7 ? 0xff2200 : 0xff6600);

        // Shockwave scale based on heat
        if (this.shockwave.visible) {
          this.shockwave.scale.setScalar(this.heatLevel * 1.5);
          this.shockwave.material.opacity = this.heatLevel * 0.2;
        }

        // Shield color change
        const shield = this.spacecraft.userData.shield;
        if (shield) {
          const shieldMat = this.spacecraft.userData.shieldMat;
          if (this.heatLevel > 0.7) {
            shieldMat.emissive.setHex(0xff2200);
          } else if (this.heatLevel > 0.4) {
            shieldMat.emissive.setHex(0xff6600);
          } else {
            shieldMat.emissive.setHex(0xff8800);
          }
          shieldMat.emissiveIntensity = this.heatLevel * 1.2;
        }

        // Communications blackout (realistic: ionized plasma blocks radio)
        if (this.heatLevel > 0.6 && !this.isBlackout) {
          this.isBlackout = true;
          this.phase = 'blackout';
          this.gs.ui.showMessage('📡 انقطاع الاتصال — بلازما مؤينة تحجب الإشارات', 5000, 'warning');
          this.gs.ui.showCenterText('انقطاع الاتصال', 'Communications Blackout', 4000);
        }

        if (this.isBlackout && this.heatLevel < 0.4) {
          this.isBlackout = false;
          this.phase = 'heating';
          this.gs.audio.playConfirm();
          this.gs.ui.showMessage('📡 استعادة الاتصال!', 3000, 'success');
          this.gs.ui.showComm('مركز التحكم', 'نسمعك مجدداً! أنت على المسار الصحيح. الدرع الحراري يعمل بشكل مثالي!', 5000);
        }

        // Entry angle warnings
        const angleOk = this.entryAngle >= -4 && this.entryAngle <= -0.5;
        if (!angleOk && !this.warningShown) {
          this.warningShown = true;
          if (this.entryAngle > -0.5) {
            this.gs.ui.showMessage('⚠️ زاوية ضحلة جداً! المركبة سترتد عن الغلاف! اخفض المقدمة (S)', 3000, 'danger');
          } else {
            this.gs.ui.showMessage('⚠️ زاوية حادة جداً! حرارة مفرطة! ارفع المقدمة (W)', 3000, 'danger');
          }
          setTimeout(() => { this.warningShown = false; }, 4000);
        }
      }

      // Transition to descent phase
      if (this.altitude <= 25 && this.phase !== 'descent') {
        this.phase = 'descent';
        this.heatLevel = 0;
        this.isBlackout = false;
        this.fireParticles.visible = false;
        this.plasmaTrail.visible = false;
        this.ionTrail.visible = false;
        this.shockwave.visible = false;
        this.debrisParticles.visible = false;
        this.heatGlow.intensity = 0;
        this.heatGlow2.intensity = 0;
        this.shakeIntensity = 0.5;
        this.gForce = 1;
        this.gs.audio.playConfirm();
        this.gs.ui.showCenterText('اجتياز منطقة التسخين', 'Peak Heating Passed — مرحلة المظلات', 3000);
        this.gs.ui.showComm('مركز التحكم', 'أحسنت! اجتزت منطقة الاحتكاك. درجة حرارة الدرع 1600 درجة! بدء تسلسل المظلات في 10 كم.', 6000);
      }
    }

    if (this.phase === 'descent') {
      this.altitude -= delta * 5;
      this.speed = Math.max(0, this.speed - delta * 0.8);
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 0.1);

      // Drogue chute at 10km
      if (this.altitude <= 10 && !this.drogueDeployed) {
        this.drogueDeployed = true;
        this.gs.audio.playConfirm();
        this.gs.ui.showCenterText('مظلات الكبح', 'Drogue Chutes — إبطاء من 230 م/ث إلى 80 م/ث', 3000);
        this.gs.ui.showComm('مركز التحكم', 'مظلات الكبح مفتوحة! السرعة تنخفض. بدء فتح المظلات الرئيسية على ارتفاع 5 كم.', 5000);
      }

      // Transition to landing scene
      if (this.altitude <= 5 && !this._transitioning) {
        this._transitioning = true;
        this.gs.ui.showCenterText('المظلات الرئيسية', 'Main Chutes Deployed', 2000);
        setTimeout(() => {
          this.gs.switchScene('landing', { mode: this.mode, entryAngle: this.entryAngle });
        }, 2500);
      }
    }

    // Update particles
    if (this.fireParticles.visible) {
      this._updateFireParticles(delta);
    }
    if (this.ionTrail && this.ionTrail.visible) {
      this._updateIonTrail(delta);
    }

    // Spacecraft tilt based on entry angle
    this.spacecraft.rotation.x = THREE.MathUtils.lerp(this.spacecraft.rotation.x, this.entryAngle * 0.1, delta * 2);

    // Camera shake (more intense during peak heating)
    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeZ = (Math.random() - 0.5) * this.shakeIntensity * 0.5;
      this.camera.position.x = shakeX;
      this.camera.position.y = 5 + shakeY;
      this.camera.position.z = 16 + shakeZ;
    }
    this.camera.lookAt(this.spacecraft.position);

    // Earth gets closer (more dramatic scale change)
    const earthScale = 1 + (408 - this.altitude) / 408 * 3;
    this.earth.scale.setScalar(earthScale);
    this.earth.position.y = -250 + (408 - this.altitude) * 0.6;
    this.earth.rotation.y += delta * 0.005;

    // Background color change (gradually becomes atmospheric blue)
    if (this.altitude < 100) {
      const t = Math.max(0, (100 - this.altitude) / 100);
      const bg = new THREE.Color().lerpColors(new THREE.Color(0x000003), new THREE.Color(0x112244), t);
      if (this.altitude < 40) {
        const t2 = (40 - this.altitude) / 40;
        bg.lerpColors(bg, new THREE.Color(0x3366aa), t2 * 0.5);
      }
      this.scene.background = bg;
    }

    // G-force visual effect (screen edges darken at high G)
    this.gs.ui.removeElement('g-vignette');
    if (this.gForce > 2) {
      const vignetteOpacity = Math.min(0.6, (this.gForce - 2) / 5);
      this.gs.ui.addElement('g-vignette', `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;
          background:radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignetteOpacity}) 100%);z-index:5;"></div>
      `);
    }

    // Blackout static effect
    this.gs.ui.removeElement('blackout-static');
    if (this.isBlackout) {
      this.gs.ui.addElement('blackout-static', `
        <div style="position:fixed;top:70px;right:15px;background:rgba(255,0,0,0.2);border:1px solid rgba(255,0,0,0.5);
          border-radius:8px;padding:8px 15px;direction:rtl;animation:blink 1s infinite;">
          <div style="color:#ff4444;font-size:0.8rem;">📡 انقطاع الاتصال</div>
          <div style="color:#ff6666;font-size:0.65rem;">بلازما مؤينة — لا يمكن الاتصال بالأرض</div>
        </div>
        <style>@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}</style>
      `);
    }

    // Enhanced HUD with more realistic data
    this.gs.ui.showHUD({
      fuel: 30,
      oxygen: 85,
      energy: 70,
      speed: Math.round(this.speed * 1000),
      altitude: Math.round(this.altitude)
    });

    // Entry angle + heat + G-force display
    this.gs.ui.removeElement('angle-display');
    const angleColor = (this.entryAngle >= -4 && this.entryAngle <= -0.5) ? '#00ff88' : '#ff4444';
    const gColor = this.gForce > 4 ? '#ff4444' : this.gForce > 3 ? '#ffaa00' : '#00ff88';
    this.gs.ui.addElement('angle-display', `
      <div style="position:fixed;bottom:100px;left:50%;transform:translateX(-50%);text-align:center;direction:rtl;">
        <div style="font-family:'Orbitron',monospace;color:${angleColor};font-size:1.2rem;">
          زاوية الدخول: ${this.entryAngle.toFixed(1)}°
        </div>
        <div style="color:#557799;font-size:0.7rem;">المطلوب: من -0.5° إلى -4.0°</div>
        ${this.heatLevel > 0 ? `
          <div style="margin-top:8px;">
            <div style="color:#ff6600;font-size:0.8rem;">حرارة الدرع: ${Math.round(this.heatShieldTemp)}°C</div>
            <div style="width:200px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;margin:3px auto;">
              <div style="width:${this.heatLevel * 100}%;height:100%;background:linear-gradient(90deg,#ff8800,#ff2200);border-radius:3px;"></div>
            </div>
          </div>
        ` : ''}
        <div style="margin-top:6px;">
          <div style="color:${gColor};font-size:0.8rem;">قوة G: ${this.gForce.toFixed(1)}G</div>
        </div>
        ${this.phase === 'descent' && this.drogueDeployed ? `
          <div style="margin-top:6px;color:#88ff88;font-size:0.8rem;">🪂 مظلات الكبح — نشطة</div>
        ` : ''}
      </div>
    `);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    if (this._timeouts) {
      this._timeouts.forEach(t => clearTimeout(t));
      this._timeouts = [];
    }
    try { if (this.rumbleSound) this.rumbleSound.source.stop(); } catch(e) {}
    this.gs.ui.clear();
  }
}
