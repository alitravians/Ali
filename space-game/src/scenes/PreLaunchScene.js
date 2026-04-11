import * as THREE from 'three';
import { createRocket, createExhaustParticles } from '../objects/Rocket.js';
import { createDetailedEarth } from '../objects/Earth.js';
import { createStarField } from '../objects/Stars.js';

export class PreLaunchScene {
  constructor(gameState) {
    this.gs = gameState;
    this.scene = null;
    this.camera = null;
    this.rocket = null;
    this.phase = 'briefing';
    this.countdownValue = 10;
    this.countdownTimer = 0;
    this.time = 0;
    this.mode = 'story';
  }

  async init(data = {}) {
    this.mode = data.mode || 'story';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(15, 12, 25);
    this.camera.lookAt(0, 10, 0);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // Sky gradient
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 2;
    skyCanvas.height = 512;
    const sctx = skyCanvas.getContext('2d');
    const skyGrad = sctx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0, '#000011');
    skyGrad.addColorStop(0.3, '#001133');
    skyGrad.addColorStop(0.5, '#003366');
    skyGrad.addColorStop(0.7, '#1a5276');
    skyGrad.addColorStop(0.85, '#d35400');
    skyGrad.addColorStop(1, '#ff6600');
    sctx.fillStyle = skyGrad;
    sctx.fillRect(0, 0, 2, 512);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    this.scene.background = skyTex;

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    sunLight.position.set(50, 30, 20);
    sunLight.castShadow = true;
    this.scene.add(sunLight);
    this.scene.add(new THREE.AmbientLight(0x334455, 0.5));
    this.scene.add(new THREE.HemisphereLight(0x88aacc, 0x443322, 0.3));

    // Ground / launch pad
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x555544 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Launch pad
    const padGeo = new THREE.CylinderGeometry(8, 8, 0.5, 32);
    const padMat = new THREE.MeshPhongMaterial({ color: 0x777766 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.25;
    this.scene.add(pad);

    // Launch tower
    const towerGeo = new THREE.BoxGeometry(1, 35, 1);
    const towerMat = new THREE.MeshPhongMaterial({ color: 0x994422 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(6, 17.5, 0);
    this.scene.add(tower);

    // Tower arm
    const armGeo = new THREE.BoxGeometry(6, 0.5, 0.5);
    const arm = new THREE.Mesh(armGeo, towerMat);
    arm.position.set(3, 25, 0);
    this.scene.add(arm);

    // Rocket
    this.rocket = createRocket();
    this.rocket.position.set(0, 0.5, 0);
    this.scene.add(this.rocket);

    // Buildings in background
    for (let i = 0; i < 8; i++) {
      const bGeo = new THREE.BoxGeometry(5 + Math.random() * 5, 3 + Math.random() * 8, 5 + Math.random() * 5);
      const bMat = new THREE.MeshPhongMaterial({ color: 0x444433 + Math.floor(Math.random() * 0x222222) });
      const b = new THREE.Mesh(bGeo, bMat);
      const angle = (i / 8) * Math.PI * 2;
      b.position.set(Math.cos(angle) * (40 + Math.random() * 30), bGeo.parameters.height / 2, Math.sin(angle) * (40 + Math.random() * 30));
      this.scene.add(b);
    }

    this.phase = 'briefing';
    this.time = 0;
    this._showBriefing();
  }

  _showBriefing() {
    this.gs.ui.clear();
    const missionName = this.mode === 'free' ? 'مهمة حرة — استكشاف المحطة' : 'المهمة: رحلة إلى محطة الفضاء الدولية';
    this.gs.ui.addElement('briefing', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;direction:rtl;">
        <div style="background:rgba(0,15,30,0.92);border:1px solid rgba(0,212,255,0.3);border-radius:15px;
          padding:30px 40px;max-width:550px;backdrop-filter:blur(15px);color:#cceeff;">
          <div style="font-family:'Orbitron',sans-serif;color:#00d4ff;font-size:1.5rem;margin-bottom:15px;text-align:center;">
            📋 إحاطة المهمة
          </div>
          <div style="font-size:1.1rem;color:#fff;margin-bottom:10px;text-align:center;">${missionName}</div>
          <hr style="border:none;border-top:1px solid rgba(0,212,255,0.2);margin:15px 0;">
          <div style="line-height:1.8;font-size:0.9rem;">
            <div>🎯 <strong>الهدف:</strong> الوصول إلى محطة الفضاء الدولية وتنفيذ المهام العلمية</div>
            <div>🚀 <strong>المركبة:</strong> كبسولة فضائية متعددة المراحل</div>
            <div>⏱️ <strong>مدة المهمة:</strong> ${this.mode === 'free' ? 'غير محددة' : '72 ساعة'}</div>
            <div>👨‍🚀 <strong>رائد الفضاء:</strong> ${this.gs.playerData.name}</div>
          </div>
          <hr style="border:none;border-top:1px solid rgba(0,212,255,0.2);margin:15px 0;">
          <div style="font-size:0.85rem;color:#88aabb;">
            <div>✓ فحص الأنظمة — جاهز</div>
            <div>✓ الوقود — مكتمل</div>
            <div>✓ أنظمة الحياة — تعمل</div>
            <div>✓ الاتصالات — نشطة</div>
          </div>
          <div style="text-align:center;margin-top:20px;">
            <button class="btn-space btn-space-primary" style="font-size:1.1rem;padding:12px 40px;" id="btn-start-countdown">
              ▶ بدء العد التنازلي
            </button>
          </div>
        </div>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('btn-start-countdown')?.addEventListener('click', () => {
        this.gs.audio.playConfirm();
        this._startSystemsCheck();
      });
    }, 100);
  }

  _startSystemsCheck() {
    this.gs.ui.clear();
    this.phase = 'systems';
    let checkIndex = 0;
    const checks = [
      { name: 'أنظمة الملاحة', status: 'جاهز' },
      { name: 'أنظمة الاتصالات', status: 'جاهز' },
      { name: 'نظام دعم الحياة', status: 'جاهز' },
      { name: 'المحركات الرئيسية', status: 'جاهز' },
      { name: 'المعززات الجانبية', status: 'جاهز' },
      { name: 'نظام الوقود', status: 'مكتمل 100%' },
      { name: 'الدرع الحراري', status: 'سليم' },
      { name: 'مظلات الهبوط', status: 'جاهز' },
    ];

    this.gs.ui.addElement('systems-check', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,15,30,0.92);border:1px solid rgba(0,212,255,0.3);border-radius:12px;
        padding:25px 35px;min-width:400px;direction:rtl;">
        <div style="font-family:'Orbitron',sans-serif;color:#00d4ff;font-size:1.2rem;margin-bottom:15px;text-align:center;">
          🔍 فحص الأنظمة
        </div>
        <div id="check-list" style="font-size:0.9rem;line-height:2;"></div>
      </div>
    `);

    const interval = setInterval(() => {
      if (checkIndex >= checks.length) {
        clearInterval(interval);
        setTimeout(() => {
          this.gs.audio.playConfirm();
          this._startCountdown();
        }, 1000);
        return;
      }
      const check = checks[checkIndex];
      this.gs.audio.playBeep();
      const listEl = document.getElementById('check-list');
      if (listEl) {
        listEl.innerHTML += `<div style="color:#00ff88;">✓ ${check.name} — <span style="color:#88ffaa;">${check.status}</span></div>`;
      }
      checkIndex++;
    }, 500);
  }

  _startCountdown() {
    this.gs.ui.clear();
    this.phase = 'countdown';
    this.countdownValue = 10;
    this.countdownTimer = 0;

    this.gs.ui.addElement('countdown', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="font-family:'Orbitron',sans-serif;color:#ff6600;font-size:0.9rem;margin-bottom:10px;letter-spacing:3px;">
          العد التنازلي للإقلاع
        </div>
        <div id="countdown-num" style="font-family:'Orbitron',sans-serif;font-size:8rem;color:#fff;
          text-shadow:0 0 60px rgba(255,100,0,0.8);">10</div>
        <div id="countdown-status" style="color:#ffcc00;font-size:1rem;margin-top:10px;">جميع الأنظمة جاهزة</div>
      </div>
    `);

    this.gs.ui.showComm('مركز التحكم', 'بدء العد التنازلي. جميع الأنظمة جاهزة للإقلاع.', 4000);
  }

  update(delta) {
    this.time += delta;

    if (this.phase === 'countdown') {
      this.countdownTimer += delta;
      if (this.countdownTimer >= 1) {
        this.countdownTimer = 0;
        this.countdownValue--;
        this.gs.audio.playCountdown();

        const numEl = document.getElementById('countdown-num');
        const statusEl = document.getElementById('countdown-status');
        if (numEl) numEl.textContent = Math.max(0, this.countdownValue);

        if (this.countdownValue === 5 && statusEl) {
          statusEl.textContent = 'تشغيل المحركات الرئيسية';
          statusEl.style.color = '#ff8800';
        }
        if (this.countdownValue === 3 && statusEl) {
          statusEl.textContent = 'المحركات بالطاقة الكاملة';
          statusEl.style.color = '#ff4400';
        }
        if (this.countdownValue === 1 && statusEl) {
          statusEl.textContent = '!إطلاق';
          statusEl.style.color = '#ff0000';
        }

        if (this.countdownValue <= 0) {
          this.gs.audio.playConfirm();
          setTimeout(() => {
            this.gs.switchScene('launch', { mode: this.mode });
          }, 500);
        }
      }
    }

    // Camera gentle movement
    if (this.phase === 'briefing' || this.phase === 'systems') {
      this.camera.position.x = 15 + Math.sin(this.time * 0.3) * 2;
      this.camera.position.y = 12 + Math.sin(this.time * 0.2) * 1;
      this.camera.lookAt(0, 10, 0);
    } else if (this.phase === 'countdown') {
      const t = Math.min(1, (10 - this.countdownValue) / 10);
      this.camera.position.lerp(new THREE.Vector3(8, 8, 15), delta * 0.5);
      this.camera.lookAt(0, 8, 0);
    }
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    this.gs.ui.clear();
  }
}
