import * as THREE from 'three';
import { createRocket, createExhaustParticles, updateExhaustParticles } from '../objects/Rocket.js';
import { createDetailedEarth } from '../objects/Earth.js';
import { createStarField } from '../objects/Stars.js';

export class LaunchScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.rocket = null;
    this.exhaust = null;
    this.earth = null;
    this.phase = 'liftoff'; // liftoff, ascending, maxq, separation, orbit
    this.time = 0;
    this.altitude = 0;
    this.speed = 0;
    this.rocketY = 0;
    this.shakeIntensity = 0;
    this.rumbleSound = null;
    this.mode = 'story';
    this.boostersSeparated = false;
    this._timeouts = [];
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.camera.position.set(10, 5, 20);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // Stars
    this.stars = createStarField(6000);
    this.scene.add(this.stars);

    // Earth
    this.earth = createDetailedEarth(200);
    this.earth.position.set(0, -200, 0);
    this.scene.add(this.earth);

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffeedd, 2);
    sunLight.position.set(100, 100, 50);
    this.scene.add(sunLight);
    this.scene.add(new THREE.AmbientLight(0x334455, 0.4));

    // Rocket
    this.rocket = createRocket();
    this.scene.add(this.rocket);

    // Exhaust particles
    this.exhaust = createExhaustParticles(800);
    this.exhaust.position.copy(this.rocket.position);
    this.exhaust.position.y -= 2;
    this.scene.add(this.exhaust);

    // Smoke cloud at base
    this.smokeParticles = this._createSmoke();
    this.scene.add(this.smokeParticles);

    // Init state
    this.phase = 'liftoff';
    this.time = 0;
    this.altitude = 0;
    this.speed = 0;
    this.rocketY = 0;
    this.shakeIntensity = 1;
    this.boostersSeparated = false;

    // Background transition color
    this.scene.background = new THREE.Color(0x000511);

    // Start rumble sound
    this.rumbleSound = this.gs.audio.playLaunchRumble(30);

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showCenterText('إطلاق!', 'بدء الصعود', 2000);

    this._timeouts.push(setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'الإقلاع تم بنجاح! جميع المحركات تعمل بكامل طاقتها.', 4000);
    }, 2500));
  }

  _createSmoke() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      colors[i * 3] = 0.7;
      colors[i * 3 + 1] = 0.7;
      colors[i * 3 + 2] = 0.7;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 3, vertexColors: true, transparent: true, opacity: 0.5,
      depthWrite: false
    });
    return new THREE.Points(geo, mat);
  }

  update(delta) {
    this.time += delta;

    // Physics
    const acceleration = this.phase === 'liftoff' ? 15 : this.phase === 'ascending' ? 25 : 30;
    this.speed += acceleration * delta;
    this.speed = Math.min(this.speed, 300);
    this.rocketY += this.speed * delta;
    this.altitude = this.rocketY * 0.1; // km

    // Rocket position
    this.rocket.position.y = this.rocketY;

    // Exhaust follows rocket
    this.exhaust.position.x = this.rocket.position.x;
    this.exhaust.position.y = this.rocket.position.y - 3;
    this.exhaust.position.z = this.rocket.position.z;
    updateExhaustParticles(this.exhaust, delta, 1 + this.speed * 0.01);

    // Smoke dissipates
    if (this.smokeParticles) {
      const sp = this.smokeParticles.geometry.attributes.position.array;
      for (let i = 0; i < sp.length; i += 3) {
        sp[i] += (Math.random() - 0.5) * delta * 5;
        sp[i + 1] += delta * 2;
      }
      this.smokeParticles.geometry.attributes.position.needsUpdate = true;
      this.smokeParticles.material.opacity = Math.max(0, 0.5 - this.time * 0.05);
    }

    // Phase transitions
    if (this.altitude > 5 && this.phase === 'liftoff') {
      this.phase = 'ascending';
      this.gs.ui.showComm('مركز التحكم', 'الصعود مستمر. سرعة وارتفاع في ازدياد.', 3000);
    }

    if (this.altitude > 12 && this.phase === 'ascending') {
      this.phase = 'maxq';
      this.shakeIntensity = 2;
      this.gs.ui.showCenterText('Max-Q', 'أقصى ضغط ديناميكي', 2000);
      this.gs.ui.showComm('مركز التحكم', 'Max-Q! اجتياز أقصى ضغط ديناميكي.', 3000);
    }

    if (this.altitude > 25 && !this.boostersSeparated) {
      this.boostersSeparated = true;
      this.phase = 'separation';
      this.gs.audio.playConfirm();
      this.gs.ui.showCenterText('انفصال المعززات', 'Booster Separation', 2500);

      // Animate boosters separating
      const boosters = this.rocket.userData.boosters;
      if (boosters) {
        boosters.forEach((b, i) => {
          const dir = i === 0 ? -1 : 1;
          const animateBooster = () => {
            b.position.x += dir * 0.5;
            b.position.y -= 0.3;
            b.rotation.z += dir * 0.02;
            if (Math.abs(b.position.x) < 30) requestAnimationFrame(animateBooster);
            else b.visible = false;
          };
          animateBooster();
        });
      }
    }

    if (this.altitude > 60 && this.phase === 'separation') {
      this.phase = 'orbit';
      this.shakeIntensity = 0.3;
      this.gs.ui.showCenterText('الوصول إلى المدار', 'انعدام الجاذبية', 3000);
      this.gs.ui.showComm('مركز التحكم', 'إيقاف المحركات الرئيسية. أنت الآن في المدار! استعد للملاحة نحو المحطة.', 5000);

      this._timeouts.push(setTimeout(() => {
        this.gs.switchScene('spaceNavigation', { mode: this.mode });
      }, 5000));
    }

    // Camera follow
    const camTargetY = this.rocketY + 5;
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, camTargetY, delta * 2);

    // Camera shake
    if (this.shakeIntensity > 0) {
      this.camera.position.x = 10 + (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.z = 20 + (Math.random() - 0.5) * this.shakeIntensity;
      if (this.phase === 'orbit') this.shakeIntensity *= 0.98;
    }

    this.camera.lookAt(this.rocket.position);

    // Background color transition (blue to black as altitude increases)
    const t = Math.min(1, this.altitude / 80);
    const bgColor = new THREE.Color().lerpColors(new THREE.Color(0x001133), new THREE.Color(0x000005), t);
    this.scene.background = bgColor;

    // Update HUD
    this.gs.ui.showHUD({
      fuel: Math.max(0, 100 - this.time * 2),
      oxygen: 100,
      energy: 100,
      speed: Math.round(this.speed * 10),
      altitude: Math.round(this.altitude)
    });

    // Earth moves down
    this.earth.position.y = -200 - this.rocketY * 0.5;
    this.earth.rotation.y += delta * 0.01;
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    this._timeouts.forEach(t => clearTimeout(t));
    this._timeouts = [];
    window.removeEventListener('resize', this._onResize);
    if (this.rumbleSound) {
      try { this.rumbleSound.source.stop(); } catch(e) {}
    }
    this.gs.ui.clear();
  }
}
