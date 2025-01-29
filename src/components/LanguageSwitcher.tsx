import { useTranslation } from "react-i18next"

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    localStorage.setItem('language', lang)
  }

  return (
    <div className="flex gap-1 items-center">
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-2 py-1 text-sm rounded-md border transition-colors ${
          i18n.language === 'en' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('ar')}
        className={`px-2 py-1 text-sm rounded-md border transition-colors ${
          i18n.language === 'ar' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
        }`}
        aria-label="Switch to Arabic"
      >
        ع
      </button>
    </div>
  )
}
