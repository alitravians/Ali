import * as z from 'zod';

// Student Form Validation
export const studentSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  admission_number: z.string().min(1, 'رقم القبول مطلوب'),
  class_name: z.string().min(1, 'الصف مطلوب'),
  grade_level: z.string().min(1, 'المستوى مطلوب'),
});

// Book Form Validation
export const bookSchema = z.object({
  title: z.string().min(1, 'عنوان الكتاب مطلوب'),
  author: z.string().min(1, 'اسم المؤلف مطلوب'),
  isbn: z.string()
    .min(10, 'الرقم التسلسلي يجب أن يكون 10 أو 13 رقماً')
    .max(13, 'الرقم التسلسلي يجب أن يكون 10 أو 13 رقماً')
    .regex(/^[0-9-]+$/, 'الرقم التسلسلي يجب أن يحتوي على أرقام وشرطات فقط'),
  total_copies: z.number()
    .min(1, 'يجب أن يكون عدد النسخ أكبر من صفر')
    .int('يجب أن يكون عدد النسخ رقماً صحيحاً'),
  category: z.string().min(1, 'التصنيف مطلوب'),
});

// Loan Form Validation
export const loanSchema = z.object({
  book_id: z.number().int('معرف الكتاب غير صالح'),
  student_id: z.number().int('معرف الطالب غير صالح'),
  due_date: z.date()
    .min(new Date(), 'تاريخ الاستحقاق يجب أن يكون في المستقبل')
    .max(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      'تاريخ الاستحقاق لا يمكن أن يتجاوز 30 يوماً'
    ),
});

export const loanUpdateSchema = z.object({
  return_date: z.date().optional(),
  status: z.enum(['borrowed', 'returned', 'overdue'], {
    invalid_type_error: 'حالة الاستعارة غير صالحة',
  }),
});

// Rule Form Validation
export const ruleSchema = z.object({
  title: z.string().min(1, 'عنوان القانون مطلوب'),
  description: z.string()
    .min(1, 'وصف القانون مطلوب')
    .max(1000, 'الوصف يجب أن لا يتجاوز 1000 حرف'),
  category: z.string().min(1, 'تصنيف القانون مطلوب'),
});

// Error Handling Types
export type ValidationError = {
  field: string;
  message: string;
};

export type ApiError = {
  status: number;
  message: string;
};

// Error Messages in Arabic
export const errorMessages = {
  network: 'حدث خطأ في الاتصال بالخادم',
  unauthorized: 'غير مصرح لك بالوصول',
  notFound: 'لم يتم العثور على البيانات المطلوبة',
  validation: 'يرجى التحقق من صحة البيانات المدخلة',
  server: 'حدث خطأ في الخادم',
  unknown: 'حدث خطأ غير معروف',
};

// Helper Functions
export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    if ('response' in error) {
      const response = (error as any).response;
      if (response?.status === 401) {
        return { status: 401, message: errorMessages.unauthorized };
      }
      if (response?.status === 404) {
        return { status: 404, message: errorMessages.notFound };
      }
      if (response?.status === 400) {
        return { status: 400, message: response.data?.detail || errorMessages.validation };
      }
      if (response?.status >= 500) {
        return { status: response.status, message: errorMessages.server };
      }
    }
    if (error.message.includes('Network Error')) {
      return { status: 0, message: errorMessages.network };
    }
  }
  return { status: -1, message: errorMessages.unknown };
};

export const formatValidationErrors = (errors: z.ZodError): ValidationError[] => {
  return errors.errors.map((error: z.ZodIssue) => ({
    field: error.path.join('.'),
    message: error.message,
  }));
};
