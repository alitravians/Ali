import * as React from "react";

export const Form = React.forwardRef<HTMLFormElement, React.FormHTMLAttributes<HTMLFormElement>>(
  ({ className, ...props }, ref) => (
    <form ref={ref} className={`space-y-6 ${className || ""}`} {...props} />
  )
);
Form.displayName = "Form";

export const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`space-y-2 ${className || ""}`} {...props} />
  )
);
FormItem.displayName = "FormItem";

export const FormLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={`text-sm font-medium ${className || ""}`} {...props} />
  )
);
FormLabel.displayName = "FormLabel";

export const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`mt-2 ${className || ""}`} {...props} />
  )
);
FormControl.displayName = "FormControl";

export const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null;
    return (
      <p ref={ref} className={`text-sm text-red-500 ${className || ""}`} {...props}>
        {children}
      </p>
    );
  }
);
FormMessage.displayName = "FormMessage";

export const FormField = ({ name, ...props }: any) => {
  return <div {...props} />;
};
FormField.displayName = "FormField";
