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
          ${data.gForce !== undefined ? `<div style="color:${data.gForce > 4 ? '#ff4444' : data.gForce > 3 ? '#ffaa00' : '#00ff88'};font-size:0.8rem;">قوة G: <span style="color:#fff;">${data.gForce}</span></div>` : ''}
          ${data.heat !== undefined ? `<div style="color:#ff6600;font-size:0.8rem;">الحرارة: <span style="color:#fff;">${data.heat}°C</span></div>` : ''}
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
      setTimeout(() => { el.remove(); delete this.activeElements[el.id]; }, duration);
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
        <div style="color:#cceeff;font-size:0.9rem;line-height:1.5;white-space:pre-line;">${message}</div>
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

  // ============ GROUND STATION CHAT SYSTEM ============

  showChatButton() {
    this.chatVisible = true;
    this.removeElement('chat-btn');
    this.addElement('chat-btn', `
      <div style="position:fixed;bottom:80px;left:20px;pointer-events:auto;z-index:30;">
        <button id="toggle-chat-btn" style="
          background:linear-gradient(135deg, rgba(0,60,120,0.9), rgba(0,30,60,0.95));
          border:1px solid rgba(0,212,255,0.5);color:#00d4ff;padding:10px 18px;
          border-radius:25px;font-family:'Cairo',sans-serif;font-size:0.85rem;
          cursor:pointer;display:flex;align-items:center;gap:8px;
          box-shadow:0 0 15px rgba(0,212,255,0.2);transition:all 0.3s;">
          <span style="font-size:1.1rem;">📡</span>
          <span>اتصل بمركز التحكم</span>
          ${this.chatMessages.length > 0 ? `<span style="background:#00d4ff;color:#000;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:bold;">${this.chatMessages.length}</span>` : ''}
        </button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('toggle-chat-btn')?.addEventListener('click', () => {
        if (this.chatOpen) {
          this.hideChat();
        } else {
          this.showChat();
        }
      });
    }, 50);
  }

  showChat() {
    this.chatOpen = true;
    this.removeElement('chat-panel');

    const messagesHTML = this.chatMessages.map(m => `
      <div style="margin-bottom:10px;display:flex;flex-direction:column;align-items:${m.fromPlayer ? 'flex-end' : 'flex-start'};">
        <div style="font-size:0.65rem;color:${m.fromPlayer ? '#88ff88' : '#00d4ff'};margin-bottom:2px;">
          ${m.fromPlayer ? '🧑‍🚀 أنت' : `📡 ${m.sender}`}
          <span style="color:#557799;margin-right:5px;">${m.time}</span>
        </div>
        <div style="background:${m.fromPlayer ? 'rgba(0,100,50,0.3)' : 'rgba(0,50,100,0.3)'};
          border:1px solid ${m.fromPlayer ? 'rgba(0,255,100,0.2)' : 'rgba(0,212,255,0.2)'};
          padding:8px 12px;border-radius:8px;max-width:280px;
          color:#ddeeff;font-size:0.82rem;line-height:1.5;white-space:pre-line;">
          ${m.text}
        </div>
      </div>
    `).join('');

    const quickBtns = this._quickMessages.map(q => `
      <button class="chat-quick-btn" data-msg="${q}" style="
        background:rgba(0,40,80,0.6);border:1px solid rgba(0,212,255,0.25);
        color:#88ccee;padding:5px 10px;border-radius:15px;font-size:0.72rem;
        cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.2s;
        white-space:nowrap;">
        ${q}
      </button>
    `).join('');

    this.addElement('chat-panel', `
      <div style="position:fixed;bottom:130px;left:20px;width:380px;max-height:500px;
        background:rgba(0,8,16,0.95);border:1px solid rgba(0,212,255,0.3);
        border-radius:12px;backdrop-filter:blur(15px);direction:rtl;
        display:flex;flex-direction:column;z-index:31;pointer-events:auto;
        box-shadow:0 5px 30px rgba(0,0,0,0.5);">
        
        <div style="padding:12px 15px;border-bottom:1px solid rgba(0,212,255,0.15);
          display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:#00ff88;font-size:0.5rem;">●</span>
            <span style="color:#00d4ff;font-size:0.9rem;font-weight:600;">مركز التحكم — هيوستن</span>
          </div>
          <button id="close-chat-btn" style="background:none;border:none;color:#557799;cursor:pointer;font-size:1.2rem;">✕</button>
        </div>

        <div id="chat-messages" style="flex:1;overflow-y:auto;padding:12px 15px;max-height:280px;
          scrollbar-width:thin;scrollbar-color:rgba(0,212,255,0.3) transparent;">
          ${messagesHTML || `
            <div style="text-align:center;color:#557799;font-size:0.8rem;padding:20px;">
              <div style="font-size:2rem;margin-bottom:8px;">📡</div>
              <div>اتصال مباشر مع مركز التحكم في هيوستن</div>
              <div style="font-size:0.7rem;margin-top:5px;">اختر رسالة سريعة أو اكتب رسالتك</div>
            </div>
          `}
        </div>

        <div style="padding:8px 12px;border-top:1px solid rgba(0,212,255,0.1);
          display:flex;flex-wrap:wrap;gap:5px;max-height:100px;overflow-y:auto;">
          ${quickBtns}
        </div>

        <div style="padding:10px 12px;border-top:1px solid rgba(0,212,255,0.15);
          display:flex;gap:8px;align-items:center;">
          <input id="chat-input" type="text" placeholder="اكتب رسالة لمركز التحكم..." style="
            flex:1;background:rgba(0,20,40,0.5);border:1px solid rgba(0,212,255,0.2);
            color:#cceeff;padding:8px 12px;border-radius:20px;font-family:'Cairo',sans-serif;
            font-size:0.82rem;outline:none;direction:rtl;">
          <button id="chat-send-btn" style="
            background:linear-gradient(135deg,#0066cc,#0044aa);border:1px solid #0088ff;
            color:#fff;width:35px;height:35px;border-radius:50%;cursor:pointer;
            display:flex;align-items:center;justify-content:center;font-size:1rem;">
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
          btn.style.background = 'rgba(0,80,160,0.6)';
          btn.style.borderColor = 'rgba(0,212,255,0.5)';
          btn.style.color = '#fff';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'rgba(0,40,80,0.6)';
          btn.style.borderColor = 'rgba(0,212,255,0.25)';
          btn.style.color = '#88ccee';
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
    
    this.chatMessages.push({
      text,
      sender: 'أنت',
      fromPlayer: true,
      time: timeStr
    });

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

    this.chatMessages.push({
      text: response.msg,
      sender: response.sender,
      fromPlayer: false,
      time: respTime
    });

    if (this.chatOpen) {
      this.showChat();
    }
    this.showChatButton();
  }

  // ============ PROFESSIONAL GAME ENDING ============

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
        background:linear-gradient(180deg, rgba(0,5,15,0.95) 0%, rgba(0,15,40,0.98) 50%, rgba(0,10,25,0.95) 100%);
        display:flex;align-items:center;justify-content:center;direction:rtl;z-index:50;
        animation:fadeIn 1.5s ease;">
        
        <div style="max-width:650px;width:90%;max-height:90vh;overflow-y:auto;padding:20px;">
          
          <div style="text-align:center;margin-bottom:25px;animation:slideDown 1s ease;">
            <div style="font-size:3.5rem;margin-bottom:8px;">🏆</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:2.2rem;color:#fff;
              text-shadow:0 0 40px rgba(0,212,255,0.6);margin-bottom:5px;">
              المهمة مكتملة بنجاح!
            </div>
            <div style="color:#00d4ff;font-size:1rem;">Mission Complete — Welcome Home, Astronaut!</div>
          </div>

          <div style="background:rgba(0,20,40,0.6);border:1px solid rgba(0,212,255,0.2);
            border-radius:12px;padding:20px;margin-bottom:15px;">
            <div style="color:#00d4ff;font-size:0.9rem;font-weight:600;margin-bottom:12px;text-align:center;">
              📊 ملخص المهمة
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;color:#cceeff;font-size:0.85rem;">
              <div style="background:rgba(0,30,60,0.4);padding:10px;border-radius:8px;text-align:center;">
                <div style="color:#557799;font-size:0.7rem;">مدة المهمة</div>
                <div style="color:#fff;font-size:1rem;margin-top:3px;">${missionTime}</div>
              </div>
              <div style="background:rgba(0,30,60,0.4);padding:10px;border-radius:8px;text-align:center;">
                <div style="color:#557799;font-size:0.7rem;">أقصى ارتفاع</div>
                <div style="color:#fff;font-size:1rem;margin-top:3px;">${maxAlt}</div>
              </div>
              <div style="background:rgba(0,30,60,0.4);padding:10px;border-radius:8px;text-align:center;">
                <div style="color:#557799;font-size:0.7rem;">أقصى سرعة</div>
                <div style="color:#fff;font-size:1rem;margin-top:3px;">${maxSpeed}</div>
              </div>
              <div style="background:rgba(0,30,60,0.4);padding:10px;border-radius:8px;text-align:center;">
                <div style="color:#557799;font-size:0.7rem;">أقصى قوة G</div>
                <div style="color:#fff;font-size:1rem;margin-top:3px;">${maxGForce}</div>
              </div>
              <div style="background:rgba(0,30,60,0.4);padding:10px;border-radius:8px;text-align:center;">
                <div style="color:#557799;font-size:0.7rem;">حرارة الدرع</div>
                <div style="color:#fff;font-size:1rem;margin-top:3px;">${maxHeat}</div>
              </div>
              <div style="background:rgba(0,30,60,0.4);padding:10px;border-radius:8px;text-align:center;">
                <div style="color:#557799;font-size:0.7rem;">التجارب العلمية</div>
                <div style="color:#fff;font-size:1rem;margin-top:3px;">${experiments} تجارب</div>
              </div>
            </div>
          </div>

          <div style="background:rgba(0,20,40,0.6);border:1px solid rgba(0,212,255,0.2);
            border-radius:12px;padding:20px;margin-bottom:15px;">
            <div style="color:#00d4ff;font-size:0.9rem;font-weight:600;margin-bottom:12px;text-align:center;">
              🎖️ الإنجازات
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
              <div style="background:linear-gradient(135deg,rgba(255,170,0,0.2),rgba(255,136,0,0.1));
                border:1px solid rgba(255,170,0,0.3);padding:8px 14px;border-radius:20px;
                color:#ffcc00;font-size:0.78rem;display:flex;align-items:center;gap:5px;">
                🚀 إطلاق ناجح
              </div>
              <div style="background:linear-gradient(135deg,rgba(255,170,0,0.2),rgba(255,136,0,0.1));
                border:1px solid rgba(255,170,0,0.3);padding:8px 14px;border-radius:20px;
                color:#ffcc00;font-size:0.78rem;display:flex;align-items:center;gap:5px;">
                🔗 التحام دقيق
              </div>
              <div style="background:linear-gradient(135deg,rgba(255,170,0,0.2),rgba(255,136,0,0.1));
                border:1px solid rgba(255,170,0,0.3);padding:8px 14px;border-radius:20px;
                color:#ffcc00;font-size:0.78rem;display:flex;align-items:center;gap:5px;">
                🧑‍🚀 سير فضائي (${evaTime})
              </div>
              <div style="background:linear-gradient(135deg,rgba(255,170,0,0.2),rgba(255,136,0,0.1));
                border:1px solid rgba(255,170,0,0.3);padding:8px 14px;border-radius:20px;
                color:#ffcc00;font-size:0.78rem;display:flex;align-items:center;gap:5px;">
                🔬 عالم فضاء
              </div>
              <div style="background:linear-gradient(135deg,rgba(255,170,0,0.2),rgba(255,136,0,0.1));
                border:1px solid rgba(255,170,0,0.3);padding:8px 14px;border-radius:20px;
                color:#ffcc00;font-size:0.78rem;display:flex;align-items:center;gap:5px;">
                🔥 نجوت من 1600°C
              </div>
              <div style="background:linear-gradient(135deg,rgba(255,170,0,0.2),rgba(255,136,0,0.1));
                border:1px solid rgba(255,170,0,0.3);padding:8px 14px;border-radius:20px;
                color:#ffcc00;font-size:0.78rem;display:flex;align-items:center;gap:5px;">
                🌊 هبوط آمن
              </div>
            </div>
          </div>

          <div style="background:rgba(0,20,40,0.6);border:1px solid rgba(0,212,255,0.2);
            border-radius:12px;padding:20px;margin-bottom:20px;">
            <div style="color:#00d4ff;font-size:0.9rem;font-weight:600;margin-bottom:12px;text-align:center;">
              📋 تقرير ما بعد الهبوط
            </div>
            <div style="color:#cceeff;font-size:0.85rem;line-height:2;">
              <div>🌊 الهبوط: المحيط الهادئ — سفن الإنقاذ وصلت</div>
              <div>🏥 الفحص الطبي: العلامات الحيوية طبيعية</div>
              <div>🚁 النقل: بطائرة هليكوبتر إلى سفينة الإنقاذ</div>
              <div>📸 المؤتمر الصحفي: مركز جونسون الفضائي</div>
              <div>🎖️ التكريم: وسام ناسا للخدمة المتميزة</div>
            </div>
          </div>

          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button class="btn-space btn-space-primary" style="padding:12px 30px;font-size:1rem;" id="btn-new-mission">
              🚀 مهمة جديدة
            </button>
            <button class="btn-space" style="padding:12px 30px;font-size:1rem;" id="btn-free-mode">
              🛸 نمط حر
            </button>
            <button class="btn-space" style="padding:12px 30px;font-size:1rem;" id="btn-main-menu">
              🏠 القائمة الرئيسية
            </button>
          </div>
        </div>
      </div>
      <style>
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-30px); } to { opacity:1; transform:translateY(0); } }
      </style>
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
      @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
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
