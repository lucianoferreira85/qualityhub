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
      <ol className="flex items-center gap-1 text-caption-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight className="h-3 w-3 text-foreground-tertiary/50 flex-shrink-0" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-foreground-tertiary hover:text-foreground-secondary transition-colors duration-120"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground-secondary font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
