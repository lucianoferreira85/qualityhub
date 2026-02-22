import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[80px] rounded-input border bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary placeholder:text-foreground-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed resize-y",
          error ? "border-danger" : "border-stroke-primary",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-caption-1 text-danger-fg">{error}</p>
      )}
    </div>
  )
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
