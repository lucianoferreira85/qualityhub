import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex items-center gap-1.5 text-caption-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-foreground-tertiary flex-shrink-0" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-brand hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground-primary">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
