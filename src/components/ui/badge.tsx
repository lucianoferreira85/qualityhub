import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: string;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-caption-1 font-medium transition-colors",
        variant || "bg-brand-light text-brand",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
