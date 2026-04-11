export class UIManager {
  constructor() {
    this.overlay = document.getElementById('ui-overlay');
    this.activeElements = {};
    this.chatMessages = [];
    this.chatOpen = false;
    this.chatVisible = false;
    this._chatResponseTimer = null;
    this._chatResponses = {
      'حالة المحطة': { sender: 'مركز التحكم — هيوستن', msg: 'جميع أنظمة المحطة تعمل بشكل طبيعي. الضغط 14.7 PSI. درجة الحرارة 22°C. المدار مستقر على ارتفاع 408 كم. لا توجد تنبيهات نشطة.' },
      'تقرير الوقود': { sender: 'مركز التحكم — هيوستن', msg: 'مستوى الوقود في المركبة: 78%. وقود المناورة: 92%. الاحتياطي كافٍ لـ 3 مناورات تصحيحية. استهلاك الوقود ضمن المعدل الطبيعي.' },
      'حالة الطاقم': { sender: 'طبيب الرحلة — د. سميث', msg: 'العلامات الحيوية لجميع أفراد الطاقم طبيعية. معدل ضربات القلب: 72/دقيقة. ضغط الدم: 120/80. مستوى الأكسجين في الدم: 98%. لا توجد أعراض دوار الفضاء. جلسة التمارين القادمة في ساعتين.' },
      'تحديث الطقس': { sender: 'مركز التحكم — هيوستن', msg: 'طقس منطقة الهبوط الأساسية (المحيط الهادئ): رياح خفيفة 12 عقدة. ارتفاع الموج: 1.2 متر. الرؤية: ممتازة. الظروف مثالية للهبوط. المنطقة البديلة جاهزة أيضاً.' },
      'جدول المهام': { sender: 'مركز التحكم — هيوستن', msg: 'المهام المتبقية اليوم:\n• 14:00 — تجربة نمو البلورات في المختبر\n• 16:00 — صيانة نظام التبريد الخارجي\n• 18:00 — اتصال مرئي مع المدارس\n• 19:30 — تمارين رياضية (ساعتان)\nاستراحة الغداء في 30 دقيقة.' },
      'طلب إمدادات': { sender: 'مركز التحكم — هيوستن', msg: 'تم تسجيل طلبك في نظام اللوجستيات. مركبة الشحن SpaceX Dragon CRS-29 القادمة ستحمل الإمدادات المطلوبة. موعد الإطلاق: 12 يوماً. الوصول المتوقع: 14 يوماً. الحمولة: 2,500 كغ معدات وطعام.' },
      'تقرير المدار': { sender: 'مركز التحكم — هيوستن', msg: 'المدار الحالي: 408 × 410 كم. الميل المداري: 51.6°. السرعة المدارية: 7.66 كم/ث (27,576 كم/ساعة). الدورة الكاملة: 92 دقيقة. شروق الشمس القادم خلال 23 دقيقة. عدد الدورات اليوم: 16.' },
      'حالة الاتصالات': { sender: 'مركز التحكم — هيوستن', msg: 'جميع قنوات الاتصال تعمل بكفاءة:\n• إشارة TDRS: قوية (99.2%)\n• S-Band: نشط\n• Ku-Band: نشط\n• الاتصال مع هيوستن: مستقر\n• القمر الصناعي التالي خلال 8 دقائق.' },
      'تقرير طبي': { sender: 'طبيب الرحلة — د. سميث', msg: 'التقرير الطبي اليومي:\n• الإشعاع المتراكم: 0.8 mSv (ضمن الحد الآمن)\n• كثافة العظام: مستقرة\n• حجم السوائل: طبيعي\n• النوم: 7.5 ساعات\n• التوصية: الاستمرار في جدول التمارين اليومي.' },
      'حالة الطوارئ': { sender: 'مركز التحكم — هيوستن', msg: '⚠️ لا توجد حالات طوارئ نشطة حالياً.\nآخر تدريب طوارئ: قبل 48 ساعة.\nإجراءات الإخلاء: مراجعة مكتملة.\nمركبة سويوز الإنقاذ: جاهزة في أي وقت.\nمسار الإخلاء السريع: 3 دقائق و 20 ثانية.' },
      'تحديث علمي': { sender: 'مركز الأبحاث — مارشال', msg: 'نتائج التجارب الأخيرة:\n• نمو البلورات: تقدم بنسبة 73%\n• تجربة الجاذبية الصغرى: بيانات ممتازة\n• مراقبة النباتات: نمو 2.3 سم خلال 24 ساعة\n• تحليل العينات: جارٍ الإرسال للأرض عبر القمر الصناعي.' },
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

  // ============ REDESIGNED HUD ============

  showHUD(data) {
    const hudHTML = `
      <div style="position:fixed;top:0;left:0;right:0;padding:12px 18px;
        display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none;z-index:20;direction:rtl;">
        
        <!-- Left gauges panel -->
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;">
          ${data.fuel !== undefined ? this.createGauge('الوقود', data.fuel, '#00ff88', '⛽') : ''}
          ${data.oxygen !== undefined ? this.createGauge('O₂', data.oxygen, '#00ccff', '💨') : ''}
          ${data.energy !== undefined ? this.createGauge('الطاقة', data.energy, '#ffcc00', '⚡') : ''}
          ${data.health !== undefined ? this.createGauge('الصحة', data.health, '#ff4466', '❤️') : ''}
        </div>

        <!-- Right telemetry panel -->
        <div style="background:rgba(5,12,25,0.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
          border:1px solid rgba(0,150,255,0.1);border-radius:10px;padding:10px 14px;
          font-family:'Orbitron',monospace;min-width:160px;">
          ${data.speed !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(0,180,255,0.6);font-size:0.65rem;letter-spacing:1px;">SPD</span>
              <span style="color:#fff;font-size:0.8rem;font-weight:500;">${data.speed} <span style="color:rgba(0,180,255,0.4);font-size:0.55rem;">كم/ث</span></span>
            </div>` : ''}
          ${data.altitude !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(0,180,255,0.6);font-size:0.65rem;letter-spacing:1px;">ALT</span>
              <span style="color:#fff;font-size:0.8rem;font-weight:500;">${data.altitude} <span style="color:rgba(0,180,255,0.4);font-size:0.55rem;">كم</span></span>
            </div>` : ''}
          ${data.distance !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(0,180,255,0.6);font-size:0.65rem;letter-spacing:1px;">DST</span>
              <span style="color:#fff;font-size:0.8rem;font-weight:500;">${data.distance} <span style="color:rgba(0,180,255,0.4);font-size:0.55rem;">كم</span></span>
            </div>` : ''}
          ${data.gForce !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(0,180,255,0.6);font-size:0.65rem;letter-spacing:1px;">G</span>
              <span style="color:${data.gForce > 4 ? '#ff4444' : data.gForce > 3 ? '#ffaa00' : '#00ff88'};font-size:0.8rem;font-weight:700;">${data.gForce}</span>
            </div>` : ''}
          ${data.heat !== undefined ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
              <span style="color:rgba(255,100,0,0.6);font-size:0.65rem;letter-spacing:1px;">TEMP</span>
              <span style="color:${data.heat > 1000 ? '#ff3300' : data.heat > 500 ? '#ff8800' : '#ffcc00'};font-size:0.8rem;font-weight:700;">${data.heat}°C</span>
            </div>` : ''}
        </div>
      </div>
    `;
    this.removeElement('hud');
    this.addElement('hud', hudHTML);
  }

  createGauge(label, value, color, icon = '') {
    const clampVal = Math.max(0, Math.min(100, value));
    const isLow = clampVal < 25;
    const isCritical = clampVal < 10;
    return `
      <div style="background:rgba(5,12,25,0.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
        border:1px solid ${isCritical ? 'rgba(255,50,50,0.3)' : 'rgba(0,150,255,0.1)'};
        border-radius:10px;padding:8px 12px;min-width:110px;
        ${isCritical ? 'animation:pulse 1s infinite;' : ''}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
          <span style="color:${isLow ? '#ff6644' : color};font-size:0.65rem;font-family:'Tajawal',sans-serif;font-weight:600;">
            ${icon} ${label}
          </span>
          <span style="color:${isLow ? '#ff6644' : '#fff'};font-size:0.75rem;font-family:'Orbitron',monospace;font-weight:700;">
            ${Math.round(clampVal)}%
          </span>
        </div>
        <div style="background:rgba(255,255,255,0.06);height:4px;border-radius:2px;overflow:hidden;">
          <div style="width:${clampVal}%;height:100%;
            background:${isCritical ? 'linear-gradient(90deg,#ff2222,#ff4444)' : isLow ? 'linear-gradient(90deg,#ff6600,#ffaa00)' : `linear-gradient(90deg,${color}88,${color})`};
            border-radius:2px;transition:width 0.4s ease;
            box-shadow:0 0 8px ${color}44;"></div>
        </div>
      </div>
    `;
  }

  // ============ REDESIGNED MESSAGES ============

  showMessage(text, duration = 3000, type = 'info') {
    const colors = {
      info: { bg: 'rgba(0,100,200,0.12)', border: 'rgba(0,180,255,0.25)', text: '#88ccff' },
      warning: { bg: 'rgba(200,150,0,0.12)', border: 'rgba(255,200,0,0.25)', text: '#ffdd66' },
      danger: { bg: 'rgba(200,50,50,0.12)', border: 'rgba(255,80,80,0.25)', text: '#ff7777' },
      success: { bg: 'rgba(0,200,100,0.12)', border: 'rgba(0,255,120,0.25)', text: '#66ffaa' }
    };
    const c = colors[type] || colors.info;
    const el = this.addElement('msg-' + Date.now(), `
      <div style="position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
        background:${c.bg};backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
        border:1px solid ${c.border};
        padding:10px 28px;border-radius:10px;color:${c.text};font-size:0.9rem;
        text-align:center;max-width:550px;font-family:'Tajawal',sans-serif;
        animation:msgSlideUp 0.4s ease;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
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
      <div style="position:fixed;top:55px;left:50%;transform:translateX(-50%);
        background:rgba(5,12,25,0.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
        border:1px solid rgba(0,150,255,0.15);
        padding:7px 22px;border-radius:20px;color:rgba(140,200,255,0.9);font-size:0.8rem;
        text-align:center;font-family:'Tajawal',sans-serif;font-weight:500;
        box-shadow:0 2px 12px rgba(0,0,0,0.2);">
        🎯 ${text}
      </div>
    `);
  }

  showComm(sender, message, duration = 5000) {
    this.removeElement('comm');
    const el = this.addElement('comm', `
      <div style="position:fixed;bottom:18px;right:18px;
        background:rgba(5,12,25,0.75);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
        border:1px solid rgba(0,150,255,0.15);
        padding:14px 18px;border-radius:12px;max-width:340px;
        direction:rtl;animation:commFadeIn 0.5s ease;
        box-shadow:0 4px 24px rgba(0,0,0,0.3);">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="color:rgba(0,255,120,0.7);font-size:0.45rem;">●</span>
          <span style="color:rgba(0,180,255,0.7);font-size:0.65rem;font-family:'Orbitron',monospace;letter-spacing:1px;">
            ${sender}
          </span>
        </div>
        <div style="color:rgba(200,220,240,0.9);font-size:0.85rem;line-height:1.6;
          font-family:'Tajawal',sans-serif;white-space:pre-line;">${message}</div>
      </div>
    `);
    if (duration > 0) setTimeout(() => this.removeElement('comm'), duration);
  }

  showCenterText(text, subtitle = '', duration = 3000) {
    this.removeElement('center-text');
    const el = this.addElement('center-text', `
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;
        animation:centerTextIn 0.8s ease;">
        <div style="font-family:'Orbitron',sans-serif;font-size:2.8rem;color:#fff;
          text-shadow:0 0 60px rgba(0,180,255,0.4), 0 0 120px rgba(0,100,200,0.2);
          margin-bottom:10px;font-weight:700;letter-spacing:4px;">${text}</div>
        ${subtitle ? `<div style="color:rgba(150,200,255,0.7);font-size:1rem;
          font-family:'Tajawal',sans-serif;font-weight:300;">${subtitle}</div>` : ''}
      </div>
    `);
    if (duration > 0) setTimeout(() => this.removeElement('center-text'), duration);
  }

  showControls(controls) {
    this.removeElement('controls');
    const items = controls.map(c =>
      `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
        <span style="background:rgba(0,100,200,0.15);border:1px solid rgba(0,150,255,0.2);
          padding:2px 8px;border-radius:4px;font-family:'Orbitron',monospace;font-size:0.65rem;
          color:rgba(0,180,255,0.7);min-width:40px;text-align:center;">${c.key}</span>
        <span style="color:rgba(180,210,240,0.7);font-size:0.75rem;font-family:'Tajawal',sans-serif;">${c.action}</span>
      </div>`
    ).join('');
    this.addElement('controls', `
      <div style="position:fixed;bottom:18px;left:18px;
        background:rgba(5,12,25,0.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
        padding:10px 14px;border-radius:10px;
        border:1px solid rgba(0,150,255,0.08);direction:rtl;
        box-shadow:0 2px 12px rgba(0,0,0,0.2);">
        <div style="color:rgba(100,150,200,0.5);font-size:0.6rem;margin-bottom:4px;
          font-family:'Orbitron',sans-serif;letter-spacing:1px;">CONTROLS</div>
        ${items}
      </div>
    `);
  }

  // ============ REDESIGNED CHAT SYSTEM ============

  showChatButton() {
    this.chatVisible = true;
    this.removeElement('chat-btn');
    this.addElement('chat-btn', `
      <div style="position:fixed;bottom:70px;left:18px;pointer-events:auto;z-index:30;">
        <button id="toggle-chat-btn" style="
          background:rgba(5,15,30,0.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
          border:1px solid rgba(0,150,255,0.15);color:rgba(0,200,255,0.9);padding:9px 16px;
          border-radius:22px;font-family:'Tajawal',sans-serif;font-size:0.8rem;
          cursor:pointer;display:flex;align-items:center;gap:7px;
          box-shadow:0 2px 16px rgba(0,0,0,0.3);transition:all 0.3s;">
          <span style="color:rgba(0,255,120,0.6);font-size:0.5rem;">●</span>
          <span>مركز التحكم</span>
          ${this.chatMessages.length > 0 ? `<span style="background:rgba(0,180,255,0.2);color:rgba(0,200,255,0.9);
            border:1px solid rgba(0,150,255,0.3);border-radius:50%;width:18px;height:18px;
            display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:600;">
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
        <div style="font-size:0.6rem;color:${m.fromPlayer ? 'rgba(0,255,120,0.5)' : 'rgba(0,180,255,0.5)'};margin-bottom:2px;
          font-family:'Orbitron',monospace;">
          ${m.fromPlayer ? 'YOU' : m.sender}
          <span style="color:rgba(100,150,200,0.3);margin-right:5px;">${m.time}</span>
        </div>
        <div style="background:${m.fromPlayer ? 'rgba(0,100,50,0.15)' : 'rgba(0,50,100,0.15)'};
          border:1px solid ${m.fromPlayer ? 'rgba(0,255,100,0.1)' : 'rgba(0,150,255,0.1)'};
          padding:8px 12px;border-radius:10px;max-width:280px;
          color:rgba(200,220,240,0.9);font-size:0.8rem;line-height:1.5;
          font-family:'Tajawal',sans-serif;white-space:pre-line;">
          ${m.text}
        </div>
      </div>
    `).join('');

    const quickBtns = this._quickMessages.map(q => `
      <button class="chat-quick-btn" data-msg="${q}" style="
        background:rgba(0,40,80,0.3);border:1px solid rgba(0,150,255,0.12);
        color:rgba(140,200,240,0.7);padding:4px 10px;border-radius:14px;font-size:0.68rem;
        cursor:pointer;font-family:'Tajawal',sans-serif;transition:all 0.2s;
        white-space:nowrap;">
        ${q}
      </button>
    `).join('');

    this.addElement('chat-panel', `
      <div style="position:fixed;bottom:120px;left:18px;width:370px;max-height:480px;
        background:rgba(5,10,20,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
        border:1px solid rgba(0,150,255,0.12);
        border-radius:14px;direction:rtl;
        display:flex;flex-direction:column;z-index:31;pointer-events:auto;
        box-shadow:0 8px 40px rgba(0,0,0,0.5);">
        
        <div style="padding:12px 16px;border-bottom:1px solid rgba(0,150,255,0.08);
          display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:7px;">
            <span style="color:rgba(0,255,120,0.6);font-size:0.45rem;">●</span>
            <span style="color:rgba(0,200,255,0.8);font-size:0.8rem;font-family:'Orbitron',sans-serif;
              font-weight:500;letter-spacing:1px;">HOUSTON</span>
          </div>
          <button id="close-chat-btn" style="background:none;border:none;color:rgba(100,150,200,0.4);
            cursor:pointer;font-size:1.1rem;transition:color 0.2s;">✕</button>
        </div>

        <div id="chat-messages" style="flex:1;overflow-y:auto;padding:12px 16px;max-height:260px;
          scrollbar-width:thin;scrollbar-color:rgba(0,100,200,0.2) transparent;">
          ${messagesHTML || `
            <div style="text-align:center;color:rgba(100,150,200,0.4);font-size:0.78rem;padding:25px 10px;
              font-family:'Tajawal',sans-serif;">
              <div style="font-size:1.5rem;margin-bottom:10px;opacity:0.5;">📡</div>
              <div>اتصال مباشر مع مركز التحكم</div>
              <div style="font-size:0.68rem;margin-top:4px;color:rgba(100,150,200,0.3);">اختر رسالة سريعة أو اكتب رسالتك</div>
            </div>
          `}
        </div>

        <div style="padding:8px 12px;border-top:1px solid rgba(0,150,255,0.06);
          display:flex;flex-wrap:wrap;gap:4px;max-height:90px;overflow-y:auto;">
          ${quickBtns}
        </div>

        <div style="padding:10px 12px;border-top:1px solid rgba(0,150,255,0.08);
          display:flex;gap:8px;align-items:center;">
          <input id="chat-input" type="text" placeholder="اكتب رسالة..." style="
            flex:1;background:rgba(0,20,40,0.4);border:1px solid rgba(0,150,255,0.1);
            color:rgba(200,220,240,0.9);padding:8px 14px;border-radius:20px;
            font-family:'Tajawal',sans-serif;font-size:0.8rem;outline:none;direction:rtl;">
          <button id="chat-send-btn" style="
            background:rgba(0,100,200,0.3);border:1px solid rgba(0,150,255,0.2);
            color:rgba(0,200,255,0.8);width:34px;height:34px;border-radius:50%;cursor:pointer;
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
        btn.addEventListener('mouseenter', () => {
          btn.style.background = 'rgba(0,60,120,0.4)';
          btn.style.borderColor = 'rgba(0,150,255,0.3)';
          btn.style.color = '#fff';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'rgba(0,40,80,0.3)';
          btn.style.borderColor = 'rgba(0,150,255,0.12)';
          btn.style.color = 'rgba(140,200,240,0.7)';
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
        { sender: 'مركز التحكم — هيوستن', msg: `استلمنا رسالتك: "${playerMsg}". الفريق يعمل على الرد. جميع الأنظمة تعمل بشكل طبيعي. هل تحتاج مساعدة في شيء محدد؟` },
        { sender: 'مركز التحكم — هيوستن', msg: `شكراً على التحديث. نحن نتابع جميع البيانات من المحطة. لا توجد مشاكل مسجلة حالياً. استمر في عملك الممتاز يا رائد الفضاء!` },
        { sender: 'CapCom — هيوستن', msg: `تلقينا رسالتك. فريق المهمة على اطلاع. تذكر أن تأخذ استراحة قريباً. صحتك أولوية. هيوستن تراقب جميع المؤشرات.` },
        { sender: 'مركز التحكم — هيوستن', msg: `مفهوم. نؤكد استلام رسالتك. جميع المعلمات ضمن النطاق الطبيعي. المسار المداري مستقر. القمر الصناعي التالي للاتصال خلال 12 دقيقة.` },
      ];
      response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }

    this.chatMessages.push({ text: response.msg, sender: response.sender, fromPlayer: false, time: respTime });
    if (this.chatOpen) this.showChat();
    this.showChatButton();
  }

  // ============ REDESIGNED GAME ENDING ============

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
        background:radial-gradient(ellipse at 50% 30%, rgba(5,15,35,0.97) 0%, rgba(2,5,12,0.99) 100%);
        display:flex;align-items:center;justify-content:center;direction:rtl;z-index:50;
        animation:fadeIn 1.5s ease;">
        
        <div style="max-width:620px;width:92%;max-height:88vh;overflow-y:auto;padding:20px;">
          
          <!-- Title -->
          <div style="text-align:center;margin-bottom:28px;animation:slideDown 1s ease;">
            <div style="font-family:'Orbitron',sans-serif;font-size:2rem;color:#fff;
              text-shadow:0 0 50px rgba(0,180,255,0.3);margin-bottom:6px;font-weight:700;letter-spacing:3px;">
              المهمة مكتملة بنجاح
            </div>
            <div style="width:150px;height:1px;background:linear-gradient(90deg,transparent,rgba(0,180,255,0.4),transparent);
              margin:0 auto 8px;"></div>
            <div style="color:rgba(100,180,255,0.6);font-size:0.85rem;font-family:'Orbitron',sans-serif;
              letter-spacing:2px;">MISSION COMPLETE</div>
          </div>

          <!-- Stats grid -->
          <div style="background:rgba(5,15,30,0.5);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
            border:1px solid rgba(0,150,255,0.1);border-radius:14px;padding:20px;margin-bottom:16px;">
            <div style="color:rgba(0,180,255,0.6);font-size:0.75rem;font-family:'Orbitron',sans-serif;
              margin-bottom:14px;text-align:center;letter-spacing:2px;">MISSION DATA</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
              ${[
                { label: 'مدة المهمة', value: missionTime, icon: '⏱️' },
                { label: 'أقصى ارتفاع', value: maxAlt, icon: '📏' },
                { label: 'أقصى سرعة', value: maxSpeed, icon: '💨' },
                { label: 'أقصى قوة G', value: maxGForce, icon: '🎯' },
                { label: 'حرارة الدرع', value: maxHeat, icon: '🔥' },
                { label: 'وقت EVA', value: evaTime, icon: '🧑‍🚀' },
              ].map(s => `
                <div style="background:rgba(0,20,40,0.4);padding:12px;border-radius:10px;text-align:center;
                  border:1px solid rgba(0,100,200,0.06);">
                  <div style="font-size:1rem;margin-bottom:4px;">${s.icon}</div>
                  <div style="color:rgba(100,150,200,0.5);font-size:0.6rem;font-family:'Tajawal',sans-serif;">${s.label}</div>
                  <div style="color:#fff;font-size:0.85rem;margin-top:3px;font-weight:600;
                    font-family:'Tajawal',sans-serif;">${s.value}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Achievements -->
          <div style="background:rgba(5,15,30,0.5);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
            border:1px solid rgba(0,150,255,0.1);border-radius:14px;padding:20px;margin-bottom:16px;">
            <div style="color:rgba(255,200,0,0.6);font-size:0.75rem;font-family:'Orbitron',sans-serif;
              margin-bottom:14px;text-align:center;letter-spacing:2px;">ACHIEVEMENTS</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
              ${['🚀 إطلاق ناجح', '🔗 التحام دقيق', `🧑‍🚀 سير فضائي`, '🔬 عالم فضاء', '🔥 نجوت من الاحتراق', '🌊 هبوط آمن'].map(a => `
                <div style="background:rgba(200,150,0,0.08);border:1px solid rgba(255,200,0,0.12);
                  padding:6px 14px;border-radius:16px;color:rgba(255,220,100,0.8);font-size:0.75rem;
                  font-family:'Tajawal',sans-serif;">${a}</div>
              `).join('')}
            </div>
          </div>

          <!-- Post-landing report -->
          <div style="background:rgba(5,15,30,0.5);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
            border:1px solid rgba(0,150,255,0.1);border-radius:14px;padding:20px;margin-bottom:22px;">
            <div style="color:rgba(0,180,255,0.6);font-size:0.75rem;font-family:'Orbitron',sans-serif;
              margin-bottom:14px;text-align:center;letter-spacing:2px;">POST-LANDING</div>
            <div style="color:rgba(200,220,240,0.7);font-size:0.82rem;line-height:2;font-family:'Tajawal',sans-serif;">
              <div>🌊 الهبوط: المحيط الهادئ — سفن الإنقاذ وصلت</div>
              <div>🏥 الفحص الطبي: العلامات الحيوية طبيعية</div>
              <div>🚁 النقل: بطائرة هليكوبتر إلى سفينة الإنقاذ</div>
              <div>📸 المؤتمر الصحفي: مركز جونسون الفضائي</div>
              <div>🎖️ التكريم: وسام ناسا للخدمة المتميزة</div>
            </div>
          </div>

          <!-- Action buttons -->
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <button class="menu-btn menu-btn-primary" style="padding:11px 28px;" id="btn-new-mission">
              <div class="menu-btn-icon" style="font-size:1rem;">🚀</div>
              <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.9rem;">مهمة جديدة</div></div>
            </button>
            <button class="menu-btn" style="padding:11px 28px;" id="btn-free-mode">
              <div class="menu-btn-icon" style="font-size:1rem;">🛸</div>
              <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.9rem;">نمط حر</div></div>
            </button>
            <button class="menu-btn" style="padding:11px 28px;" id="btn-main-menu">
              <div class="menu-btn-icon" style="font-size:1rem;">🏠</div>
              <div class="menu-btn-text"><div class="menu-btn-title" style="font-size:0.9rem;">القائمة</div></div>
            </button>
          </div>
        </div>
      </div>
      <style>
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
      </style>
    `);
  }

  // ============ REDESIGNED GLOBAL STYLES ============

  addGlobalStyles() {
    if (document.getElementById('game-styles')) return;
    const style = document.createElement('style');
    style.id = 'game-styles';
    style.textContent = `
      @keyframes fadeInUp { from { opacity:0; transform:translate(-50%,-50%) translateY(20px); } to { opacity:1; transform:translate(-50%,-50%); } }
      @keyframes msgSlideUp { from { opacity:0; transform:translateX(-50%) translateY(15px); } to { opacity:1; transform:translateX(-50%); } }
      @keyframes centerTextIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.9); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
      @keyframes commFadeIn { from { opacity:0; transform:translateX(15px); } to { opacity:1; transform:translateX(0); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      @keyframes glow { 0%,100% { box-shadow:0 0 5px rgba(0,150,255,0.2); } 50% { box-shadow:0 0 20px rgba(0,150,255,0.4); } }
      @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

      /* ===== MENU BUTTONS ===== */
      .menu-btn {
        display: flex; align-items: center; gap: 14px; width: 100%;
        background: rgba(5,15,30,0.5); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(0,150,255,0.1); color: #fff;
        padding: 14px 18px; border-radius: 12px;
        font-family: 'Tajawal', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.3s ease; pointer-events: auto;
        text-align: right; direction: rtl;
        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
      }
      .menu-btn:hover {
        background: rgba(0,40,80,0.5);
        border-color: rgba(0,180,255,0.25);
        box-shadow: 0 4px 24px rgba(0,100,200,0.15);
        transform: translateY(-1px);
      }
      .menu-btn-primary {
        background: rgba(0,60,120,0.4);
        border-color: rgba(0,180,255,0.2);
        box-shadow: 0 2px 16px rgba(0,100,200,0.15);
      }
      .menu-btn-primary:hover {
        background: rgba(0,80,160,0.5);
        border-color: rgba(0,200,255,0.35);
        box-shadow: 0 4px 30px rgba(0,120,255,0.2);
      }
      .menu-btn-icon {
        font-size: 1.4rem; min-width: 36px; text-align: center;
        filter: grayscale(0.1);
      }
      .menu-btn-text { flex: 1; }
      .menu-btn-title {
        font-weight: 600; font-size: 1rem; color: rgba(220,235,255,0.95);
        margin-bottom: 2px;
      }
      .menu-btn-desc {
        font-size: 0.72rem; color: rgba(130,170,210,0.55);
        font-weight: 300;
      }
      .menu-btn-small {
        background: rgba(5,15,30,0.5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(0,150,255,0.1); color: rgba(180,210,240,0.7);
        padding: 7px 18px; border-radius: 8px;
        font-family: 'Tajawal', sans-serif; font-size: 0.8rem;
        cursor: pointer; transition: all 0.3s; pointer-events: auto;
      }
      .menu-btn-small:hover {
        background: rgba(0,40,80,0.4);
        border-color: rgba(0,180,255,0.2);
        color: #fff;
      }

      /* ===== LEGACY BTN-SPACE (for compatibility) ===== */
      .btn-space {
        background: rgba(5,15,30,0.5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(0,150,255,0.12); color: #fff; padding: 12px 30px;
        border-radius: 10px; font-family: 'Tajawal', sans-serif; font-size: 1rem;
        cursor: pointer; transition: all 0.3s; pointer-events: auto;
      }
      .btn-space:hover {
        background: rgba(0,40,80,0.5);
        border-color: rgba(0,180,255,0.25);
        box-shadow: 0 4px 20px rgba(0,100,200,0.15);
        transform: translateY(-1px);
      }
      .btn-space-primary {
        background: rgba(0,60,120,0.4);
        border-color: rgba(0,180,255,0.2);
      }
      .btn-space-primary:hover {
        background: rgba(0,80,160,0.5);
        border-color: rgba(0,200,255,0.35);
        box-shadow: 0 4px 24px rgba(0,120,255,0.2);
      }
      .btn-space-danger {
        background: rgba(80,10,10,0.4);
        border-color: rgba(255,80,80,0.2);
      }
      .btn-space-danger:hover {
        background: rgba(120,20,20,0.5);
        border-color: rgba(255,80,80,0.35);
      }

      /* ===== SCROLLBAR ===== */
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0,100,200,0.2); border-radius: 2px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(0,100,200,0.4); }
    `;
    document.head.appendChild(style);
  }
}
