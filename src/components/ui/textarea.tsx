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
            "w-full min-h-[80px] rounded-input border bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary placeholder:text-foreground-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed resize-y",
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

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
