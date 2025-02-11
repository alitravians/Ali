import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { z } from 'zod';

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  defaultValues?: Partial<StudentFormValues>;
  onSubmit: (data: StudentFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function StudentForm({ defaultValues, onSubmit, isLoading }: StudentFormProps) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: defaultValues || {
      name: '',
      admission_number: '',
      class_name: '',
      grade_level: '',
    },
  });

  const handleSubmit = async (data: StudentFormValues) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // Error will be handled by the parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم</FormLabel>
              <FormControl>
                <Input {...field} placeholder="اسم الطالب" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="admission_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم القبول</FormLabel>
              <FormControl>
                <Input {...field} placeholder="رقم القبول" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="class_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الصف</FormLabel>
              <FormControl>
                <Input {...field} placeholder="الصف" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="grade_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المستوى</FormLabel>
              <FormControl>
                <Input {...field} placeholder="المستوى" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </form>
    </Form>
  );
}
