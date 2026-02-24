import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-10 w-full rounded-input border bg-surface-primary px-3 text-body-1 text-foreground-primary placeholder:text-foreground-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed",
            error
              ? "border-danger focus:ring-danger/30"
              : "border-stroke-primary",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-caption-1 text-danger-fg" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
