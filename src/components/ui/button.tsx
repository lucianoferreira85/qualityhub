import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-spring focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "btn-primary-gradient !text-white",
        accent:
          "bg-emerald-600 !text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs hover:shadow-sm",
        secondary:
          "bg-surface-secondary text-foreground-primary border border-stroke-secondary hover:bg-surface-tertiary hover:border-stroke-primary active:bg-stroke-secondary shadow-xs",
        outline:
          "border border-stroke-primary bg-transparent text-foreground-primary hover:bg-surface-tertiary hover:border-stroke-primary active:bg-stroke-secondary",
        ghost:
          "bg-transparent text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary active:bg-stroke-secondary",
        danger:
          "bg-red-600 !text-white hover:bg-red-700 active:bg-red-800 shadow-xs hover:shadow-sm",
        "ghost-brand":
          "bg-transparent text-brand hover:bg-brand-light active:bg-brand-light/80",
      },
      size: {
        sm: "h-8 px-3 text-body-2 rounded-button",
        md: "h-10 px-4 text-body-1 rounded-button",
        lg: "h-11 px-5 text-title-3 rounded-button",
        icon: "h-10 w-10 rounded-button",
        "icon-sm": "h-8 w-8 rounded-button",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
