// بنك أسئلة الرياضيات للصف العاشر — منهاج سوريا
// كل سؤال يحوي نوعه ومحتواه وشرح الإجابة

export type SeedQuestion = {
  type: "mcq" | "tf" | "fill" | "match" | "order";
  prompt: string;
  payload: any;
  explanation: string;
  difficulty?: number;
};

export type SeedSection = {
  slug: string;
  title: string;
  description: string;
  questions: SeedQuestion[];
};

export type SeedChapter = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  sections: SeedSection[];
};

// أنواع الأسئلة:
// mcq: { options: string[], answer: number }
// tf:  { answer: boolean }
// fill: { answers: string[] } — الإجابات الصحيحة المقبولة
// match: { left: string[], right: string[], pairs: number[] } — pairs[i] هو فهرس right الموافق لـ left[i]
// order: { items: string[], correct: number[] } — الترتيب الصحيح كـ فهارس

export const questionBank: SeedChapter[] = [
  {
    slug: "algebra",
    title: "الجبر",
    description: "الأعداد الحقيقية، كثيرات الحدود، التحليل، والمتطابقات",
    icon: "🧮",
    color: "#6366f1",
    sections: [
      {
        slug: "real-numbers",
        title: "الأعداد الحقيقية",
        description: "الأعداد النسبية وغير النسبية، القيمة المطلقة، خصائص العمليات",
        questions: [
          {
            type: "mcq",
            prompt: "أيٌّ من الأعداد التالية عددٌ غير نسبي؟",
            payload: { options: ["½", "0.75", "√2", "—3"], answer: 2 },
            explanation: "√2 لا يمكن كتابته على شكل كسر a/b، لذلك هو عددٌ غير نسبي.",
            difficulty: 1,
          },
          {
            type: "tf",
            prompt: "كل عدد صحيح هو عدد نسبي.",
            payload: { answer: true },
            explanation: "أي عدد صحيح n يمكن كتابته n/1، إذن هو نسبي.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "احسبي |—7| + |3|",
            payload: { options: ["10", "—10", "4", "—4"], answer: 0 },
            explanation: "|—7| = 7 و |3| = 3، إذن 7 + 3 = 10.",
            difficulty: 1,
          },
          {
            type: "fill",
            prompt: "إذا كان x² = 16، فإن قيم x هي ____ و ____.",
            payload: { answers: ["4 و -4", "-4 و 4", "4،-4", "-4،4", "4،—4", "±4"] },
            explanation: "x² = 16 ⇒ x = ±4.",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "ما ناتج: (—3) × (—4) × 2 = ؟",
            payload: { options: ["—24", "24", "—14", "14"], answer: 1 },
            explanation: "سالب × سالب = موجب ⇒ 12، ثم ×2 = 24.",
            difficulty: 1,
          },
          {
            type: "tf",
            prompt: "العدد 0 ينتمي إلى مجموعة الأعداد الطبيعية ℕ في الاصطلاح السوري الشائع.",
            payload: { answer: true },
            explanation: "في المنهاج السوري ℕ = {0, 1, 2, 3, …}.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "أيٌّ من العبارات صحيحة عن مجموعة الأعداد الحقيقية ℝ؟",
            payload: {
              options: [
                "ℝ = ℕ ∪ ℤ فقط",
                "ℝ = ℚ ∪ (الأعداد غير النسبية)",
                "ℝ تحوي الأعداد الموجبة فقط",
                "ℝ لا تحوي الأعداد العشرية",
              ],
              answer: 1,
            },
            explanation: "ℝ تتألف من اتحاد الأعداد النسبية والأعداد غير النسبية.",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "إذا كان a = —2 و b = 5، فإن قيمة |a — b| =",
            payload: { options: ["3", "7", "—7", "—3"], answer: 1 },
            explanation: "|—2 — 5| = |—7| = 7.",
            difficulty: 2,
          },
        ],
      },
      {
        slug: "polynomials",
        title: "كثيرات الحدود",
        description: "الجمع والطرح والضرب والتحليل",
        questions: [
          {
            type: "mcq",
            prompt: "ما درجة كثير الحدود: 5x³ — 2x² + 7x — 1؟",
            payload: { options: ["1", "2", "3", "4"], answer: 2 },
            explanation: "الدرجة هي أعلى أس للمتغير x، وهنا x³ فالدرجة 3.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "احسبي: (2x + 3)(x — 4)",
            payload: {
              options: [
                "2x² — 5x — 12",
                "2x² + 5x — 12",
                "2x² — 11x + 12",
                "2x² + 11x + 12",
              ],
              answer: 0,
            },
            explanation: "2x·x + 2x·(—4) + 3·x + 3·(—4) = 2x² — 8x + 3x — 12 = 2x² — 5x — 12.",
            difficulty: 2,
          },
          {
            type: "fill",
            prompt: "حللي إلى عوامل: x² — 9 = ____",
            payload: { answers: ["(x-3)(x+3)", "(x+3)(x-3)", "(x—3)(x+3)", "(x+3)(x—3)"] },
            explanation: "فرق مربعين: a² — b² = (a — b)(a + b).",
            difficulty: 2,
          },
          {
            type: "tf",
            prompt: "العبارة (x + 2)² = x² + 4 صحيحة.",
            payload: { answer: false },
            explanation: "(x + 2)² = x² + 4x + 4 وليست x² + 4. هذا الخطأ شائع جداً!",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "ما ناتج: (x — 5)²؟",
            payload: {
              options: ["x² — 25", "x² + 10x + 25", "x² — 10x + 25", "x² — 10x — 25"],
              answer: 2,
            },
            explanation: "(a — b)² = a² — 2ab + b² ⇒ x² — 10x + 25.",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "حللي: x² + 7x + 12",
            payload: {
              options: ["(x+3)(x+4)", "(x—3)(x—4)", "(x+2)(x+6)", "(x+1)(x+12)"],
              answer: 0,
            },
            explanation: "نحتاج عددين حاصل ضربهما 12 ومجموعهما 7 ⇒ 3 و 4.",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "أبسط صورة لـ: 3x² + 5x — 2x² + x = ",
            payload: { options: ["x² + 6x", "5x² + 6x", "x² + 4x", "x² + 5x + 1"], answer: 0 },
            explanation: "3x² — 2x² = x² ، و 5x + x = 6x.",
            difficulty: 1,
          },
        ],
      },
      {
        slug: "identities",
        title: "المتطابقات الجبرية",
        description: "(a+b)² ، (a—b)² ، فرق المربعين، فرق ومجموع المكعبين",
        questions: [
          {
            type: "mcq",
            prompt: "(a + b)² = ؟",
            payload: {
              options: ["a² + b²", "a² + 2ab + b²", "a² — 2ab + b²", "a² + ab + b²"],
              answer: 1,
            },
            explanation: "متطابقة مربع المجموع.",
            difficulty: 1,
          },
          {
            type: "fill",
            prompt: "a³ — b³ = (a — b)( ____ )",
            payload: { answers: ["a² + ab + b²", "a²+ab+b²"] },
            explanation: "متطابقة فرق المكعبين.",
            difficulty: 3,
          },
          {
            type: "tf",
            prompt: "(a — b)(a + b) = a² — b².",
            payload: { answer: true },
            explanation: "متطابقة فرق المربعين.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "احسبي بسرعة باستخدام المتطابقة: 101² = ؟",
            payload: { options: ["10201", "11201", "10001", "10100"], answer: 0 },
            explanation: "101² = (100+1)² = 10000 + 200 + 1 = 10201.",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "احسبي 99 × 101 بسرعة.",
            payload: { options: ["10001", "9999", "9899", "10099"], answer: 1 },
            explanation: "(100—1)(100+1) = 100² — 1 = 9999.",
            difficulty: 2,
          },
        ],
      },
    ],
  },
  {
    slug: "equations",
    title: "المعادلات",
    description: "المعادلات الخطية، التربيعية، وأنظمة المعادلات",
    icon: "⚖️",
    color: "#0ea5e9",
    sections: [
      {
        slug: "linear-equations",
        title: "المعادلات الخطية",
        description: "حل المعادلات من الدرجة الأولى بمجهول واحد",
        questions: [
          {
            type: "mcq",
            prompt: "حلّي المعادلة: 2x + 5 = 13",
            payload: { options: ["x = 3", "x = 4", "x = 5", "x = 9"], answer: 1 },
            explanation: "2x = 13 — 5 = 8 ⇒ x = 4.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "حلّي: 3(x — 2) = 9",
            payload: { options: ["x = 1", "x = 3", "x = 5", "x = 7"], answer: 2 },
            explanation: "x — 2 = 3 ⇒ x = 5.",
            difficulty: 1,
          },
          {
            type: "fill",
            prompt: "حلّي: 5x — 4 = 2x + 11. الإجابة x = ____",
            payload: { answers: ["5", "5.0"] },
            explanation: "3x = 15 ⇒ x = 5.",
            difficulty: 2,
          },
          {
            type: "tf",
            prompt: "المعادلة 2x + 3 = 2x + 7 ليس لها حل.",
            payload: { answer: true },
            explanation: "إذا حذفنا 2x من الطرفين نحصل على 3 = 7 وهو خطأ، فلا يوجد حل.",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "حلّي: (x/3) + 2 = 5",
            payload: { options: ["x = 6", "x = 9", "x = 12", "x = 15"], answer: 1 },
            explanation: "x/3 = 3 ⇒ x = 9.",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "إذا كان مجموع عدد وضعفه يساوي 21، فالعدد هو:",
            payload: { options: ["5", "6", "7", "8"], answer: 2 },
            explanation: "x + 2x = 21 ⇒ 3x = 21 ⇒ x = 7.",
            difficulty: 2,
          },
        ],
      },
      {
        slug: "quadratic-equations",
        title: "المعادلات التربيعية",
        description: "حل المعادلات من الدرجة الثانية بالتحليل والقانون العام",
        questions: [
          {
            type: "mcq",
            prompt: "حلّي: x² — 9 = 0",
            payload: {
              options: ["x = 3 فقط", "x = ±3", "x = ±9", "x = 0 أو 9"],
              answer: 1,
            },
            explanation: "x² = 9 ⇒ x = ±3.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "حلّي بالتحليل: x² — 5x + 6 = 0",
            payload: {
              options: ["x = 2, 3", "x = 1, 6", "x = —2, —3", "x = —1, —6"],
              answer: 0,
            },
            explanation: "(x — 2)(x — 3) = 0 ⇒ x = 2 أو x = 3.",
            difficulty: 2,
          },
          {
            type: "fill",
            prompt: "المميز Δ للمعادلة ax² + bx + c = 0 هو: ____",
            payload: { answers: ["b²-4ac", "b² - 4ac", "b² — 4ac", "b²—4ac"] },
            explanation: "Δ = b² — 4ac يحدد طبيعة الجذور.",
            difficulty: 2,
          },
          {
            type: "tf",
            prompt: "إذا كان Δ < 0 فالمعادلة التربيعية ليس لها حل حقيقي.",
            payload: { answer: true },
            explanation: "عندما Δ < 0 لا توجد جذور حقيقية.",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "ما عدد جذور المعادلة x² + 4x + 4 = 0؟",
            payload: { options: ["لا جذور", "جذر واحد مكرر", "جذران مختلفان", "ثلاثة جذور"], answer: 1 },
            explanation: "(x+2)² = 0 ⇒ x = —2 (مكرر)، أي Δ = 0 فالجذر مكرر.",
            difficulty: 3,
          },
          {
            type: "mcq",
            prompt: "ما مجموع جذري المعادلة 2x² — 6x + 4 = 0؟ (استخدمي قانون فييت)",
            payload: { options: ["—3", "3", "2", "—2"], answer: 1 },
            explanation: "مجموع الجذور = —b/a = 6/2 = 3.",
            difficulty: 3,
          },
        ],
      },
      {
        slug: "systems",
        title: "أنظمة المعادلات",
        description: "حل النظم بطريقة الحذف والتعويض",
        questions: [
          {
            type: "mcq",
            prompt: "حلّي النظام: x + y = 7 ، x — y = 3",
            payload: {
              options: ["x = 5, y = 2", "x = 4, y = 3", "x = 6, y = 1", "x = 3, y = 4"],
              answer: 0,
            },
            explanation: "بالجمع: 2x = 10 ⇒ x = 5، ثم y = 7 — 5 = 2.",
            difficulty: 2,
          },
          {
            type: "fill",
            prompt: "إذا كانت 2x + y = 10 و x = 3، فإن y = ____",
            payload: { answers: ["4", "4.0"] },
            explanation: "2(3) + y = 10 ⇒ y = 4.",
            difficulty: 1,
          },
          {
            type: "tf",
            prompt: "النظام x + y = 1 ، 2x + 2y = 5 ليس له حل.",
            payload: { answer: true },
            explanation: "المعادلتان متوازيتان (نفس الميل، تقاطعات مختلفة).",
            difficulty: 3,
          },
        ],
      },
    ],
  },
  {
    slug: "geometry",
    title: "الهندسة",
    description: "المثلثات، الدوائر، التشابه، ونظرية فيثاغورس",
    icon: "📐",
    color: "#0891b2",
    sections: [
      {
        slug: "triangles",
        title: "المثلثات",
        description: "أنواع المثلثات، نظرية فيثاغورس، والمساحة",
        questions: [
          {
            type: "mcq",
            prompt: "في مثلث قائم الزاوية، طولا الضلعين القائمين 3 و 4. ما طول الوتر؟",
            payload: { options: ["5", "6", "7", "12"], answer: 0 },
            explanation: "√(3² + 4²) = √25 = 5 — نظرية فيثاغورس.",
            difficulty: 1,
          },
          {
            type: "tf",
            prompt: "مجموع زوايا المثلث يساوي دائماً 180°.",
            payload: { answer: true },
            explanation: "حقيقة هندسية أساسية.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "مساحة مثلث ارتفاعه 8 سم وقاعدته 5 سم تساوي:",
            payload: { options: ["13 سم²", "40 سم²", "20 سم²", "10 سم²"], answer: 2 },
            explanation: "(½) × 5 × 8 = 20 سم².",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "في مثلث متساوي الساقين، إذا كانت زاوية الرأس 40°، فما قياس كل من زاويتي القاعدة؟",
            payload: { options: ["40°", "60°", "70°", "80°"], answer: 2 },
            explanation: "زاويتا القاعدة متساويتان: (180 — 40)/2 = 70°.",
            difficulty: 2,
          },
          {
            type: "fill",
            prompt: "إذا كان طولا ضلعي القائمة 6 و 8، فإن الوتر = ____",
            payload: { answers: ["10", "10.0"] },
            explanation: "√(36 + 64) = √100 = 10.",
            difficulty: 1,
          },
          {
            type: "tf",
            prompt: "كل مثلث متساوي الأضلاع هو متساوي الساقين أيضاً.",
            payload: { answer: true },
            explanation: "تساوي جميع الأضلاع يضمن تساوي ضلعين منها.",
            difficulty: 2,
          },
        ],
      },
      {
        slug: "circles",
        title: "الدوائر",
        description: "المحيط، المساحة، الأقواس والأوتار",
        questions: [
          {
            type: "mcq",
            prompt: "محيط دائرة نصف قطرها 7 سم (π ≈ 22/7):",
            payload: { options: ["22 سم", "44 سم", "49 سم", "154 سم"], answer: 1 },
            explanation: "محيط = 2πr = 2 × (22/7) × 7 = 44 سم.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "مساحة دائرة قطرها 10 سم (π ≈ 3.14):",
            payload: { options: ["31.4 سم²", "78.5 سم²", "157 سم²", "314 سم²"], answer: 1 },
            explanation: "r = 5، المساحة = π × 25 = 78.5 سم².",
            difficulty: 2,
          },
          {
            type: "tf",
            prompt: "القطر يساوي ضعف نصف القطر.",
            payload: { answer: true },
            explanation: "تعريف هندسي أساسي: d = 2r.",
            difficulty: 1,
          },
        ],
      },
      {
        slug: "similarity",
        title: "التشابه والتطابق",
        description: "تشابه المثلثات والنسب",
        questions: [
          {
            type: "mcq",
            prompt: "مثلثان متشابهان ونسبة التشابه 2:3. إذا كان طول أحد أضلاع المثلث الأول 6، فطول الضلع الموافق في الثاني:",
            payload: { options: ["4", "8", "9", "12"], answer: 2 },
            explanation: "6/2 × 3 = 9.",
            difficulty: 2,
          },
          {
            type: "tf",
            prompt: "إذا تطابق مثلثان فإنهما متشابهان بالضرورة.",
            payload: { answer: true },
            explanation: "التطابق حالة خاصة من التشابه (النسبة 1:1).",
            difficulty: 1,
          },
        ],
      },
    ],
  },
  {
    slug: "fractions",
    title: "الكسور والنسب",
    description: "العمليات على الكسور، النسب المئوية، التناسب",
    icon: "➗",
    color: "#8b5cf6",
    sections: [
      {
        slug: "fraction-ops",
        title: "العمليات على الكسور",
        description: "جمع وطرح وضرب وقسمة الكسور",
        questions: [
          {
            type: "mcq",
            prompt: "احسبي: ½ + ⅓ = ؟",
            payload: { options: ["⅖", "⅚", "⅙", "1"], answer: 1 },
            explanation: "نوحّد المقام: 3/6 + 2/6 = 5/6.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "احسبي: ¾ × ⅔ = ؟",
            payload: { options: ["½", "¼", "⅗", "5/12"], answer: 0 },
            explanation: "(3×2)/(4×3) = 6/12 = ½.",
            difficulty: 1,
          },
          {
            type: "fill",
            prompt: "أبسطي إلى أبسط صورة: 12/18 = ____",
            payload: { answers: ["2/3", "⅔"] },
            explanation: "نقسم البسط والمقام على 6.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "احسبي: ½ ÷ ¼ = ؟",
            payload: { options: ["⅛", "2", "¼", "½"], answer: 1 },
            explanation: "½ × 4 = 2 — نضرب بمقلوب الثاني.",
            difficulty: 2,
          },
          {
            type: "tf",
            prompt: "لجمع كسرين يجب توحيد المقامين.",
            payload: { answer: true },
            explanation: "لا يمكن جمع البسطين دون توحيد المقامات.",
            difficulty: 1,
          },
        ],
      },
      {
        slug: "percentages",
        title: "النسب المئوية",
        description: "النسبة المئوية، الزيادة، النقصان، والربح",
        questions: [
          {
            type: "mcq",
            prompt: "25% من 80 يساوي:",
            payload: { options: ["10", "15", "20", "25"], answer: 2 },
            explanation: "25% = ¼، و ¼ × 80 = 20.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "ارتفع سعر كتاب من 200 ل.س إلى 250 ل.س. ما نسبة الزيادة؟",
            payload: { options: ["20%", "25%", "30%", "50%"], answer: 1 },
            explanation: "الزيادة = 50، النسبة = 50/200 = 25%.",
            difficulty: 2,
          },
          {
            type: "fill",
            prompt: "إذا كانت 30% من عدد ما = 60، فالعدد هو ____",
            payload: { answers: ["200", "200.0"] },
            explanation: "العدد = 60 ÷ 0.30 = 200.",
            difficulty: 2,
          },
        ],
      },
    ],
  },
  {
    slug: "statistics",
    title: "الإحصاء",
    description: "المتوسط الحسابي، الوسيط، المنوال، التشتت",
    icon: "📊",
    color: "#10b981",
    sections: [
      {
        slug: "central-tendency",
        title: "مقاييس النزعة المركزية",
        description: "المتوسط الحسابي، الوسيط، المنوال",
        questions: [
          {
            type: "mcq",
            prompt: "ما المتوسط الحسابي للأعداد: 4، 6، 8، 10، 12؟",
            payload: { options: ["6", "7", "8", "9"], answer: 2 },
            explanation: "(4+6+8+10+12) / 5 = 40/5 = 8.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "ما وسيط البيانات: 3، 5، 7، 9، 11؟",
            payload: { options: ["3", "5", "7", "9"], answer: 2 },
            explanation: "بعد ترتيبها (وهي مرتّبة)، الوسيط هو العنصر الأوسط = 7.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "ما منوال البيانات: 2، 3، 3، 5، 7، 3، 9؟",
            payload: { options: ["2", "3", "5", "7"], answer: 1 },
            explanation: "المنوال هو القيمة الأكثر تكراراً = 3 (تكرر 3 مرات).",
            difficulty: 1,
          },
          {
            type: "tf",
            prompt: "الوسيط هو دائماً عنصر من البيانات.",
            payload: { answer: false },
            explanation: "إذا كان عدد البيانات زوجياً، الوسيط = متوسط القيمتين الوسطيتين، وقد لا يكون من البيانات.",
            difficulty: 2,
          },
          {
            type: "fill",
            prompt: "وسيط البيانات: 2، 4، 6، 8 هو ____",
            payload: { answers: ["5", "5.0"] },
            explanation: "العدد زوجي، فالوسيط = (4+6)/2 = 5.",
            difficulty: 2,
          },
        ],
      },
    ],
  },
  {
    slug: "probability",
    title: "الاحتمالات",
    description: "حساب الاحتمالات، الحوادث المستقلة والمتنافية",
    icon: "🎲",
    color: "#f59e0b",
    sections: [
      {
        slug: "basic-probability",
        title: "أساسيات الاحتمال",
        description: "تعريف الاحتمال وقوانينه الأساسية",
        questions: [
          {
            type: "mcq",
            prompt: "عند رمي حجر نرد، ما احتمال ظهور العدد 4؟",
            payload: { options: ["1/2", "1/3", "1/4", "1/6"], answer: 3 },
            explanation: "كل وجه احتماله 1/6.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "كيس فيه 3 كرات حمراء و 2 زرقاء. ما احتمال سحب كرة حمراء؟",
            payload: { options: ["2/5", "1/2", "3/5", "1/3"], answer: 2 },
            explanation: "3 حالات ملائمة من 5 ⇒ 3/5.",
            difficulty: 1,
          },
          {
            type: "tf",
            prompt: "احتمال الحادثة المؤكدة يساوي 1.",
            payload: { answer: true },
            explanation: "P(الحادثة المؤكدة) = 1، و P(المستحيلة) = 0.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "عند رمي قطعة نقدية مرتين، ما احتمال ظهور صورتين؟",
            payload: { options: ["1/4", "1/2", "1/3", "3/4"], answer: 0 },
            explanation: "P(صورة) × P(صورة) = ½ × ½ = ¼.",
            difficulty: 2,
          },
          {
            type: "mcq",
            prompt: "ما احتمال ظهور عدد زوجي عند رمي حجر نرد؟",
            payload: { options: ["1/2", "1/3", "2/3", "1/6"], answer: 0 },
            explanation: "الأعداد الزوجية: 2، 4، 6 ⇒ 3/6 = 1/2.",
            difficulty: 1,
          },
        ],
      },
    ],
  },
  {
    slug: "functions",
    title: "الاقترانات",
    description: "تعريف الاقتران، المجال والمدى، التمثيل البياني",
    icon: "📈",
    color: "#ec4899",
    sections: [
      {
        slug: "intro-functions",
        title: "مقدمة في الاقترانات",
        description: "تعريف الاقتران، المجال، المستقر",
        questions: [
          {
            type: "mcq",
            prompt: "إذا كان f(x) = 2x + 3، فإن f(4) =",
            payload: { options: ["7", "8", "11", "14"], answer: 2 },
            explanation: "f(4) = 2(4) + 3 = 11.",
            difficulty: 1,
          },
          {
            type: "mcq",
            prompt: "إذا كان g(x) = x² — 1، فإن g(—2) =",
            payload: { options: ["3", "—3", "5", "—5"], answer: 0 },
            explanation: "g(—2) = (—2)² — 1 = 4 — 1 = 3.",
            difficulty: 1,
          },
          {
            type: "tf",
            prompt: "كل علاقة هي اقتران.",
            payload: { answer: false },
            explanation: "الاقتران علاقة خاصة: كل قيمة من المجال تقابل قيمة وحيدة في المستقر.",
            difficulty: 2,
          },
          {
            type: "fill",
            prompt: "إذا كان f(x) = 3x — 1 ، فإن f(2) = ____",
            payload: { answers: ["5", "5.0"] },
            explanation: "f(2) = 3×2 — 1 = 5.",
            difficulty: 1,
          },
        ],
      },
    ],
  },
];

export type { SeedChapter as Chapter, SeedSection as Section, SeedQuestion as Question };
