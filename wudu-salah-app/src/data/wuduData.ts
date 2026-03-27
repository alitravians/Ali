export interface WuduStep {
  id: string;
  number: number;
  title: string;
  description: string;
  details: string;
  icon: string;
  childDescription: string;
}

export interface WuduCondition {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface WuduMistake {
  id: string;
  mistake: string;
  correction: string;
  icon: string;
}

export interface WuduInvalidator {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const wuduIntro = {
  title: 'الوضوء',
  definition: 'الوضوء هو غسل أعضاء مخصوصة بالماء بنية الطهارة، وهو شرط من شروط صحة الصلاة.',
  importance: 'الوضوء مفتاح الصلاة، ولا تصح الصلاة بدونه. قال النبي ﷺ: "لا يقبل الله صلاة أحدكم إذا أحدث حتى يتوضأ".',
  virtues: [
    'الوضوء نصف الإيمان',
    'يُكفّر الذنوب والخطايا',
    'تخرج الذنوب مع الماء أو مع آخر قطر الماء',
    'يرفع الدرجات',
    'المتوضئ يأتي يوم القيامة غُرًّا مُحجَّلين من آثار الوضوء',
  ],
};

export const wuduConditions: WuduCondition[] = [
  { id: 'wc1', title: 'الإسلام', description: 'أن يكون المتوضئ مسلمًا', icon: '☪️' },
  { id: 'wc2', title: 'العقل', description: 'أن يكون عاقلًا مميزًا', icon: '🧠' },
  { id: 'wc3', title: 'النية', description: 'أن ينوي الوضوء في قلبه', icon: '💭' },
  { id: 'wc4', title: 'الماء الطهور', description: 'استخدام ماء طاهر مطهِّر', icon: '💧' },
  { id: 'wc5', title: 'إزالة ما يمنع وصول الماء', description: 'إزالة أي شيء يمنع وصول الماء للبشرة كالطلاء ونحوه', icon: '✋' },
  { id: 'wc6', title: 'الاستنجاء أو الاستجمار قبله', description: 'التطهر من النجاسة قبل الوضوء', icon: '🚿' },
];

export const wuduSteps: WuduStep[] = [
  {
    id: 'ws1', number: 1,
    title: 'النية',
    description: 'انوِ الوضوء في قلبك. النية محلها القلب ولا يُشترط التلفظ بها.',
    details: 'النية ركن من أركان الوضوء، ومحلها القلب. تنوي رفع الحدث الأصغر أو الوضوء للصلاة.',
    icon: '💭',
    childDescription: 'انوِ في قلبك أنك تريد الوضوء',
  },
  {
    id: 'ws2', number: 2,
    title: 'التسمية',
    description: 'قل "بسم الله" عند بداية الوضوء.',
    details: 'يُسن قول "بسم الله" عند البدء بالوضوء، وهي واجبة عند بعض العلماء مع الذِّكر.',
    icon: '🤲',
    childDescription: 'قُل: بسم الله',
  },
  {
    id: 'ws3', number: 3,
    title: 'غسل الكفين',
    description: 'اغسل كفيك ثلاث مرات.',
    details: 'اغسل كفيك ثلاث مرات، وأدخل الماء بين الأصابع وتأكد من وصوله لجميع أجزاء الكف.',
    icon: '🖐️',
    childDescription: 'اغسل يديك 3 مرات',
  },
  {
    id: 'ws4', number: 4,
    title: 'المضمضة',
    description: 'أدخل الماء في فمك وأدره ثم أخرجه، ثلاث مرات.',
    details: 'خذ الماء بيدك اليمنى وأدخله فمك، ثم حركه في جميع أنحاء الفم وأخرجه. كرر ذلك ثلاث مرات. ويُسن المبالغة إلا للصائم.',
    icon: '👄',
    childDescription: 'ضع ماء في فمك وحركه ثم أخرجه، 3 مرات',
  },
  {
    id: 'ws5', number: 5,
    title: 'الاستنشاق والاستنثار',
    description: 'اجذب الماء بأنفك ثم أخرجه، ثلاث مرات.',
    details: 'الاستنشاق: جذب الماء بالنَّفَس إلى داخل الأنف. الاستنثار: إخراج الماء من الأنف بيدك اليسرى. كرر ثلاث مرات.',
    icon: '👃',
    childDescription: 'اسحب الماء بأنفك ثم أخرجه، 3 مرات',
  },
  {
    id: 'ws6', number: 6,
    title: 'غسل الوجه',
    description: 'اغسل وجهك ثلاث مرات من منابت الشعر إلى أسفل الذقن، ومن الأذن إلى الأذن.',
    details: 'حدود الوجه: من منابت شعر الرأس المعتاد إلى أسفل الذقن طولًا، ومن الأذن إلى الأذن عرضًا. اغسله ثلاث مرات مع تعميم الماء.',
    icon: '😊',
    childDescription: 'اغسل وجهك كاملًا 3 مرات',
  },
  {
    id: 'ws7', number: 7,
    title: 'غسل اليدين إلى المرفقين',
    description: 'اغسل يدك اليمنى من أطراف الأصابع إلى المرفق ثلاث مرات، ثم اليسرى كذلك.',
    details: 'ابدأ باليمنى ثم اليسرى. اغسل من أطراف الأصابع إلى المرفقين (الكوعين) مع إدخال المرفقين في الغسل. كرر ثلاث مرات لكل يد.',
    icon: '💪',
    childDescription: 'اغسل يدك اليمنى ثم اليسرى إلى الكوع، 3 مرات',
  },
  {
    id: 'ws8', number: 8,
    title: 'مسح الرأس',
    description: 'امسح رأسك بيديك المبللتين من مقدمة الرأس إلى القفا ثم ارجع، مرة واحدة.',
    details: 'بلّل يديك بالماء، ثم امسح من مقدمة الرأس إلى مؤخرته (القفا) ثم ارجع إلى المقدمة. يكون المسح مرة واحدة.',
    icon: '👤',
    childDescription: 'امسح رأسك بيديك المبللتين، مرة واحدة',
  },
  {
    id: 'ws9', number: 9,
    title: 'مسح الأذنين',
    description: 'امسح أذنيك بإدخال السبابتين في صماخي الأذنين ومسح ظاهرهما بالإبهامين.',
    details: 'أدخل السبابتين في صماخي الأذنين (داخل الأذن) وامسح ظاهر الأذنين بالإبهامين. يكون مرة واحدة بنفس ماء مسح الرأس.',
    icon: '👂',
    childDescription: 'امسح أذنيك من الداخل والخارج',
  },
  {
    id: 'ws10', number: 10,
    title: 'غسل القدمين',
    description: 'اغسل قدمك اليمنى إلى الكعبين ثلاث مرات، ثم اليسرى كذلك.',
    details: 'ابدأ بالقدم اليمنى ثم اليسرى. اغسل من أطراف الأصابع إلى الكعبين مع إدخال الكعبين. خلّل بين الأصابع. كرر ثلاث مرات.',
    icon: '🦶',
    childDescription: 'اغسل قدمك اليمنى ثم اليسرى 3 مرات',
  },
];

export const wuduMistakes: WuduMistake[] = [
  { id: 'wm1', mistake: 'عدم إسباغ الوضوء', correction: 'تأكد من وصول الماء لجميع أجزاء العضو المغسول', icon: '💧' },
  { id: 'wm2', mistake: 'ترك الترتيب بين الأعضاء', correction: 'التزم بالترتيب: الوجه، اليدين، الرأس، القدمين', icon: '📋' },
  { id: 'wm3', mistake: 'عدم تخليل الأصابع', correction: 'أدخل الماء بين أصابع اليدين والقدمين', icon: '🖐️' },
  { id: 'wm4', mistake: 'الإسراف في الماء', correction: 'استخدم الماء باعتدال كما كان يفعل النبي ﷺ', icon: '🚰' },
  { id: 'wm5', mistake: 'ترك المرفقين أو الكعبين', correction: 'تأكد من غسل المرفقين والكعبين مع العضو', icon: '⚠️' },
  { id: 'wm6', mistake: 'غسل الرأس بدل مسحه', correction: 'الرأس يُمسح ولا يُغسل', icon: '👤' },
  { id: 'wm7', mistake: 'الوضوء بسرعة شديدة', correction: 'تمهّل وتأكد من إسباغ الوضوء على كل عضو', icon: '⏱️' },
  { id: 'wm8', mistake: 'نسيان التسمية', correction: 'قل "بسم الله" عند البدء بالوضوء', icon: '📝' },
];

export const wuduInvalidators: WuduInvalidator[] = [
  { id: 'wi1', title: 'الخارج من السبيلين', description: 'كل ما خرج من القُبل أو الدُّبر من بول أو غائط أو ريح', icon: '🚫' },
  { id: 'wi2', title: 'النوم المستغرق', description: 'النوم العميق الذي يفقد فيه الإنسان الإحساس', icon: '😴' },
  { id: 'wi3', title: 'زوال العقل', description: 'بجنون أو إغماء أو سُكر أو تخدير', icon: '🧠' },
  { id: 'wi4', title: 'أكل لحم الإبل', description: 'أكل لحم الجمل ينقض الوضوء على الراجح', icon: '🐪' },
  { id: 'wi5', title: 'مس الفرج بدون حائل', description: 'مس الفرج باليد مباشرة بدون حائل', icon: '✋' },
  { id: 'wi6', title: 'الردة عن الإسلام', description: 'الخروج من الإسلام يبطل الوضوء والعبادات', icon: '⚠️' },
];
