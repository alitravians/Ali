export const formatArabicTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'الآن'
    } else if (diffInMinutes === 1) {
      return 'منذ دقيقة واحدة'
    } else if (diffInMinutes === 2) {
      return 'منذ دقيقتين'
    } else if (diffInMinutes >= 3 && diffInMinutes <= 10) {
      return `منذ ${diffInMinutes} دقائق`
    } else if (diffInMinutes >= 11 && diffInMinutes <= 59) {
      return `منذ ${diffInMinutes} دقيقة`
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours === 1) {
        return 'منذ ساعة واحدة'
      } else if (diffInHours === 2) {
        return 'منذ ساعتين'
      } else if (diffInHours >= 3 && diffInHours <= 10) {
        return `منذ ${diffInHours} ساعات`
      } else if (diffInHours >= 11 && diffInHours <= 23) {
        return `منذ ${diffInHours} ساعة`
      } else {
        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays === 1) {
          return 'منذ يوم واحد'
        } else if (diffInDays === 2) {
          return 'منذ يومين'
        } else if (diffInDays >= 3 && diffInDays <= 10) {
          return `منذ ${diffInDays} أيام`
        } else {
          return `منذ ${diffInDays} يوم`
        }
      }
    }
  } catch {
    return 'الآن'
  }
}

export const formatArabicDuration = (minutes: number): string => {
  if (minutes === 1) {
    return 'دقيقة واحدة'
  } else if (minutes === 2) {
    return 'دقيقتين'
  } else if (minutes >= 3 && minutes <= 10) {
    return `${minutes} دقائق`
  } else if (minutes >= 11) {
    return `${minutes} دقيقة`
  } else {
    return `${minutes} دقيقة`
  }
}

export const arabicTranslations = {
  login: 'تسجيل الدخول',
  logout: 'تسجيل الخروج',
  username: 'اسم المستخدم',
  enterUsername: 'أدخل اسم المستخدم',
  loggingIn: 'جاري تسجيل الدخول...',
  
  chatSystem: 'نظام الدردشة',
  typeMessage: 'اكتب رسالتك هنا...',
  send: 'إرسال',
  sending: 'جاري الإرسال...',
  connected: 'متصل',
  disconnected: 'غير متصل',
  noMessages: 'لا توجد رسائل بعد. ابدأ المحادثة!',
  
  admin: 'مدير',
  moderator: 'مشرف',
  user: 'مستخدم',
  welcome: 'مرحباً',
  onlineUsers: 'المستخدمون المتصلون',
  noUsersOnline: 'لا يوجد مستخدمون متصلون',
  
  active: 'نشط',
  muted: 'مكتوم',
  banned: 'محظور',
  pending: 'قيد المراجعة',
  resolved: 'تم الحل',
  rejected: 'مرفوض',
  
  moderation: 'الإشراف',
  administration: 'الإدارة',
  deleteMessage: 'حذف رسالة',
  muteUser: 'كتم مستخدم',
  banUser: 'حظر مستخدم',
  messageId: 'معرف الرسالة',
  userId: 'معرف المستخدم',
  muteDuration: 'مدة الكتم (بالدقائق)',
  banDuration: 'مدة الحظر (بالدقائق)',
  banReason: 'سبب الحظر',
  deleting: 'جاري الحذف...',
  muting: 'جاري الكتم...',
  banning: 'جاري الحظر...',
  
  announcements: 'الإعلانات',
  users: 'المستخدمون',
  reports: 'البلاغات',
  appeals: 'طلبات الاستئناف',
  createAnnouncement: 'إنشاء إعلان جديد',
  announcementTitle: 'عنوان الإعلان',
  announcementContent: 'محتوى الإعلان',
  creating: 'جاري الإنشاء...',
  
  youAreBanned: 'تم حظرك من الدردشة',
  appealReason: 'سبب الاستئناف',
  submitAppeal: 'تقديم طلب الاستئناف',
  submitting: 'جاري التقديم...',
  appealSubmitted: 'تم تقديم طلب الاستئناف بنجاح',
  
  save: 'حفظ',
  cancel: 'إلغاء',
  delete: 'حذف',
  edit: 'تعديل',
  close: 'إغلاق',
  loading: 'جاري التحميل...',
  error: 'خطأ',
  success: 'نجح',
  pleaseWait: 'يرجى الانتظار...',
  
  now: 'الآن',
  minute: 'دقيقة',
  minutes: 'دقائق',
  hour: 'ساعة',
  hours: 'ساعات',
  day: 'يوم',
  days: 'أيام',
  
  charactersRemaining: 'حرف متبقي',
  maxCharacters: 'الحد الأقصى للأحرف'
}
