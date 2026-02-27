import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, error, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const errorId = `${inputId}-error`;

    return (
      <div className={cn("w-full", wrapperClassName)}>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-10 w-full rounded-input border bg-surface-secondary px-3 text-body-1 text-foreground-primary placeholder:text-foreground-tertiary transition-all duration-150 ease-spring",
            "focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-primary focus:shadow-xs",
            "hover:border-stroke-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-danger focus:ring-danger/20 focus:border-danger"
              : "border-stroke-secondary",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-caption-1 text-danger-fg" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
