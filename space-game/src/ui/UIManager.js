export class UIManager {
  constructor() {
    this.overlay = document.getElementById('ui-overlay');
    this.activeElements = {};
    this.chatMessages = [];
    this.chatOpen = false;
    this.chatVisible = false;
    this._chatResponseTimer = null;
    this._chatResponses = {
      'حالة المحطة': { sender: 'HOUSTON', msg: 'جميع أنظمة المحطة تعمل بشكل طبيعي. الضغط 14.7 PSI. درجة الحرارة 22°C. المدار مستقر على ارتفاع 408 كم. لا توجد تنبيهات نشطة.' },
      'تقرير الوقود': { sender: 'HOUSTON', msg: 'مستوى الوقود في المركبة: 78%. وقود المناورة: 92%. الاحتياطي كافٍ لـ 3 مناورات تصحيحية. استهلاك الوقود ضمن المعدل الطبيعي.' },
      'حالة الطاقم': { sender: 'FLIGHT SURGEON', msg: 'العلامات الحيوية لجميع أفراد الطاقم طبيعية. معدل ضربات القلب: 72/دقيقة. ضغط الدم: 120/80. مستوى الأكسجين في الدم: 98%. لا توجد أعراض دوار الفضاء.' },
      'تحديث الطقس': { sender: 'HOUSTON', msg: 'طقس منطقة الهبوط الأساسية (المحيط الهادئ): رياح خفيفة 12 عقدة. ارتفاع الموج: 1.2 متر. الرؤية: ممتازة. الظروف مثالية للهبوط.' },
      'جدول المهام': { sender: 'HOUSTON', msg: 'المهام المتبقية اليوم:\n• 14:00 — تجربة نمو البلورات في المختبر\n• 16:00 — صيانة نظام التبريد الخارجي\n• 18:00 — اتصال مرئي مع المدارس\n• 19:30 — تمارين رياضية (ساعتان)' },
      'طلب إمدادات': { sender: 'HOUSTON', msg: 'تم تسجيل طلبك في نظام اللوجستيات. مركبة الشحن SpaceX Dragon CRS-29 القادمة ستحمل الإمدادات المطلوبة. موعد الإطلاق: 12 يوماً.' },
      'تقرير المدار': { sender: 'HOUSTON', msg: 'المدار الحالي: 408 × 410 كم. الميل المداري: 51.6°. السرعة المدارية: 7.66 كم/ث (27,576 كم/ساعة). الدورة الكاملة: 92 دقيقة.' },
      'حالة الاتصالات': { sender: 'HOUSTON', msg: 'جميع قنوات الاتصال تعمل بكفاءة:\n• إشارة TDRS: قوية (99.2%)\n• S-Band: نشط\n• Ku-Band: نشط\n• الاتصال مع هيوستن: مستقر' },
      'تقرير طبي': { sender: 'FLIGHT SURGEON', msg: 'التقرير الطبي اليومي:\n• الإشعاع المتراكم: 0.8 mSv (ضمن الحد الآمن)\n• كثافة العظام: مستقرة\n• حجم السوائل: طبيعي\n• النوم: 7.5 ساعات' },
      'حالة الطوارئ': { sender: 'HOUSTON', msg: '⚠️ لا توجد حالات طوارئ نشطة حالياً.\nآخر تدريب طوارئ: قبل 48 ساعة.\nمركبة سويوز الإنقاذ: جاهزة في أي وقت.' },
      'تحديث علمي': { sender: 'MARSHALL', msg: 'نتائج التجارب الأخيرة:\n• نمو البلورات: تقدم بنسبة 73%\n• تجربة الجاذبية الصغرى: بيانات ممتازة\n• مراقبة النباتات: نمو 2.3 سم خلال 24 ساعة' },
    };
    this._quickMessages = [
      'حالة المحطة', 'تقرير الوقود', 'حالة الطاقم', 'تحديث الطقس',
      'جدول المهام', 'طلب إمدادات', 'تقرير المدار', 'حالة الاتصالات',
      'تقرير طبي', 'حالة الطوارئ', 'تحديث علمي'
    ];
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

  // ============ NEW COCKPIT-STYLE HUD ============

  showHUD(data) {
    const hudHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:20;">
        
        <!-- TOP BAR - Minimal status -->
        <div style="position:absolute;top:0;left:0;right:0;height:38px;
          background:linear-gradient(180deg,rgba(3,8,16,0.85) 0%,transparent 100%);
          display:flex;align-items:center;justify-content:space-between;padding:0 16px;">
          ${data.phase ? `
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,0.5);"></div>
              <span style="font-family:'Exo 2','Share Tech Mono',monospace;font-size:0.65rem;color:rgba(180,200,240,0.6);
                letter-spacing:2px;text-transform:uppercase;">${data.phase}</span>
            </div>` : '<div></div>'}
          <div style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:rgba(120,150,200,0.3);
            letter-spacing:1px;">${data.missionTime || ''}</div>
        </div>

        <!-- LEFT PANEL - Gauges -->
        <div style="position:absolute;top:50px;left:12px;display:flex;flex-direction:column;gap:6px;">
          ${data.fuel !== undefined ? this._createArcGauge('FUEL', 'الوقود', data.fuel, '#4ade80', '#166534') : ''}
          ${data.oxygen !== undefined ? this._createArcGauge('O₂', 'أكسجين', data.oxygen, '#38bdf8', '#0c4a6e') : ''}
          ${data.energy !== undefined ? this._createArcGauge('PWR', 'طاقة', data.energy, '#a78bfa', '#3b0764') : ''}
          ${data.health !== undefined ? this._createArcGauge('VIT', 'صحة', data.health, '#fb7185', '#4c0519') : ''}
        </div>

        <!-- BOTTOM CENTER - Telemetry Strip -->
        <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);
          display:flex;gap:2px;align-items:flex-end;">
          ${data.speed !== undefined ? this._createTelemetryCell('SPD', data.speed, 'm/s', '#38bdf8') : ''}
          ${data.altitude !== undefined ? this._createTelemetryCell('ALT', data.altitude, 'm', '#4ade80') : ''}
          ${data.distance !== undefined ? this._createTelemetryCell('DST', data.distance, 'km', '#a78bfa') : ''}
          ${data.gForce !== undefined ? this._createTelemetryCell('G', data.gForce, '', data.gForce > 4 ? '#f87171' : data.gForce > 3 ? '#fbbf24' : '#4ade80') : ''}
          ${data.heat !== undefined ? this._createTelemetryCell('TEMP', data.heat, '°C', data.heat > 1000 ? '#f87171' : data.heat > 500 ? '#fb923c' : '#fbbf24') : ''}
        </div>
      </div>
    `;
    this.removeElement('hud');
    this.addElement('hud', hudHTML);
  }

  _createArcGauge(tag, label, value, color, bgColor) {
    const clamp = Math.max(0, Math.min(100, value));
    const isCritical = clamp < 10;
    const isLow = clamp < 25;
    const displayColor = isCritical ? '#f87171' : isLow ? '#fbbf24' : color;
    return `
      <div style="width:80px;background:rgba(3,8,16,0.8);border:1px solid rgba(100,160,255,0.08);
        border-radius:8px;padding:8px 6px;text-align:center;
        ${isCritical ? 'animation:criticalPulse 1s infinite;' : ''}">
        <div style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;color:rgba(140,170,220,0.4);
          letter-spacing:2px;margin-bottom:4px;">${tag}</div>
        <div style="font-family:'Exo 2',sans-serif;font-size:1.1rem;font-weight:700;color:${displayColor};
          text-shadow:0 0 10px ${displayColor}33;line-height:1;">${Math.round(clamp)}%</div>
        <div style="margin:5px auto 0;width:60px;height:3px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden;">
          <div style="width:${clamp}%;height:100%;background:${displayColor};border-radius:2px;
            transition:width 0.4s ease;box-shadow:0 0 8px ${displayColor}66;"></div>
        </div>
        <div style="font-family:'Tajawal',sans-serif;font-size:0.5rem;color:rgba(160,180,220,0.3);margin-top:3px;">${label}</div>
      </div>
    `;
  }

  _createTelemetryCell(tag, value, unit, color) {
    return `
      <div style="background:rgba(3,8,16,0.8);border:1px solid rgba(100,160,255,0.08);
        border-radius:6px;padding:6px 12px;text-align:center;min-width:75px;">
        <div style="font-family:'Share Tech Mono',monospace;font-size:0.45rem;color:rgba(140,170,220,0.35);
          letter-spacing:2px;margin-bottom:2px;">${tag}</div>
        <div style="font-family:'Exo 2',sans-serif;font-size:0.95rem;font-weight:700;color:${color};
          text-shadow:0 0 8px ${color}33;">
          ${value}
          ${unit ? `<span style="font-size:0.45rem;color:rgba(140,170,220,0.3);margin-right:2px;">${unit}</span>` : ''}
        </div>
      </div>
    `;
  }

  // ============ MESSAGES ============

  showMessage(text, duration = 3000, type = 'info') {
    const colors = {
      info: { bg: 'rgba(56,189,248,0.06)', border: 'rgba(56,189,248,0.2)', text: '#7dd3fc', icon: '◆' },
      warning: { bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.2)', text: '#fde68a', icon: '⬥' },
      danger: { bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.2)', text: '#fca5a5', icon: '◈' },
      success: { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.2)', text: '#86efac', icon: '◇' }
    };
    const c = colors[type] || colors.info;
    const el = this.addElement('msg-' + Date.now(), `
      <div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:${c.bg};border:1px solid ${c.border};backdrop-filter:blur(12px);
        padding:10px 28px;border-radius:10px;color:${c.text};font-size:0.85rem;
        text-align:center;max-width:520px;font-family:'Tajawal',sans-serif;
        animation:msgSlideUp 0.4s cubic-bezier(0.16,1,0.3,1);
        box-shadow:0 4px 24px rgba(0,0,0,0.3);">
        <span style="margin-left:8px;font-size:0.6rem;opacity:0.6;">${c.icon}</span>
        ${text}
      </div>
    `);
    if (duration > 0) {
      setTimeout(() => { el.remove(); delete this.activeElements[el.id]; }, duration);
    }
    return el;
  }

  showObjective(text) {
    this.removeElement('objective');
    this.addElement('objective', `
      <div style="position:fixed;top:50px;left:50%;transform:translateX(-50%);
        background:rgba(3,8,16,0.75);border:1px solid rgba(100,160,255,0.15);
        backdrop-filter:blur(12px);
        padding:8px 24px;border-radius:10px;color:rgba(200,220,255,0.85);font-size:0.8rem;
        text-align:center;font-family:'Tajawal',sans-serif;font-weight:500;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);">
        <span style="color:#8ab4f8;font-family:'Share Tech Mono',monospace;font-size:0.55rem;
          margin-left:8px;letter-spacing:1px;">OBJ</span>
        ${text}
      </div>
    `);
  }

  showComm(sender, message, duration = 5000) {
    this.removeElement('comm');
    const el = this.addElement('comm', `
      <div style="position:fixed;bottom:14px;right:14px;
        background:rgba(3,8,16,0.9);border:1px solid rgba(100,160,255,0.12);
        backdrop-filter:blur(16px);
        padding:14px 18px;border-radius:12px;max-width:360px;
        direction:rtl;animation:commSlideIn 0.5s cubic-bezier(0.16,1,0.3,1);
        box-shadow:0 8px 32px rgba(0,0,0,0.4);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#4ade80;
            box-shadow:0 0 8px rgba(74,222,128,0.5);"></div>
          <span style="color:#8ab4f8;font-size:0.65rem;font-family:'Exo 2','Share Tech Mono',monospace;
            font-weight:600;letter-spacing:1px;">${sender}</span>
        </div>
        <div style="color:rgba(200,215,240,0.85);font-size:0.82rem;line-height:1.7;
          font-family:'Tajawal',sans-serif;white-space:pre-line;">${message}</div>
        <div style="margin-top:8px;text-align:left;">
          <span style="color:rgba(100,140,200,0.2);font-size:0.5rem;font-family:'Share Tech Mono',monospace;
            letter-spacing:2px;">ENCRYPTED CHANNEL</span>
        </div>
      </div>
    `);
    if (duration > 0) setTimeout(() => this.removeElement('comm'), duration);
  }

  showCenterText(text, subtitle = '', duration = 3000) {
    this.removeElement('center-text');
    const el = this.addElement('center-text', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;
        animation:centerZoomIn 0.7s cubic-bezier(0.16,1,0.3,1);">
        <div style="font-family:'Exo 2','Orbitron',sans-serif;font-size:2.8rem;font-weight:800;
          background:linear-gradient(135deg,#e0e8ff 0%,#8ab4f8 50%,#c0d0ff 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          margin-bottom:10px;letter-spacing:3px;">${text}</div>
        ${subtitle ? `<div style="color:rgba(160,180,220,0.6);font-size:0.95rem;
          font-family:'Tajawal',sans-serif;font-weight:300;letter-spacing:1px;">${subtitle}</div>` : ''}
      </div>
    `);
    if (duration > 0) setTimeout(() => this.removeElement('center-text'), duration);
  }

  showControls(controls) {
    this.removeElement('controls');
    const items = controls.map(c =>
      `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
        <span style="background:rgba(100,160,255,0.08);border:1px solid rgba(100,160,255,0.15);
          padding:3px 8px;border-radius:5px;font-family:'Share Tech Mono',monospace;font-size:0.6rem;
          color:#8ab4f8;min-width:40px;text-align:center;">${c.key}</span>
        <span style="color:rgba(180,200,230,0.5);font-size:0.7rem;font-family:'Tajawal',sans-serif;">${c.action}</span>
      </div>`
    ).join('');
    this.addElement('controls', `
      <div style="position:fixed;bottom:14px;left:14px;
        background:rgba(3,8,16,0.8);border:1px solid rgba(100,160,255,0.08);
        backdrop-filter:blur(12px);
        padding:10px 14px;border-radius:10px;direction:rtl;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);">
        <div style="color:rgba(120,150,200,0.3);font-size:0.5rem;margin-bottom:4px;
          font-family:'Share Tech Mono',monospace;letter-spacing:2px;">CONTROLS</div>
        ${items}
      </div>
    `);
  }

  // ============ CHAT SYSTEM ============

  showChatButton() {
    this.chatVisible = true;
    this.removeElement('chat-btn');
    this.addElement('chat-btn', `
      <div style="position:fixed;bottom:60px;left:14px;pointer-events:auto;z-index:30;">
        <button id="toggle-chat-btn" style="
          background:rgba(3,8,16,0.85);border:1px solid rgba(100,160,255,0.15);
          backdrop-filter:blur(12px);
          color:#8ab4f8;padding:10px 16px;border-radius:10px;
          font-family:'Exo 2',sans-serif;font-size:0.75rem;font-weight:500;
          cursor:pointer;display:flex;align-items:center;gap:8px;
          box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:all 0.3s ease;
          letter-spacing:1px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#4ade80;
            box-shadow:0 0 6px rgba(74,222,128,0.4);"></div>
          <span>HOUSTON</span>
          ${this.chatMessages.length > 0 ? `<span style="background:rgba(74,138,244,0.15);color:#8ab4f8;
            border:1px solid rgba(74,138,244,0.2);border-radius:8px;width:20px;height:20px;
            display:flex;align-items:center;justify-content:center;font-size:0.55rem;font-weight:700;">
            ${this.chatMessages.length}</span>` : ''}
        </button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('toggle-chat-btn')?.addEventListener('click', () => {
        if (this.chatOpen) this.hideChat();
        else this.showChat();
      });
    }, 50);
  }

  showChat() {
    this.chatOpen = true;
    this.removeElement('chat-panel');

    const messagesHTML = this.chatMessages.map(m => `
      <div style="margin-bottom:10px;display:flex;flex-direction:column;align-items:${m.fromPlayer ? 'flex-end' : 'flex-start'};">
        <div style="font-size:0.55rem;color:${m.fromPlayer ? '#4ade80' : '#8ab4f8'};margin-bottom:3px;
          font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
          ${m.fromPlayer ? 'YOU' : m.sender}
          <span style="color:rgba(120,150,200,0.2);margin-right:6px;">${m.time}</span>
        </div>
        <div style="background:${m.fromPlayer ? 'rgba(74,222,128,0.06)' : 'rgba(74,138,244,0.06)'};
          border:1px solid ${m.fromPlayer ? 'rgba(74,222,128,0.12)' : 'rgba(74,138,244,0.12)'};
          padding:8px 13px;border-radius:10px;max-width:280px;
          color:rgba(200,215,240,0.85);font-size:0.78rem;line-height:1.6;
          font-family:'Tajawal',sans-serif;white-space:pre-line;">
          ${m.text}
        </div>
      </div>
    `).join('');

    const quickBtns = this._quickMessages.map(q => `
      <button class="chat-quick-btn" data-msg="${q}" style="
        background:rgba(74,138,244,0.06);border:1px solid rgba(74,138,244,0.12);
        color:rgba(180,200,240,0.6);padding:4px 10px;border-radius:8px;font-size:0.65rem;
        cursor:pointer;font-family:'Tajawal',sans-serif;transition:all 0.2s;
        white-space:nowrap;">
        ${q}
      </button>
    `).join('');

    this.addElement('chat-panel', `
      <div style="position:fixed;bottom:100px;left:14px;width:380px;max-height:480px;
        background:rgba(3,8,16,0.95);border:1px solid rgba(100,160,255,0.1);
        backdrop-filter:blur(20px);
        border-radius:14px;direction:rtl;
        display:flex;flex-direction:column;z-index:31;pointer-events:auto;
        box-shadow:0 12px 48px rgba(0,0,0,0.5);">
        
        <div style="padding:12px 16px;border-bottom:1px solid rgba(100,160,255,0.06);
          display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:6px;height:6px;border-radius:50%;background:#4ade80;
              box-shadow:0 0 6px rgba(74,222,128,0.4);"></div>
            <span style="color:#8ab4f8;font-size:0.75rem;font-family:'Exo 2',sans-serif;
              font-weight:600;letter-spacing:1px;">HOUSTON UPLINK</span>
          </div>
          <button id="close-chat-btn" style="background:none;border:none;color:rgba(140,170,220,0.3);
            cursor:pointer;font-size:1.1rem;transition:color 0.2s;padding:4px;">✕</button>
        </div>

        <div id="chat-messages" style="flex:1;overflow-y:auto;padding:12px 16px;max-height:260px;
          scrollbar-width:thin;scrollbar-color:rgba(100,160,255,0.1) transparent;">
          ${messagesHTML || `
            <div style="text-align:center;color:rgba(120,150,200,0.3);font-size:0.75rem;padding:24px 8px;">
              <div style="font-size:0.6rem;font-family:'Share Tech Mono',monospace;
                letter-spacing:2px;margin-bottom:10px;color:rgba(74,138,244,0.3);">CHANNEL OPEN</div>
              <div style="font-family:'Tajawal',sans-serif;color:rgba(180,200,230,0.4);">اتصال مباشر مع مركز التحكم</div>
            </div>
          `}
        </div>

        <div style="padding:8px 12px;border-top:1px solid rgba(100,160,255,0.04);
          display:flex;flex-wrap:wrap;gap:4px;max-height:80px;overflow-y:auto;">
          ${quickBtns}
        </div>

        <div style="padding:10px 12px;border-top:1px solid rgba(100,160,255,0.06);
          display:flex;gap:8px;align-items:center;">
          <input id="chat-input" type="text" placeholder="اكتب رسالة..." style="
            flex:1;background:rgba(100,160,255,0.04);border:1px solid rgba(100,160,255,0.1);
            color:rgba(200,215,240,0.9);padding:8px 14px;border-radius:8px;
            font-family:'Tajawal',sans-serif;font-size:0.78rem;outline:none;direction:rtl;
            transition:border-color 0.2s;">
          <button id="chat-send-btn" style="
            background:rgba(74,138,244,0.15);border:1px solid rgba(74,138,244,0.2);
            color:#8ab4f8;width:34px;height:34px;border-radius:8px;cursor:pointer;
            display:flex;align-items:center;justify-content:center;font-size:0.9rem;
            transition:all 0.2s;">
            ↑
          </button>
        </div>
      </div>
    `);

    setTimeout(() => {
      document.getElementById('close-chat-btn')?.addEventListener('click', () => this.hideChat());
      
      document.querySelectorAll('.chat-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const msg = btn.getAttribute('data-msg');
          this._sendChatMessage(msg);
        });
      });

      const input = document.getElementById('chat-input');
      const sendBtn = document.getElementById('chat-send-btn');
      const send = () => {
        const text = input?.value?.trim();
        if (text) { this._sendChatMessage(text); input.value = ''; }
      };
      sendBtn?.addEventListener('click', send);
      input?.addEventListener('keypress', e => { if (e.key === 'Enter') send(); });

      const msgContainer = document.getElementById('chat-messages');
      if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 50);
  }

  hideChat() {
    this.chatOpen = false;
    this.removeElement('chat-panel');
  }

  _sendChatMessage(text) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    
    this.chatMessages.push({ text, sender: 'أنت', fromPlayer: true, time: timeStr });
    if (this.chatOpen) this.showChat();

    if (this._chatResponseTimer) clearTimeout(this._chatResponseTimer);
    this._chatResponseTimer = setTimeout(() => {
      this._generateResponse(text, timeStr);
    }, 1200 + Math.random() * 1500);
  }

  _generateResponse(playerMsg, timeStr) {
    const now = new Date();
    const respTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    
    let response = null;
    for (const key of Object.keys(this._chatResponses)) {
      if (playerMsg.includes(key) || key.includes(playerMsg)) {
        response = this._chatResponses[key];
        break;
      }
    }

    if (!response) {
      const genericResponses = [
        { sender: 'HOUSTON', msg: `استلمنا رسالتك: "${playerMsg}". الفريق يعمل على الرد. جميع الأنظمة تعمل بشكل طبيعي.` },
        { sender: 'HOUSTON', msg: `شكراً على التحديث. نحن نتابع جميع البيانات من المحطة. استمر في عملك الممتاز يا رائد الفضاء!` },
        { sender: 'CAPCOM', msg: `تلقينا رسالتك. فريق المهمة على اطلاع. تذكر أن تأخذ استراحة قريباً. هيوستن تراقب جميع المؤشرات.` },
        { sender: 'HOUSTON', msg: `مفهوم. نؤكد استلام رسالتك. جميع المعلمات ضمن النطاق الطبيعي. المسار المداري مستقر.` },
      ];
      response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }

    this.chatMessages.push({ text: response.msg, sender: response.sender, fromPlayer: false, time: respTime });
    if (this.chatOpen) this.showChat();
    this.showChatButton();
  }

  // ============ GAME ENDING ============

  showGameEnding(stats = {}) {
    this.clear();
    this.addGlobalStyles();

    const missionTime = stats.missionTime || '4 ساعات و 23 دقيقة';
    const maxAlt = stats.maxAltitude || '408 كم';
    const maxSpeed = stats.maxSpeed || '27,576 كم/ساعة';
    const maxGForce = stats.maxGForce || '4.2G';
    const maxHeat = stats.maxHeat || '1,600°C';
    const evaTime = stats.evaTime || '45 دقيقة';

    this.addElement('game-ending', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(3,8,16,0.97);backdrop-filter:blur(20px);
        display:flex;align-items:center;justify-content:center;direction:rtl;z-index:50;
        animation:fadeIn 1.5s ease;">
        
        <div style="max-width:640px;width:92%;max-height:88vh;overflow-y:auto;padding:20px;">
          
          <!-- Title -->
          <div style="text-align:center;margin-bottom:28px;animation:slideDown 1s ease;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:rgba(74,138,244,0.4);
              letter-spacing:4px;margin-bottom:10px;">MISSION STATUS</div>
            <div style="font-family:'Exo 2','Orbitron',sans-serif;font-size:2rem;font-weight:800;
              background:linear-gradient(135deg,#e0e8ff 0%,#8ab4f8 50%,#c0d0ff 100%);
              -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
              margin-bottom:6px;letter-spacing:2px;">
              المهمة مكتملة بنجاح
            </div>
            <div style="color:#4ade80;font-size:0.7rem;font-family:'Share Tech Mono',monospace;
              letter-spacing:2px;">MISSION COMPLETE — ALL OBJECTIVES MET</div>
          </div>

          <!-- Stats Grid -->
          <div style="background:rgba(100,160,255,0.03);border:1px solid rgba(100,160,255,0.08);
            border-radius:12px;padding:20px;margin-bottom:16px;">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
              ${[
                { label: 'مدة المهمة', value: missionTime, tag: 'TIME', color: '#8ab4f8' },
                { label: 'أقصى ارتفاع', value: maxAlt, tag: 'ALT', color: '#4ade80' },
                { label: 'أقصى سرعة', value: maxSpeed, tag: 'VEL', color: '#a78bfa' },
                { label: 'أقصى قوة G', value: maxGForce, tag: 'G-MAX', color: '#fbbf24' },
                { label: 'حرارة الدرع', value: maxHeat, tag: 'TEMP', color: '#fb923c' },
                { label: 'وقت EVA', value: evaTime, tag: 'EVA', color: '#38bdf8' },
              ].map(s => `
                <div style="background:rgba(3,8,16,0.6);padding:12px;border-radius:8px;text-align:center;
                  border:1px solid rgba(100,160,255,0.06);">
                  <div style="color:rgba(140,170,220,0.35);font-size:0.5rem;font-family:'Share Tech Mono',monospace;
                    letter-spacing:2px;margin-bottom:5px;">${s.tag}</div>
                  <div style="color:${s.color};font-size:0.85rem;font-weight:600;
                    font-family:'Tajawal',sans-serif;">${s.value}</div>
                  <div style="color:rgba(180,200,230,0.3);font-size:0.55rem;font-family:'Tajawal',sans-serif;
                    margin-top:3px;">${s.label}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Achievements -->
          <div style="background:rgba(74,222,128,0.03);border:1px solid rgba(74,222,128,0.08);
            border-radius:12px;padding:18px;margin-bottom:16px;">
            <div style="color:rgba(74,222,128,0.4);font-size:0.6rem;font-family:'Share Tech Mono',monospace;
              margin-bottom:12px;text-align:center;letter-spacing:3px;">ACHIEVEMENTS</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
              ${['إطلاق ناجح', 'التحام دقيق', 'سير فضائي', 'عالم فضاء', 'نجوت من الاحتراق', 'هبوط آمن'].map(a => `
                <div style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.12);
                  padding:5px 14px;border-radius:8px;color:rgba(74,222,128,0.8);font-size:0.7rem;
                  font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:5px;">
                  <span style="font-size:0.4rem;">◆</span> ${a}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Post-landing -->
          <div style="background:rgba(100,160,255,0.03);border:1px solid rgba(100,160,255,0.08);
            border-radius:12px;padding:18px;margin-bottom:22px;">
            <div style="color:rgba(100,160,255,0.4);font-size:0.6rem;font-family:'Share Tech Mono',monospace;
              margin-bottom:12px;text-align:center;letter-spacing:3px;">POST-LANDING</div>
            <div style="color:rgba(200,215,240,0.6);font-size:0.8rem;line-height:2;font-family:'Tajawal',sans-serif;">
              <div><span style="color:#8ab4f8;font-size:0.5rem;margin-left:8px;">◆</span> الهبوط: المحيط الهادئ — سفن الإنقاذ وصلت</div>
              <div><span style="color:#8ab4f8;font-size:0.5rem;margin-left:8px;">◆</span> الفحص الطبي: العلامات الحيوية طبيعية</div>
              <div><span style="color:#8ab4f8;font-size:0.5rem;margin-left:8px;">◆</span> النقل: بطائرة هليكوبتر إلى سفينة الإنقاذ</div>
              <div><span style="color:#8ab4f8;font-size:0.5rem;margin-left:8px;">◆</span> المؤتمر الصحفي: مركز جونسون الفضائي</div>
              <div><span style="color:#8ab4f8;font-size:0.5rem;margin-left:8px;">◆</span> التكريم: وسام ناسا للخدمة المتميزة</div>
            </div>
          </div>

          <!-- Buttons -->
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <button class="glass-btn glass-btn-primary" id="btn-new-mission">مهمة جديدة</button>
            <button class="glass-btn" id="btn-free-mode">نمط حر</button>
            <button class="glass-btn" id="btn-main-menu">القائمة الرئيسية</button>
          </div>
        </div>
      </div>
      <style>
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
      </style>
    `);
  }

  // ============ GLOBAL STYLES ============

  addGlobalStyles() {
    if (document.getElementById('game-styles')) return;
    const style = document.createElement('style');
    style.id = 'game-styles';
    style.textContent = `
      @keyframes fadeInUp { from { opacity:0; transform:translate(-50%,-50%) translateY(15px); } to { opacity:1; transform:translate(-50%,-50%); } }
      @keyframes msgSlideUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%); } }
      @keyframes centerZoomIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.9); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
      @keyframes commSlideIn { from { opacity:0; transform:translateX(15px); } to { opacity:1; transform:translateX(0); } }
      @keyframes criticalPulse { 0%,100% { opacity:1; border-color:rgba(248,113,113,0.3); } 50% { opacity:0.7; border-color:rgba(248,113,113,0.6); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      @keyframes glow { 0%,100% { box-shadow:0 0 8px rgba(74,138,244,0.2); } 50% { box-shadow:0 0 20px rgba(74,138,244,0.4); } }
      @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
      @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }

      /* ===== GLASS BUTTONS — Modern translucent ===== */
      .glass-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        background: rgba(100,160,255,0.06); 
        border: 1px solid rgba(100,160,255,0.12);
        backdrop-filter: blur(12px);
        color: rgba(200,220,255,0.8); padding: 11px 24px; border-radius: 10px;
        font-family: 'Tajawal', sans-serif; font-size: 0.9rem; font-weight: 500;
        cursor: pointer; transition: all 0.3s ease; pointer-events: auto;
        text-align: center; direction: rtl;
        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
      }
      .glass-btn:hover {
        background: rgba(100,160,255,0.12);
        border-color: rgba(100,160,255,0.25);
        color: #e0e8ff;
        box-shadow: 0 4px 20px rgba(74,138,244,0.15);
        transform: translateY(-1px);
      }
      .glass-btn-primary {
        background: rgba(74,138,244,0.12);
        border-color: rgba(74,138,244,0.25);
        color: #8ab4f8;
        box-shadow: 0 2px 16px rgba(74,138,244,0.1);
      }
      .glass-btn-primary:hover {
        background: rgba(74,138,244,0.2);
        border-color: rgba(74,138,244,0.4);
        color: #c0d4ff;
        box-shadow: 0 4px 24px rgba(74,138,244,0.2);
      }
      .glass-btn-danger {
        border-color: rgba(248,113,113,0.2);
        color: rgba(248,113,113,0.8);
      }
      .glass-btn-danger:hover {
        background: rgba(248,113,113,0.08);
        border-color: rgba(248,113,113,0.3);
      }
      .glass-btn-small {
        padding: 6px 16px; font-size: 0.78rem;
        border-radius: 8px;
      }

      /* ===== MENU CARDS — Large interactive tiles ===== */
      .menu-card {
        display: flex; align-items: center; gap: 16px; width: 100%;
        background: rgba(100,160,255,0.04);
        border: 1px solid rgba(100,160,255,0.08);
        backdrop-filter: blur(12px);
        color: #fff; padding: 16px 20px; border-radius: 12px;
        font-family: 'Tajawal', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.3s ease; pointer-events: auto;
        text-align: right; direction: rtl;
        box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        position: relative; overflow: hidden;
      }
      .menu-card::before {
        content: '';
        position: absolute; top: 0; left: 0; width: 3px; height: 100%;
        background: linear-gradient(180deg, #4a8af4, #8ab4f8);
        opacity: 0; transition: opacity 0.3s ease;
        border-radius: 0 2px 2px 0;
      }
      .menu-card:hover {
        background: rgba(100,160,255,0.08);
        border-color: rgba(100,160,255,0.18);
        box-shadow: 0 4px 24px rgba(74,138,244,0.1);
        transform: translateX(-3px);
      }
      .menu-card:hover::before { opacity: 1; }
      .menu-card-primary {
        background: rgba(74,138,244,0.06);
        border-color: rgba(74,138,244,0.15);
      }
      .menu-card-primary::before { opacity: 1; }
      .menu-card-icon {
        font-size: 1.5rem; min-width: 40px; text-align: center;
        filter: drop-shadow(0 0 8px rgba(100,180,255,0.3));
      }
      .menu-card-text { flex: 1; }
      .menu-card-title {
        font-weight: 600; font-size: 1rem; color: rgba(220,230,255,0.9);
        margin-bottom: 3px;
      }
      .menu-card-desc {
        font-size: 0.7rem; color: rgba(160,180,220,0.4);
        font-weight: 300; line-height: 1.4;
      }
      .menu-card-tag {
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.5rem; letter-spacing: 2px;
        color: rgba(120,150,200,0.25);
      }

      /* ===== CMD BUTTONS (legacy compat) ===== */
      .cmd-btn {
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(100,160,255,0.06); border: 1px solid rgba(100,160,255,0.12);
        backdrop-filter: blur(12px);
        color: rgba(200,220,255,0.8); padding: 10px 20px; border-radius: 10px;
        font-family: 'Tajawal', sans-serif; font-size: 0.9rem;
        cursor: pointer; transition: all 0.3s ease; pointer-events: auto;
        text-align: right; direction: rtl;
      }
      .cmd-btn:hover {
        background: rgba(100,160,255,0.12);
        border-color: rgba(100,160,255,0.25);
        transform: translateY(-1px);
      }
      .cmd-btn-primary { border-color: rgba(74,138,244,0.25); color: #8ab4f8; }
      .cmd-btn-primary:hover { background: rgba(74,138,244,0.15); }
      .cmd-btn-tag {
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.55rem; letter-spacing: 2px;
        color: rgba(120,150,200,0.35);
        background: rgba(100,160,255,0.06);
        border: 1px solid rgba(100,160,255,0.08);
        padding: 2px 6px; border-radius: 4px;
      }
      .cmd-btn-danger { border-color: rgba(248,113,113,0.2); color: rgba(248,113,113,0.8); }
      .cmd-btn-danger:hover { background: rgba(248,113,113,0.08); }

      /* Legacy menu-btn aliases */
      .menu-btn { 
        display: flex; align-items: center; gap: 16px; width: 100%;
        background: rgba(100,160,255,0.04); border: 1px solid rgba(100,160,255,0.08);
        backdrop-filter: blur(12px);
        color: #fff; padding: 14px 18px; border-radius: 12px;
        font-family: 'Tajawal', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.3s ease; pointer-events: auto;
        text-align: right; direction: rtl;
      }
      .menu-btn:hover {
        background: rgba(100,160,255,0.08);
        border-color: rgba(100,160,255,0.18);
        transform: translateX(-3px);
      }
      .menu-btn-primary { background: rgba(74,138,244,0.06); border-color: rgba(74,138,244,0.15); }
      .menu-btn-primary:hover { background: rgba(74,138,244,0.12); }
      .menu-btn-icon { font-size: 1.5rem; min-width: 40px; text-align: center; }
      .menu-btn-text { flex: 1; }
      .menu-btn-title { font-weight: 600; font-size: 1rem; color: rgba(220,230,255,0.9); margin-bottom: 2px; }
      .menu-btn-desc { font-size: 0.7rem; color: rgba(160,180,220,0.4); font-weight: 300; }
      .menu-btn-small {
        background: rgba(100,160,255,0.06); border: 1px solid rgba(100,160,255,0.1);
        backdrop-filter: blur(12px);
        color: rgba(180,200,240,0.6); padding: 7px 18px; border-radius: 8px;
        font-family: 'Tajawal', sans-serif; font-size: 0.78rem;
        cursor: pointer; transition: all 0.3s ease; pointer-events: auto;
      }
      .menu-btn-small:hover {
        background: rgba(100,160,255,0.1);
        border-color: rgba(100,160,255,0.2);
        color: #8ab4f8;
      }

      /* Legacy btn-space */
      .btn-space { 
        background: rgba(100,160,255,0.06); border: 1px solid rgba(100,160,255,0.12);
        color: #e0e8ff; padding: 10px 26px; border-radius: 10px;
        font-family: 'Tajawal', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.3s ease; pointer-events: auto;
      }
      .btn-space:hover { background: rgba(100,160,255,0.12); border-color: rgba(100,160,255,0.25); }
      .btn-space-primary { border-color: rgba(74,138,244,0.25); color: #8ab4f8; }
      .btn-space-primary:hover { background: rgba(74,138,244,0.15); }
      .btn-space-danger { border-color: rgba(248,113,113,0.2); color: rgba(248,113,113,0.8); }
      .btn-space-danger:hover { background: rgba(248,113,113,0.08); }

      /* ===== SCROLLBAR ===== */
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(100,160,255,0.1); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(100,160,255,0.2); }
    `;
    document.head.appendChild(style);
  }
}
