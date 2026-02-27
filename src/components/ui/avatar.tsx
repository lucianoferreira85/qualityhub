import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-caption-2",
  lg: "h-10 w-10 text-body-2",
};

function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full gradient-brand flex items-center justify-center flex-shrink-0 shadow-xs ring-2 ring-surface-primary",
        sizeClasses[size],
        className
      )}
    >
      <span className="text-white font-semibold leading-none">
        {getInitials(name)}
      </span>
    </div>
  );
}

export { Avatar };
export type { AvatarProps };
