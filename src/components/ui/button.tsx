import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium
          ${variant === "default" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
          ${variant === "ghost" ? "hover:bg-gray-100" : ""}
          ${className || ""}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
