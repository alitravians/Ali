import * as THREE from 'three';
import { createSpacecraft } from '../objects/Rocket.js';
import { createDetailedEarth } from '../objects/Earth.js';
import { createISS } from '../objects/ISS.js';
import { createStarField, createSun, createMilkyWay } from '../objects/Stars.js';

export class SpaceNavigationScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.spacecraft = null;
    this.iss = null;
    this.earth = null;
    this.time = 0;
    this.distanceToISS = 50;
    this.spacecraftSpeed = new THREE.Vector3();
    this.mode = 'story';
    this.ambience = null;
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005);
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.camera.position.set(0, 5, 15);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // Stars and space
    this.scene.add(createStarField(8000));
    this.scene.add(createMilkyWay());

    const sun = createSun();
    sun.position.set(300, 100, -400);
    this.scene.add(sun);

    // Earth below
    this.earth = createDetailedEarth(150);
    this.earth.position.set(0, -180, 0);
    this.scene.add(this.earth);

    // Spacecraft
    this.spacecraft = createSpacecraft();
    this.spacecraft.position.set(0, 0, 0);
    this.scene.add(this.spacecraft);

    // ISS in the distance
    this.iss = createISS();
    this.iss.position.set(0, 0, -this.distanceToISS * 5);
    this.iss.scale.setScalar(0.3);
    this.scene.add(this.iss);

    // Ambient lighting
    this.scene.add(new THREE.AmbientLight(0x223344, 0.3));

    this.time = 0;
    this.distanceToISS = 50;

    // Reset speed and transition flag to prevent residual state on replay
    this.spacecraftSpeed = new THREE.Vector3();
    this._transitioning = false;
    this._msg30Shown = false;
    this._msg10Shown = false;

    // Space ambience sound
    this.ambience = this.gs.audio.playSpaceAmbience();
    this.engineHum = this.gs.audio.playEngineHum();

    this.gs.ui.clear();
    this.gs.ui.addGlobalStyles();
    this.gs.ui.showChatButton();
    this.gs.ui.showCenterText('الملاحة الفضائية', 'التوجه نحو محطة الفضاء الدولية', 3000);
    this.gs.ui.showObjective('اقترب من محطة الفضاء الدولية');
    this.gs.ui.showControls([
      { key: 'W/↑', action: 'تسريع' },
      { key: 'S/↓', action: 'إبطاء' },
      { key: 'A/←', action: 'يسار' },
      { key: 'D/→', action: 'يمين' },
      { key: 'Q/مسافة', action: 'أعلى' },
      { key: 'E/Shift', action: 'أسفل' },
    ]);

    setTimeout(() => {
      this.gs.ui.showComm('مركز التحكم', 'محطة الفضاء الدولية على مسافة 50 كم. عدّل مسارك واقترب بحذر.', 5000);
    }, 3500);
  }

  update(delta) {
    this.time += delta;
    const input = this.gs.input;

    // Spacecraft controls
    const thrustPower = 5;
    if (input.isForward()) this.spacecraftSpeed.z -= thrustPower * delta;
    if (input.isBackward()) this.spacecraftSpeed.z += thrustPower * delta;
    if (input.isLeft()) this.spacecraftSpeed.x -= thrustPower * delta;
    if (input.isRight()) this.spacecraftSpeed.x += thrustPower * delta;
    if (input.isUp()) this.spacecraftSpeed.y += thrustPower * delta;
    if (input.isDown()) this.spacecraftSpeed.y -= thrustPower * delta;

    // Damping in space (slight)
    this.spacecraftSpeed.multiplyScalar(0.98);

    // Auto-approach
    this.distanceToISS -= delta * 2;
    this.spacecraftSpeed.z -= delta * 0.5;

    // Apply movement
    this.spacecraft.position.add(this.spacecraftSpeed.clone().multiplyScalar(delta));

    // Tilt spacecraft based on movement
    this.spacecraft.rotation.z = THREE.MathUtils.lerp(this.spacecraft.rotation.z, -this.spacecraftSpeed.x * 0.1, delta * 2);
    this.spacecraft.rotation.x = THREE.MathUtils.lerp(this.spacecraft.rotation.x, this.spacecraftSpeed.z * 0.05, delta * 2);

    // ISS moves closer
    const issTargetZ = -this.distanceToISS * 5;
    this.iss.position.z = THREE.MathUtils.lerp(this.iss.position.z, issTargetZ, delta * 0.5);
    this.iss.rotation.y += delta * 0.02;

    // ISS scale increases as it gets closer
    const issScale = THREE.MathUtils.lerp(0.1, 1, Math.max(0, 1 - this.distanceToISS / 50));
    this.iss.scale.setScalar(Math.max(0.1, issScale));

    // Camera follows spacecraft
    const camTarget = new THREE.Vector3(
      this.spacecraft.position.x * 0.5,
      this.spacecraft.position.y * 0.5 + 3,
      this.spacecraft.position.z + 12
    );
    this.camera.position.lerp(camTarget, delta * 2);
    this.camera.lookAt(
      this.spacecraft.position.x,
      this.spacecraft.position.y,
      this.spacecraft.position.z - 10
    );

    // Earth rotation
    this.earth.rotation.y += delta * 0.01;

    // HUD
    this.gs.ui.showHUD({
      fuel: Math.max(0, this.gs.playerData.fuel - this.time * 0.3),
      oxygen: 100,
      energy: 98,
      speed: Math.round(Math.abs(this.spacecraftSpeed.z) * 100 + 200),
      altitude: 408,
      distance: Math.max(0, Math.round(this.distanceToISS * 10) / 10)
    });

    // Phase messages
    if (this.distanceToISS < 30 && !this._msg30Shown) {
      this._msg30Shown = true;
      this.gs.ui.showComm('مركز التحكم', 'المحطة على بعد 30 كم. استمر في الاقتراب.', 3000);
    }
    if (this.distanceToISS < 10 && !this._msg10Shown) {
      this._msg10Shown = true;
      this.gs.ui.showComm('مركز التحكم', 'المحطة قريبة! ابدأ إجراءات الالتحام.', 4000);
      this.gs.ui.showObjective('استعد للالتحام بالمحطة');
    }

    // Transition to docking
    if (this.distanceToISS <= 2 && !this._transitioning) {
      this._transitioning = true;
      this.gs.audio.playConfirm();
      this.gs.ui.showCenterText('بدء الالتحام', 'Docking Sequence Initiated', 2000);
      setTimeout(() => {
        this.gs.switchScene('docking', { mode: this.mode });
      }, 2500);
    }
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    try {
      if (this.ambience) { this.ambience.osc1.stop(); this.ambience.osc2.stop(); }
      if (this.engineHum) { this.engineHum.osc.stop(); }
    } catch(e) {}
    this.gs.ui.clear();
  }
}
