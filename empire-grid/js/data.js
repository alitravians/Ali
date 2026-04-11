/* =============================================
   Empire Grid - بيانات اللعبة
   ============================================= */

// ============ الشخصيات ============
const CHARACTERS = [
    {
        id: 'bold_investor',
        name: 'المستثمر الجريء',
        avatar: '🦁',
        description: 'يغامر بجرأة في الاستثمارات عالية المخاطر ويحصد أرباحًا مضاعفة',
        ability: 'عائد مضاعف من المناطق الخطرة',
        weakness: 'يدفع ضرائب أعلى بـ 20%',
        color: '#ff3366',
        bonuses: { riskyReturn: 2.0, taxMultiplier: 1.2, startMoney: 0 }
    },
    {
        id: 'developer',
        name: 'المطور العقاري',
        avatar: '🏗️',
        description: 'خبير في تطوير الأصول بتكلفة أقل وسرعة أكبر',
        ability: 'تكلفة التطوير أقل بـ 30%',
        weakness: 'عائد أقل بـ 15% قبل التطوير',
        color: '#4ade80',
        bonuses: { upgradeCostReduction: 0.3, baseIncomeReduction: 0.15, startMoney: 0 }
    },
    {
        id: 'fast_business',
        name: 'رجل الأعمال السريع',
        avatar: '⚡',
        description: 'يتحرك بسرعة ويحصل على فرص إضافية في كل جولة',
        ability: 'يحصل على إجراء إضافي كل جولة',
        weakness: 'يبدأ بمال أقل بـ 15%',
        color: '#60a5fa',
        bonuses: { extraAction: true, startMoney: -0.15 }
    },
    {
        id: 'negotiator',
        name: 'المفاوض المحترف',
        avatar: '🤝',
        description: 'يحصل على أفضل الصفقات ويربح من كل تفاوض',
        ability: 'خصم 20% على الشراء + مكافأة تفاوض',
        weakness: 'نفوذ أبطأ بـ 20%',
        color: '#fbbf24',
        bonuses: { buyDiscount: 0.2, influenceGainReduction: 0.2, startMoney: 0 }
    },
    {
        id: 'market_expert',
        name: 'خبير الأسواق',
        avatar: '📊',
        description: 'يتنبأ بتغيرات السوق ويستفيد منها قبل الجميع',
        ability: 'يرى الحدث القادم مسبقًا',
        weakness: 'لا يمكنه شراء مناطق VIP',
        color: '#a78bfa',
        bonuses: { seeNextEvent: true, canBuyVIP: false, startMoney: 0 }
    },
    {
        id: 'financier',
        name: 'الممول الكبير',
        avatar: '💰',
        description: 'يبدأ برأس مال أكبر ويحصل على دخل إضافي كل جولة',
        ability: 'يبدأ بـ 30% مال إضافي + دخل ثابت',
        weakness: 'تكلفة التطوير أعلى بـ 20%',
        color: '#fb923c',
        bonuses: { startMoney: 0.3, passiveIncome: 200, upgradeCostIncrease: 0.2 }
    }
];

// ============ أنواع المناطق ============
const ZONE_TYPES = {
    residential: { name: 'سكني', icon: '🏠', color: '#4ade80' },
    commercial: { name: 'تجاري', icon: '🏪', color: '#60a5fa' },
    entertainment: { name: 'ترفيهي', icon: '🎭', color: '#f472b6' },
    tech: { name: 'تقني', icon: '💻', color: '#a78bfa' },
    logistics: { name: 'لوجستي', icon: '🚢', color: '#fb923c' },
    investment: { name: 'استثماري', icon: '📈', color: '#fbbf24' },
    vip: { name: 'VIP', icon: '👑', color: '#ffd700' },
    risky: { name: 'عالي المخاطر', icon: '⚠️', color: '#ef4444' },
    event: { name: 'حدث', icon: '🎲', color: '#00f0ff' },
    start: { name: 'نقطة البداية', icon: '🚀', color: '#ffd700' }
};

// ============ خريطة المدينة ============
const CITY_MAP = [
    // صف 1
    { id: 0, name: 'نقطة الانطلاق', type: 'start', price: 0, baseIncome: 0, icon: '🚀' },
    { id: 1, name: 'حي النور السكني', type: 'residential', price: 800, baseIncome: 80, icon: '🏠' },
    { id: 2, name: 'مركز البيانات', type: 'tech', price: 1500, baseIncome: 180, icon: '🖥️' },
    { id: 3, name: 'بطاقة حظ', type: 'event', price: 0, baseIncome: 0, icon: '🎲' },
    { id: 4, name: 'البرج التجاري', type: 'commercial', price: 1200, baseIncome: 140, icon: '🏢' },
    // صف 2
    { id: 5, name: 'ميناء الشحن', type: 'logistics', price: 1800, baseIncome: 200, icon: '🚢' },
    { id: 6, name: 'مجمع الترفيه', type: 'entertainment', price: 1000, baseIncome: 120, icon: '🎪' },
    { id: 7, name: 'شارع الأعمال', type: 'commercial', price: 1400, baseIncome: 160, icon: '🏬' },
    { id: 8, name: 'وادي التقنية', type: 'tech', price: 2000, baseIncome: 250, icon: '💻' },
    { id: 9, name: 'حدث السوق', type: 'event', price: 0, baseIncome: 0, icon: '📰' },
    // صف 3
    { id: 10, name: 'حي الأمل', type: 'residential', price: 600, baseIncome: 60, icon: '🏘️' },
    { id: 11, name: 'صندوق الاستثمار', type: 'investment', price: 2200, baseIncome: 280, icon: '📊' },
    { id: 12, name: 'الساحة المركزية', type: 'event', price: 0, baseIncome: 0, icon: '⭐' },
    { id: 13, name: 'مصنع المستقبل', type: 'logistics', price: 1600, baseIncome: 190, icon: '🏭' },
    { id: 14, name: 'منطقة المغامرة', type: 'risky', price: 1000, baseIncome: 300, icon: '🎰' },
    // صف 4
    { id: 15, name: 'بطاقة حظ', type: 'event', price: 0, baseIncome: 0, icon: '🃏' },
    { id: 16, name: 'المنتجع السياحي', type: 'entertainment', price: 1800, baseIncome: 220, icon: '🏖️' },
    { id: 17, name: 'شركة ناشئة', type: 'tech', price: 900, baseIncome: 100, icon: '🚀' },
    { id: 18, name: 'البنك المركزي', type: 'investment', price: 2500, baseIncome: 320, icon: '🏦' },
    { id: 19, name: 'حي الزهور', type: 'residential', price: 1000, baseIncome: 110, icon: '🌸' },
    // صف 5
    { id: 20, name: 'كازينو الحظ', type: 'risky', price: 1500, baseIncome: 400, icon: '🎲' },
    { id: 21, name: 'مركز اللوجستيات', type: 'logistics', price: 1400, baseIncome: 170, icon: '📦' },
    { id: 22, name: 'قصر الأعمال VIP', type: 'vip', price: 3500, baseIncome: 450, icon: '👑' },
    { id: 23, name: 'سوق الذهب', type: 'commercial', price: 2000, baseIncome: 260, icon: '🏪' },
    { id: 24, name: 'برج الإمبراطورية', type: 'vip', price: 4000, baseIncome: 500, icon: '🏰' }
];

// ============ مستويات التطوير ============
const UPGRADE_LEVELS = [
    { level: 0, name: 'غير مطور', icon: '⬜', incomeMultiplier: 1.0, description: 'أساسي' },
    { level: 1, name: 'المستوى الأول', icon: '🟩', incomeMultiplier: 1.5, description: 'تطوير أساسي', costMultiplier: 0.5 },
    { level: 2, name: 'المستوى الثاني', icon: '🟦', incomeMultiplier: 2.0, description: 'تطوير متقدم', costMultiplier: 0.8 },
    { level: 3, name: 'المستوى الثالث', icon: '🟪', incomeMultiplier: 3.0, description: 'تطوير فاخر', costMultiplier: 1.2 },
    { level: 4, name: 'معلم مميز', icon: '⭐', incomeMultiplier: 4.5, description: 'Landmark', costMultiplier: 2.0 }
];

// ============ الأحداث ============
const EVENTS = [
    {
        id: 'investment_boom',
        name: 'طفرة استثمارية',
        icon: '📈',
        description: 'السوق يشهد طفرة كبيرة! جميع الأصول الاستثمارية ترتفع قيمتها.',
        effects: [
            { type: 'zone_value', zoneType: 'investment', change: 0.4, label: 'ارتفاع أصول الاستثمار +40%' },
            { type: 'market_index', change: 15, label: 'ارتفاع مؤشر السوق +15' }
        ],
        duration: 2
    },
    {
        id: 'economic_crisis',
        name: 'أزمة اقتصادية',
        icon: '📉',
        description: 'أزمة مالية تضرب السوق! انخفاض شامل في قيمة الأصول.',
        effects: [
            { type: 'all_value', change: -0.2, label: 'انخفاض جميع الأصول -20%' },
            { type: 'market_index', change: -20, label: 'انخفاض مؤشر السوق -20' }
        ],
        duration: 2
    },
    {
        id: 'tourism_season',
        name: 'موسم سياحي',
        icon: '✈️',
        description: 'موسم سياحي مزدهر! المناطق الترفيهية تحقق أرباحًا استثنائية.',
        effects: [
            { type: 'zone_income', zoneType: 'entertainment', change: 0.5, label: 'دخل الترفيه +50%' },
            { type: 'zone_value', zoneType: 'entertainment', change: 0.2, label: 'قيمة الترفيه +20%' }
        ],
        duration: 3
    },
    {
        id: 'tech_revolution',
        name: 'ثورة تقنية',
        icon: '🤖',
        description: 'اختراق تقني كبير! القطاع التقني يشهد نموًا هائلًا.',
        effects: [
            { type: 'zone_value', zoneType: 'tech', change: 0.5, label: 'ارتفاع التقنية +50%' },
            { type: 'zone_income', zoneType: 'tech', change: 0.3, label: 'دخل التقنية +30%' }
        ],
        duration: 2
    },
    {
        id: 'supply_disruption',
        name: 'انقطاع سلاسل الإمداد',
        icon: '🚫',
        description: 'أزمة في سلاسل الإمداد تؤثر على القطاع اللوجستي.',
        effects: [
            { type: 'zone_income', zoneType: 'logistics', change: -0.4, label: 'انخفاض دخل اللوجستي -40%' },
            { type: 'zone_value', zoneType: 'commercial', change: -0.15, label: 'انخفاض التجاري -15%' }
        ],
        duration: 2
    },
    {
        id: 'housing_boom',
        name: 'طفرة عقارية',
        icon: '🏠',
        description: 'الطلب على السكن يرتفع بشكل كبير!',
        effects: [
            { type: 'zone_value', zoneType: 'residential', change: 0.35, label: 'ارتفاع السكني +35%' },
            { type: 'zone_income', zoneType: 'residential', change: 0.25, label: 'دخل السكني +25%' }
        ],
        duration: 3
    },
    {
        id: 'tax_reform',
        name: 'إصلاح ضريبي',
        icon: '📜',
        description: 'الحكومة تفرض ضرائب جديدة على الأصول الكبيرة.',
        effects: [
            { type: 'tax_all', amount: 0.1, label: 'ضريبة 10% على جميع اللاعبين' }
        ],
        duration: 1
    },
    {
        id: 'gold_rush',
        name: 'حمى الذهب',
        icon: '💰',
        description: 'اكتشاف موارد جديدة! المناطق عالية المخاطر تحقق أرباحًا خيالية.',
        effects: [
            { type: 'zone_income', zoneType: 'risky', change: 1.0, label: 'دخل المخاطر +100%' },
            { type: 'market_index', change: 10, label: 'ارتفاع مؤشر السوق +10' }
        ],
        duration: 2
    },
    {
        id: 'city_upgrade',
        name: 'تحديثات عمرانية',
        icon: '🏗️',
        description: 'المدينة تطلق مشاريع تطوير! تكلفة التطوير أقل لجولتين.',
        effects: [
            { type: 'upgrade_discount', change: 0.3, label: 'خصم تطوير 30%' }
        ],
        duration: 2
    },
    {
        id: 'vip_gala',
        name: 'حفل كبار المستثمرين',
        icon: '🎩',
        description: 'حفل حصري للنخبة! مناطق VIP تحقق عوائد مضاعفة.',
        effects: [
            { type: 'zone_income', zoneType: 'vip', change: 1.0, label: 'دخل VIP +100%' }
        ],
        duration: 1
    },
    {
        id: 'market_correction',
        name: 'تصحيح السوق',
        icon: '⚖️',
        description: 'السوق يعود إلى التوازن. جميع الأصول تعود لقيمتها الأصلية.',
        effects: [
            { type: 'reset_values', label: 'إعادة تعيين قيم الأصول' },
            { type: 'market_index', change: 0, label: 'إعادة تعيين مؤشر السوق' }
        ],
        duration: 1
    },
    {
        id: 'rare_auction',
        name: 'مزاد نادر',
        icon: '🏛️',
        description: 'مزاد حصري على أصل نادر! فرصة لا تتكرر.',
        effects: [
            { type: 'trigger_auction', label: 'بدء مزاد خاص' }
        ],
        duration: 1
    }
];

// ============ البطاقات ============
const CARDS = [
    {
        id: 'market_crash',
        name: 'انهيار السوق',
        icon: '💥',
        description: 'أنزل قيمة جميع أصول خصم واحد بنسبة 30%',
        type: 'attack',
        effect: (game, player, target) => {
            if (target) {
                const props = game.getPlayerProperties(target.id);
                props.forEach(p => { p.currentValue *= 0.7; });
                return `انخفضت أصول ${target.name} بنسبة 30%!`;
            }
        }
    },
    {
        id: 'fast_expansion',
        name: 'توسع سريع',
        icon: '🚀',
        description: 'اشترِ أي أصل متاح بخصم 40%',
        type: 'buff',
        effect: (game, player) => {
            player.nextBuyDiscount = 0.4;
            return 'ستحصل على خصم 40% على عملية الشراء القادمة!';
        }
    },
    {
        id: 'secret_deal',
        name: 'صفقة سرية',
        icon: '🕵️',
        description: 'احصل على أصل عشوائي غير مملوك مجانًا',
        type: 'buff',
        effect: (game, player) => {
            const available = game.map.filter(z => !z.owner && z.price > 0);
            if (available.length > 0) {
                const prop = available[Math.floor(Math.random() * available.length)];
                prop.owner = player.id;
                return `حصلت على "${prop.name}" مجانًا!`;
            }
            return 'لا توجد أصول متاحة!';
        }
    },
    {
        id: 'tax_shield',
        name: 'درع ضريبي',
        icon: '🛡️',
        description: 'لا تدفع أي ضرائب أو إيجارات لجولتين',
        type: 'defense',
        effect: (game, player) => {
            player.taxShield = 2;
            return 'أنت محمي من الضرائب والإيجارات لجولتين!';
        }
    },
    {
        id: 'city_bonus',
        name: 'مكافأة المدينة',
        icon: '🏙️',
        description: 'احصل على 1500 عملة فورًا',
        type: 'buff',
        effect: (game, player) => {
            player.money += 1500;
            return 'حصلت على 1,500 عملة!';
        }
    },
    {
        id: 'investment_surge',
        name: 'طفرة استثمارية',
        icon: '📈',
        description: 'ضاعف دخل جميع أصولك لجولة واحدة',
        type: 'buff',
        effect: (game, player) => {
            player.doubleIncome = 1;
            return 'دخلك مضاعف في الجولة القادمة!';
        }
    },
    {
        id: 'emergency_loan',
        name: 'قرض طوارئ',
        icon: '🏦',
        description: 'احصل على قرض بقيمة 2000 عملة (تدفع 2500 بعد 3 جولات)',
        type: 'buff',
        effect: (game, player) => {
            player.money += 2000;
            player.loans.push({ amount: 2500, dueIn: 3 });
            return 'حصلت على قرض 2,000 عملة! يستحق السداد بعد 3 جولات.';
        }
    },
    {
        id: 'influence_boost',
        name: 'تعزيز النفوذ',
        icon: '⚡',
        description: 'احصل على 30 نقطة نفوذ فورًا',
        type: 'buff',
        effect: (game, player) => {
            player.influence += 30;
            return 'حصلت على 30 نقطة نفوذ!';
        }
    },
    {
        id: 'hostile_takeover',
        name: 'استحواذ عدائي',
        icon: '🦈',
        description: 'اشترِ أصل خصم بـ 150% من قيمته الحالية',
        type: 'attack',
        effect: (game, player) => {
            player.hostileTakeover = true;
            return 'يمكنك الآن الاستحواذ على أصل خصم!';
        }
    },
    {
        id: 'lucky_break',
        name: 'ضربة حظ',
        icon: '🍀',
        description: 'ارمِ النرد مرة إضافية وتحرك مجانًا',
        type: 'buff',
        effect: (game, player) => {
            player.extraRoll = true;
            return 'يمكنك رمي النرد مرة إضافية!';
        }
    }
];

// ============ المهمات السرية ============
const MISSIONS = [
    {
        id: 'tech_monopoly',
        name: 'احتكار التقنية',
        icon: '💻',
        description: 'امتلك 3 مناطق تقنية',
        target: 3,
        check: (player, game) => game.getPlayerProperties(player.id).filter(p => p.type === 'tech').length,
        reward: { influence: 40, money: 2000 }
    },
    {
        id: 'commercial_king',
        name: 'ملك التجارة',
        icon: '🏪',
        description: 'امتلك 3 مناطق تجارية',
        target: 3,
        check: (player, game) => game.getPlayerProperties(player.id).filter(p => p.type === 'commercial').length,
        reward: { influence: 35, money: 1500 }
    },
    {
        id: 'max_developer',
        name: 'المطور الأعظم',
        icon: '⬆️',
        description: 'طوّر أصلين إلى أعلى مستوى',
        target: 2,
        check: (player, game) => game.getPlayerProperties(player.id).filter(p => p.level >= 4).length,
        reward: { influence: 50, money: 3000 }
    },
    {
        id: 'diversified',
        name: 'التنويع الذكي',
        icon: '🎯',
        description: 'امتلك أصولًا في 4 قطاعات مختلفة',
        target: 4,
        check: (player, game) => {
            const types = new Set(game.getPlayerProperties(player.id).map(p => p.type));
            return types.size;
        },
        reward: { influence: 45, money: 2500 }
    },
    {
        id: 'wealth_builder',
        name: 'باني الثروات',
        icon: '💰',
        description: 'اجمع 10,000 عملة',
        target: 10000,
        check: (player) => player.money,
        reward: { influence: 30, money: 0 }
    },
    {
        id: 'influence_master',
        name: 'سيد النفوذ',
        icon: '👑',
        description: 'اوصل نفوذك إلى 100 نقطة',
        target: 100,
        check: (player) => player.influence,
        reward: { money: 5000 }
    },
    {
        id: 'risk_taker',
        name: 'محب المخاطرة',
        icon: '🎰',
        description: 'امتلك منطقتين عاليتي المخاطر',
        target: 2,
        check: (player, game) => game.getPlayerProperties(player.id).filter(p => p.type === 'risky').length,
        reward: { influence: 35, money: 2000 }
    },
    {
        id: 'five_assets',
        name: 'جامع الأصول',
        icon: '🏢',
        description: 'امتلك 5 أصول أو أكثر',
        target: 5,
        check: (player, game) => game.getPlayerProperties(player.id).length,
        reward: { influence: 25, money: 1500 }
    }
];

// ============ ألوان اللاعبين ============
const PLAYER_COLORS = [
    '#00f0ff', '#ff00e5', '#ffd700', '#00ff88', '#ff3366', '#4466ff'
];

// ============ رسائل النرد ============
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// ============ إعدادات اللعبة ============
const GAME_SETTINGS = {
    casual: { rounds: 10, startMoney: 5000, label: 'سريع' },
    standard: { rounds: 15, startMoney: 5000, label: 'تنافسي' },
    extended: { rounds: 20, startMoney: 6000, label: 'ممتد' }
};

// ============ مراحل المباراة ============
const GAME_PHASES = [
    { id: 'expansion', name: 'مرحلة التوسع', icon: '🚀', description: 'اشترِ واستحوذ على الأصول', color: '#00f0ff' },
    { id: 'competition', name: 'مرحلة التنافس', icon: '⚔️', description: 'نافس وطوّر وتاجر', color: '#ffd700' },
    { id: 'control', name: 'مرحلة السيطرة', icon: '👑', description: 'سيطر واحسم المباراة', color: '#ff00e5' }
];

// ============ رسائل شريط الأحداث ============
const TICKER_MESSAGES = [
    { text: 'مرحبًا بكم في إمبراطورية الشبكة!', type: 'neutral' },
    { text: 'الأسواق تشهد حركة نشطة اليوم', type: 'neutral' },
    { text: 'المستثمرون يترقبون الفرص الجديدة', type: 'neutral' },
    { text: 'القطاع التقني يسجل نموًا ملحوظًا', type: 'positive' },
    { text: 'تقلبات في سوق العقارات', type: 'negative' },
    { text: 'فرص استثمارية جديدة في الأفق', type: 'positive' },
    { text: 'حركة تداول مكثفة في القطاع التجاري', type: 'neutral' },
    { text: 'ارتفاع الطلب على المناطق الترفيهية', type: 'positive' },
    { text: 'تحذيرات من تقلبات اقتصادية قادمة', type: 'negative' }
];
