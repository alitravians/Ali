import { Language } from './types';

const translations: Record<string, Record<Language, string>> = {
  gameTitle: {
    en: 'Snake City Game',
    ar: 'لعبة ثعبان المدينة'
  },
  startGame: {
    en: 'Start Game',
    ar: 'ابدأ اللعبة'
  },
  start: {
    en: 'Start',
    ar: 'ابدأ'
  },
  selectLevel: {
    en: 'Select Level',
    ar: 'اختر المستوى'
  },
  settings: {
    en: 'Settings',
    ar: 'الإعدادات'
  },
  language: {
    en: 'Language',
    ar: 'اللغة'
  },
  english: {
    en: 'English',
    ar: 'الإنجليزية'
  },
  arabic: {
    en: 'Arabic',
    ar: 'العربية'
  },
  sound: {
    en: 'Sound',
    ar: 'الصوت'
  },
  on: {
    en: 'On',
    ar: 'تشغيل'
  },
  off: {
    en: 'Off',
    ar: 'إيقاف'
  },
  difficulty: {
    en: 'Difficulty',
    ar: 'الصعوبة'
  },
  easy: {
    en: 'Easy',
    ar: 'سهل'
  },
  normal: {
    en: 'Normal',
    ar: 'عادي'
  },
  hard: {
    en: 'Hard',
    ar: 'صعب'
  },
  score: {
    en: 'Score',
    ar: 'النقاط'
  },
  gameOver: {
    en: 'Game Over',
    ar: 'انتهت اللعبة'
  },
  retry: {
    en: 'Retry',
    ar: 'إعادة المحاولة'
  },
  mainMenu: {
    en: 'Main Menu',
    ar: 'القائمة الرئيسية'
  },
  levelCompleted: {
    en: 'Level Completed!',
    ar: 'اكتمل المستوى!'
  },
  nextLevel: {
    en: 'Next Level',
    ar: 'المستوى التالي'
  },
  cityUnlocked: {
    en: 'New City Unlocked!',
    ar: 'تم فتح مدينة جديدة!'
  },
  saveManager: {
    en: 'Save Manager',
    ar: 'إدارة الحفظ'
  },
  save: {
    en: 'Save',
    ar: 'حفظ'
  },
  load: {
    en: 'Load',
    ar: 'تحميل'
  },
  delete: {
    en: 'Delete',
    ar: 'حذف'
  },
  noSaveData: {
    en: 'No save data found',
    ar: 'لم يتم العثور على بيانات محفوظة'
  },
  saveSuccess: {
    en: 'Game saved successfully',
    ar: 'تم حفظ اللعبة بنجاح'
  },
  loadSuccess: {
    en: 'Game loaded successfully',
    ar: 'تم تحميل اللعبة بنجاح'
  },
  deleteSuccess: {
    en: 'Save data deleted successfully',
    ar: 'تم حذف بيانات الحفظ بنجاح'
  },
  confirmDelete: {
    en: 'Are you sure you want to delete your save data?',
    ar: 'هل أنت متأكد من أنك تريد حذف بيانات الحفظ الخاصة بك؟'
  },
  yes: {
    en: 'Yes',
    ar: 'نعم'
  },
  no: {
    en: 'No',
    ar: 'لا'
  },
  pause: {
    en: 'Pause',
    ar: 'إيقاف مؤقت'
  },
  resume: {
    en: 'Resume',
    ar: 'استئناف'
  },
  updatesPage: {
    en: 'Updates',
    ar: 'التحديثات'
  },
  backToGame: {
    en: 'Back to Game',
    ar: 'العودة إلى اللعبة'
  },
  gameUpdates: {
    en: 'Game Updates',
    ar: 'تحديثات اللعبة'
  },
  noUpdates: {
    en: 'No updates available',
    ar: 'لا توجد تحديثات متاحة'
  },
  adminDashboard: {
    en: 'Admin Dashboard',
    ar: 'لوحة تحكم الإدارة'
  },
  adminAccess: {
    en: 'Admin Access',
    ar: 'وصول الإدارة'
  },
  enterAccessCode: {
    en: 'Enter Access Code',
    ar: 'أدخل رمز الوصول'
  },
  submit: {
    en: 'Submit',
    ar: 'إرسال'
  },
  invalidCode: {
    en: 'Invalid access code',
    ar: 'رمز الوصول غير صالح'
  },
  gameControlPanel: {
    en: 'Game Control Panel',
    ar: 'لوحة تحكم اللعبة'
  },
  gameStatus: {
    en: 'Game Status',
    ar: 'حالة اللعبة'
  },
  open: {
    en: 'Open',
    ar: 'مفتوح'
  },
  closed: {
    en: 'Closed',
    ar: 'مغلق'
  },
  closureReason: {
    en: 'Closure Reason',
    ar: 'سبب الإغلاق'
  },
  enterClosureReason: {
    en: 'Enter reason for closing the game',
    ar: 'أدخل سبب إغلاق اللعبة'
  },
  saveChanges: {
    en: 'Save Changes',
    ar: 'حفظ التغييرات'
  },
  announcementsPanel: {
    en: 'Announcements Panel',
    ar: 'لوحة الإعلانات'
  },
  announcementsPanelDescription: {
    en: 'Manage announcements that will be displayed to players',
    ar: 'إدارة الإعلانات التي سيتم عرضها للاعبين'
  },
  announcementContent: {
    en: 'Announcement Content',
    ar: 'محتوى الإعلان'
  },
  enterAnnouncementContent: {
    en: 'Enter announcement content',
    ar: 'أدخل محتوى الإعلان'
  },
  announcementAuthor: {
    en: 'Author',
    ar: 'الكاتب'
  },
  enterAuthorName: {
    en: 'Enter author name',
    ar: 'أدخل اسم الكاتب'
  },
  announcementDuration: {
    en: 'Duration (seconds)',
    ar: 'المدة (بالثواني)'
  },
  addAnnouncement: {
    en: 'Add Announcement',
    ar: 'إضافة إعلان'
  },
  currentAnnouncements: {
    en: 'Current Announcements',
    ar: 'الإعلانات الحالية'
  },
  noAnnouncements: {
    en: 'No announcements yet',
    ar: 'لا توجد إعلانات حتى الآن'
  },
  duration: {
    en: 'Duration',
    ar: 'المدة'
  },
  seconds: {
    en: 'seconds',
    ar: 'ثواني'
  },
  updatesPanel: {
    en: 'Updates Panel',
    ar: 'لوحة التحديثات'
  },
  updatesPanelDescription: {
    en: 'Manage game updates that will be displayed on the updates page',
    ar: 'إدارة تحديثات اللعبة التي سيتم عرضها على صفحة التحديثات'
  },
  updateContent: {
    en: 'Update Content',
    ar: 'محتوى التحديث'
  },
  enterUpdateContent: {
    en: 'Enter update content',
    ar: 'أدخل محتوى التحديث'
  },
  addUpdate: {
    en: 'Add Update',
    ar: 'إضافة تحديث'
  },
  currentUpdates: {
    en: 'Current Updates',
    ar: 'التحديثات الحالية'
  },
  gameClosed: {
    en: 'Game is currently closed',
    ar: 'اللعبة مغلقة حاليًا'
  },
  toggleDevice: {
    en: 'Toggle Device Mode',
    ar: 'تبديل وضع الجهاز'
  },
  selectCity: {
    en: 'Select City',
    ar: 'اختر المدينة'
  },
  theme: {
    en: 'Theme',
    ar: 'السمة'
  },
  difficultyMultiplier: {
    en: 'Difficulty Multiplier',
    ar: 'مضاعف الصعوبة'
  },
  locked: {
    en: 'Locked',
    ar: 'مغلق'
  },
  loading: {
    en: 'Loading',
    ar: 'جاري التحميل'
  }
};

export function t(key: string, language: Language): string {
  if (!translations[key]) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  
  return translations[key][language] || translations[key]['en'] || key;
}

export { translations };

export const getDirection = (language: Language): string => {
  return language === 'ar' ? 'rtl' : 'ltr';
};

export const isRTL = (language: Language): boolean => {
  return language === 'ar';
};

export default translations;
