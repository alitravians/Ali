import { z } from "zod";

const MIN_DATE = new Date();
MIN_DATE.setHours(0, 0, 0, 0);

const MAX_DATE = new Date();
MAX_DATE.setDate(MAX_DATE.getDate() + 30); // 30 days from now
MAX_DATE.setHours(23, 59, 59, 999);

export const bookSchema = z.object({
  title: z.string().min(1, "عنوان الكتاب مطلوب"),
  author: z.string().min(1, "اسم المؤلف مطلوب"),
  isbn: z.string().min(1, "الرقم التسلسلي مطلوب"),
  total_copies: z.number().min(1, "عدد النسخ يجب أن يكون 1 على الأقل"),
  category: z.string().min(1, "تصنيف الكتاب مطلوب"),
});

export const studentSchema = z.object({
  name: z.string().min(1, "اسم الطالب مطلوب"),
  class_name: z.string().min(1, "الصف مطلوب"),
  admission_number: z.string().min(1, "رقم القبول مطلوب"),
  grade_level: z.string().min(1, "المستوى الدراسي مطلوب"),
});

export const loanSchema = z.object({
  student_id: z.number().min(1, "الطالب مطلوب"),
  book_id: z.number().min(1, "الكتاب مطلوب"),
  due_date: z.coerce.date()
    .min(MIN_DATE, "تاريخ الإرجاع يجب أن يكون في المستقبل")
    .max(MAX_DATE, "تاريخ الإرجاع لا يمكن أن يتجاوز 30 يوماً"),
});

export const ruleSchema = z.object({
  title: z.string().min(1, "عنوان القانون مطلوب"),
  description: z.string().min(1, "وصف القانون مطلوب"),
  category: z.string().min(1, "تصنيف القانون مطلوب"),
});

export type BookFormValues = z.infer<typeof bookSchema>;
export type StudentFormValues = z.infer<typeof studentSchema>;
export type LoanFormValues = z.infer<typeof loanSchema>;
export type RuleFormValues = z.infer<typeof ruleSchema>;
