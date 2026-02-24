"use client";

import { type ReactNode } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FileSearch } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: React.ElementType;
}

function DataTable<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  sortKey,
  sortDirection,
  onSort,
  loading,
  emptyMessage = "Nenhum registro encontrado",
  emptyDescription,
  emptyIcon,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="border border-stroke-secondary rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-secondary border-b border-stroke-secondary">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-caption-1 font-medium text-foreground-secondary",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-stroke-secondary last:border-b-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className={cn("h-4", i % 2 === 0 ? "w-3/4" : "w-1/2")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon || FileSearch}
        title={emptyMessage}
        description={emptyDescription}
      />
    );
  }

  const getSortIcon = (colKey: string) => {
    if (sortKey !== colKey) return <ArrowUpDown className="h-3.5 w-3.5" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="border border-stroke-secondary rounded-lg overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="bg-surface-secondary border-b border-stroke-secondary">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-caption-1 font-medium text-foreground-secondary",
                  col.sortable && "cursor-pointer select-none hover:text-foreground-primary",
                  col.className
                )}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                onKeyDown={col.sortable && onSort ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSort(col.key); } } : undefined}
                tabIndex={col.sortable && onSort ? 0 : undefined}
                aria-sort={col.sortable && sortKey === col.key ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && onSort && getSortIcon(col.key)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id ?? index}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(item); } } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "button" : undefined}
              className={cn(
                "border-b border-stroke-secondary last:border-b-0 transition-colors",
                index % 2 === 1 && "bg-surface-secondary/30",
                onRowClick
                  ? "cursor-pointer hover:bg-brand-light/40 dark:hover:bg-brand-light/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
                  : "hover:bg-surface-secondary/50"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-body-2 text-foreground-primary",
                    col.className
                  )}
                >
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
export type { Column, DataTableProps };
