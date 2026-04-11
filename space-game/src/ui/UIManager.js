export class UIManager {
  constructor() {
    this.overlay = document.getElementById('ui-overlay');
    this.activeElements = {};
  }

  clear() {
    this.overlay.innerHTML = '';
    this.activeElements = {};
  }

  addElement(id, html, styles = {}) {
    const el = document.createElement('div');
    el.id = id;
    el.innerHTML = html;
    Object.assign(el.style, styles);
    this.overlay.appendChild(el);
    this.activeElements[id] = el;
    return el;
  }

  removeElement(id) {
    const el = this.activeElements[id];
    if (el) {
      el.remove();
      delete this.activeElements[id];
    }
  }

  updateElement(id, html) {
    const el = this.activeElements[id];
    if (el) el.innerHTML = html;
  }

  showHUD(data) {
    const hudHTML = `
      <div style="position:fixed;top:15px;left:15px;right:15px;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none;z-index:20;direction:rtl;">
        <div style="display:flex;gap:15px;flex-wrap:wrap;">
          ${data.fuel !== undefined ? this.createGauge('الوقود', data.fuel, '#00ff88') : ''}
          ${data.oxygen !== undefined ? this.createGauge('الأكسجين', data.oxygen, '#00ccff') : ''}
          ${data.energy !== undefined ? this.createGauge('الطاقة', data.energy, '#ffcc00') : ''}
          ${data.health !== undefined ? this.createGauge('الصحة', data.health, '#ff4444') : ''}
        </div>
        <div style="text-align:left;font-family:'Orbitron',monospace;">
          ${data.speed !== undefined ? `<div style="color:#00d4ff;font-size:0.8rem;">السرعة: <span style="color:#fff;">${data.speed}</span> كم/ث</div>` : ''}
          ${data.altitude !== undefined ? `<div style="color:#00d4ff;font-size:0.8rem;">الارتفاع: <span style="color:#fff;">${data.altitude}</span> كم</div>` : ''}
          ${data.distance !== undefined ? `<div style="color:#00d4ff;font-size:0.8rem;">المسافة: <span style="color:#fff;">${data.distance}</span> كم</div>` : ''}
        </div>
      </div>
    `;
    this.removeElement('hud');
    this.addElement('hud', hudHTML);
  }

  createGauge(label, value, color) {
    const clampVal = Math.max(0, Math.min(100, value));
    return `
      <div style="min-width:120px;">
        <div style="color:${color};font-size:0.7rem;margin-bottom:3px;font-weight:600;">${label}: ${Math.round(clampVal)}%</div>
        <div style="background:rgba(255,255,255,0.1);height:6px;border-radius:3px;overflow:hidden;">
          <div style="width:${clampVal}%;height:100%;background:${color};border-radius:3px;transition:width 0.3s;"></div>
        </div>
      </div>
    `;
  }

  showMessage(text, duration = 3000, type = 'info') {
    const colors = { info: '#00d4ff', warning: '#ffcc00', danger: '#ff4444', success: '#00ff88' };
    const el = this.addElement('msg-' + Date.now(), `
      <div style="position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.85);border:1px solid ${colors[type]};
        padding:12px 30px;border-radius:8px;color:#fff;font-size:1rem;
        text-align:center;max-width:600px;backdrop-filter:blur(10px);
        animation:fadeInUp 0.3s ease;">
        ${text}
      </div>
    `);
    if (duration > 0) {
      setTimeout(() => el.remove(), duration);
    }
    return el;
  }

  showObjective(text) {
    this.removeElement('objective');
    this.addElement('objective', `
      <div style="position:fixed;top:60px;left:50%;transform:translateX(-50%);
        background:rgba(0,20,40,0.8);border:1px solid rgba(0,212,255,0.3);
        padding:8px 25px;border-radius:20px;color:#88ccff;font-size:0.85rem;
        text-align:center;backdrop-filter:blur(5px);font-family:'Cairo',sans-serif;">
        🎯 ${text}
      </div>
    `);
  }

  showComm(sender, message, duration = 5000) {
    this.removeElement('comm');
    const el = this.addElement('comm', `
      <div style="position:fixed;bottom:20px;right:20px;
        background:rgba(0,10,20,0.9);border:1px solid rgba(0,212,255,0.4);
        padding:15px 20px;border-radius:10px;max-width:350px;
        backdrop-filter:blur(10px);direction:rtl;">
        <div style="color:#00d4ff;font-size:0.7rem;margin-bottom:5px;font-family:'Orbitron',monospace;">📡 ${sender}</div>
        <div style="color:#cceeff;font-size:0.9rem;line-height:1.5;">${message}</div>
      </div>
    `);
    if (duration > 0) setTimeout(() => this.removeElement('comm'), duration);
  }

  showCenterText(text, subtitle = '', duration = 3000) {
    this.removeElement('center-text');
    const el = this.addElement('center-text', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;
        animation:fadeInUp 0.5s ease;">
        <div style="font-family:'Orbitron',sans-serif;font-size:2.5rem;color:#fff;
          text-shadow:0 0 40px rgba(0,212,255,0.5);margin-bottom:10px;">${text}</div>
        ${subtitle ? `<div style="color:#88ccff;font-size:1.1rem;">${subtitle}</div>` : ''}
      </div>
    `);
    if (duration > 0) setTimeout(() => this.removeElement('center-text'), duration);
  }

  showControls(controls) {
    this.removeElement('controls');
    const items = controls.map(c =>
      `<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
        <span style="background:rgba(0,212,255,0.2);border:1px solid rgba(0,212,255,0.4);
          padding:2px 8px;border-radius:4px;font-family:'Orbitron',monospace;font-size:0.7rem;color:#00d4ff;">${c.key}</span>
        <span style="color:#aaccdd;font-size:0.8rem;">${c.action}</span>
      </div>`
    ).join('');
    this.addElement('controls', `
      <div style="position:fixed;bottom:20px;left:20px;
        background:rgba(0,10,20,0.7);padding:10px 15px;border-radius:8px;
        border:1px solid rgba(255,255,255,0.1);direction:rtl;">
        <div style="color:#557799;font-size:0.65rem;margin-bottom:5px;">التحكم</div>
        ${items}
      </div>
    `);
  }

  addGlobalStyles() {
    if (document.getElementById('game-styles')) return;
    const style = document.createElement('style');
    style.id = 'game-styles';
    style.textContent = `
      @keyframes fadeInUp { from { opacity:0; transform:translate(-50%,-50%) translateY(20px); } to { opacity:1; transform:translate(-50%,-50%); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      @keyframes glow { 0%,100% { box-shadow:0 0 5px rgba(0,212,255,0.3); } 50% { box-shadow:0 0 20px rgba(0,212,255,0.6); } }
      .btn-space {
        background: linear-gradient(135deg, rgba(0,60,120,0.8), rgba(0,30,60,0.9));
        border: 1px solid rgba(0,212,255,0.4); color: #fff; padding: 12px 35px;
        border-radius: 8px; font-family: 'Cairo', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.3s; pointer-events: auto;
        text-shadow: 0 0 10px rgba(0,212,255,0.3);
      }
      .btn-space:hover {
        background: linear-gradient(135deg, rgba(0,80,160,0.9), rgba(0,50,100,0.9));
        border-color: #00d4ff; box-shadow: 0 0 25px rgba(0,212,255,0.3);
        transform: translateY(-2px);
      }
      .btn-space-primary {
        background: linear-gradient(135deg, #0066cc, #0044aa);
        border-color: #00aaff;
      }
      .btn-space-primary:hover {
        background: linear-gradient(135deg, #0088ff, #0066cc);
        box-shadow: 0 0 30px rgba(0,136,255,0.4);
      }
      .btn-space-danger {
        background: linear-gradient(135deg, rgba(120,0,0,0.8), rgba(60,0,0,0.9));
        border-color: rgba(255,68,68,0.4);
      }
      .btn-space-danger:hover {
        background: linear-gradient(135deg, rgba(160,0,0,0.9), rgba(100,0,0,0.9));
        border-color: #ff4444;
      }
    `;
    document.head.appendChild(style);
  }
}
