import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, error, options, placeholder, id, ...props }, ref) => {
    const autoId = useId();
    const selectId = id || autoId;
    const errorId = `${selectId}-error`;

    return (
      <div className={cn("w-full", wrapperClassName)}>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-10 w-full rounded-input border bg-surface-primary px-3 pr-8 text-body-2 text-foreground-primary transition-all duration-120 ease-spring focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat",
            "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
            error
              ? "border-danger focus:ring-danger/20 focus:border-danger"
              : "border-stroke-primary hover:border-stroke-focus/40",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="mt-1.5 text-caption-1 text-danger-fg" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export type { SelectOption, SelectProps };
