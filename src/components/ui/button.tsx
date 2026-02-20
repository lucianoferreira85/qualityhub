import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "bg-brand !text-white hover:bg-brand-hover active:bg-brand-pressed shadow-sm",
        accent:
          "bg-emerald-700 !text-white hover:bg-emerald-800 active:bg-emerald-900 shadow-sm",
        secondary:
          "bg-surface-tertiary text-foreground-primary hover:bg-stroke-secondary active:bg-stroke-primary",
        outline:
          "border border-stroke-primary bg-transparent text-foreground-primary hover:bg-surface-tertiary active:bg-stroke-secondary",
        ghost:
          "bg-transparent text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground-primary active:bg-stroke-secondary",
        danger:
          "bg-red-700 !text-white hover:bg-red-800 active:bg-red-900 shadow-sm",
        "ghost-brand":
          "bg-transparent text-brand hover:bg-brand-light active:bg-brand-light/80",
      },
      size: {
        sm: "h-8 px-3 text-body-2 rounded-button",
        md: "h-10 px-4 text-body-1 rounded-button",
        lg: "h-12 px-6 text-title-3 rounded-button",
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
