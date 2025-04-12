import { Language } from './types';

type TranslationKeys = 
  | 'startGame'
  | 'selectLevel'
  | 'settings'
  | 'sound'
  | 'language'
  | 'difficulty'
  | 'easy'
  | 'normal'
  | 'hard'
  | 'on'
  | 'off'
  | 'english'
  | 'arabic'
  | 'close'
  | 'score'
  | 'highScore'
  | 'level'
  | 'city'
  | 'progress'
  | 'pause'
  | 'resume'
  | 'restart'
  | 'gameOver'
  | 'levelCompleted'
  | 'continueToNextLevel'
  | 'backToMenu'
  | 'selectCity'
  | 'locked'
  | 'unlocked'
  | 'completed'
  | 'copyright'
  | 'pressToStart'
  | 'controls'
  | 'soundOn'
  | 'soundOff'
  | 'progressToNextLevel'
  | 'continue'
  | 'play'
  | 'saveManager'
  | 'gameProgress'
  | 'completedLevels'
  | 'unlockedCities'
  | 'totalHighScore'
  | 'lastPlayed'
  | 'resetProgress'
  | 'resetWarning'
  | 'confirmReset'
  | 'cancel'
  | 'saveLoadError'
  | 'saveSuccess'
  | 'loadSuccess'
  | 'resetSuccess'
  | 'updatesPage'
  | 'version'
  | 'initialRelease'
  | 'coreGameMechanics'
  | 'tenGameLevels'
  | 'sixCityThemes'
  | 'progressiveDifficulty'
  | 'gameControlPanel'
  | 'gameControlDescription'
  | 'bilingualSupport'
  | 'saveGameProgress'
  | 'soundSystem'
  | 'betaRelease'
  | 'levelSelection'
  | 'cityThemes'
  | 'soundEffects'
  | 'languageToggle'
  | 'alphaRelease'
  | 'basicGameplay'
  | 'snakeMovement'
  | 'collisionDetection'
  | 'foodGeneration'
  | 'upcomingFeatures'
  | 'multiplayerMode'
  | 'customizableSnake'
  | 'achievementSystem'
  | 'leaderboards'
  | 'adminDashboard'
  | 'adminAccessCode'
  | 'adminAccess'
  | 'invalidAccessCode'
  | 'gameClosedTitle'
  | 'gameClosedMessage'
  | 'checkBackLater'
  | 'gameControl'
  | 'announcements'
  | 'gameStatus'
  | 'gameOpen'
  | 'gameClosed'
  | 'closureReason'
  | 'enterClosureReason'
  | 'closureReasonDescription'
  | 'saveChanges'
  | 'saving'
  | 'saved'
  | 'announcementsPanel'
  | 'announcementsPanelDescription'
  | 'enterNewAnnouncement'
  | 'addAnnouncement'
  | 'currentAnnouncements'
  | 'noAnnouncements'
  | 'delete'
  | 'author'
  | 'updatesPanel'
  | 'updatesPanelDescription'
  | 'enterNewUpdate'
  | 'addUpdate'
  | 'currentUpdates'
  | 'noUpdates'
  | 'toggleDevice'
  | 'updateDeleted'
  | 'selectUpdate'
  | 'deleteUpdate'
  | 'selectUpdatePlaceholder'
  | 'updatesPagePlaceholder'
  | 'authorPlaceholder'
  | 'duration'
  | 'saveUpdate'
  | 'seconds';

type Translations = {
  [key in TranslationKeys]: string;
};

const enTranslations: Translations = {
  startGame: 'Start Game',
  selectLevel: 'Select Level',
  settings: 'Settings',
  sound: 'Sound',
  language: 'Language',
  difficulty: 'Difficulty',
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  on: 'On',
  off: 'Off',
  english: 'English',
  arabic: 'Arabic',
  close: 'Close',
  score: 'Score',
  highScore: 'High Score',
  level: 'Level',
  city: 'City',
  progress: 'Progress',
  pause: 'Pause',
  resume: 'Resume',
  restart: 'Restart',
  gameOver: 'Game Over',
  levelCompleted: 'Level Completed!',
  continueToNextLevel: 'Continue to Next Level',
  backToMenu: 'Back to Menu',
  selectCity: 'Select City',
  locked: 'Locked',
  unlocked: 'Unlocked',
  completed: 'Completed',
  copyright: '© 2025 Snake Game - All Rights Reserved',
  pressToStart: 'Press the button to start the game',
  controls: 'Use arrow keys or WASD to move\nSpace to pause, R to restart',
  soundOn: 'Sound On',
  soundOff: 'Sound Off',
  progressToNextLevel: 'Progress to next level',
  continue: 'Continue',
  play: 'Play',
  saveManager: 'Save Manager',
  gameProgress: 'Game Progress',
  completedLevels: 'Completed Levels',
  unlockedCities: 'Unlocked Cities',
  totalHighScore: 'Total High Score',
  lastPlayed: 'Last Played',
  resetProgress: 'Reset Progress',
  resetWarning: 'This will reset all your progress, including unlocked levels, cities, and high scores. This action cannot be undone.',
  confirmReset: 'Yes, Reset',
  cancel: 'Cancel',
  saveLoadError: 'Error saving/loading game data',
  saveSuccess: 'Game progress saved successfully',
  loadSuccess: 'Game progress loaded successfully',
  resetSuccess: 'Game progress reset successfully',
  updatesPage: 'Updates & Changelog',
  version: 'Version',
  initialRelease: 'Initial Release',
  coreGameMechanics: 'Core Game Mechanics',
  tenGameLevels: '10 Game Levels',
  sixCityThemes: '6 City Themes',
  progressiveDifficulty: 'Progressive Difficulty System',
  gameControlPanel: 'Game Control Panel',
  gameControlDescription: 'Control the game status and closure settings',
  bilingualSupport: 'Bilingual Support (Arabic/English)',
  saveGameProgress: 'Save Game Progress',
  soundSystem: 'Sound System',
  betaRelease: 'Beta Release',
  levelSelection: 'Level Selection',
  cityThemes: 'City Themes',
  soundEffects: 'Sound Effects',
  languageToggle: 'Language Toggle',
  alphaRelease: 'Alpha Release',
  basicGameplay: 'Basic Gameplay',
  snakeMovement: 'Snake Movement',
  collisionDetection: 'Collision Detection',
  foodGeneration: 'Food Generation',
  upcomingFeatures: 'Upcoming Features',
  multiplayerMode: 'Multiplayer Mode',
  customizableSnake: 'Customizable Snake',
  achievementSystem: 'Achievement System',
  leaderboards: 'Leaderboards',
  adminDashboard: 'Admin Dashboard',
  adminAccessCode: 'Enter Access Code',
  adminAccess: 'Access',
  invalidAccessCode: 'Invalid access code',
  gameClosedTitle: 'Game Closed',
  gameClosedMessage: 'The game is currently closed for maintenance.',
  checkBackLater: 'Please check back later.',
  gameControl: 'Game Control',
  announcements: 'Announcements',
  gameStatus: 'Game Status',
  gameOpen: 'Game is currently open',
  gameClosed: 'Game is currently closed',
  closureReason: 'Closure Reason',
  enterClosureReason: 'Enter reason for game closure',
  closureReasonDescription: 'This message will be displayed to players when they try to access the game',
  saveChanges: 'Save Changes',
  saving: 'Saving...',
  saved: 'Saved!',
  announcementsPanel: 'Announcements Panel',
  announcementsPanelDescription: 'Manage game announcements',
  enterNewAnnouncement: 'Enter new announcement...',
  addAnnouncement: 'Add Announcement',
  currentAnnouncements: 'Current Announcements',
  noAnnouncements: 'No announcements available',
  delete: 'Delete',
  author: 'Author',
  updatesPanel: 'Updates Panel',
  updatesPanelDescription: 'Manage game updates and announcements',
  enterNewUpdate: 'Enter new update content...',
  addUpdate: 'Add Update',
  currentUpdates: 'Current Updates',
  noUpdates: 'No updates available',
  toggleDevice: 'Toggle Device Mode',
  updateDeleted: 'Update deleted successfully',
  selectUpdate: 'Select Update',
  deleteUpdate: 'Delete Update',
  selectUpdatePlaceholder: 'Select an update',
  updatesPagePlaceholder: 'Enter update content...',
  authorPlaceholder: 'Enter author name',
  duration: 'Duration (seconds)',
  saveUpdate: 'Save Update',
  seconds: 'seconds'
};

const arTranslations: Translations = {
  startGame: 'ابدأ اللعبة',
  selectLevel: 'اختر المستوى',
  settings: 'الإعدادات',
  sound: 'الصوت',
  language: 'اللغة',
  difficulty: 'الصعوبة',
  easy: 'سهل',
  normal: 'عادي',
  hard: 'صعب',
  on: 'تشغيل',
  off: 'إيقاف',
  english: 'الإنجليزية',
  arabic: 'العربية',
  close: 'إغلاق',
  score: 'النتيجة',
  highScore: 'أعلى نتيجة',
  level: 'المستوى',
  city: 'المدينة',
  progress: 'التقدم',
  pause: 'إيقاف مؤقت',
  resume: 'استئناف',
  restart: 'إعادة تشغيل',
  gameOver: 'انتهت اللعبة',
  levelCompleted: 'اكتمل المستوى!',
  continueToNextLevel: 'استمر إلى المستوى التالي',
  backToMenu: 'العودة إلى القائمة',
  selectCity: 'اختر المدينة',
  locked: 'مقفل',
  unlocked: 'مفتوح',
  completed: 'مكتمل',
  copyright: '© 2025 لعبة الثعبان - جميع الحقوق محفوظة',
  pressToStart: 'اضغط على الزر لبدء اللعبة',
  controls: 'استخدم مفاتيح الأسهم أو WASD للتحرك\nمسافة للإيقاف المؤقت، R لإعادة التشغيل',
  soundOn: 'الصوت مفعل',
  soundOff: 'الصوت معطل',
  progressToNextLevel: 'التقدم للمستوى التالي',
  continue: 'استمر',
  play: 'العب',
  saveManager: 'مدير الحفظ',
  gameProgress: 'تقدم اللعبة',
  completedLevels: 'المستويات المكتملة',
  unlockedCities: 'المدن المفتوحة',
  totalHighScore: 'مجموع النقاط العالية',
  lastPlayed: 'آخر لعب',
  resetProgress: 'إعادة ضبط التقدم',
  resetWarning: 'سيؤدي هذا إلى إعادة ضبط كل تقدمك، بما في ذلك المستويات المفتوحة والمدن والنتائج العالية. لا يمكن التراجع عن هذا الإجراء.',
  confirmReset: 'نعم، إعادة الضبط',
  cancel: 'إلغاء',
  saveLoadError: 'خطأ في حفظ/تحميل بيانات اللعبة',
  saveSuccess: 'تم حفظ تقدم اللعبة بنجاح',
  loadSuccess: 'تم تحميل تقدم اللعبة بنجاح',
  resetSuccess: 'تم إعادة ضبط تقدم اللعبة بنجاح',
  updatesPage: 'التحديثات والتغييرات',
  version: 'الإصدار',
  initialRelease: 'الإصدار الأولي',
  coreGameMechanics: 'آليات اللعبة الأساسية',
  tenGameLevels: '10 مستويات لعب',
  sixCityThemes: '6 سمات للمدن',
  progressiveDifficulty: 'نظام صعوبة تدريجي',
  gameControlPanel: 'لوحة تحكم اللعبة',
  gameControlDescription: 'التحكم في حالة اللعبة وإعدادات الإغلاق',
  bilingualSupport: 'دعم ثنائي اللغة (العربية/الإنجليزية)',
  saveGameProgress: 'حفظ تقدم اللعبة',
  soundSystem: 'نظام الصوت',
  betaRelease: 'إصدار تجريبي',
  levelSelection: 'اختيار المستوى',
  cityThemes: 'سمات المدن',
  soundEffects: 'مؤثرات صوتية',
  languageToggle: 'تبديل اللغة',
  alphaRelease: 'إصدار ألفا',
  basicGameplay: 'طريقة اللعب الأساسية',
  snakeMovement: 'حركة الثعبان',
  collisionDetection: 'اكتشاف التصادم',
  foodGeneration: 'توليد الطعام',
  upcomingFeatures: 'الميزات القادمة',
  multiplayerMode: 'وضع متعدد اللاعبين',
  customizableSnake: 'ثعبان قابل للتخصيص',
  achievementSystem: 'نظام الإنجازات',
  leaderboards: 'لوحات المتصدرين',
  adminDashboard: 'لوحة تحكم المسؤول',
  adminAccessCode: 'أدخل رمز الوصول',
  adminAccess: 'وصول',
  invalidAccessCode: 'رمز الوصول غير صالح',
  gameClosedTitle: 'اللعبة مغلقة',
  gameClosedMessage: 'اللعبة مغلقة حاليًا للصيانة.',
  checkBackLater: 'يرجى التحقق لاحقًا.',
  gameControl: 'التحكم باللعبة',
  announcements: 'الإعلانات',
  gameStatus: 'حالة اللعبة',
  gameOpen: 'اللعبة مفتوحة حاليًا',
  gameClosed: 'اللعبة مغلقة حاليًا',
  closureReason: 'سبب الإغلاق',
  enterClosureReason: 'أدخل سبب إغلاق اللعبة',
  closureReasonDescription: 'سيتم عرض هذه الرسالة للاعبين عندما يحاولون الوصول إلى اللعبة',
  saveChanges: 'حفظ التغييرات',
  saving: 'جاري الحفظ...',
  saved: 'تم الحفظ!',
  announcementsPanel: 'لوحة الإعلانات',
  announcementsPanelDescription: 'إدارة إعلانات اللعبة',
  enterNewAnnouncement: 'أدخل إعلانًا جديدًا...',
  addAnnouncement: 'إضافة إعلان',
  currentAnnouncements: 'الإعلانات الحالية',
  noAnnouncements: 'لا توجد إعلانات متاحة',
  delete: 'حذف',
  author: 'الكاتب',
  updatesPanel: 'لوحة التحديثات',
  updatesPanelDescription: 'إدارة تحديثات وإعلانات اللعبة',
  enterNewUpdate: 'أدخل محتوى التحديث الجديد...',
  addUpdate: 'إضافة تحديث',
  currentUpdates: 'التحديثات الحالية',
  noUpdates: 'لا توجد تحديثات متاحة',
  toggleDevice: 'تبديل وضع الجهاز',
  updateDeleted: 'تم حذف التحديث بنجاح',
  selectUpdate: 'اختر التحديث',
  deleteUpdate: 'حذف التحديث',
  selectUpdatePlaceholder: 'اختر تحديثًا',
  updatesPagePlaceholder: 'أدخل محتوى التحديث...',
  authorPlaceholder: 'أدخل اسم الكاتب',
  duration: 'المدة (بالثواني)',
  saveUpdate: 'حفظ التحديث',
  seconds: 'ثواني'
};

export const translations = {
  en: enTranslations,
  ar: arTranslations
};

export const getTranslation = (key: TranslationKeys, language: Language): string => {
  return translations[language][key];
};

export const t = (key: TranslationKeys, language: Language): string => {
  return getTranslation(key, language);
};

export const isRTL = (language: Language): boolean => {
  return language === 'ar';
};

export const getDirection = (language: Language): 'ltr' | 'rtl' => {
  return isRTL(language) ? 'rtl' : 'ltr';
};

export const getTextAlign = (language: Language): 'left' | 'right' => {
  return isRTL(language) ? 'right' : 'left';
};

export const getFontFamily = (language: Language): string => {
  return language === 'ar' 
    ? "'Tajawal', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
};
