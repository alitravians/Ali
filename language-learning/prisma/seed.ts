import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@linguamaster.com" },
    update: {},
    create: {
      name: "المسؤول",
      email: "admin@linguamaster.com",
      password: adminPassword,
      role: "admin",
    },
  });
  console.log(`Admin user created: ${adminUser.email}`);

  // Create English language
  const english = await prisma.language.create({
    data: {
      name: "English",
      nameAr: "الإنجليزية",
      code: "en",
      flag: "🇬🇧",
      description: "Learn English - the most widely spoken language in the world",
      isActive: true,
    },
  });

  // Create 3 levels
  const beginner = await prisma.level.create({
    data: {
      name: "Beginner",
      nameAr: "مبتدئ",
      order: 1,
      description: "Basic vocabulary and simple sentences",
      passingScore: 60,
      languageId: english.id,
    },
  });

  const intermediate = await prisma.level.create({
    data: {
      name: "Intermediate",
      nameAr: "متوسط",
      order: 2,
      description: "Complex sentences and grammar",
      passingScore: 70,
      languageId: english.id,
    },
  });

  const advanced = await prisma.level.create({
    data: {
      name: "Advanced",
      nameAr: "متقدم",
      order: 3,
      description: "Fluent communication and advanced grammar",
      passingScore: 80,
      languageId: english.id,
    },
  });

  // --- BEGINNER LEVEL ---
  const b1 = await prisma.lesson.create({
    data: { title: "Greetings & Introductions", titleAr: "التحيات والتعريف بالنفس", order: 1, levelId: beginner.id },
  });
  const b2 = await prisma.lesson.create({
    data: { title: "Numbers & Colors", titleAr: "الأرقام والألوان", order: 2, levelId: beginner.id },
  });
  const b3 = await prisma.lesson.create({
    data: { title: "Family & People", titleAr: "العائلة والأشخاص", order: 3, levelId: beginner.id },
  });

  // Beginner Lesson 1 Words
  const b1Words = [
    { word: "Hello", translation: "مرحبا", pronunciation: "heh-LOH", example: "Hello, how are you?", exampleTranslation: "مرحبا، كيف حالك؟" },
    { word: "Goodbye", translation: "مع السلامة", pronunciation: "good-BYE", example: "Goodbye, see you later!", exampleTranslation: "مع السلامة، أراك لاحقاً!" },
    { word: "Thank you", translation: "شكرا لك", pronunciation: "THANGK yoo", example: "Thank you very much.", exampleTranslation: "شكرا جزيلا لك." },
    { word: "Please", translation: "من فضلك", pronunciation: "pleez", example: "Please sit down.", exampleTranslation: "من فضلك اجلس." },
    { word: "Yes", translation: "نعم", pronunciation: "yes", example: "Yes, I understand.", exampleTranslation: "نعم، أنا أفهم." },
    { word: "No", translation: "لا", pronunciation: "noh", example: "No, thank you.", exampleTranslation: "لا، شكرا لك." },
    { word: "Name", translation: "اسم", pronunciation: "naym", example: "What is your name?", exampleTranslation: "ما اسمك؟" },
    { word: "Friend", translation: "صديق", pronunciation: "frend", example: "He is my friend.", exampleTranslation: "هو صديقي." },
  ];

  for (const w of b1Words) {
    await prisma.word.create({ data: { ...w, translationAr: w.translation, lessonId: b1.id } });
  }

  // Beginner Lesson 2 Words
  const b2Words = [
    { word: "One", translation: "واحد", pronunciation: "wuhn", example: "I have one book.", exampleTranslation: "لدي كتاب واحد." },
    { word: "Two", translation: "اثنان", pronunciation: "too", example: "Two cats are playing.", exampleTranslation: "قطتان تلعبان." },
    { word: "Three", translation: "ثلاثة", pronunciation: "three", example: "Three birds are singing.", exampleTranslation: "ثلاثة طيور تغني." },
    { word: "Red", translation: "أحمر", pronunciation: "red", example: "The apple is red.", exampleTranslation: "التفاحة حمراء." },
    { word: "Blue", translation: "أزرق", pronunciation: "bloo", example: "The sky is blue.", exampleTranslation: "السماء زرقاء." },
    { word: "Green", translation: "أخضر", pronunciation: "green", example: "The grass is green.", exampleTranslation: "العشب أخضر." },
  ];

  for (const w of b2Words) {
    await prisma.word.create({ data: { ...w, translationAr: w.translation, lessonId: b2.id } });
  }

  // Beginner Lesson 3 Words
  const b3Words = [
    { word: "Mother", translation: "أم", pronunciation: "MUHTH-er", example: "My mother is kind.", exampleTranslation: "أمي طيبة." },
    { word: "Father", translation: "أب", pronunciation: "FAH-ther", example: "My father works hard.", exampleTranslation: "أبي يعمل بجد." },
    { word: "Brother", translation: "أخ", pronunciation: "BRUHTH-er", example: "I have one brother.", exampleTranslation: "لدي أخ واحد." },
    { word: "Sister", translation: "أخت", pronunciation: "SIS-ter", example: "My sister is a student.", exampleTranslation: "أختي طالبة." },
    { word: "Child", translation: "طفل", pronunciation: "chyld", example: "The child is happy.", exampleTranslation: "الطفل سعيد." },
    { word: "Family", translation: "عائلة", pronunciation: "FAM-uh-lee", example: "I love my family.", exampleTranslation: "أحب عائلتي." },
  ];

  for (const w of b3Words) {
    await prisma.word.create({ data: { ...w, translationAr: w.translation, lessonId: b3.id } });
  }

  // Grammar Rules
  await prisma.grammarRule.create({
    data: {
      title: "Present Simple - To Be",
      titleAr: "المضارع البسيط - فعل الكينونة",
      explanation: "The verb 'to be' has three forms: am (I), is (he/she/it), are (you/we/they).",
      explanationAr: "فعل الكينونة 'to be' له ثلاثة أشكال: am (أنا)، is (هو/هي)، are (أنت/نحن/هم).",
      examples: JSON.stringify(["I am a student.", "She is happy.", "They are friends."]),
      lessonId: b1.id,
    },
  });

  await prisma.grammarRule.create({
    data: {
      title: "Articles - A / An / The",
      titleAr: "أدوات التعريف والتنكير",
      explanation: "'A' is used before consonant sounds, 'An' before vowel sounds, 'The' for specific things.",
      explanationAr: "'A' تستخدم قبل الأصوات الساكنة، 'An' قبل أصوات العلة، 'The' للأشياء المحددة.",
      examples: JSON.stringify(["A book", "An apple", "The sun"]),
      lessonId: b2.id,
    },
  });

  await prisma.grammarRule.create({
    data: {
      title: "Possessive Adjectives",
      titleAr: "صفات الملكية",
      explanation: "My, Your, His, Her, Its, Our, Their - used before nouns to show possession.",
      explanationAr: "صفات الملكية: my (لي), your (لك), his (له), her (لها), our (لنا), their (لهم) - تستخدم قبل الأسماء للدلالة على الملكية.",
      examples: JSON.stringify(["My name is Ali.", "Her book is new.", "Their house is big."]),
      lessonId: b3.id,
    },
  });

  // Questions for Beginner
  const beginnerQuestions = [
    // Multiple choice
    { type: "multiple_choice", question: "What does 'Hello' mean?", questionAr: "ماذا تعني 'Hello'؟", options: JSON.stringify(["مرحبا", "مع السلامة", "شكرا", "من فضلك"]), answer: "مرحبا", explanation: "Hello means مرحبا in Arabic", points: 10, lessonId: b1.id },
    { type: "multiple_choice", question: "What color is the sky?", questionAr: "ما لون السماء؟", options: JSON.stringify(["Red", "Green", "Blue", "Yellow"]), answer: "Blue", explanation: "The sky is blue - السماء زرقاء", points: 10, lessonId: b2.id },
    { type: "multiple_choice", question: "What does 'Mother' mean?", questionAr: "ماذا تعني 'Mother'؟", options: JSON.stringify(["أب", "أم", "أخ", "أخت"]), answer: "أم", explanation: "Mother means أم", points: 10, lessonId: b3.id },
    // Writing
    { type: "writing", question: "Write the English word for: مرحبا", questionAr: "اكتب الكلمة الإنجليزية لـ: مرحبا", options: "[]", answer: "Hello", explanation: "مرحبا = Hello", points: 15, lessonId: b1.id },
    { type: "writing", question: "Write the English word for: أحمر", questionAr: "اكتب الكلمة الإنجليزية لـ: أحمر", options: "[]", answer: "Red", explanation: "أحمر = Red", points: 15, lessonId: b2.id },
    { type: "writing", question: "Write the English word for: عائلة", questionAr: "اكتب الكلمة الإنجليزية لـ: عائلة", options: "[]", answer: "Family", explanation: "عائلة = Family", points: 15, lessonId: b3.id },
    // Matching
    { type: "matching", question: "Match: Goodbye", questionAr: "وصّل: Goodbye", options: JSON.stringify(["مع السلامة", "مرحبا", "شكرا", "نعم"]), answer: "مع السلامة", explanation: "Goodbye = مع السلامة", points: 10, lessonId: b1.id },
    { type: "matching", question: "Match: Green", questionAr: "وصّل: Green", options: JSON.stringify(["أحمر", "أزرق", "أخضر", "أصفر"]), answer: "أخضر", explanation: "Green = أخضر", points: 10, lessonId: b2.id },
    // Listening
    { type: "listening", question: "Listen and choose the correct meaning of 'Thank you'", questionAr: "استمع واختر المعنى الصحيح لـ 'Thank you'", options: JSON.stringify(["من فضلك", "شكرا لك", "مرحبا", "نعم"]), answer: "شكرا لك", explanation: "Thank you = شكرا لك", points: 15, lessonId: b1.id },
    // Pronunciation
    { type: "pronunciation", question: "Say: Hello, how are you?", questionAr: "انطق: Hello, how are you?", options: "[]", answer: "Hello, how are you?", explanation: "Practice greeting pronunciation", points: 20, lessonId: b1.id },
    { type: "pronunciation", question: "Say: My name is...", questionAr: "انطق: My name is...", options: "[]", answer: "My name is", explanation: "Practice introducing yourself", points: 20, lessonId: b1.id },
  ];

  for (const q of beginnerQuestions) {
    await prisma.question.create({ data: q });
  }

  // Create test for beginner level
  await prisma.test.create({
    data: {
      title: "Beginner Level Test",
      titleAr: "اختبار المستوى المبتدئ",
      type: "level",
      passingScore: 60,
      levelId: beginner.id,
    },
  });

  // --- INTERMEDIATE LEVEL ---
  const i1 = await prisma.lesson.create({
    data: { title: "Daily Routines", titleAr: "الروتين اليومي", order: 1, levelId: intermediate.id },
  });
  const i2 = await prisma.lesson.create({
    data: { title: "Travel & Directions", titleAr: "السفر والاتجاهات", order: 2, levelId: intermediate.id },
  });

  const i1Words = [
    { word: "Wake up", translation: "استيقظ", pronunciation: "wayk uhp", example: "I wake up at 7 AM.", exampleTranslation: "أستيقظ في الساعة 7 صباحا." },
    { word: "Breakfast", translation: "فطور", pronunciation: "BREK-fuhst", example: "I eat breakfast every morning.", exampleTranslation: "أتناول الفطور كل صباح." },
    { word: "Work", translation: "عمل", pronunciation: "wurk", example: "I go to work by bus.", exampleTranslation: "أذهب إلى العمل بالحافلة." },
    { word: "Lunch", translation: "غداء", pronunciation: "luhnch", example: "We have lunch at noon.", exampleTranslation: "نتناول الغداء في الظهيرة." },
    { word: "Exercise", translation: "تمرين", pronunciation: "EK-ser-syz", example: "I exercise three times a week.", exampleTranslation: "أتمرن ثلاث مرات في الأسبوع." },
    { word: "Sleep", translation: "نوم", pronunciation: "sleep", example: "I sleep at 10 PM.", exampleTranslation: "أنام في الساعة 10 مساء." },
  ];

  for (const w of i1Words) {
    await prisma.word.create({ data: { ...w, translationAr: w.translation, lessonId: i1.id } });
  }

  const i2Words = [
    { word: "Airport", translation: "مطار", pronunciation: "AIR-port", example: "The airport is far.", exampleTranslation: "المطار بعيد." },
    { word: "Hotel", translation: "فندق", pronunciation: "hoh-TEL", example: "The hotel is beautiful.", exampleTranslation: "الفندق جميل." },
    { word: "Left", translation: "يسار", pronunciation: "left", example: "Turn left at the corner.", exampleTranslation: "اتجه يسارا عند الزاوية." },
    { word: "Right", translation: "يمين", pronunciation: "ryt", example: "Turn right after the bridge.", exampleTranslation: "اتجه يمينا بعد الجسر." },
    { word: "Map", translation: "خريطة", pronunciation: "map", example: "I need a map.", exampleTranslation: "أحتاج خريطة." },
    { word: "Passport", translation: "جواز سفر", pronunciation: "PAS-port", example: "Show me your passport.", exampleTranslation: "أرني جواز سفرك." },
  ];

  for (const w of i2Words) {
    await prisma.word.create({ data: { ...w, translationAr: w.translation, lessonId: i2.id } });
  }

  await prisma.grammarRule.create({
    data: {
      title: "Past Simple Tense",
      titleAr: "زمن الماضي البسيط",
      explanation: "Used for completed actions in the past. Regular verbs add -ed. Irregular verbs have special forms.",
      explanationAr: "يستخدم للأفعال المكتملة في الماضي. الأفعال المنتظمة تضاف لها -ed. الأفعال الشاذة لها أشكال خاصة.",
      examples: JSON.stringify(["I worked yesterday.", "She went to school.", "They played football."]),
      lessonId: i1.id,
    },
  });

  await prisma.grammarRule.create({
    data: {
      title: "Prepositions of Place",
      titleAr: "حروف الجر المكانية",
      explanation: "In (inside), On (surface), At (specific point), Near (close to), Between (in the middle of two things).",
      explanationAr: "In (داخل)، On (على السطح)، At (عند نقطة محددة)، Near (بالقرب من)، Between (بين شيئين).",
      examples: JSON.stringify(["The book is on the table.", "She is at the airport.", "The hotel is near the beach."]),
      lessonId: i2.id,
    },
  });

  const intermediateQuestions = [
    { type: "multiple_choice", question: "What does 'Breakfast' mean?", questionAr: "ماذا تعني 'Breakfast'؟", options: JSON.stringify(["غداء", "عشاء", "فطور", "وجبة"]), answer: "فطور", explanation: "Breakfast = فطور", points: 10, lessonId: i1.id },
    { type: "multiple_choice", question: "What does 'Airport' mean?", questionAr: "ماذا تعني 'Airport'؟", options: JSON.stringify(["مطار", "فندق", "محطة", "ميناء"]), answer: "مطار", explanation: "Airport = مطار", points: 10, lessonId: i2.id },
    { type: "writing", question: "Write the English word for: فندق", questionAr: "اكتب الكلمة الإنجليزية لـ: فندق", options: "[]", answer: "Hotel", explanation: "فندق = Hotel", points: 15, lessonId: i2.id },
    { type: "writing", question: "Write the English word for: نوم", questionAr: "اكتب الكلمة الإنجليزية لـ: نوم", options: "[]", answer: "Sleep", explanation: "نوم = Sleep", points: 15, lessonId: i1.id },
    { type: "matching", question: "Match: Passport", questionAr: "وصّل: Passport", options: JSON.stringify(["خريطة", "جواز سفر", "فندق", "مطار"]), answer: "جواز سفر", explanation: "Passport = جواز سفر", points: 10, lessonId: i2.id },
    { type: "listening", question: "Listen and choose the correct meaning of 'Exercise'", questionAr: "استمع واختر المعنى الصحيح لـ 'Exercise'", options: JSON.stringify(["نوم", "عمل", "تمرين", "فطور"]), answer: "تمرين", explanation: "Exercise = تمرين", points: 15, lessonId: i1.id },
    { type: "pronunciation", question: "Say: I wake up at seven in the morning.", questionAr: "انطق: I wake up at seven in the morning.", options: "[]", answer: "I wake up at seven in the morning", explanation: "Practice daily routine sentence", points: 20, lessonId: i1.id },
  ];

  for (const q of intermediateQuestions) {
    await prisma.question.create({ data: q });
  }

  await prisma.test.create({
    data: {
      title: "Intermediate Level Test",
      titleAr: "اختبار المستوى المتوسط",
      type: "level",
      passingScore: 70,
      levelId: intermediate.id,
    },
  });

  // --- ADVANCED LEVEL ---
  const a1 = await prisma.lesson.create({
    data: { title: "Business English", titleAr: "الإنجليزية التجارية", order: 1, levelId: advanced.id },
  });
  const a2 = await prisma.lesson.create({
    data: { title: "Idioms & Expressions", titleAr: "المصطلحات والتعبيرات", order: 2, levelId: advanced.id },
  });

  const a1Words = [
    { word: "Meeting", translation: "اجتماع", pronunciation: "MEE-ting", example: "We have a meeting at 3 PM.", exampleTranslation: "لدينا اجتماع في الساعة 3 مساء." },
    { word: "Deadline", translation: "موعد نهائي", pronunciation: "DED-lyn", example: "The deadline is tomorrow.", exampleTranslation: "الموعد النهائي غدا." },
    { word: "Negotiate", translation: "يتفاوض", pronunciation: "nih-GOH-shee-ayt", example: "We need to negotiate the price.", exampleTranslation: "نحتاج للتفاوض على السعر." },
    { word: "Presentation", translation: "عرض تقديمي", pronunciation: "prez-en-TAY-shun", example: "The presentation was excellent.", exampleTranslation: "العرض التقديمي كان ممتازا." },
    { word: "Contract", translation: "عقد", pronunciation: "KON-trakt", example: "Please sign the contract.", exampleTranslation: "من فضلك وقّع العقد." },
  ];

  for (const w of a1Words) {
    await prisma.word.create({ data: { ...w, translationAr: w.translation, lessonId: a1.id } });
  }

  const a2Words = [
    { word: "Break a leg", translation: "حظا سعيدا", pronunciation: "brayk uh leg", example: "Break a leg in your interview!", exampleTranslation: "حظا سعيدا في مقابلتك!" },
    { word: "Piece of cake", translation: "سهل جدا", pronunciation: "pees uhv kayk", example: "The test was a piece of cake.", exampleTranslation: "الاختبار كان سهلا جدا." },
    { word: "Hit the road", translation: "انطلق في الطريق", pronunciation: "hit thuh rohd", example: "Let's hit the road!", exampleTranslation: "لننطلق في الطريق!" },
    { word: "Under the weather", translation: "مريض / ليس بخير", pronunciation: "UHN-der thuh WETH-er", example: "I'm feeling under the weather.", exampleTranslation: "أشعر أنني لست بخير." },
    { word: "Cost an arm and a leg", translation: "مكلف جدا", pronunciation: "kawst an ahrm and uh leg", example: "That car costs an arm and a leg.", exampleTranslation: "تلك السيارة مكلفة جدا." },
  ];

  for (const w of a2Words) {
    await prisma.word.create({ data: { ...w, translationAr: w.translation, lessonId: a2.id } });
  }

  await prisma.grammarRule.create({
    data: {
      title: "Conditional Sentences",
      titleAr: "الجمل الشرطية",
      explanation: "If + present simple, will + base verb (First Conditional). If + past simple, would + base verb (Second Conditional).",
      explanationAr: "If + مضارع بسيط، will + فعل أساسي (الشرط الأول). If + ماضي بسيط، would + فعل أساسي (الشرط الثاني).",
      examples: JSON.stringify(["If it rains, I will stay home.", "If I were rich, I would travel the world."]),
      lessonId: a1.id,
    },
  });

  await prisma.grammarRule.create({
    data: {
      title: "Phrasal Verbs",
      titleAr: "الأفعال المركبة",
      explanation: "Phrasal verbs are combinations of verbs with prepositions or adverbs that create new meanings.",
      explanationAr: "الأفعال المركبة هي مزيج من الأفعال مع حروف الجر أو الظروف لتكوين معاني جديدة.",
      examples: JSON.stringify(["Give up = surrender", "Look forward to = anticipate", "Put off = postpone"]),
      lessonId: a2.id,
    },
  });

  const advancedQuestions = [
    { type: "multiple_choice", question: "What does 'Deadline' mean?", questionAr: "ماذا تعني 'Deadline'؟", options: JSON.stringify(["اجتماع", "موعد نهائي", "عقد", "عرض"]), answer: "موعد نهائي", explanation: "Deadline = موعد نهائي", points: 15, lessonId: a1.id },
    { type: "multiple_choice", question: "What does 'Piece of cake' mean?", questionAr: "ماذا تعني 'Piece of cake'؟", options: JSON.stringify(["قطعة كعك", "سهل جدا", "مكلف", "ممتع"]), answer: "سهل جدا", explanation: "Piece of cake is an idiom meaning very easy", points: 15, lessonId: a2.id },
    { type: "writing", question: "Write the English idiom for: حظا سعيدا (hint: body part)", questionAr: "اكتب المصطلح الإنجليزي لـ: حظا سعيدا", options: "[]", answer: "Break a leg", explanation: "حظا سعيدا = Break a leg", points: 20, lessonId: a2.id },
    { type: "writing", question: "Write the English word for: يتفاوض", questionAr: "اكتب الكلمة الإنجليزية لـ: يتفاوض", options: "[]", answer: "Negotiate", explanation: "يتفاوض = Negotiate", points: 20, lessonId: a1.id },
    { type: "matching", question: "Match: Contract", questionAr: "وصّل: Contract", options: JSON.stringify(["اجتماع", "عقد", "عرض تقديمي", "موعد نهائي"]), answer: "عقد", explanation: "Contract = عقد", points: 15, lessonId: a1.id },
    { type: "listening", question: "Listen and choose the meaning of 'Presentation'", questionAr: "استمع واختر معنى 'Presentation'", options: JSON.stringify(["عرض تقديمي", "عقد", "اجتماع", "موعد نهائي"]), answer: "عرض تقديمي", explanation: "Presentation = عرض تقديمي", points: 15, lessonId: a1.id },
    { type: "pronunciation", question: "Say: We need to negotiate the contract before the deadline.", questionAr: "انطق: We need to negotiate the contract before the deadline.", options: "[]", answer: "We need to negotiate the contract before the deadline", explanation: "Practice business English sentence", points: 25, lessonId: a1.id },
  ];

  for (const q of advancedQuestions) {
    await prisma.question.create({ data: q });
  }

  await prisma.test.create({
    data: {
      title: "Advanced Level Test",
      titleAr: "اختبار المستوى المتقدم",
      type: "level",
      passingScore: 80,
      levelId: advanced.id,
    },
  });

  // Create site settings
  await prisma.siteSettings.create({
    data: {
      id: "settings",
      siteName: "LinguaMaster",
      siteDescription: "منصة تعلم اللغات الأجنبية",
      maintenanceMode: false,
      maintenanceMessage: "الموقع تحت الصيانة حالياً. سنعود قريباً!",
    },
  });

  console.log("Seed completed successfully!");
  console.log(`Created: 1 language, 3 levels, 7 lessons, ${b1Words.length + b2Words.length + b3Words.length + i1Words.length + i2Words.length + a1Words.length + a2Words.length} words, ${beginnerQuestions.length + intermediateQuestions.length + advancedQuestions.length} questions, 3 tests`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
