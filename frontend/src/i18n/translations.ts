export const translations = {
  ar: {
    direction: 'rtl',
    visitorSupport: {
      title: 'إرسال طلب دعم فني',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      message: 'الرسالة',
      submit: 'إرسال',
      submitting: 'جاري الإرسال...',
      requestSubmittedSuccessfully: 'تم إرسال طلبك بنجاح. سيقوم فريق الدعم بالرد عليك قريباً.',
      errorSubmittingRequest: 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.',
      loginAsAdmin: 'تسجيل الدخول كمشرف',
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
      loading: 'جاري التحميل...'
    },
    admin: {
      title: 'لوحة التحكم',
      tabs: {
        users: 'المستخدمين',
        tickets: 'التذاكر',
        reports: 'البلاغات',
        ads: 'الإعلانات',
        moderators: 'المشرفين'
      },
      users: {
        select: 'اختر مستخدم',
        selectPlaceholder: 'اختر مستخدم...',
        banDuration: 'مدة الحظر',
        banReason: 'سبب الحظر',
        banReasonPlaceholder: 'ادخل سبب الحظر...',
        banButton: 'حظر المستخدم'
      },
      moderators: {
        add: 'إضافة مشرف',
        remove: 'إزالة مشرف',
        permissions: 'الصلاحيات',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        create: 'إنشاء مشرف',
        usernamePlaceholder: 'أدخل اسم المستخدم للمشرف',
        passwordPlaceholder: 'أدخل كلمة المرور للمشرف'
      },
      ads: {
        create: 'إنشاء إعلان',
        title: 'عنوان الإعلان',
        content: 'محتوى الإعلان',
        duration: 'مدة العرض',
        active: 'نشط',
        inactive: 'غير نشط'
      },
      time: {
        day: 'يوم',
        days: 'أيام',
        hours: 'ساعات'
      },
      reports: {
        status: 'الحالة',
        pending: 'قيد الانتظار',
        resolved: 'تم الحل',
        dismissed: 'مرفوض'
      }
    },
    login: {
      title: 'تسجيل الدخول',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      submit: 'دخول',
      loginError: 'خطأ في تسجيل الدخول',
      errorInvalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة'
    },
    tickets: {
      list: 'قائمة التذاكر',
      create: 'إنشاء تذكرة جديدة',
      title: 'العنوان',
      description: 'الوصف',
      status: {
        open: 'مفتوحة',
        in_progress: 'قيد المعالجة',
        resolved: 'تم الحل',
        closed: 'مغلقة'
      }
    },
    messages: {
      send: 'إرسال',
      placeholder: 'اكتب رسالتك هنا',
      title: 'الرسائل'
    }
  },
  en: {
    direction: 'ltr',
    visitorSupport: {
      title: 'Submit Support Request',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      submit: 'Submit',
      submitting: 'Submitting...',
      requestSubmittedSuccessfully: 'Your request has been submitted successfully. Our support team will respond soon.',
      errorSubmittingRequest: 'An error occurred while submitting your request. Please try again.',
      loginAsAdmin: 'Login as Admin'
    },
    common: {
      submit: 'Submit',
      back: 'Back',
      loading: 'Loading...'
    },
    login: {
      title: 'Login',
      username: 'Username',
      password: 'Password',
      submit: 'Submit',
      loginError: 'Login Error',
      errorInvalidCredentials: 'Invalid username or password'
    },
    tickets: {
      list: 'Tickets',
      create: 'Create New Ticket',
      title: 'Title',
      description: 'Description',
      responsePlaceholder: 'Type your response here...',
      responseRequired: 'Please enter a response before sending',
      responseSuccess: 'Response sent successfully',
      responseError: 'Failed to send response. Please try again.',
      sendResponse: 'Send Response',
      status: {
        open: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed'
      }
    },
    messages: {
      send: 'Send',
      placeholder: 'Type your message here',
      title: 'Messages'
    },
    admin: {
      title: 'Admin Panel',
      tabs: {
        users: 'Users',
        tickets: 'Tickets',
        reports: 'Reports',
        ads: 'Advertisements',
        moderators: 'Moderators'
      },
      users: {
        select: 'Select User',
        selectPlaceholder: 'Select a user...',
        banDuration: 'Ban Duration',
        banReason: 'Ban Reason',
        banReasonPlaceholder: 'Enter ban reason...',
        banButton: 'Ban User'
      },
      moderators: {
        add: 'Add Moderator',
        remove: 'Remove Moderator',
        permissions: 'Permissions',
        username: 'Username',
        password: 'Password',
        create: 'Create Supervisor',
        usernamePlaceholder: 'Enter supervisor username',
        passwordPlaceholder: 'Enter supervisor password'
      },
      ads: {
        create: 'Create Advertisement',
        title: 'Advertisement Title',
        content: 'Advertisement Content',
        duration: 'Display Duration',
        active: 'Active',
        inactive: 'Inactive'
      },
      time: {
        day: 'day',
        days: 'days',
        hours: 'hours'
      },
      reports: {
        status: 'Status',
        pending: 'Pending',
        resolved: 'Resolved',
        dismissed: 'Dismissed'
      }
    }
  },
  fr: {
    direction: 'ltr',
    visitorSupport: {
      title: 'Soumettre une demande de support',
      name: 'Nom',
      email: 'Email',
      message: 'Message',
      submit: 'Envoyer',
      submitting: 'Envoi en cours...',
      requestSubmittedSuccessfully: 'Votre demande a été soumise avec succès. Notre équipe de support vous répondra bientôt.',
      errorSubmittingRequest: 'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.',
      loginAsAdmin: 'Connexion administrateur'
    },
    common: {
      submit: 'Envoyer',
      back: 'Retour',
      loading: 'Chargement...'
    },
    admin: {
      title: 'Panneau d\'administration',
      tabs: {
        users: 'Utilisateurs',
        tickets: 'Tickets',
        reports: 'Rapports',
        ads: 'Publicités',
        moderators: 'Modérateurs'
      },
      users: {
        select: 'Sélectionner un utilisateur',
        selectPlaceholder: 'Sélectionner un utilisateur...',
        banDuration: 'Durée du bannissement',
        banReason: 'Raison du bannissement',
        banReasonPlaceholder: 'Entrer la raison du bannissement...',
        banButton: 'Bannir l\'utilisateur'
      },
      moderators: {
        add: 'Ajouter un modérateur',
        remove: 'Supprimer un modérateur',
        permissions: 'Permissions',
        username: 'Nom d\'utilisateur',
        password: 'Mot de passe',
        create: 'Créer un superviseur',
        usernamePlaceholder: 'Entrez le nom d\'utilisateur du superviseur',
        passwordPlaceholder: 'Entrez le mot de passe du superviseur'
      },
      ads: {
        create: 'Créer une publicité',
        title: 'Titre de la publicité',
        content: 'Contenu de la publicité',
        duration: 'Durée d\'affichage',
        active: 'Active',
        inactive: 'Inactive'
      },
      time: {
        day: 'jour',
        days: 'jours',
        hours: 'heures'
      },
      reports: {
        status: 'Statut',
        pending: 'En attente',
        resolved: 'Résolu',
        dismissed: 'Rejeté'
      }
    },
    login: {
      title: 'Connexion',
      username: 'Nom d\'utilisateur',
      password: 'Mot de passe',
      submit: 'Envoyer',
      loginError: 'Erreur de connexion',
      errorInvalidCredentials: 'Nom d\'utilisateur ou mot de passe invalide'
    },
    tickets: {
      list: 'Liste des tickets',
      create: 'Créer un nouveau ticket',
      title: 'Titre',
      description: 'Description',
      status: {
        open: 'Ouvert',
        in_progress: 'En cours',
        resolved: 'Résolu',
        closed: 'Fermé'
      }
    },
    messages: {
      send: 'Envoyer',
      placeholder: 'Écrivez votre message ici',
      title: 'Messages'
    }
  },
  es: {
    direction: 'ltr',
    visitorSupport: {
      title: 'Enviar solicitud de soporte',
      name: 'Nombre',
      email: 'Correo electrónico',
      message: 'Mensaje',
      submit: 'Enviar',
      submitting: 'Enviando...',
      requestSubmittedSuccessfully: 'Su solicitud ha sido enviada con éxito. Nuestro equipo de soporte responderá pronto.',
      errorSubmittingRequest: 'Ocurrió un error al enviar su solicitud. Por favor, inténtelo de nuevo.',
      loginAsAdmin: 'Iniciar sesión como administrador'
    },
    common: {
      submit: 'Enviar',
      back: 'Volver',
      loading: 'Cargando...'
    },
    admin: {
      title: 'Panel de Administración',
      tabs: {
        users: 'Usuarios',
        tickets: 'Tickets',
        reports: 'Reportes',
        ads: 'Anuncios',
        moderators: 'Moderadores'
      },
      users: {
        select: 'Seleccionar Usuario',
        selectPlaceholder: 'Seleccionar un usuario...',
        banDuration: 'Duración del Ban',
        banReason: 'Razón del Ban',
        banReasonPlaceholder: 'Ingrese la razón del ban...',
        banButton: 'Banear Usuario'
      },
      moderators: {
        add: 'Agregar Moderador',
        remove: 'Eliminar Moderador',
        permissions: 'Permisos',
        username: 'Nombre de usuario',
        password: 'Contraseña',
        create: 'Crear Supervisor',
        usernamePlaceholder: 'Ingrese nombre de usuario del supervisor',
        passwordPlaceholder: 'Ingrese contraseña del supervisor'
      },
      ads: {
        create: 'Crear Anuncio',
        title: 'Título del Anuncio',
        content: 'Contenido del Anuncio',
        duration: 'Duración',
        active: 'Activo',
        inactive: 'Inactivo'
      },
      time: {
        day: 'día',
        days: 'días',
        hours: 'horas'
      },
      reports: {
        status: 'Estado',
        pending: 'Pendiente',
        resolved: 'Resuelto',
        dismissed: 'Descartado'
      }
    },
    login: {
      title: 'Iniciar sesión',
      username: 'Nombre de usuario',
      password: 'Contraseña',
      submit: 'Enviar',
      loginError: 'Error de inicio de sesión',
      errorInvalidCredentials: 'Nombre de usuario o contraseña inválidos',
      errorEmptyFields: 'Por favor ingrese nombre de usuario y contraseña'
    },
    tickets: {
      list: 'Lista de tickets',
      create: 'Crear nuevo ticket',
      title: 'Título',
      description: 'Descripción',
      status: {
        open: 'Abierto',
        in_progress: 'En progreso',
        resolved: 'Resuelto',
        closed: 'Cerrado'
      }
    },
    messages: {
      send: 'Enviar',
      placeholder: 'Escribe tu mensaje aquí',
      title: 'Mensajes'
    }
  },
  de: {
    direction: 'ltr',
    visitorSupport: {
      title: 'Support-Anfrage einreichen',
      name: 'Name',
      email: 'E-Mail',
      message: 'Nachricht',
      submit: 'Absenden',
      submitting: 'Wird gesendet...',
      requestSubmittedSuccessfully: 'Ihre Anfrage wurde erfolgreich übermittelt. Unser Support-Team wird sich in Kürze bei Ihnen melden.',
      errorSubmittingRequest: 'Beim Senden Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
      loginAsAdmin: 'Als Administrator anmelden'
    },
    common: {
      submit: 'Absenden',
      back: 'Zurück',
      loading: 'Laden...'
    },
    admin: {
      title: 'Administrationsbereich',
      tabs: {
        users: 'Benutzer',
        tickets: 'Tickets',
        reports: 'Meldungen',
        ads: 'Werbung',
        moderators: 'Moderatoren'
      },
      users: {
        select: 'Benutzer auswählen',
        selectPlaceholder: 'Benutzer auswählen...',
        banDuration: 'Sperrdauer',
        banReason: 'Sperrgrund',
        banReasonPlaceholder: 'Grund für die Sperre eingeben...',
        banButton: 'Benutzer sperren'
      },
      moderators: {
        add: 'Moderator hinzufügen',
        remove: 'Moderator entfernen',
        permissions: 'Berechtigungen',
        username: 'Benutzername',
        password: 'Passwort',
        create: 'Supervisor erstellen',
        usernamePlaceholder: 'Supervisor-Benutzername eingeben',
        passwordPlaceholder: 'Supervisor-Passwort eingeben'
      },
      ads: {
        create: 'Werbung erstellen',
        title: 'Werbetitel',
        content: 'Werbeinhalt',
        duration: 'Anzeigedauer',
        active: 'Aktiv',
        inactive: 'Inaktiv'
      },
      time: {
        day: 'Tag',
        days: 'Tage',
        hours: 'Stunden'
      },
      reports: {
        status: 'Status',
        pending: 'Ausstehend',
        resolved: 'Gelöst',
        dismissed: 'Abgelehnt'
      }
    },
    login: {
      title: 'Anmelden',
      username: 'Benutzername',
      password: 'Passwort',
      submit: 'Absenden',
      loginError: 'Anmeldefehler',
      errorInvalidCredentials: 'Ungültiger Benutzername oder Passwort',
      errorEmptyFields: 'Bitte geben Sie Benutzername und Passwort ein'
    },
    tickets: {
      list: 'Tickets Liste',
      create: 'Neues Ticket erstellen',
      title: 'Titel',
      description: 'Beschreibung',
      status: {
        open: 'Offen',
        in_progress: 'In Bearbeitung',
        resolved: 'Gelöst',
        closed: 'Geschlossen'
      }
    },
    messages: {
      send: 'Senden',
      placeholder: 'Schreiben Sie Ihre Nachricht hier',
      title: 'Nachrichten'
    }
  }
};

export type Language = keyof typeof translations;
export type TranslationKeys = keyof typeof translations.en;
