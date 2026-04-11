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
  }

  async init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 20, 100);
    this.camera.lookAt(0, 0, 0);

    window.addEventListener('resize', this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    this.scene.add(createStarField(8000));
    this.scene.add(createMilkyWay());

    const sun = createSun();
    sun.position.set(200, 100, -300);
    this.scene.add(sun);

    this.earth = createDetailedEarth(40);
    this.earth.position.set(0, -20, 0);
    this.scene.add(this.earth);

    this.scene.fog = new THREE.FogExp2(0x000011, 0.001);

    this.gs.ui.addGlobalStyles();
    this.gs.ui.clear();
    this._showMenu();
    this.time = 0;
  }

  _showMenu() {
    this.gs.ui.clear();
    this.gs.ui.addElement('main-menu', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <div style="text-align:center;margin-bottom:40px;">
          <div style="font-family:'Orbitron',sans-serif;font-size:3.5rem;color:#fff;text-shadow:0 0 50px rgba(0,212,255,0.6);letter-spacing:4px;margin-bottom:5px;">
            SPACE STATION
          </div>
          <div style="font-size:1.5rem;color:#88ccff;text-shadow:0 0 20px rgba(0,150,255,0.4);margin-bottom:5px;">
            رحلة إلى محطة الفضاء الدولية
          </div>
          <div style="font-size:0.9rem;color:#557799;">International Space Station Mission</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:320px;">
          <button class="btn-space btn-space-primary" style="width:100%;font-size:1.1rem;padding:15px;" id="btn-story">
            🚀 نمط القصة
            <div style="font-size:0.7rem;color:#aaddff;margin-top:3px;">رحلة متكاملة من التدريب حتى العودة</div>
          </button>
          <button class="btn-space" style="width:100%;" id="btn-missions">
            🎯 نمط المهمات
            <div style="font-size:0.7rem;color:#88aabb;margin-top:3px;">مهام مستقلة متنوعة</div>
          </button>
          <button class="btn-space" style="width:100%;" id="btn-free">
            🌍 المحاكاة الحرة
            <div style="font-size:0.7rem;color:#88aabb;margin-top:3px;">استكشاف وتجربة بدون ضغط</div>
          </button>
          <button class="btn-space" style="width:100%;" id="btn-challenge">
            🏆 نمط التحديات
            <div style="font-size:0.7rem;color:#88aabb;margin-top:3px;">أفضل التحام • أسرع إصلاح • هبوط ناجح</div>
          </button>
        </div>

        <div style="margin-top:30px;display:flex;gap:15px;">
          <button class="btn-space" style="padding:8px 20px;font-size:0.85rem;" id="btn-settings">⚙️ الإعدادات</button>
          <button class="btn-space" style="padding:8px 20px;font-size:0.85rem;" id="btn-help">❓ التعليمات</button>
        </div>

        <div style="position:fixed;bottom:20px;color:#334455;font-size:0.75rem;text-align:center;">
          <div>استخدم WASD أو الأسهم للتحكم • مسافة للصعود • Shift للنزول</div>
          <div style="margin-top:3px;">Space Station v1.0 — رحلة فضائية احترافية</div>
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
        <h2 style="font-family:'Orbitron',sans-serif;color:#00d4ff;margin-bottom:25px;font-size:1.8rem;">🎯 اختر المهمة</h2>
        <div style="display:flex;flex-direction:column;gap:10px;width:350px;max-height:60vh;overflow-y:auto;padding:10px;">
          ${[
            { id: 'mission-1', name: 'مهمة التدريب الأولى', desc: 'تعلم أساسيات الطيران والالتحام', diff: 'سهل' },
            { id: 'mission-2', name: 'إصلاح الألواح الشمسية', desc: 'خروج إلى الفضاء لإصلاح لوح شمسي', diff: 'متوسط' },
            { id: 'mission-3', name: 'تجربة نمو النباتات', desc: 'إجراء تجارب في مختبر المحطة', diff: 'سهل' },
            { id: 'mission-4', name: 'إنقاذ المحطة', desc: 'التعامل مع تسرب هواء طارئ', diff: 'صعب' },
            { id: 'mission-5', name: 'مهمة الإمداد', desc: 'استقبال وتفريغ مركبة شحن', diff: 'متوسط' },
            { id: 'mission-6', name: 'العودة الطارئة', desc: 'هبوط اضطراري في ظروف صعبة', diff: 'صعب' },
          ].map(m => `
            <button class="btn-space" style="width:100%;text-align:right;padding:12px 18px;" id="${m.id}">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:1rem;">${m.name}</span>
                <span style="font-size:0.7rem;padding:2px 8px;border-radius:10px;
                  background:${m.diff === 'سهل' ? 'rgba(0,255,100,0.2)' : m.diff === 'متوسط' ? 'rgba(255,200,0,0.2)' : 'rgba(255,50,50,0.2)'};
                  color:${m.diff === 'سهل' ? '#00ff88' : m.diff === 'متوسط' ? '#ffcc00' : '#ff4444'};">${m.diff}</span>
              </div>
              <div style="font-size:0.75rem;color:#88aabb;margin-top:4px;">${m.desc}</div>
            </button>
          `).join('')}
        </div>
        <button class="btn-space" style="margin-top:20px;padding:8px 30px;" id="btn-back-missions">↩ العودة</button>
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
        <h2 style="font-family:'Orbitron',sans-serif;color:#ffcc00;margin-bottom:25px;font-size:1.8rem;">🏆 التحديات</h2>
        <div style="display:flex;flex-direction:column;gap:10px;width:320px;">
          <button class="btn-space" style="width:100%;" id="ch-dock">🎯 تحدي الالتحام الدقيق</button>
          <button class="btn-space" style="width:100%;" id="ch-repair">🔧 تحدي أسرع إصلاح</button>
          <button class="btn-space" style="width:100%;" id="ch-land">🪂 تحدي الهبوط الناجح</button>
          <button class="btn-space" style="width:100%;" id="ch-crisis">⚠️ تحدي إدارة الأزمات</button>
        </div>
        <button class="btn-space" style="margin-top:20px;padding:8px 30px;" id="btn-back-ch">↩ العودة</button>
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
    const s = this.gs.settings;
    this.gs.ui.addElement('settings-menu', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl;">
        <h2 style="font-family:'Orbitron',sans-serif;color:#00d4ff;margin-bottom:25px;">⚙️ الإعدادات</h2>
        <div style="display:flex;flex-direction:column;gap:15px;width:300px;background:rgba(0,20,40,0.8);padding:25px;border-radius:12px;border:1px solid rgba(0,212,255,0.2);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#aaccdd;">المؤثرات الصوتية</span>
            <button class="btn-space" style="padding:5px 15px;font-size:0.8rem;" id="toggle-sfx">${this.gs.settings.soundEnabled ? '🔊 مفعّل' : '🔇 مغلق'}</button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#aaccdd;">الصعوبة</span>
            <button class="btn-space" style="padding:5px 15px;font-size:0.8rem;" id="toggle-diff">${this.gs.settings.difficulty === 'easy' ? 'سهل' : this.gs.settings.difficulty === 'normal' ? 'عادي' : 'صعب'}</button>
          </div>
        </div>
        <button class="btn-space" style="margin-top:20px;padding:8px 30px;" id="btn-back-settings">↩ العودة</button>
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
        <h2 style="font-family:'Orbitron',sans-serif;color:#00d4ff;margin-bottom:20px;">❓ تعليمات اللعبة</h2>
        <div style="max-width:500px;max-height:60vh;overflow-y:auto;background:rgba(0,20,40,0.85);padding:25px;border-radius:12px;border:1px solid rgba(0,212,255,0.2);line-height:1.8;color:#cceeff;">
          <h3 style="color:#00d4ff;margin-bottom:10px;">🎮 التحكم</h3>
          <div style="background:rgba(0,0,0,0.3);padding:10px;border-radius:8px;margin-bottom:15px;font-size:0.85rem;">
            <div>W / ↑ — التحرك للأمام</div>
            <div>S / ↓ — التحرك للخلف</div>
            <div>A / ← — التحرك لليسار</div>
            <div>D / → — التحرك لليمين</div>
            <div>Q / مسافة — الصعود</div>
            <div>E / Shift — النزول</div>
            <div>الفأرة — توجيه الكاميرا</div>
          </div>
          <h3 style="color:#00d4ff;margin-bottom:10px;">🚀 مراحل اللعبة</h3>
          <div style="font-size:0.85rem;">
            <div>1. الاستعداد والتجهيز للمهمة</div>
            <div>2. الإقلاع من الأرض</div>
            <div>3. الملاحة في الفضاء</div>
            <div>4. الالتحام بمحطة الفضاء الدولية</div>
            <div>5. استكشاف المحطة وتنفيذ المهام</div>
            <div>6. الخروج إلى الفضاء (EVA)</div>
            <div>7. العودة والدخول إلى الغلاف الجوي</div>
            <div>8. الهبوط على الأرض</div>
          </div>
          <h3 style="color:#00d4ff;margin:15px 0 10px;">💡 نصائح</h3>
          <div style="font-size:0.85rem;">
            <div>• راقب مستوى الأكسجين والوقود دائماً</div>
            <div>• اتبع تعليمات مركز التحكم</div>
            <div>• أثناء الالتحام، اقترب ببطء وبدقة</div>
            <div>• أثناء العودة، حافظ على زاوية الدخول الصحيحة</div>
          </div>
        </div>
        <button class="btn-space" style="margin-top:20px;padding:8px 30px;" id="btn-back-help">↩ العودة</button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('btn-back-help')?.addEventListener('click', () => { this.gs.audio.playBeep(); this._showMenu(); });
    }, 100);
  }

  update(delta) {
    this.time += delta;
    if (this.earth) {
      this.earth.rotation.y += delta * 0.05;
    }
    this.camera.position.x = Math.sin(this.time * 0.1) * 10;
    this.camera.position.y = 20 + Math.sin(this.time * 0.15) * 5;
    this.camera.lookAt(0, -10, 0);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  async cleanup() {
    window.removeEventListener('resize', this._onResize);
    this.gs.ui.clear();
  }
}
