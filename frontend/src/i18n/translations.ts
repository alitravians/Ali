export type Language = 'ar';

export interface Translation {
  direction: string;
  team: {
    title: string;
    communityManager: string;
    notices: {
      noNews: string;
    };
    sections: {
      generalManagement: string;
      subAdministrator: string;
      janitors: string;
      support: string;
    };
    columns: {
      name: string;
      responsibility: string;
      avatar: string;
    };
    roles: {
      administrator: string;
      general: string;
      support: string;
    };
    noMembers: string;
  };
  visitorSupport: {
    title: string;
    loginAsAdmin: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    nameValidation: string;
    emailValidation: string;
    messageValidation: string;
    errorSubmittingRequest: string;
    requestSubmittedSuccessfully: string;
  };
  tutorial: {
    title: string;
    step1: {
      title: string;
      description: string;
    };
    step2: {
      title: string;
      description: string;
    };
    step3: {
      title: string;
      description: string;
    };
    step4: {
      title: string;
      description: string;
    };
    step5: {
      title: string;
      description: string;
    };
  };
  visitor: {
    title: string;
    name: string;
    email: string;
    message: string;
    submit: string;
    submitting: string;
    requestSubmittedSuccessfully: string;
    errorSubmittingRequest: string;
    nameValidation: string;
    emailValidation: string;
    messageValidation: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
  };
  common: {
    submit: string;
    back: string;
    loading: string;
    cancel: string;
    close: string;
    more: string;
    previous: string;
    next: string;
    morePages: string;
    toggleSidebar: string;
  };
  login: {
    title: string;
    username: string;
    password: string;
    submit: string;
    loginError: string;
    errorInvalidCredentials: string;
  };
  tickets: {
    list: string;
    create: string;
    status: string;
    subject: string;
    description: string;
    priority: string;
    assignedTo: string;
    createdAt: string;
    updatedAt: string;
    messages: {
      title: string;
    };
  };
}

export const translations: { ar: Translation } = {
  ar: {
    direction: 'rtl',
    team: {
      title: 'فريق العمل',
      communityManager: 'مدير المجتمع',
      notices: {
        noNews: 'تحذيرات من مدير المجتمع: لا توجد أخبار جديدة',
      },
      sections: {
        generalManagement: 'الإدارة العامة',
        subAdministrator: 'نائب المدير',
        janitors: 'المشرفين',
        support: 'الدعم'
      },
      columns: {
        name: 'الاسم',
        responsibility: 'المسؤولية',
        avatar: 'الصورة الرمزية'
      },
      roles: {
        administrator: 'مدير',
        general: 'عام',
        support: 'دعم'
      },
      noMembers: 'لا يوجد أعضاء في هذا القسم'
    },
    visitorSupport: {
      title: 'نظام الدعم الفني',
      loginAsAdmin: 'تسجيل الدخول كمشرف',
      name: 'الاسم الكامل',
      namePlaceholder: 'أدخل اسمك الكامل',
      email: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      message: 'الرسالة',
      messagePlaceholder: 'اكتب رسالتك هنا...',
      submit: 'إرسال الطلب',
      submitting: 'جاري الإرسال...',
      nameValidation: 'يجب أن يكون الاسم بين 2 و 50 حرفاً',
      emailValidation: 'يرجى إدخال بريد إلكتروني صحيح',
      messageValidation: 'يجب أن تكون الرسالة بين 10 و 500 حرف',
      errorSubmittingRequest: 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.',
      requestSubmittedSuccessfully: 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً.'
    },
    tutorial: {
      title: 'كيفية استخدام نظام الدعم الفني',
      step1: {
        title: 'الخطوة الأولى: إدخال المعلومات الشخصية',
        description: 'قم بإدخال اسمك الكامل في الحقل المخصص. تأكد من كتابة اسمك بشكل صحيح حتى نتمكن من التواصل معك بشكل مناسب.'
      },
      step2: {
        title: 'الخطوة الثانية: إدخال البريد الإلكتروني',
        description: 'أدخل عنوان بريدك الإلكتروني الذي تستخدمه بشكل منتظم. سنقوم بإرسال تحديثات حالة طلبك على هذا البريد.'
      },
      step3: {
        title: 'الخطوة الثالثة: كتابة تفاصيل المشكلة',
        description: 'اشرح المشكلة التي تواجهها بالتفصيل. كلما كان وصفك أكثر دقة، كلما تمكنا من مساعدتك بشكل أفضل وأسرع.'
      },
      step4: {
        title: 'الخطوة الرابعة: إرسال الطلب',
        description: 'بعد التأكد من صحة جميع المعلومات، انقر على زر "إرسال الطلب" لتقديم طلب الدعم الفني.'
      },
      step5: {
        title: 'الخطوة الخامسة: متابعة حالة الطلب',
        description: 'بعد إرسال طلبك، ستتمكن من متابعة حالته عبر رقم التذكرة الخاص بك. سنقوم بإخطارك عبر البريد الإلكتروني بأي تحديثات.'
      }
    },
    visitor: {
      title: 'طلب دعم فني',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      message: 'الرسالة',
      submit: 'إرسال',
      submitting: 'جاري الإرسال...',
      requestSubmittedSuccessfully: 'تم إرسال طلبك بنجاح. سيقوم فريق الدعم بالرد قريباً.',
      errorSubmittingRequest: 'حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.',
      nameValidation: 'يجب أن يكون الاسم بين 2 و 50 حرفاً',
      emailValidation: 'يرجى إدخال بريد إلكتروني صحيح',
      messageValidation: 'يجب أن تكون الرسالة بين 10 و 500 حرف',
      namePlaceholder: 'أدخل اسمك',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      messagePlaceholder: 'كيف يمكننا مساعدتك؟'
    },
    common: {
      submit: 'إرسال',
      back: 'رجوع',
      loading: 'جاري التحميل...',
      cancel: 'إلغاء',
      close: 'إغلاق',
      more: 'المزيد',
      previous: 'السابق',
      next: 'التالي',
      morePages: 'المزيد من الصفحات',
      toggleSidebar: 'تبديل الشريط الجانبي'
    },
    login: {
      title: 'تسجيل الدخول',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      submit: 'تسجيل الدخول',
      loginError: 'خطأ في تسجيل الدخول',
      errorInvalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة'
    },
    tickets: {
      list: 'التذاكر',
      create: 'إنشاء تذكرة جديدة',
      status: 'الحالة',
      subject: 'الموضوع',
      description: 'الوصف',
      priority: 'الأولوية',
      assignedTo: 'مسند إلى',
      createdAt: 'تاريخ الإنشاء',
      updatedAt: 'آخر تحديث',
      messages: {
        title: 'الرسائل'
      }
    }
  }
};

export const ar = translations.ar;
