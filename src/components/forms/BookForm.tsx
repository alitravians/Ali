import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { z } from 'zod';

type BookFormValues = z.infer<typeof bookSchema>;

interface BookFormProps {
  defaultValues?: Partial<BookFormValues>;
  onSubmit: (data: BookFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function BookForm({ defaultValues, onSubmit, isLoading }: BookFormProps) {
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: defaultValues || {
      title: '',
      author: '',
      isbn: '',
      total_copies: 1,
      category: '',
    },
  });

  const handleSubmit = async (data: BookFormValues) => {
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عنوان الكتاب</FormLabel>
              <FormControl>
                <Input {...field} placeholder="عنوان الكتاب" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المؤلف</FormLabel>
              <FormControl>
                <Input {...field} placeholder="اسم المؤلف" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isbn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الرقم التسلسلي (ISBN)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="الرقم التسلسلي" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="total_copies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عدد النسخ</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  min="1"
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  placeholder="عدد النسخ" 
                  disabled={isLoading} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>التصنيف</FormLabel>
              <FormControl>
                <Input {...field} placeholder="تصنيف الكتاب" disabled={isLoading} />
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
