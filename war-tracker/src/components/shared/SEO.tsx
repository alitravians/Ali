import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
}

const BASE_URL = 'https://dist-mu-taupe-70.vercel.app';

const SEO_DATA: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'WarScope - مركز التتبع المباشر للأحداث الجيوسياسية',
    description: 'منصة تحليل وتتبع مباشر للأحداث الجيوسياسية والعسكرية — رصد بحري مباشر، تنبيهات فورية، تحليلات ذكية بالذكاء الاصطناعي',
  },
  '/live': {
    title: 'البث المباشر — WarScope',
    description: 'تتبع مباشر للأحداث الجيوسياسية والعسكرية مع بث بحري حي ومراقبة مضيق هرمز والبحر الأحمر وقناة السويس',
  },
  '/analysis': {
    title: 'التحليلات الذكية — WarScope',
    description: 'تحليل الأحداث الجيوسياسية بالذكاء الاصطناعي — تقييم المخاطر والتهديدات وتوقعات التطورات العسكرية',
  },
  '/sources': {
    title: 'المصادر — WarScope',
    description: 'مصادر البيانات والأخبار المستخدمة في WarScope — GDELT، NewsAPI، RSS، AISStream وغيرها',
  },
  '/cities': {
    title: 'خريطة المدن — WarScope',
    description: 'خريطة تفاعلية للمدن المتأثرة بالأحداث الجيوسياسية مع تقييم مستويات المخاطر',
  },
  '/alerts': {
    title: 'التنبيهات العاجلة — WarScope',
    description: 'تنبيهات فورية وأخبار عاجلة عن الأحداث الجيوسياسية والعسكرية حول العالم',
  },
  '/analytics': {
    title: 'الإحصائيات — WarScope',
    description: 'إحصائيات وبيانات تفصيلية عن الأحداث الجيوسياسية — رسوم بيانية وتحليلات رقمية',
  },
  '/status': {
    title: 'حالة النظام — WarScope',
    description: 'حالة النظام والخوادم — مراقبة أداء واستقرار منصة WarScope',
  },
};

export default function SEO({ title, description, path = '/' }: SEOProps) {
  const data = SEO_DATA[path] || SEO_DATA['/'];
  const pageTitle = title || data.title;
  const pageDescription = description || data.description;
  const pageUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={pageUrl} />
    </Helmet>
  );
}
