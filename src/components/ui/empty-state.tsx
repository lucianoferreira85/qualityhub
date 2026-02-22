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
    <Card>
      <CardContent className="flex flex-col items-center py-12">
        <Icon className="h-12 w-12 text-foreground-tertiary mb-4" />
        <p className="text-title-3 text-foreground-primary mb-1">{title}</p>
        {description && (
          <p className="text-body-1 text-foreground-secondary text-center max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-4">
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
