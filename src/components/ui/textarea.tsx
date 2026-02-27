import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, ...props }, ref) => {
    const autoId = useId();
    const textareaId = id || autoId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full min-h-[80px] rounded-input border bg-surface-primary px-3 py-2.5 text-body-1 text-foreground-primary placeholder:text-foreground-tertiary transition-all duration-120 ease-spring focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed resize-y",
            error
              ? "border-danger focus:ring-danger/20 focus:border-danger"
              : "border-stroke-primary hover:border-stroke-focus/40",
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

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
