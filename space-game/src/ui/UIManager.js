export class UIManager {
  constructor() {
    this.overlay = document.getElementById('ui-overlay');
    this.activeElements = {};
    this.chatMessages = [];
    this.chatOpen = false;
    this.chatVisible = false;
    this._chatResponseTimer = null;
    this._chatResponses = {
      'حالة المحطة': { sender: 'HOUSTON — مركز التحكم', msg: 'جميع أنظمة المحطة تعمل بشكل طبيعي. الضغط 14.7 PSI. درجة الحرارة 22°C. المدار مستقر على ارتفاع 408 كم. لا توجد تنبيهات نشطة.' },
      'تقرير الوقود': { sender: 'HOUSTON — مركز التحكم', msg: 'مستوى الوقود في المركبة: 78%. وقود المناورة: 92%. الاحتياطي كافٍ لـ 3 مناورات تصحيحية. استهلاك الوقود ضمن المعدل الطبيعي.' },
      'حالة الطاقم': { sender: 'FLIGHT SURGEON — د. سميث', msg: 'العلامات الحيوية لجميع أفراد الطاقم طبيعية. معدل ضربات القلب: 72/دقيقة. ضغط الدم: 120/80. مستوى الأكسجين في الدم: 98%. لا توجد أعراض دوار الفضاء. جلسة التمارين القادمة في ساعتين.' },
      'تحديث الطقس': { sender: 'HOUSTON — مركز التحكم', msg: 'طقس منطقة الهبوط الأساسية (المحيط الهادئ): رياح خفيفة 12 عقدة. ارتفاع الموج: 1.2 متر. الرؤية: ممتازة. الظروف مثالية للهبوط. المنطقة البديلة جاهزة أيضاً.' },
      'جدول المهام': { sender: 'HOUSTON — مركز التحكم', msg: 'المهام المتبقية اليوم:\n• 14:00 — تجربة نمو البلورات في المختبر\n• 16:00 — صيانة نظام التبريد الخارجي\n• 18:00 — اتصال مرئي مع المدارس\n• 19:30 — تمارين رياضية (ساعتان)\nاستراحة الغداء في 30 دقيقة.' },
      'طلب إمدادات': { sender: 'HOUSTON — مركز التحكم', msg: 'تم تسجيل طلبك في نظام اللوجستيات. مركبة الشحن SpaceX Dragon CRS-29 القادمة ستحمل الإمدادات المطلوبة. موعد الإطلاق: 12 يوماً. الوصول المتوقع: 14 يوماً. الحمولة: 2,500 كغ معدات وطعام.' },
      'تقرير المدار': { sender: 'HOUSTON — مركز التحكم', msg: 'المدار الحالي: 408 × 410 كم. الميل المداري: 51.6°. السرعة المدارية: 7.66 كم/ث (27,576 كم/ساعة). الدورة الكاملة: 92 دقيقة. شروق الشمس القادم خلال 23 دقيقة. عدد الدورات اليوم: 16.' },
      'حالة الاتصالات': { sender: 'HOUSTON — مركز التحكم', msg: 'جميع قنوات الاتصال تعمل بكفاءة:\n• إشارة TDRS: قوية (99.2%)\n• S-Band: نشط\n• Ku-Band: نشط\n• الاتصال مع هيوستن: مستقر\n• القمر الصناعي التالي خلال 8 دقائق.' },
      'تقرير طبي': { sender: 'FLIGHT SURGEON — د. سميث', msg: 'التقرير الطبي اليومي:\n• الإشعاع المتراكم: 0.8 mSv (ضمن الحد الآمن)\n• كثافة العظام: مستقرة\n• حجم السوائل: طبيعي\n• النوم: 7.5 ساعات\n• التوصية: الاستمرار في جدول التمارين اليومي.' },
      'حالة الطوارئ': { sender: 'HOUSTON — مركز التحكم', msg: '⚠️ لا توجد حالات طوارئ نشطة حالياً.\nآخر تدريب طوارئ: قبل 48 ساعة.\nإجراءات الإخلاء: مراجعة مكتملة.\nمركبة سويوز الإنقاذ: جاهزة في أي وقت.\nمسار الإخلاء السريع: 3 دقائق و 20 ثانية.' },
      'تحديث علمي': { sender: 'MARSHALL — مركز الأبحاث', msg: 'نتائج التجارب الأخيرة:\n• نمو البلورات: تقدم بنسبة 73%\n• تجربة الجاذبية الصغرى: بيانات ممتازة\n• مراقبة النباتات: نمو 2.3 سم خلال 24 ساعة\n• تحليل العينات: جارٍ الإرسال للأرض عبر القمر الصناعي.' },
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

  // ============ COCKPIT HUD ============

  showHUD(data) {
    const hudHTML = `
      <div style="position:fixed;top:0;left:0;right:0;padding:8px 12px;
        display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none;z-index:20;direction:rtl;">
        
        <!-- Left instruments -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;">
          ${data.fuel !== undefined ? this.createGauge('الوقود', data.fuel, '#00ff88', 'FUEL') : ''}
          ${data.oxygen !== undefined ? this.createGauge('O₂', data.oxygen, '#00bbff', 'O2') : ''}
          ${data.energy !== undefined ? this.createGauge('الطاقة', data.energy, '#ff9500', 'PWR') : ''}
          ${data.health !== undefined ? this.createGauge('الصحة', data.health, '#ff3355', 'VIT') : ''}
        </div>

        <!-- Right telemetry -->
        <div style="background:rgba(0,0,0,0.85);border:1px solid rgba(255,149,0,0.3);
          border-radius:2px;padding:8px 12px;font-family:'Share Tech Mono','Orbitron',monospace;min-width:155px;">
          <div style="color:rgba(255,149,0,0.5);font-size:0.55rem;letter-spacing:2px;margin-bottom:4px;
            border-bottom:1px solid rgba(255,149,0,0.15);padding-bottom:3px;">TELEMETRY</div>
          ${data.speed !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,149,0,0.6);font-size:0.6rem;">SPD</span>
              <span style="color:#00ff88;font-size:0.8rem;font-weight:700;">${data.speed} <span style="color:rgba(255,149,0,0.3);font-size:0.5rem;">كم/ث</span></span>
            </div>` : ''}
          ${data.altitude !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,149,0,0.6);font-size:0.6rem;">ALT</span>
              <span style="color:#00ff88;font-size:0.8rem;font-weight:700;">${data.altitude} <span style="color:rgba(255,149,0,0.3);font-size:0.5rem;">كم</span></span>
            </div>` : ''}
          ${data.distance !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,149,0,0.6);font-size:0.6rem;">DST</span>
              <span style="color:#00ff88;font-size:0.8rem;font-weight:700;">${data.distance} <span style="color:rgba(255,149,0,0.3);font-size:0.5rem;">كم</span></span>
            </div>` : ''}
          ${data.gForce !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,149,0,0.6);font-size:0.6rem;">G-FORCE</span>
              <span style="color:${data.gForce > 4 ? '#ff3344' : data.gForce > 3 ? '#ffb800' : '#00ff88'};font-size:0.8rem;font-weight:700;">${data.gForce}</span>
            </div>` : ''}
          ${data.heat !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,100,0,0.7);font-size:0.6rem;">TEMP</span>
              <span style="color:${data.heat > 1000 ? '#ff2200' : data.heat > 500 ? '#ff8800' : '#ffb800'};font-size:0.8rem;font-weight:700;">${data.heat}°C</span>
            </div>` : ''}
        </div>
      </div>
    `;
    this.removeElement('hud');
    this.addElement('hud', hudHTML);
  }

  createGauge(label, value, color, tag = '') {
    const clampVal = Math.max(0, Math.min(100, value));
    const isLow = clampVal < 25;
    const isCritical = clampVal < 10;
    const barColor = isCritical ? '#ff2222' : isLow ? '#ffb800' : color;
    return `
      <div style="background:rgba(0,0,0,0.85);border:1px solid ${isCritical ? 'rgba(255,30,30,0.5)' : 'rgba(255,149,0,0.2)'};
        border-radius:2px;padding:6px 10px;min-width:105px;
        ${isCritical ? 'animation:criticalPulse 1s infinite;' : ''}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span style="color:rgba(255,149,0,0.5);font-size:0.55rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
            ${tag}
          </span>
          <span style="color:${barColor};font-size:0.75rem;font-family:'Share Tech Mono',monospace;font-weight:700;">
            ${Math.round(clampVal)}%
          </span>
        </div>
        <div style="background:rgba(255,255,255,0.05);height:3px;border-radius:1px;overflow:hidden;">
          <div style="width:${clampVal}%;height:100%;background:${barColor};
            border-radius:1px;transition:width 0.4s ease;
            box-shadow:0 0 6px ${barColor}66;"></div>
        </div>
        <div style="color:rgba(255,149,0,0.35);font-size:0.5rem;font-family:'Tajawal',sans-serif;margin-top:2px;text-align:right;">
          ${label}
        </div>
      </div>
    `;
  }

  // ============ MESSAGES ============

  showMessage(text, duration = 3000, type = 'info') {
    const colors = {
      info: { bg: 'rgba(255,149,0,0.08)', border: 'rgba(255,149,0,0.3)', text: '#ffb800', icon: '▸' },
      warning: { bg: 'rgba(255,180,0,0.08)', border: 'rgba(255,180,0,0.4)', text: '#ffdd00', icon: '⚠' },
      danger: { bg: 'rgba(255,30,30,0.08)', border: 'rgba(255,50,50,0.4)', text: '#ff4444', icon: '✖' },
      success: { bg: 'rgba(0,255,100,0.06)', border: 'rgba(0,255,100,0.3)', text: '#00ff88', icon: '✓' }
    };
    const c = colors[type] || colors.info;
    const el = this.addElement('msg-' + Date.now(), `
      <div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:${c.bg};border:1px solid ${c.border};
        padding:10px 24px;border-radius:2px;color:${c.text};font-size:0.85rem;
        text-align:center;max-width:520px;font-family:'Tajawal',sans-serif;
        animation:msgSlideUp 0.3s ease;
        box-shadow:0 0 20px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.2);">
        <span style="font-family:'Share Tech Mono',monospace;margin-left:8px;font-size:0.7rem;">${c.icon}</span>
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
        background:rgba(0,0,0,0.8);border:1px solid rgba(255,149,0,0.25);
        border-left:3px solid #ff9500;
        padding:6px 20px;border-radius:2px;color:rgba(255,200,100,0.9);font-size:0.78rem;
        text-align:center;font-family:'Tajawal',sans-serif;font-weight:500;
        box-shadow:0 2px 15px rgba(0,0,0,0.3);">
        <span style="color:#ff9500;font-family:'Share Tech Mono',monospace;font-size:0.6rem;margin-left:8px;">OBJ</span>
        ${text}
      </div>
    `);
  }

  showComm(sender, message, duration = 5000) {
    this.removeElement('comm');
    const el = this.addElement('comm', `
      <div style="position:fixed;bottom:14px;right:14px;
        background:rgba(0,0,0,0.9);border:1px solid rgba(255,149,0,0.2);
        border-top:2px solid #ff9500;
        padding:12px 16px;border-radius:2px;max-width:340px;
        direction:rtl;animation:commSlideIn 0.4s ease;
        box-shadow:0 4px 25px rgba(0,0,0,0.5);">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="color:#00ff88;font-size:0.4rem;">●</span>
          <span style="color:#ff9500;font-size:0.6rem;font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
            ${sender}
          </span>
        </div>
        <div style="color:rgba(200,210,220,0.85);font-size:0.82rem;line-height:1.6;
          font-family:'Tajawal',sans-serif;white-space:pre-line;">${message}</div>
        <div style="margin-top:6px;text-align:left;">
          <span style="color:rgba(255,149,0,0.25);font-size:0.5rem;font-family:'Share Tech Mono',monospace;">
            SECURE CHANNEL — ENCRYPTED
          </span>
        </div>
      </div>
    `);
    if (duration > 0) setTimeout(() => this.removeElement('comm'), duration);
  }

  showCenterText(text, subtitle = '', duration = 3000) {
    this.removeElement('center-text');
    const el = this.addElement('center-text', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;
        animation:centerZoomIn 0.6s ease;">
        <div style="font-family:'Orbitron',sans-serif;font-size:2.6rem;color:#ff9500;
          text-shadow:0 0 40px rgba(255,149,0,0.4), 0 0 80px rgba(255,149,0,0.15);
          margin-bottom:8px;font-weight:700;letter-spacing:3px;">${text}</div>
        ${subtitle ? `<div style="color:rgba(200,210,220,0.6);font-size:0.9rem;
          font-family:'Tajawal',sans-serif;font-weight:300;letter-spacing:1px;">${subtitle}</div>` : ''}
      </div>
    `);
    if (duration > 0) setTimeout(() => this.removeElement('center-text'), duration);
  }

  showControls(controls) {
    this.removeElement('controls');
    const items = controls.map(c =>
      `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">
        <span style="background:rgba(255,149,0,0.1);border:1px solid rgba(255,149,0,0.25);
          padding:2px 7px;border-radius:2px;font-family:'Share Tech Mono',monospace;font-size:0.6rem;
          color:#ff9500;min-width:36px;text-align:center;">${c.key}</span>
        <span style="color:rgba(200,210,220,0.6);font-size:0.7rem;font-family:'Tajawal',sans-serif;">${c.action}</span>
      </div>`
    ).join('');
    this.addElement('controls', `
      <div style="position:fixed;bottom:14px;left:14px;
        background:rgba(0,0,0,0.85);border:1px solid rgba(255,149,0,0.15);
        padding:8px 12px;border-radius:2px;direction:rtl;
        box-shadow:0 2px 12px rgba(0,0,0,0.3);">
        <div style="color:rgba(255,149,0,0.4);font-size:0.5rem;margin-bottom:3px;
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
          background:rgba(0,0,0,0.9);border:1px solid rgba(255,149,0,0.3);
          color:#ff9500;padding:8px 14px;border-radius:2px;
          font-family:'Share Tech Mono',monospace;font-size:0.75rem;
          cursor:pointer;display:flex;align-items:center;gap:6px;
          box-shadow:0 2px 15px rgba(0,0,0,0.4);transition:all 0.3s;
          letter-spacing:1px;">
          <span style="color:#00ff88;font-size:0.45rem;">●</span>
          <span>HOUSTON COMM</span>
          ${this.chatMessages.length > 0 ? `<span style="background:rgba(255,149,0,0.15);color:#ff9500;
            border:1px solid rgba(255,149,0,0.3);border-radius:2px;width:18px;height:18px;
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
      <div style="margin-bottom:8px;display:flex;flex-direction:column;align-items:${m.fromPlayer ? 'flex-end' : 'flex-start'};">
        <div style="font-size:0.55rem;color:${m.fromPlayer ? '#00ff88' : '#ff9500'};margin-bottom:2px;
          font-family:'Share Tech Mono',monospace;letter-spacing:1px;">
          ${m.fromPlayer ? 'CREW' : m.sender}
          <span style="color:rgba(255,149,0,0.25);margin-right:5px;">${m.time}</span>
        </div>
        <div style="background:${m.fromPlayer ? 'rgba(0,255,100,0.05)' : 'rgba(255,149,0,0.05)'};
          border:1px solid ${m.fromPlayer ? 'rgba(0,255,100,0.15)' : 'rgba(255,149,0,0.15)'};
          ${m.fromPlayer ? 'border-right:2px solid rgba(0,255,100,0.3)' : 'border-left:2px solid rgba(255,149,0,0.3)'};
          padding:7px 11px;border-radius:2px;max-width:270px;
          color:rgba(200,210,220,0.85);font-size:0.78rem;line-height:1.5;
          font-family:'Tajawal',sans-serif;white-space:pre-line;">
          ${m.text}
        </div>
      </div>
    `).join('');

    const quickBtns = this._quickMessages.map(q => `
      <button class="chat-quick-btn" data-msg="${q}" style="
        background:rgba(255,149,0,0.05);border:1px solid rgba(255,149,0,0.15);
        color:rgba(255,200,100,0.6);padding:3px 9px;border-radius:2px;font-size:0.65rem;
        cursor:pointer;font-family:'Tajawal',sans-serif;transition:all 0.2s;
        white-space:nowrap;">
        ${q}
      </button>
    `).join('');

    this.addElement('chat-panel', `
      <div style="position:fixed;bottom:100px;left:14px;width:360px;max-height:460px;
        background:rgba(0,0,0,0.95);border:1px solid rgba(255,149,0,0.2);
        border-top:2px solid #ff9500;
        border-radius:2px;direction:rtl;
        display:flex;flex-direction:column;z-index:31;pointer-events:auto;
        box-shadow:0 8px 40px rgba(0,0,0,0.6);">
        
        <div style="padding:10px 14px;border-bottom:1px solid rgba(255,149,0,0.1);
          display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#00ff88;font-size:0.4rem;">●</span>
            <span style="color:#ff9500;font-size:0.7rem;font-family:'Share Tech Mono',monospace;
              font-weight:700;letter-spacing:2px;">HOUSTON UPLINK</span>
          </div>
          <button id="close-chat-btn" style="background:none;border:none;color:rgba(255,149,0,0.3);
            cursor:pointer;font-size:1rem;transition:color 0.2s;font-family:'Share Tech Mono',monospace;">✕</button>
        </div>

        <div id="chat-messages" style="flex:1;overflow-y:auto;padding:10px 14px;max-height:250px;
          scrollbar-width:thin;scrollbar-color:rgba(255,149,0,0.15) transparent;">
          ${messagesHTML || `
            <div style="text-align:center;color:rgba(255,149,0,0.3);font-size:0.75rem;padding:20px 8px;
              font-family:'Share Tech Mono',monospace;">
              <div style="font-size:0.6rem;letter-spacing:2px;margin-bottom:8px;">COMM CHANNEL OPEN</div>
              <div style="font-family:'Tajawal',sans-serif;color:rgba(200,210,220,0.4);">اتصال مباشر مع مركز التحكم</div>
              <div style="font-size:0.6rem;margin-top:4px;color:rgba(255,149,0,0.2);">اختر رسالة سريعة أو اكتب رسالتك</div>
            </div>
          `}
        </div>

        <div style="padding:6px 10px;border-top:1px solid rgba(255,149,0,0.06);
          display:flex;flex-wrap:wrap;gap:3px;max-height:80px;overflow-y:auto;">
          ${quickBtns}
        </div>

        <div style="padding:8px 10px;border-top:1px solid rgba(255,149,0,0.1);
          display:flex;gap:6px;align-items:center;">
          <input id="chat-input" type="text" placeholder="اكتب رسالة..." style="
            flex:1;background:rgba(255,149,0,0.03);border:1px solid rgba(255,149,0,0.15);
            color:rgba(200,210,220,0.9);padding:7px 12px;border-radius:2px;
            font-family:'Tajawal',sans-serif;font-size:0.78rem;outline:none;direction:rtl;">
          <button id="chat-send-btn" style="
            background:rgba(255,149,0,0.15);border:1px solid rgba(255,149,0,0.3);
            color:#ff9500;width:32px;height:32px;border-radius:2px;cursor:pointer;
            display:flex;align-items:center;justify-content:center;font-size:0.85rem;
            font-family:'Share Tech Mono',monospace;transition:all 0.2s;">
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
        btn.addEventListener('mouseenter', () => {
          btn.style.background = 'rgba(255,149,0,0.12)';
          btn.style.borderColor = 'rgba(255,149,0,0.3)';
          btn.style.color = '#ff9500';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'rgba(255,149,0,0.05)';
          btn.style.borderColor = 'rgba(255,149,0,0.15)';
          btn.style.color = 'rgba(255,200,100,0.6)';
        });
      });

      const input = document.getElementById('chat-input');
      const sendBtn = document.getElementById('chat-send-btn');
      
      sendBtn?.addEventListener('click', () => {
        if (input && input.value.trim()) {
          this._sendChatMessage(input.value.trim());
          input.value = '';
        }
      });
      
      input?.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && input.value.trim()) {
          this._sendChatMessage(input.value.trim());
          input.value = '';
        }
      });
      input?.addEventListener('keyup', (e) => e.stopPropagation());
      input?.addEventListener('keypress', (e) => e.stopPropagation());

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
        { sender: 'HOUSTON — مركز التحكم', msg: `استلمنا رسالتك: "${playerMsg}". الفريق يعمل على الرد. جميع الأنظمة تعمل بشكل طبيعي. هل تحتاج مساعدة في شيء محدد؟` },
        { sender: 'HOUSTON — مركز التحكم', msg: `شكراً على التحديث. نحن نتابع جميع البيانات من المحطة. لا توجد مشاكل مسجلة حالياً. استمر في عملك الممتاز يا رائد الفضاء!` },
        { sender: 'CAPCOM — هيوستن', msg: `تلقينا رسالتك. فريق المهمة على اطلاع. تذكر أن تأخذ استراحة قريباً. صحتك أولوية. هيوستن تراقب جميع المؤشرات.` },
        { sender: 'HOUSTON — مركز التحكم', msg: `مفهوم. نؤكد استلام رسالتك. جميع المعلمات ضمن النطاق الطبيعي. المسار المداري مستقر. القمر الصناعي التالي للاتصال خلال 12 دقيقة.` },
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
    const experiments = stats.experiments || 3;
    const evaTime = stats.evaTime || '45 دقيقة';

    this.addElement('game-ending', `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.97);
        display:flex;align-items:center;justify-content:center;direction:rtl;z-index:50;
        animation:fadeIn 1.5s ease;">
        
        <div style="max-width:600px;width:92%;max-height:88vh;overflow-y:auto;padding:20px;">
          
          <!-- Title -->
          <div style="text-align:center;margin-bottom:24px;animation:slideDown 1s ease;">
            <div style="font-family:'Orbitron',sans-serif;font-size:0.7rem;color:rgba(255,149,0,0.4);
              letter-spacing:4px;margin-bottom:8px;">MISSION STATUS</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:1.8rem;color:#ff9500;
              text-shadow:0 0 30px rgba(255,149,0,0.3);margin-bottom:4px;font-weight:700;letter-spacing:2px;">
              المهمة مكتملة بنجاح
            </div>
            <div style="width:120px;height:2px;background:linear-gradient(90deg,transparent,#ff9500,transparent);
              margin:0 auto 6px;"></div>
            <div style="color:#00ff88;font-size:0.7rem;font-family:'Share Tech Mono',monospace;
              letter-spacing:2px;">MISSION COMPLETE — ALL OBJECTIVES MET</div>
          </div>

          <!-- Stats -->
          <div style="background:rgba(255,149,0,0.03);border:1px solid rgba(255,149,0,0.15);
            border-radius:2px;padding:18px;margin-bottom:14px;">
            <div style="color:rgba(255,149,0,0.5);font-size:0.6rem;font-family:'Share Tech Mono',monospace;
              margin-bottom:12px;text-align:center;letter-spacing:3px;">MISSION DATA</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
              ${[
                { label: 'مدة المهمة', value: missionTime, tag: 'TIME' },
                { label: 'أقصى ارتفاع', value: maxAlt, tag: 'ALT' },
                { label: 'أقصى سرعة', value: maxSpeed, tag: 'VEL' },
                { label: 'أقصى قوة G', value: maxGForce, tag: 'G-MAX' },
                { label: 'حرارة الدرع', value: maxHeat, tag: 'TEMP' },
                { label: 'وقت EVA', value: evaTime, tag: 'EVA' },
              ].map(s => `
                <div style="background:rgba(0,0,0,0.5);padding:10px;border-radius:2px;text-align:center;
                  border:1px solid rgba(255,149,0,0.08);">
                  <div style="color:rgba(255,149,0,0.4);font-size:0.5rem;font-family:'Share Tech Mono',monospace;
                    letter-spacing:1px;margin-bottom:4px;">${s.tag}</div>
                  <div style="color:#ff9500;font-size:0.8rem;margin-top:2px;font-weight:600;
                    font-family:'Tajawal',sans-serif;">${s.value}</div>
                  <div style="color:rgba(200,210,220,0.35);font-size:0.55rem;font-family:'Tajawal',sans-serif;
                    margin-top:2px;">${s.label}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Achievements -->
          <div style="background:rgba(255,149,0,0.03);border:1px solid rgba(255,149,0,0.15);
            border-radius:2px;padding:18px;margin-bottom:14px;">
            <div style="color:rgba(255,149,0,0.5);font-size:0.6rem;font-family:'Share Tech Mono',monospace;
              margin-bottom:12px;text-align:center;letter-spacing:3px;">ACHIEVEMENTS UNLOCKED</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
              ${['إطلاق ناجح', 'التحام دقيق', 'سير فضائي', 'عالم فضاء', 'نجوت من الاحتراق', 'هبوط آمن'].map(a => `
                <div style="background:rgba(0,255,100,0.05);border:1px solid rgba(0,255,100,0.15);
                  padding:5px 12px;border-radius:2px;color:rgba(0,255,136,0.8);font-size:0.7rem;
                  font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:4px;">
                  <span style="color:#00ff88;font-size:0.5rem;">■</span> ${a}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Post-landing -->
          <div style="background:rgba(255,149,0,0.03);border:1px solid rgba(255,149,0,0.15);
            border-radius:2px;padding:18px;margin-bottom:20px;">
            <div style="color:rgba(255,149,0,0.5);font-size:0.6rem;font-family:'Share Tech Mono',monospace;
              margin-bottom:12px;text-align:center;letter-spacing:3px;">POST-LANDING REPORT</div>
            <div style="color:rgba(200,210,220,0.65);font-size:0.8rem;line-height:2;font-family:'Tajawal',sans-serif;">
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> الهبوط: المحيط الهادئ — سفن الإنقاذ وصلت</div>
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> الفحص الطبي: العلامات الحيوية طبيعية</div>
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> النقل: بطائرة هليكوبتر إلى سفينة الإنقاذ</div>
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> المؤتمر الصحفي: مركز جونسون الفضائي</div>
              <div><span style="color:#ff9500;font-size:0.5rem;margin-left:6px;">▸</span> التكريم: وسام ناسا للخدمة المتميزة</div>
            </div>
          </div>

          <!-- Buttons -->
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <button class="cmd-btn cmd-btn-primary" id="btn-new-mission">
              <span class="cmd-btn-tag">NEW</span> مهمة جديدة
            </button>
            <button class="cmd-btn" id="btn-free-mode">
              <span class="cmd-btn-tag">FREE</span> نمط حر
            </button>
            <button class="cmd-btn" id="btn-main-menu">
              <span class="cmd-btn-tag">MENU</span> القائمة
            </button>
          </div>
        </div>
      </div>
      <style>
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }
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
      @keyframes centerZoomIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.85); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
      @keyframes commSlideIn { from { opacity:0; transform:translateX(10px); } to { opacity:1; transform:translateX(0); } }
      @keyframes criticalPulse { 0%,100% { opacity:1; border-color:rgba(255,30,30,0.5); } 50% { opacity:0.7; border-color:rgba(255,30,30,0.8); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      @keyframes glow { 0%,100% { box-shadow:0 0 5px rgba(255,149,0,0.2); } 50% { box-shadow:0 0 15px rgba(255,149,0,0.4); } }
      @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      @keyframes scanline { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }

      /* ===== COMMAND BUTTONS (cockpit style) ===== */
      .cmd-btn {
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(0,0,0,0.8); border: 1px solid rgba(255,149,0,0.2);
        color: rgba(200,210,220,0.8); padding: 10px 20px; border-radius: 2px;
        font-family: 'Tajawal', sans-serif; font-size: 0.9rem;
        cursor: pointer; transition: all 0.2s; pointer-events: auto;
        text-align: right; direction: rtl;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      .cmd-btn:hover {
        background: rgba(255,149,0,0.1);
        border-color: rgba(255,149,0,0.4);
        color: #fff;
        box-shadow: 0 0 20px rgba(255,149,0,0.15);
      }
      .cmd-btn-primary {
        border-color: rgba(255,149,0,0.4);
        color: #ff9500;
        box-shadow: 0 0 15px rgba(255,149,0,0.1);
      }
      .cmd-btn-primary:hover {
        background: rgba(255,149,0,0.15);
        border-color: #ff9500;
        box-shadow: 0 0 25px rgba(255,149,0,0.2);
      }
      .cmd-btn-tag {
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.55rem; letter-spacing: 2px;
        color: rgba(255,149,0,0.5);
        background: rgba(255,149,0,0.06);
        border: 1px solid rgba(255,149,0,0.12);
        padding: 2px 6px; border-radius: 2px;
      }
      .cmd-btn-danger {
        border-color: rgba(255,50,50,0.3);
        color: rgba(255,100,100,0.8);
      }
      .cmd-btn-danger:hover {
        background: rgba(255,50,50,0.1);
        border-color: rgba(255,50,50,0.5);
      }

      /* ===== MENU BUTTONS (mission control panels) ===== */
      .menu-btn {
        display: flex; align-items: center; gap: 12px; width: 100%;
        background: rgba(0,0,0,0.7); border: 1px solid rgba(255,149,0,0.15);
        border-left: 3px solid rgba(255,149,0,0.3);
        color: #fff; padding: 12px 16px; border-radius: 2px;
        font-family: 'Tajawal', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.2s; pointer-events: auto;
        text-align: right; direction: rtl;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      .menu-btn:hover {
        background: rgba(255,149,0,0.08);
        border-color: rgba(255,149,0,0.3);
        border-left-color: #ff9500;
        box-shadow: 0 0 20px rgba(255,149,0,0.1);
        transform: translateX(-2px);
      }
      .menu-btn-primary {
        border-left-color: #ff9500;
        background: rgba(255,149,0,0.05);
      }
      .menu-btn-primary:hover {
        background: rgba(255,149,0,0.12);
        box-shadow: 0 0 25px rgba(255,149,0,0.15);
      }
      .menu-btn-icon {
        font-size: 1.3rem; min-width: 32px; text-align: center;
      }
      .menu-btn-text { flex: 1; }
      .menu-btn-title {
        font-weight: 600; font-size: 0.95rem; color: rgba(255,220,180,0.9);
        margin-bottom: 2px;
      }
      .menu-btn-desc {
        font-size: 0.68rem; color: rgba(200,180,150,0.4);
        font-weight: 300;
      }
      .menu-btn-small {
        background: rgba(0,0,0,0.7); border: 1px solid rgba(255,149,0,0.15);
        color: rgba(255,200,150,0.6); padding: 6px 16px; border-radius: 2px;
        font-family: 'Tajawal', sans-serif; font-size: 0.78rem;
        cursor: pointer; transition: all 0.2s; pointer-events: auto;
      }
      .menu-btn-small:hover {
        background: rgba(255,149,0,0.08);
        border-color: rgba(255,149,0,0.3);
        color: #ff9500;
      }

      /* ===== LEGACY BTN-SPACE ===== */
      .btn-space {
        background: rgba(0,0,0,0.7); border: 1px solid rgba(255,149,0,0.2);
        color: #fff; padding: 10px 26px; border-radius: 2px;
        font-family: 'Tajawal', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.2s; pointer-events: auto;
      }
      .btn-space:hover {
        background: rgba(255,149,0,0.1);
        border-color: rgba(255,149,0,0.4);
        box-shadow: 0 0 20px rgba(255,149,0,0.1);
      }
      .btn-space-primary {
        border-color: rgba(255,149,0,0.35);
        color: #ff9500;
      }
      .btn-space-primary:hover {
        background: rgba(255,149,0,0.12);
      }
      .btn-space-danger {
        border-color: rgba(255,50,50,0.3);
        color: rgba(255,100,100,0.8);
      }
      .btn-space-danger:hover {
        background: rgba(255,50,50,0.1);
      }

      /* ===== SCROLLBAR ===== */
      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,149,0,0.15); border-radius: 1px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,149,0,0.3); }
    `;
    document.head.appendChild(style);
  }
}
