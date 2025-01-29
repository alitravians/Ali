import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

const resources = {
  en: {
    translation: {
      // Form Labels
      firstNameLabel: "First Name",
      middleNameLabel: "Middle Name",
      lastNameLabel: "Last Name",
      emailLabel: "Email Address",
      picoIdLabel: "Pico ID",
      reasonLabel: "Reason for Request",
      
      // Buttons
      submitButton: "Submit Request",
      viewTrendsButton: "View Accepted/Rejected Trends",
      submitNewRequestButton: "Submit New Request",
      
      // Form Validation
      nameValidationError: "First name must contain only letters, spaces, hyphens, or apostrophes and be between 1 and 50 characters",
      lastNameValidationError: "Last name must contain only letters, spaces, hyphens, or apostrophes and be between 1 and 50 characters",
      middleNameValidationError: "Middle name must contain only letters, spaces, hyphens, or apostrophes and not exceed 50 characters",
      emailValidationError: "Please enter a valid email address",
      picoIdValidationError: "Pico ID must contain only letters and numbers and not exceed 20 characters",
      reasonLengthError: "Reason must be between 10 and 1000 characters",
      
      // Admin Login
      adminLoginTitle: "Admin Login",
      adminLoginDescription: "Enter your credentials to access the admin dashboard",
      usernameLabel: "Username",
      passwordLabel: "Password",
      loginButton: "Login",
      loggingInText: "Logging in...",
      invalidCredentials: "Invalid credentials",
      loginFailedError: "Failed to login. Please try again.",
      closeButton: "Close",
      
      // Status Labels
      underReviewStatus: "Under Review",
      approvedStatus: "Approved",
      rejectedStatus: "Rejected",
      
      // Messages
      noTrendsMessage: "No accepted or rejected trends yet",
      fetchError: "Failed to fetch trends",
      networkError: "Network error while fetching trends",
      submissionSuccess: "Your request has been submitted successfully!",
      submittingText: "Submitting...",
      trendRequestTitle: "Trend Request Form",
      trendRequestDescription: "Submit your trend request for review",
      
      // Language Selection
      languageSelect: "Select Language",
      englishOption: "English",
      arabicOption: "العربية"
    }
  },
  ar: {
    translation: {
      // Form Labels
      firstNameLabel: "الاسم الأول",
      middleNameLabel: "الاسم الأوسط",
      lastNameLabel: "اسم العائلة",
      emailLabel: "البريد الإلكتروني",
      picoIdLabel: "معرف بيكو",
      reasonLabel: "سبب الطلب",
      
      // Buttons
      submitButton: "تقديم الطلب",
      viewTrendsButton: "عرض الاتجاهات المقبولة/المرفوضة",
      submitNewRequestButton: "تقديم طلب جديد",
      
      // Form Validation
      nameValidationError: "يجب أن يحتوي الاسم الأول على أحرف ومسافات وشرطات وعلامات اقتباس فقط وأن يكون بين 1 و 50 حرفًا",
      lastNameValidationError: "يجب أن يحتوي اسم العائلة على أحرف ومسافات وشرطات وعلامات اقتباس فقط وأن يكون بين 1 و 50 حرفًا",
      middleNameValidationError: "يجب أن يحتوي الاسم الأوسط على أحرف ومسافات وشرطات وعلامات اقتباس فقط ولا يتجاوز 50 حرفًا",
      emailValidationError: "يرجى إدخال عنوان بريد إلكتروني صالح",
      picoIdValidationError: "يجب أن يحتوي معرف بيكو على أحرف وأرقام فقط ولا يتجاوز 20 حرفًا",
      reasonLengthError: "يجب أن يكون السبب بين 10 و 1000 حرف",
      
      // Admin Login
      adminLoginTitle: "تسجيل دخول المسؤول",
      adminLoginDescription: "أدخل بيانات اعتماد للوصول إلى لوحة تحكم المسؤول",
      usernameLabel: "اسم المستخدم",
      passwordLabel: "كلمة المرور",
      loginButton: "تسجيل الدخول",
      loggingInText: "جاري تسجيل الدخول...",
      invalidCredentials: "بيانات الاعتماد غير صالحة",
      loginFailedError: "فشل تسجيل الدخول. حاول مرة أخرى.",
      closeButton: "إغلاق",
      
      // Status Labels
      underReviewStatus: "قيد المراجعة",
      approvedStatus: "مقبول",
      rejectedStatus: "مرفوض",
      
      // Messages
      noTrendsMessage: "لا توجد اتجاهات مقبولة أو مرفوضة حتى الآن",
      fetchError: "فشل في جلب الاتجاهات",
      networkError: "خطأ في الشبكة أثناء جلب الاتجاهات",
      submissionSuccess: "تم تقديم طلبك بنجاح!",
      submittingText: "جاري التقديم...",
      trendRequestTitle: "نموذج طلب الاتجاه",
      trendRequestDescription: "قدم طلب الاتجاه الخاص بك للمراجعة",
      
      // Language Selection
      languageSelect: "اختر اللغة",
      englishOption: "English",
      arabicOption: "العربية"
    }
  }
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: localStorage.getItem('language') || 'en',
    react: {
      useSuspense: false
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n
