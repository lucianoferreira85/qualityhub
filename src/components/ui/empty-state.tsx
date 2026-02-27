import Link from "next/link";
import { Card, CardContent } from "./card";
import { Button, buttonVariants } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center py-16">
        <div className="h-14 w-14 rounded-2xl bg-surface-tertiary flex items-center justify-center mb-4">
          <Icon className="h-7 w-7 text-foreground-tertiary" />
        </div>
        <p className="text-title-3 text-foreground-primary mb-1">{title}</p>
        {description && (
          <p className="text-body-2 text-foreground-secondary text-center max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-5">
            {action.href ? (
              <Link
                href={action.href}
                className={cn(buttonVariants({ variant: "default", size: "md" }))}
              >
                {action.label}
              </Link>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { EmptyState };
export type { EmptyStateProps };
