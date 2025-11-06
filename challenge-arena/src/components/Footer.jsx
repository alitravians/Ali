import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 py-6 text-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-slate-600 dark:text-slate-400">
          <p>
            {language === 'ar' 
              ? '© 2025 أرض التحديات - جميع الحقوق محفوظة' 
              : '© 2025 Challenge Arena - All Rights Reserved'}
          </p>
          <p>
            {language === 'ar' ? 'للتواصل: ' : 'Contact: '}
            <a 
              href="mailto:admin@challenger.example" 
              className="text-blue-600 dark:text-cyan-400 hover:underline"
            >
              admin@challenger.example
            </a>
            {' • '}
            {language === 'ar' ? 'واتساب: ' : 'WhatsApp: '}
            <a 
              href="https://wa.me/97300000000" 
              className="text-blue-600 dark:text-cyan-400 hover:underline"
            >
              +973 0000 0000
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
