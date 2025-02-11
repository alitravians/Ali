import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ruleSchema, type RuleFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ControllerRenderProps } from 'react-hook-form';

interface RuleFormProps {
  defaultValues?: Partial<RuleFormValues>;
  onSubmit: (data: RuleFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function RuleForm({ defaultValues, onSubmit, isLoading }: RuleFormProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      category: '',
    },
  });

  const handleSubmit = async (data: RuleFormValues) => {
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
          render={({ field }: { field: ControllerRenderProps<RuleFormValues, "title"> }) => (
            <FormItem>
              <FormLabel>عنوان القانون</FormLabel>
              <FormControl>
                <Input {...field} placeholder="عنوان القانون" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: ControllerRenderProps<RuleFormValues, "description"> }) => (
            <FormItem>
              <FormLabel>الوصف</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="وصف القانون"
                  rows={4}
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
          render={({ field }: { field: ControllerRenderProps<RuleFormValues, "category"> }) => (
            <FormItem>
              <FormLabel>التصنيف</FormLabel>
              <FormControl>
                <Input {...field} placeholder="تصنيف القانون" disabled={isLoading} />
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
