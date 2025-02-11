import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loanSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { z } from 'zod';

type LoanFormValues = z.infer<typeof loanSchema>;

interface LoanFormProps {
  defaultValues?: Partial<LoanFormValues>;
  onSubmit: (data: LoanFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function LoanForm({ defaultValues, onSubmit, isLoading }: LoanFormProps) {
  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: defaultValues || {
      book_id: 0,
      student_id: 0,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  });

  const handleSubmit = async (data: LoanFormValues) => {
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
          name="book_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الكتاب</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number"
                  min="1"
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  placeholder="رقم الكتاب"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الطالب</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number"
                  min="1"
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  placeholder="رقم الطالب"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تاريخ الاستحقاق</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : 'تسجيل الاستعارة'}
        </Button>
      </form>
    </Form>
  );
}
