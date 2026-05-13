export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requirement: number;
  type: string;
  unlocked: boolean;
}

export const achievements: Achievement[] = [
  {
    "id": "first_translation",
    "name": "المترجم المبتدئ",
    "description": "أكمل أول ترجمة",
    "emoji": "🎯",
    "requirement": 1,
    "type": "translations",
    "unlocked": false
  },
  {
    "id": "translator_10",
    "name": "المترجم النشط",
    "description": "أكمل 10 ترجمات",
    "emoji": "📝",
    "requirement": 10,
    "type": "translations",
    "unlocked": false
  },
  {
    "id": "translator_50",
    "name": "المترجم المحترف",
    "description": "أكمل 50 ترجمة",
    "emoji": "🏆",
    "requirement": 50,
    "type": "translations",
    "unlocked": false
  },
  {
    "id": "translator_100",
    "name": "خبير الترجمة",
    "description": "أكمل 100 ترجمة",
    "emoji": "👑",
    "requirement": 100,
    "type": "translations",
    "unlocked": false
  },
  {
    "id": "translator_500",
    "name": "أسطورة الترجمة",
    "description": "أكمل 500 ترجمة",
    "emoji": "🌟",
    "requirement": 500,
    "type": "translations",
    "unlocked": false
  },
  {
    "id": "words_50",
    "name": "جامع الكلمات",
    "description": "ترجم 50 كلمة مختلفة",
    "emoji": "📚",
    "requirement": 50,
    "type": "words",
    "unlocked": false
  },
  {
    "id": "words_200",
    "name": "عالم اللغة",
    "description": "ترجم 200 كلمة مختلفة",
    "emoji": "🎓",
    "requirement": 200,
    "type": "words",
    "unlocked": false
  },
  {
    "id": "words_500",
    "name": "موسوعة الكلمات",
    "description": "ترجم 500 كلمة مختلفة",
    "emoji": "📖",
    "requirement": 500,
    "type": "words",
    "unlocked": false
  },
  {
    "id": "streak_3",
    "name": "البداية القوية",
    "description": "حافظ على سلسلة 3 أيام",
    "emoji": "🔥",
    "requirement": 3,
    "type": "streak",
    "unlocked": false
  },
  {
    "id": "streak_7",
    "name": "أسبوع كامل",
    "description": "حافظ على سلسلة 7 أيام",
    "emoji": "⚡",
    "requirement": 7,
    "type": "streak",
    "unlocked": false
  },
  {
    "id": "streak_30",
    "name": "شهر من التعلم",
    "description": "حافظ على سلسلة 30 يوم",
    "emoji": "💎",
    "requirement": 30,
    "type": "streak",
    "unlocked": false
  },
  {
    "id": "quiz_first",
    "name": "المختبر الأول",
    "description": "أكمل أول اختبار",
    "emoji": "✅",
    "requirement": 1,
    "type": "quiz",
    "unlocked": false
  },
  {
    "id": "quiz_10",
    "name": "طالب مجتهد",
    "description": "أكمل 10 اختبارات",
    "emoji": "📋",
    "requirement": 10,
    "type": "quiz",
    "unlocked": false
  },
  {
    "id": "quiz_perfect",
    "name": "الإجابة المثالية",
    "description": "احصل على 100% في اختبار",
    "emoji": "💯",
    "requirement": 100,
    "type": "quiz",
    "unlocked": false
  },
  {
    "id": "training_beginner",
    "name": "متدرب مبتدئ",
    "description": "أكمل مستوى المبتدئين",
    "emoji": "🌱",
    "requirement": 100,
    "type": "training",
    "unlocked": false
  },
  {
    "id": "training_intermediate",
    "name": "متدرب متوسط",
    "description": "أكمل المستوى المتوسط",
    "emoji": "🌿",
    "requirement": 250,
    "type": "training",
    "unlocked": false
  },
  {
    "id": "training_advanced",
    "name": "متدرب متقدم",
    "description": "أكمل المستوى المتقدم",
    "emoji": "🌳",
    "requirement": 500,
    "type": "training",
    "unlocked": false
  },
  {
    "id": "favorites_5",
    "name": "المجمع",
    "description": "أضف 5 ترجمات للمفضلة",
    "emoji": "⭐",
    "requirement": 5,
    "type": "favorites",
    "unlocked": false
  },
  {
    "id": "favorites_20",
    "name": "هاوي المفضلات",
    "description": "أضف 20 ترجمة للمفضلة",
    "emoji": "💫",
    "requirement": 20,
    "type": "favorites",
    "unlocked": false
  }
];
