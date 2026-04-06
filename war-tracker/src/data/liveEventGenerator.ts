import type { TrackerEvent, EventCategory, TrustLevel } from '../types';

const now = () => new Date();

const liveEventTemplates: Array<{
  titleAr: string;
  descriptionAr: string;
  category: EventCategory;
  trustLevel: TrustLevel;
  trustReasonAr: string;
  location: { lat: number; lng: number; name: string; nameAr: string };
  sourceNameAr: string;
  isBreaking: boolean;
  whyItMattersAr?: string;
  relatedCities: string[];
}> = [
  {
    titleAr: 'صاروخ باليستي يستهدف قاعدة عسكرية في النقب',
    descriptionAr: 'رصد إطلاق صاروخ باليستي باتجاه منطقة النقب الجنوبية. أنظمة الدفاع الجوي تعترض الصاروخ.',
    category: 'military',
    trustLevel: 'high',
    trustReasonAr: 'مؤكد من مصادر إعلامية متعددة',
    location: { lat: 31.25, lng: 34.79, name: 'Negev', nameAr: 'النقب' },
    sourceNameAr: 'رويترز',
    isBreaking: true,
    whyItMattersAr: 'استهداف منطقة النقب يشير إلى توسيع نطاق الأهداف العسكرية.',
    relatedCities: ['telaviv'],
  },
  {
    titleAr: 'تحذير من هجوم وشيك على بنية تحتية نفطية',
    descriptionAr: 'مصادر استخباراتية تحذر من هجوم محتمل على منشآت نفطية في الخليج العربي.',
    category: 'alert',
    trustLevel: 'medium',
    trustReasonAr: 'تحذيرات استخباراتية غير مؤكدة بشكل مستقل',
    location: { lat: 26.2, lng: 50.5, name: 'Persian Gulf', nameAr: 'الخليج العربي' },
    sourceNameAr: 'الجزيرة',
    isBreaking: true,
    whyItMattersAr: 'أي هجوم على البنية التحتية النفطية سيؤدي لارتفاع حاد في أسعار النفط العالمية.',
    relatedCities: ['bahrain'],
  },
  {
    titleAr: 'وزير الدفاع الإسرائيلي يعلن حالة الطوارئ القصوى',
    descriptionAr: 'وزير الدفاع الإسرائيلي يعلن رفع حالة الطوارئ للمستوى الأقصى في جميع المنشآت العسكرية.',
    category: 'official',
    trustLevel: 'confirmed',
    trustReasonAr: 'بيان رسمي من وزارة الدفاع الإسرائيلية',
    location: { lat: 32.08, lng: 34.78, name: 'Tel Aviv', nameAr: 'تل أبيب' },
    sourceNameAr: 'المتحدث باسم الجيش الإسرائيلي',
    isBreaking: true,
    whyItMattersAr: 'إعلان الطوارئ القصوى يشير إلى توقعات بتصعيد عسكري كبير.',
    relatedCities: ['telaviv'],
  },
  {
    titleAr: 'إيران تغلق مجالها الجوي بالكامل',
    descriptionAr: 'هيئة الطيران المدني الإيرانية تعلن إغلاق المجال الجوي الإيراني بالكامل أمام جميع الرحلات.',
    category: 'airspace',
    trustLevel: 'confirmed',
    trustReasonAr: 'إشعار رسمي من هيئة الطيران المدني الإيرانية',
    location: { lat: 35.69, lng: 51.39, name: 'Tehran', nameAr: 'طهران' },
    sourceNameAr: 'فلايت رادار 24',
    isBreaking: false,
    relatedCities: ['tehran'],
  },
  {
    titleAr: 'ناقلة نفط تتعرض لهجوم بطائرة مسيّرة في بحر عمان',
    descriptionAr: 'ناقلة نفط ترفع علم ليبيريا تتعرض لهجوم بطائرة مسيّرة قبالة سواحل عمان. لا إصابات بشرية.',
    category: 'maritime',
    trustLevel: 'high',
    trustReasonAr: 'مؤكد من مارين ترافيك وتقارير بحرية',
    location: { lat: 25.3, lng: 57.8, name: 'Sea of Oman', nameAr: 'بحر عمان' },
    sourceNameAr: 'مارين ترافيك',
    isBreaking: false,
    whyItMattersAr: 'الهجمات على ناقلات النفط تهدد حرية الملاحة وأسعار الطاقة العالمية.',
    relatedCities: ['bahrain'],
  },
  {
    titleAr: 'رصد حريق كبير في مستودع ذخيرة بالقرب من أصفهان',
    descriptionAr: 'صور أقمار اصطناعية تظهر حريقاً كبيراً في موقع يُعتقد أنه مستودع ذخيرة شرق أصفهان.',
    category: 'fire',
    trustLevel: 'medium',
    trustReasonAr: 'صور أقمار اصطناعية، السبب قيد التحقيق',
    location: { lat: 32.7, lng: 52.1, name: 'Isfahan East', nameAr: 'شرق أصفهان' },
    sourceNameAr: 'محللو المصادر المفتوحة',
    isBreaking: false,
    whyItMattersAr: 'انفجار مستودعات الذخيرة قد يشير إلى ضربة مباشرة أو حادث داخلي.',
    relatedCities: ['isfahan'],
  },
  {
    titleAr: 'الأمم المتحدة تطالب بوقف إطلاق نار فوري',
    descriptionAr: 'الأمين العام للأمم المتحدة يصدر بياناً عاجلاً يطالب جميع الأطراف بوقف فوري لإطلاق النار.',
    category: 'humanitarian',
    trustLevel: 'confirmed',
    trustReasonAr: 'بيان رسمي من الأمين العام للأمم المتحدة',
    location: { lat: 40.75, lng: -73.97, name: 'UN HQ', nameAr: 'مقر الأمم المتحدة' },
    sourceNameAr: 'مكتب الأمم المتحدة',
    isBreaking: true,
    relatedCities: [],
  },
  {
    titleAr: 'إطلاق صواريخ كروز من سفن حربية إيرانية',
    descriptionAr: 'رصد إطلاق عدة صواريخ كروز من سفن حربية إيرانية في مياه الخليج العربي.',
    category: 'military',
    trustLevel: 'high',
    trustReasonAr: 'رصد بالأقمار الاصطناعية ومصادر استخباراتية',
    location: { lat: 27.5, lng: 52.0, name: 'Persian Gulf', nameAr: 'الخليج العربي' },
    sourceNameAr: 'وكالة إرنا الإيرانية',
    isBreaking: true,
    whyItMattersAr: 'إطلاق صواريخ كروز من سفن حربية يمثل تصعيداً بحرياً خطيراً.',
    relatedCities: ['bahrain'],
  },
  {
    titleAr: 'صفارات إنذار تدوي في بئر السبع وعسقلان',
    descriptionAr: 'تفعيل صفارات الإنذار في مدينتي بئر السبع وعسقلان مع تقارير عن اعتراضات صاروخية.',
    category: 'alert',
    trustLevel: 'confirmed',
    trustReasonAr: 'مؤكد من قيادة الجبهة الداخلية الإسرائيلية',
    location: { lat: 31.25, lng: 34.79, name: 'Beersheba', nameAr: 'بئر السبع' },
    sourceNameAr: 'المتحدث باسم الجيش الإسرائيلي',
    isBreaking: true,
    relatedCities: ['telaviv'],
  },
  {
    titleAr: 'حزب الله يعلن استهداف مقر قيادة شمالي بصواريخ بركان',
    descriptionAr: 'حزب الله يعلن إطلاق صواريخ بركان على مقر قيادة عسكرية إسرائيلية في شمال الجليل.',
    category: 'military',
    trustLevel: 'medium',
    trustReasonAr: 'بيان حزب الله، لم يتم التأكيد من الجانب الإسرائيلي بعد',
    location: { lat: 33.1, lng: 35.1, name: 'Northern Galilee', nameAr: 'شمال الجليل' },
    sourceNameAr: 'الجزيرة',
    isBreaking: false,
    whyItMattersAr: 'استخدام صواريخ بركان الثقيلة يشير إلى تصعيد نوعي من حزب الله.',
    relatedCities: ['haifa', 'beirut'],
  },
  {
    titleAr: 'تركيا تستدعي سفراء إيران وإسرائيل',
    descriptionAr: 'وزارة الخارجية التركية تستدعي سفيري إيران وإسرائيل وتطالب بوقف التصعيد فوراً.',
    category: 'official',
    trustLevel: 'confirmed',
    trustReasonAr: 'بيان رسمي من وزارة الخارجية التركية',
    location: { lat: 39.93, lng: 32.86, name: 'Ankara', nameAr: 'أنقرة' },
    sourceNameAr: 'أسوشيتد برس',
    isBreaking: false,
    relatedCities: [],
  },
  {
    titleAr: 'انقطاع الاتصالات في عدة مدن إيرانية',
    descriptionAr: 'تقارير عن انقطاع واسع في خدمات الإنترنت والاتصالات في أصفهان وشيراز وطهران.',
    category: 'alert',
    trustLevel: 'high',
    trustReasonAr: 'مؤكد من خدمات مراقبة الإنترنت العالمية',
    location: { lat: 35.69, lng: 51.39, name: 'Iran', nameAr: 'إيران' },
    sourceNameAr: 'محللو المصادر المفتوحة',
    isBreaking: false,
    whyItMattersAr: 'قطع الاتصالات غالباً ما يسبق عمليات عسكرية كبرى أو يرافقها.',
    relatedCities: ['tehran', 'isfahan'],
  },
];

let nextEventId = 100;

export function generateLiveEvent(): TrackerEvent {
  const template = liveEventTemplates[Math.floor(Math.random() * liveEventTemplates.length)];
  const id = `live-${nextEventId++}`;

  // Slight location randomization for variety
  const latOffset = (Math.random() - 0.5) * 0.5;
  const lngOffset = (Math.random() - 0.5) * 0.5;

  return {
    id,
    title: template.titleAr,
    titleAr: template.titleAr,
    description: template.descriptionAr,
    descriptionAr: template.descriptionAr,
    category: template.category,
    trustLevel: template.trustLevel,
    trustReason: template.trustReasonAr,
    trustReasonAr: template.trustReasonAr,
    location: {
      lat: template.location.lat + latOffset,
      lng: template.location.lng + lngOffset,
      name: template.location.name,
      nameAr: template.location.nameAr,
    },
    timestamp: now(),
    sources: [
      {
        sourceId: `s-live-${id}`,
        sourceName: template.sourceNameAr,
        sourceNameAr: template.sourceNameAr,
        timestamp: now(),
      },
    ],
    isBreaking: template.isBreaking,
    isDuplicate: false,
    whyItMatters: template.whyItMattersAr,
    whyItMattersAr: template.whyItMattersAr,
    relatedCities: template.relatedCities,
  };
}
