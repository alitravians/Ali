export type QuizType = 'wudu' | 'salah' | 'children' | 'adults';
export type QuestionType = 'multiple-choice' | 'true-false' | 'ordering';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | number | number[];
  explanation: string;
  forChildren: boolean;
  category: 'wudu' | 'salah';
}

export const quizQuestions: QuizQuestion[] = [
  // Wudu Questions
  {
    id: 'wq1', type: 'multiple-choice', category: 'wudu',
    question: 'ما هو أول شيء نفعله قبل الوضوء؟',
    options: ['غسل الوجه', 'النية والتسمية', 'غسل اليدين', 'المضمضة'],
    correctAnswer: 1, explanation: 'النية والتسمية هما أول خطوة في الوضوء',
    forChildren: true,
  },
  {
    id: 'wq2', type: 'true-false', category: 'wudu',
    question: 'يجب غسل اليدين ثلاث مرات في الوضوء',
    correctAnswer: 'خطأ', explanation: 'الغسل ثلاثا سنة وليس واجبا، والواجب مرة واحدة تعم العضو',
    forChildren: false,
  },
  {
    id: 'wq3', type: 'multiple-choice', category: 'wudu',
    question: 'كم عدد مرات المضمضة والاستنشاق في الوضوء؟',
    options: ['مرة واحدة (واجب)', 'مرتان', 'ثلاث مرات (سنة)', 'أربع مرات'],
    correctAnswer: 2, explanation: 'السنة ثلاث مرات والواجب مرة واحدة',
    forChildren: true,
  },
  {
    id: 'wq4', type: 'multiple-choice', category: 'wudu',
    question: 'ما هو الترتيب الصحيح بعد غسل الوجه؟',
    options: ['مسح الرأس', 'غسل اليدين إلى المرفقين', 'غسل القدمين', 'المضمضة'],
    correctAnswer: 1, explanation: 'بعد غسل الوجه يأتي غسل اليدين إلى المرفقين',
    forChildren: true,
  },
  {
    id: 'wq5', type: 'true-false', category: 'wudu',
    question: 'النوم العميق من مبطلات الوضوء',
    correctAnswer: 'صح', explanation: 'النوم المستغرق الذي لا يشعر فيه الإنسان بما يخرج منه يعتبر ناقضا للوضوء',
    forChildren: false,
  },
  {
    id: 'wq6', type: 'multiple-choice', category: 'wudu',
    question: 'ماذا نقول بعد الانتهاء من الوضوء؟',
    options: ['الحمد لله', 'بسم الله', 'أشهد أن لا إله إلا الله وأشهد أن محمدا عبده ورسوله', 'سبحان الله'],
    correctAnswer: 2, explanation: 'من السنة قول الشهادة بعد الوضوء',
    forChildren: true,
  },
  {
    id: 'wq7', type: 'true-false', category: 'wudu',
    question: 'يجب الترتيب في أعضاء الوضوء',
    correctAnswer: 'صح', explanation: 'الترتيب بين أعضاء الوضوء واجب كما ذكر في القرآن الكريم',
    forChildren: false,
  },
  {
    id: 'wq8', type: 'multiple-choice', category: 'wudu',
    question: 'أي من التالي ليس من شروط الوضوء؟',
    options: ['الإسلام', 'الماء الطاهر', 'لبس ملابس بيضاء', 'إزالة ما يمنع وصول الماء'],
    correctAnswer: 2, explanation: 'لبس ملابس بيضاء ليس من شروط الوضوء',
    forChildren: true,
  },
  // Salah Questions
  {
    id: 'sq1', type: 'multiple-choice', category: 'salah',
    question: 'كم عدد ركعات صلاة الفجر؟',
    options: ['ركعة واحدة', 'ركعتان', 'ثلاث ركعات', 'أربع ركعات'],
    correctAnswer: 1, explanation: 'صلاة الفجر ركعتان',
    forChildren: true,
  },
  {
    id: 'sq2', type: 'true-false', category: 'salah',
    question: 'قراءة سورة الفاتحة ركن في كل ركعة من ركعات الصلاة',
    correctAnswer: 'صح', explanation: 'قراءة الفاتحة ركن من أركان الصلاة في كل ركعة',
    forChildren: false,
  },
  {
    id: 'sq3', type: 'multiple-choice', category: 'salah',
    question: 'ماذا نقول في الركوع؟',
    options: ['سبحان ربي الأعلى', 'سبحان ربي العظيم', 'الله أكبر', 'سمع الله لمن حمده'],
    correctAnswer: 1, explanation: 'في الركوع نقول سبحان ربي العظيم',
    forChildren: true,
  },
  {
    id: 'sq4', type: 'multiple-choice', category: 'salah',
    question: 'ماذا نقول في السجود؟',
    options: ['سبحان ربي العظيم', 'ربنا ولك الحمد', 'سبحان ربي الأعلى', 'رب اغفر لي'],
    correctAnswer: 2, explanation: 'في السجود نقول سبحان ربي الأعلى',
    forChildren: true,
  },
  {
    id: 'sq5', type: 'true-false', category: 'salah',
    question: 'الضحك في الصلاة لا يبطلها',
    correctAnswer: 'خطأ', explanation: 'القهقهة في الصلاة تبطلها بالإجماع',
    forChildren: false,
  },
  {
    id: 'sq6', type: 'multiple-choice', category: 'salah',
    question: 'كم عدد ركعات صلاة المغرب؟',
    options: ['ركعتان', 'ثلاث ركعات', 'أربع ركعات', 'خمس ركعات'],
    correctAnswer: 1, explanation: 'صلاة المغرب ثلاث ركعات',
    forChildren: true,
  },
  {
    id: 'sq7', type: 'multiple-choice', category: 'salah',
    question: 'على كم عضو نسجد في الصلاة؟',
    options: ['خمسة أعضاء', 'ستة أعضاء', 'سبعة أعضاء', 'ثمانية أعضاء'],
    correctAnswer: 2, explanation: 'نسجد على سبعة أعضاء: الجبهة مع الأنف والكفين والركبتين وأطراف القدمين',
    forChildren: true,
  },
  {
    id: 'sq8', type: 'true-false', category: 'salah',
    question: 'التشهد الأول واجب في الصلاة الرباعية والثلاثية',
    correctAnswer: 'صح', explanation: 'التشهد الأول واجب وليس ركنا ويسقط بالسهو ويجبر بسجود السهو',
    forChildren: false,
  },
  {
    id: 'sq9', type: 'multiple-choice', category: 'salah',
    question: 'ماذا نقول عند الرفع من الركوع؟',
    options: ['الله أكبر', 'سمع الله لمن حمده', 'سبحان ربي العظيم', 'رب اغفر لي'],
    correctAnswer: 1, explanation: 'عند الرفع من الركوع نقول سمع الله لمن حمده',
    forChildren: true,
  },
  {
    id: 'sq10', type: 'multiple-choice', category: 'salah',
    question: 'كيف نختم الصلاة؟',
    options: ['بالتكبير', 'بالركوع', 'بالتسليم عن اليمين والشمال', 'بالسجود'],
    correctAnswer: 2, explanation: 'نختم الصلاة بالتسليم عن اليمين ثم عن الشمال',
    forChildren: true,
  },
  {
    id: 'sq11', type: 'true-false', category: 'salah',
    question: 'استقبال القبلة شرط من شروط صحة الصلاة',
    correctAnswer: 'صح', explanation: 'استقبال القبلة شرط من شروط صحة الصلاة للقادر عليه',
    forChildren: false,
  },
  {
    id: 'sq12', type: 'multiple-choice', category: 'salah',
    question: 'ما هو أول ركن من أركان الصلاة؟',
    options: ['قراءة الفاتحة', 'الركوع', 'القيام مع القدرة', 'تكبيرة الإحرام'],
    correctAnswer: 2, explanation: 'القيام مع القدرة هو أول أركان الصلاة في صلاة الفريضة',
    forChildren: false,
  },
];

export function getQuizByCategory(category: 'wudu' | 'salah'): QuizQuestion[] {
  return quizQuestions.filter(q => q.category === category);
}

export function getChildrenQuiz(): QuizQuestion[] {
  return quizQuestions.filter(q => q.forChildren);
}

export function getAdultsQuiz(): QuizQuestion[] {
  return quizQuestions;
}
