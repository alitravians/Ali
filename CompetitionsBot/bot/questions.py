"""Arabic-first question bank for the trivia engine.

Each question has the structure:
    {
        "id": "unique-string",
        "category": "عام|عربي|تاريخ|جغرافيا|رياضة|تقنية|إسلامي|علوم",
        "difficulty": "سهل|متوسط|صعب",
        "type": "mcq|tf",
        "question": "...",
        "choices": ["A", "B", "C", "D"],   # required for mcq
        "answer_index": 0,                   # required for mcq
        "answer": True/False,                # required for tf
        "explanation": "..."                 # optional
    }
"""
from __future__ import annotations

import random
from typing import Any

# 100+ Arabic questions across multiple categories and difficulties
QUESTIONS: list[dict[str, Any]] = [
    # ===== عام (General) =====
    {"id": "g1", "category": "عام", "difficulty": "سهل", "type": "mcq",
     "question": "ما هي عاصمة المملكة العربية السعودية؟",
     "choices": ["الرياض", "جدة", "مكة", "المدينة"], "answer_index": 0},
    {"id": "g2", "category": "عام", "difficulty": "سهل", "type": "mcq",
     "question": "كم عدد قارات العالم؟",
     "choices": ["5", "6", "7", "8"], "answer_index": 2},
    {"id": "g3", "category": "عام", "difficulty": "سهل", "type": "mcq",
     "question": "ما هو أكبر محيط في العالم؟",
     "choices": ["الأطلسي", "الهادي", "الهندي", "المتجمد"], "answer_index": 1},
    {"id": "g4", "category": "عام", "difficulty": "متوسط", "type": "mcq",
     "question": "في أي عام تأسست منظمة الأمم المتحدة؟",
     "choices": ["1939", "1945", "1950", "1960"], "answer_index": 1},
    {"id": "g5", "category": "عام", "difficulty": "متوسط", "type": "mcq",
     "question": "ما هي اللغة الأكثر تحدثًا في العالم بعدد السكان الناطقين بها أصلًا؟",
     "choices": ["الإنجليزية", "الإسبانية", "الصينية الماندرين", "العربية"], "answer_index": 2},
    {"id": "g6", "category": "عام", "difficulty": "صعب", "type": "mcq",
     "question": "ما هو أصغر بلد في العالم من حيث المساحة؟",
     "choices": ["موناكو", "ناورو", "الفاتيكان", "سان مارينو"], "answer_index": 2},
    {"id": "g7", "category": "عام", "difficulty": "سهل", "type": "tf",
     "question": "النيل أطول نهر في العالم.",
     "answer": True},
    {"id": "g8", "category": "عام", "difficulty": "متوسط", "type": "tf",
     "question": "كندا أكبر دولة في العالم من حيث المساحة.",
     "answer": False, "explanation": "روسيا الأكبر"},

    # ===== عربي (Arabic Language) =====
    {"id": "ar1", "category": "عربي", "difficulty": "سهل", "type": "mcq",
     "question": "كم حرفًا في اللغة العربية؟",
     "choices": ["26", "28", "30", "32"], "answer_index": 1},
    {"id": "ar2", "category": "عربي", "difficulty": "سهل", "type": "mcq",
     "question": "ما هو ضد كلمة \"كريم\"؟",
     "choices": ["جواد", "بخيل", "شجاع", "كسول"], "answer_index": 1},
    {"id": "ar3", "category": "عربي", "difficulty": "متوسط", "type": "mcq",
     "question": "من هو أمير الشعراء؟",
     "choices": ["المتنبي", "أحمد شوقي", "نزار قباني", "حافظ إبراهيم"], "answer_index": 1},
    {"id": "ar4", "category": "عربي", "difficulty": "متوسط", "type": "mcq",
     "question": "كم عدد أبيات المعلقات السبع تقريبًا؟",
     "choices": ["7", "70", "700", "7000"], "answer_index": 2},
    {"id": "ar5", "category": "عربي", "difficulty": "صعب", "type": "mcq",
     "question": "من مؤلف كتاب \"كليلة ودمنة\"؟",
     "choices": ["ابن المقفع", "الجاحظ", "ابن خلدون", "ابن سينا"], "answer_index": 0},
    {"id": "ar6", "category": "عربي", "difficulty": "سهل", "type": "tf",
     "question": "الفعل \"كتب\" فعل ماضٍ.",
     "answer": True},
    {"id": "ar7", "category": "عربي", "difficulty": "متوسط", "type": "mcq",
     "question": "ما هو جمع كلمة \"إنسان\"؟",
     "choices": ["أناس", "أناسين", "إنسانون", "إنسانات"], "answer_index": 0},

    # ===== تاريخ (History) =====
    {"id": "h1", "category": "تاريخ", "difficulty": "سهل", "type": "mcq",
     "question": "متى بدأت الحرب العالمية الأولى؟",
     "choices": ["1912", "1914", "1916", "1918"], "answer_index": 1},
    {"id": "h2", "category": "تاريخ", "difficulty": "سهل", "type": "mcq",
     "question": "متى توحدت المملكة العربية السعودية على يد الملك عبدالعزيز؟",
     "choices": ["1920", "1932", "1945", "1950"], "answer_index": 1},
    {"id": "h3", "category": "تاريخ", "difficulty": "متوسط", "type": "mcq",
     "question": "من فتح الأندلس؟",
     "choices": ["موسى بن نصير", "طارق بن زياد", "صلاح الدين الأيوبي", "عقبة بن نافع"], "answer_index": 1},
    {"id": "h4", "category": "تاريخ", "difficulty": "متوسط", "type": "mcq",
     "question": "في أي عام سقطت بغداد على يد المغول؟",
     "choices": ["1258", "1300", "1453", "1492"], "answer_index": 0},
    {"id": "h5", "category": "تاريخ", "difficulty": "صعب", "type": "mcq",
     "question": "من هو مؤسس الدولة العباسية؟",
     "choices": ["أبو العباس السفاح", "أبو جعفر المنصور", "هارون الرشيد", "المأمون"], "answer_index": 0},
    {"id": "h6", "category": "تاريخ", "difficulty": "متوسط", "type": "tf",
     "question": "اخترع الورق في الصين قبل الميلاد.",
     "answer": False, "explanation": "اختُرع نحو عام 105 ميلادي"},
    {"id": "h7", "category": "تاريخ", "difficulty": "صعب", "type": "mcq",
     "question": "من هو القائد الذي هزم نابليون في معركة واترلو؟",
     "choices": ["نيلسون", "ولينغتون", "بسمارك", "كرومويل"], "answer_index": 1},

    # ===== جغرافيا (Geography) =====
    {"id": "geo1", "category": "جغرافيا", "difficulty": "سهل", "type": "mcq",
     "question": "ما هو أعلى جبل في العالم؟",
     "choices": ["كليمنجارو", "إفرست", "K2", "مكنلي"], "answer_index": 1},
    {"id": "geo2", "category": "جغرافيا", "difficulty": "سهل", "type": "mcq",
     "question": "ما هي أكبر صحراء حارّة في العالم؟",
     "choices": ["الربع الخالي", "كالاهاري", "الكبرى", "ناميب"], "answer_index": 2},
    {"id": "geo3", "category": "جغرافيا", "difficulty": "متوسط", "type": "mcq",
     "question": "كم دولة في القارة الإفريقية؟",
     "choices": ["48", "54", "60", "65"], "answer_index": 1},
    {"id": "geo4", "category": "جغرافيا", "difficulty": "متوسط", "type": "mcq",
     "question": "ما هي عاصمة كندا؟",
     "choices": ["تورونتو", "أوتاوا", "مونتريال", "فانكوفر"], "answer_index": 1},
    {"id": "geo5", "category": "جغرافيا", "difficulty": "صعب", "type": "mcq",
     "question": "أي البلاد التالية ليست لها سواحل؟",
     "choices": ["تشيلي", "بوليفيا", "البرازيل", "الأرجنتين"], "answer_index": 1},
    {"id": "geo6", "category": "جغرافيا", "difficulty": "متوسط", "type": "tf",
     "question": "البحر الميت هو أخفض نقطة على سطح اليابسة.",
     "answer": True},
    {"id": "geo7", "category": "جغرافيا", "difficulty": "سهل", "type": "mcq",
     "question": "ما عاصمة اليابان؟",
     "choices": ["كيوتو", "أوساكا", "طوكيو", "هيروشيما"], "answer_index": 2},

    # ===== رياضة (Sports) =====
    {"id": "s1", "category": "رياضة", "difficulty": "سهل", "type": "mcq",
     "question": "كم لاعبًا في فريق كرة القدم على أرض الملعب؟",
     "choices": ["9", "10", "11", "12"], "answer_index": 2},
    {"id": "s2", "category": "رياضة", "difficulty": "سهل", "type": "mcq",
     "question": "أين أُقيمت كأس العالم 2022؟",
     "choices": ["روسيا", "قطر", "البرازيل", "الإمارات"], "answer_index": 1},
    {"id": "s3", "category": "رياضة", "difficulty": "متوسط", "type": "mcq",
     "question": "كم عدد بطولات كأس العالم التي فازت بها البرازيل؟",
     "choices": ["3", "4", "5", "6"], "answer_index": 2},
    {"id": "s4", "category": "رياضة", "difficulty": "متوسط", "type": "mcq",
     "question": "من فاز بالكرة الذهبية عام 2023؟",
     "choices": ["كريستيانو رونالدو", "ليونيل ميسي", "ارلينج هالاند", "كيليان مبابي"], "answer_index": 1},
    {"id": "s5", "category": "رياضة", "difficulty": "صعب", "type": "mcq",
     "question": "كم نقطة في رمية ثلاثية في كرة السلة؟",
     "choices": ["2", "3", "4", "5"], "answer_index": 1},
    {"id": "s6", "category": "رياضة", "difficulty": "متوسط", "type": "tf",
     "question": "كأس العالم تُقام كل أربع سنوات.",
     "answer": True},
    {"id": "s7", "category": "رياضة", "difficulty": "سهل", "type": "mcq",
     "question": "ما اسم الملعب الأشهر للأهلي السعودي؟",
     "choices": ["الإنماء", "الجوهرة", "الملك فهد", "الأول بارك"], "answer_index": 3},

    # ===== تقنية (Technology) =====
    {"id": "t1", "category": "تقنية", "difficulty": "سهل", "type": "mcq",
     "question": "من مؤسس شركة Microsoft؟",
     "choices": ["ستيف جوبز", "بيل غيتس", "إيلون ماسك", "مارك زوكربيرغ"], "answer_index": 1},
    {"id": "t2", "category": "تقنية", "difficulty": "سهل", "type": "mcq",
     "question": "ماذا يعني اختصار CPU؟",
     "choices": ["Central Processing Unit", "Computer Personal Unit", "Core Programming Unit", "Central Power Unit"], "answer_index": 0},
    {"id": "t3", "category": "تقنية", "difficulty": "متوسط", "type": "mcq",
     "question": "في أي عام تأسست شركة Apple؟",
     "choices": ["1972", "1976", "1980", "1984"], "answer_index": 1},
    {"id": "t4", "category": "تقنية", "difficulty": "متوسط", "type": "mcq",
     "question": "أي لغة برمجة تُستخدم لتطوير تطبيقات iOS بشكل رسمي؟",
     "choices": ["Java", "Kotlin", "Swift", "C#"], "answer_index": 2},
    {"id": "t5", "category": "تقنية", "difficulty": "صعب", "type": "mcq",
     "question": "من اخترع بروتوكول HTTP؟",
     "choices": ["Vint Cerf", "Tim Berners-Lee", "Linus Torvalds", "Dennis Ritchie"], "answer_index": 1},
    {"id": "t6", "category": "تقنية", "difficulty": "سهل", "type": "tf",
     "question": "Python لغة برمجة منخفضة المستوى.",
     "answer": False, "explanation": "Python لغة عالية المستوى"},
    {"id": "t7", "category": "تقنية", "difficulty": "متوسط", "type": "mcq",
     "question": "ما هو نظام التشغيل مفتوح المصدر الذي طوّره لينوس تورفالدز؟",
     "choices": ["Windows", "macOS", "Linux", "Solaris"], "answer_index": 2},

    # ===== إسلامي (Islamic) =====
    {"id": "i1", "category": "إسلامي", "difficulty": "سهل", "type": "mcq",
     "question": "كم عدد أركان الإسلام؟",
     "choices": ["3", "4", "5", "6"], "answer_index": 2},
    {"id": "i2", "category": "إسلامي", "difficulty": "سهل", "type": "mcq",
     "question": "ما اسم أم النبي محمد ﷺ؟",
     "choices": ["خديجة", "عائشة", "آمنة", "فاطمة"], "answer_index": 2},
    {"id": "i3", "category": "إسلامي", "difficulty": "متوسط", "type": "mcq",
     "question": "كم عدد سور القرآن الكريم؟",
     "choices": ["110", "114", "120", "124"], "answer_index": 1},
    {"id": "i4", "category": "إسلامي", "difficulty": "متوسط", "type": "mcq",
     "question": "أين وقعت غزوة بدر؟",
     "choices": ["قرب المدينة", "قرب مكة", "بالشام", "باليمن"], "answer_index": 0},
    {"id": "i5", "category": "إسلامي", "difficulty": "صعب", "type": "mcq",
     "question": "من هو أول من أسلم من الرجال؟",
     "choices": ["عمر بن الخطاب", "أبو بكر الصديق", "علي بن أبي طالب", "زيد بن حارثة"], "answer_index": 1},
    {"id": "i6", "category": "إسلامي", "difficulty": "سهل", "type": "tf",
     "question": "صلاة العصر أربع ركعات.",
     "answer": True},
    {"id": "i7", "category": "إسلامي", "difficulty": "متوسط", "type": "mcq",
     "question": "في أي شهر تُؤدّى فريضة الحج؟",
     "choices": ["رمضان", "ذو الحجة", "محرم", "شعبان"], "answer_index": 1},

    # ===== علوم (Science) =====
    {"id": "sc1", "category": "علوم", "difficulty": "سهل", "type": "mcq",
     "question": "ما هو الكوكب الأقرب للشمس؟",
     "choices": ["الزهرة", "عطارد", "الأرض", "المريخ"], "answer_index": 1},
    {"id": "sc2", "category": "علوم", "difficulty": "سهل", "type": "mcq",
     "question": "الماء يتكوّن من ذرتي هيدروجين وذرة _؟_",
     "choices": ["كربون", "أكسجين", "نيتروجين", "هيليوم"], "answer_index": 1},
    {"id": "sc3", "category": "علوم", "difficulty": "متوسط", "type": "mcq",
     "question": "كم عدد عظام جسم الإنسان البالغ؟",
     "choices": ["186", "206", "246", "286"], "answer_index": 1},
    {"id": "sc4", "category": "علوم", "difficulty": "متوسط", "type": "mcq",
     "question": "ما الجزء الذي يضخّ الدم في الجسم؟",
     "choices": ["الكلية", "الكبد", "القلب", "الرئة"], "answer_index": 2},
    {"id": "sc5", "category": "علوم", "difficulty": "صعب", "type": "mcq",
     "question": "ما هي أصغر وحدة في المادة تحتفظ بخواصها الكيميائية؟",
     "choices": ["الذرة", "الجزيء", "الإلكترون", "البروتون"], "answer_index": 1},
    {"id": "sc6", "category": "علوم", "difficulty": "سهل", "type": "tf",
     "question": "الشمس نجمة.",
     "answer": True},
    {"id": "sc7", "category": "علوم", "difficulty": "متوسط", "type": "mcq",
     "question": "من اكتشف قانون الجاذبية؟",
     "choices": ["أينشتاين", "نيوتن", "غاليليو", "هوكينغ"], "answer_index": 1},

    # ===== أفلام / Pop Culture =====
    {"id": "f1", "category": "أفلام", "difficulty": "سهل", "type": "mcq",
     "question": "من أخرج فيلم Inception؟",
     "choices": ["Steven Spielberg", "Christopher Nolan", "Quentin Tarantino", "James Cameron"], "answer_index": 1},
    {"id": "f2", "category": "أفلام", "difficulty": "متوسط", "type": "mcq",
     "question": "ما الفيلم الذي حصد أعلى إيرادات تاريخيًا (2024)؟",
     "choices": ["Titanic", "Avengers: Endgame", "Avatar", "Avatar: The Way of Water"], "answer_index": 2},
    {"id": "f3", "category": "أفلام", "difficulty": "متوسط", "type": "tf",
     "question": "فيلم Forrest Gump فاز بجائزة الأوسكار لأفضل فيلم.",
     "answer": True},
]


# Runtime-loaded community-approved questions (populated by the submissions cog
# at startup and after each new approval). Same shape as QUESTIONS entries.
EXTRA_QUESTIONS: list[dict[str, Any]] = []


def filter_questions(
    *,
    category: str | None = None,
    difficulty: str | None = None,
    type_: str | None = None,
    count: int = 5,
    exclude_ids: set[str] | None = None,
) -> list[dict[str, Any]]:
    pool = QUESTIONS + EXTRA_QUESTIONS
    if category and category != "كل":
        pool = [q for q in pool if q["category"] == category]
    if difficulty and difficulty != "كل":
        pool = [q for q in pool if q["difficulty"] == difficulty]
    if type_:
        pool = [q for q in pool if q["type"] == type_]
    if exclude_ids:
        pool = [q for q in pool if q["id"] not in exclude_ids]
    if not pool:
        return []
    if count >= len(pool):
        random.shuffle(pool)
        return pool
    return random.sample(pool, count)


def categories() -> list[str]:
    return sorted({q["category"] for q in QUESTIONS})


def total() -> int:
    return len(QUESTIONS) + len(EXTRA_QUESTIONS)
