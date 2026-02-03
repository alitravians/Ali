// بيانات المناظرات والمواضيع
export interface DebateTopic {
  id: string;
  titleAr: string;
  titleEn: string;
  categoryAr: string;
  categoryEn: string;
  side1: {
    nameAr: string;
    nameEn: string;
    color: string;
    arguments: { ar: string; en: string }[];
  };
  side2: {
    nameAr: string;
    nameEn: string;
    color: string;
    arguments: { ar: string; en: string }[];
  };
}

export interface Judge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const judges: Judge[] = [
  { id: 'deepseek', name: 'DeepSeek', icon: '🔮', color: '#6366f1' },
  { id: 'chatgpt', name: 'ChatGPT', icon: '🤖', color: '#10b981' },
  { id: 'claude', name: 'Claude', icon: '🧠', color: '#f59e0b' },
  { id: 'gemini', name: 'Gemini', icon: '✨', color: '#3b82f6' },
  { id: 'grok', name: 'Grok', icon: '⚡', color: '#ef4444' },
];

export const debateTopics: DebateTopic[] = [
  {
    id: 'tech-vs-nature',
    titleAr: 'التكنولوجيا أم الطبيعة؟',
    titleEn: 'Technology vs Nature?',
    categoryAr: 'فلسفة',
    categoryEn: 'Philosophy',
    side1: {
      nameAr: 'مؤيد التكنولوجيا',
      nameEn: 'Tech Advocate',
      color: '#3b82f6',
      arguments: [
        { ar: 'التكنولوجيا حسّنت جودة الحياة البشرية بشكل كبير', en: 'Technology has significantly improved human quality of life' },
        { ar: 'الابتكارات الطبية أنقذت ملايين الأرواح', en: 'Medical innovations have saved millions of lives' },
        { ar: 'التواصل العالمي أصبح ممكناً بفضل التكنولوجيا', en: 'Global communication became possible thanks to technology' },
        { ar: 'التكنولوجيا تساعد في حل مشاكل البيئة', en: 'Technology helps solve environmental problems' },
      ],
    },
    side2: {
      nameAr: 'مؤيد الطبيعة',
      nameEn: 'Nature Advocate',
      color: '#22c55e',
      arguments: [
        { ar: 'الطبيعة توفر السلام النفسي والهدوء', en: 'Nature provides mental peace and tranquility' },
        { ar: 'التكنولوجيا تسبب التلوث وتدمير البيئة', en: 'Technology causes pollution and environmental destruction' },
        { ar: 'الإنسان جزء من الطبيعة ويجب أن يعيش معها', en: 'Humans are part of nature and should live with it' },
        { ar: 'الاعتماد على التكنولوجيا يضعف القدرات البشرية', en: 'Dependence on technology weakens human capabilities' },
      ],
    },
  },
  {
    id: 'ai-future',
    titleAr: 'هل الذكاء الاصطناعي نعمة أم نقمة؟',
    titleEn: 'Is AI a Blessing or a Curse?',
    categoryAr: 'تكنولوجيا',
    categoryEn: 'Technology',
    side1: {
      nameAr: 'متفائل بالذكاء الاصطناعي',
      nameEn: 'AI Optimist',
      color: '#8b5cf6',
      arguments: [
        { ar: 'الذكاء الاصطناعي سيحل أكبر مشاكل البشرية', en: 'AI will solve humanity\'s biggest problems' },
        { ar: 'سيوفر وظائف جديدة ويزيد الإنتاجية', en: 'It will create new jobs and increase productivity' },
        { ar: 'سيساعد في اكتشافات علمية مذهلة', en: 'It will help in amazing scientific discoveries' },
        { ar: 'سيجعل التعليم والصحة متاحين للجميع', en: 'It will make education and healthcare accessible to all' },
      ],
    },
    side2: {
      nameAr: 'متشكك بالذكاء الاصطناعي',
      nameEn: 'AI Skeptic',
      color: '#ef4444',
      arguments: [
        { ar: 'الذكاء الاصطناعي قد يهدد وظائف الملايين', en: 'AI may threaten millions of jobs' },
        { ar: 'مخاطر أمنية وخصوصية كبيرة', en: 'Major security and privacy risks' },
        { ar: 'قد يُستخدم في أغراض ضارة', en: 'Could be used for harmful purposes' },
        { ar: 'فقدان السيطرة على الأنظمة الذكية', en: 'Loss of control over intelligent systems' },
      ],
    },
  },
  {
    id: 'remote-work',
    titleAr: 'العمل عن بُعد أم العمل من المكتب؟',
    titleEn: 'Remote Work vs Office Work?',
    categoryAr: 'عمل',
    categoryEn: 'Work',
    side1: {
      nameAr: 'مؤيد العمل عن بُعد',
      nameEn: 'Remote Work Advocate',
      color: '#06b6d4',
      arguments: [
        { ar: 'مرونة أكبر في إدارة الوقت', en: 'Greater flexibility in time management' },
        { ar: 'توفير وقت ومال التنقل', en: 'Saving commute time and money' },
        { ar: 'بيئة عمل مريحة ومخصصة', en: 'Comfortable and personalized work environment' },
        { ar: 'تحسين التوازن بين العمل والحياة', en: 'Better work-life balance' },
      ],
    },
    side2: {
      nameAr: 'مؤيد العمل من المكتب',
      nameEn: 'Office Work Advocate',
      color: '#f97316',
      arguments: [
        { ar: 'التواصل المباشر يحسن التعاون', en: 'Direct communication improves collaboration' },
        { ar: 'فصل واضح بين العمل والمنزل', en: 'Clear separation between work and home' },
        { ar: 'بناء علاقات مهنية أقوى', en: 'Building stronger professional relationships' },
        { ar: 'الوصول لموارد المكتب والدعم الفوري', en: 'Access to office resources and immediate support' },
      ],
    },
  },
  {
    id: 'social-media',
    titleAr: 'وسائل التواصل الاجتماعي: فائدة أم ضرر؟',
    titleEn: 'Social Media: Benefit or Harm?',
    categoryAr: 'مجتمع',
    categoryEn: 'Society',
    side1: {
      nameAr: 'مؤيد وسائل التواصل',
      nameEn: 'Social Media Supporter',
      color: '#ec4899',
      arguments: [
        { ar: 'تربط الناس حول العالم', en: 'Connects people around the world' },
        { ar: 'منصة للتعبير عن الرأي والإبداع', en: 'Platform for expression and creativity' },
        { ar: 'مصدر للأخبار والمعلومات', en: 'Source of news and information' },
        { ar: 'فرص للتسويق والأعمال', en: 'Marketing and business opportunities' },
      ],
    },
    side2: {
      nameAr: 'معارض وسائل التواصل',
      nameEn: 'Social Media Critic',
      color: '#64748b',
      arguments: [
        { ar: 'تسبب الإدمان وإضاعة الوقت', en: 'Causes addiction and time waste' },
        { ar: 'تنشر المعلومات المضللة', en: 'Spreads misinformation' },
        { ar: 'تؤثر سلباً على الصحة النفسية', en: 'Negatively affects mental health' },
        { ar: 'تقلل التواصل الحقيقي بين الناس', en: 'Reduces real communication between people' },
      ],
    },
  },
  {
    id: 'education-system',
    titleAr: 'التعليم التقليدي أم التعليم الإلكتروني؟',
    titleEn: 'Traditional vs Online Education?',
    categoryAr: 'تعليم',
    categoryEn: 'Education',
    side1: {
      nameAr: 'مؤيد التعليم التقليدي',
      nameEn: 'Traditional Education Advocate',
      color: '#84cc16',
      arguments: [
        { ar: 'التفاعل المباشر مع المعلم والطلاب', en: 'Direct interaction with teachers and students' },
        { ar: 'بيئة تعليمية منظمة ومنضبطة', en: 'Organized and disciplined learning environment' },
        { ar: 'تطوير المهارات الاجتماعية', en: 'Development of social skills' },
        { ar: 'موارد ومختبرات متاحة', en: 'Available resources and laboratories' },
      ],
    },
    side2: {
      nameAr: 'مؤيد التعليم الإلكتروني',
      nameEn: 'Online Education Advocate',
      color: '#a855f7',
      arguments: [
        { ar: 'مرونة في الوقت والمكان', en: 'Flexibility in time and place' },
        { ar: 'تكلفة أقل وإمكانية الوصول للجميع', en: 'Lower cost and accessibility for all' },
        { ar: 'محتوى متنوع من أفضل المصادر', en: 'Diverse content from the best sources' },
        { ar: 'التعلم بالسرعة المناسبة لكل فرد', en: 'Learning at each individual\'s pace' },
      ],
    },
  },
];

export const getRandomScore = (): number => {
  return Math.floor(Math.random() * 21) + 70; // 70-90
};

export const calculateAverageScore = (scores: number[]): number => {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
};
