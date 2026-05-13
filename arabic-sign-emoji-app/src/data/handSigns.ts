export interface HandSign {
  fingers: number[];
  rotation: number;
  description: string;
}

export const handSigns: Record<string, HandSign> = {
  "🙏": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "يدين مضمومتين"
  },
  "👐": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 15,
    "description": "يدين مفتوحتين"
  },
  "🤟": {
    "fingers": [
      1,
      0,
      0,
      0,
      1
    ],
    "rotation": -10,
    "description": "أحبك"
  },
  "👋": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 20,
    "description": "تلويح"
  },
  "👍": {
    "fingers": [
      1,
      0,
      0,
      0,
      0
    ],
    "rotation": 0,
    "description": "إبهام للأعلى"
  },
  "👎": {
    "fingers": [
      1,
      0,
      0,
      0,
      0
    ],
    "rotation": 180,
    "description": "إبهام للأسفل"
  },
  "✋": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "يد مفتوحة"
  },
  "🤚": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "ظهر اليد"
  },
  "🖐️": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "يد مفتوحة بأصابع"
  },
  "✌️": {
    "fingers": [
      0,
      1,
      1,
      0,
      0
    ],
    "rotation": 0,
    "description": "علامة النصر"
  },
  "🤞": {
    "fingers": [
      0,
      1,
      1,
      0,
      0
    ],
    "rotation": 0,
    "description": "أصابع متقاطعة"
  },
  "🤙": {
    "fingers": [
      1,
      0,
      0,
      0,
      1
    ],
    "rotation": -15,
    "description": "اتصل بي"
  },
  "👌": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "موافق"
  },
  "🤏": {
    "fingers": [
      1,
      1,
      0,
      0,
      0
    ],
    "rotation": 0,
    "description": "قليل"
  },
  "👈": {
    "fingers": [
      0,
      1,
      0,
      0,
      0
    ],
    "rotation": -90,
    "description": "إشارة لليسار"
  },
  "👉": {
    "fingers": [
      0,
      1,
      0,
      0,
      0
    ],
    "rotation": 90,
    "description": "إشارة لليمين"
  },
  "👆": {
    "fingers": [
      0,
      1,
      0,
      0,
      0
    ],
    "rotation": 0,
    "description": "إشارة للأعلى"
  },
  "👇": {
    "fingers": [
      0,
      1,
      0,
      0,
      0
    ],
    "rotation": 180,
    "description": "إشارة للأسفل"
  },
  "☝️": {
    "fingers": [
      0,
      1,
      0,
      0,
      0
    ],
    "rotation": 0,
    "description": "إصبع واحد"
  },
  "✊": {
    "fingers": [
      0,
      0,
      0,
      0,
      0
    ],
    "rotation": 0,
    "description": "قبضة"
  },
  "👊": {
    "fingers": [
      0,
      0,
      0,
      0,
      0
    ],
    "rotation": 0,
    "description": "لكمة"
  },
  "🤛": {
    "fingers": [
      0,
      0,
      0,
      0,
      0
    ],
    "rotation": -90,
    "description": "قبضة يسار"
  },
  "🤜": {
    "fingers": [
      0,
      0,
      0,
      0,
      0
    ],
    "rotation": 90,
    "description": "قبضة يمين"
  },
  "👏": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "تصفيق"
  },
  "🙌": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "يدين مرفوعتين"
  },
  "🤲": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "كفين مفتوحين"
  },
  "🤝": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "مصافحة"
  },
  "🫶": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "قلب باليدين"
  },
  "❤️": {
    "fingers": [
      1,
      1,
      1,
      1,
      1
    ],
    "rotation": 0,
    "description": "حب"
  },
  "💪": {
    "fingers": [
      0,
      0,
      0,
      0,
      0
    ],
    "rotation": 45,
    "description": "عضلة"
  }
};
