"use client";

import { type ReactNode } from "react";
import { Search, Filter, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/ui/view-toggle";
import { cn } from "@/lib/utils";

interface FilterConfig {
  key: string;
  options: SelectOption[];
  value: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  onExport?: () => void;
  exportLabel?: string;
  viewToggle?: {
    view: "cards" | "table";
    onChange: (view: "cards" | "table") => void;
  };
  children?: ReactNode;
  className?: string;
}

function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  onExport,
  exportLabel = "Exportar CSV",
  viewToggle,
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3", className)}>
      {/* Search + Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm sm:w-auto" role="search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        {filters && filters.length > 0 && onFilterChange && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0 hidden sm:block" />
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                options={filter.options}
                className="w-full sm:w-auto"
              />
            ))}
          </div>
        )}

        {/* Clear */}
        {hasActiveFilters && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-foreground-tertiary self-start"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </Button>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Extra children (e.g. "Novo" button) */}
        {children}

        {/* Export */}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{exportLabel}</span>
          </Button>
        )}

        {/* View Toggle */}
        {viewToggle && (
          <ViewToggle view={viewToggle.view} onChange={viewToggle.onChange} />
        )}
      </div>
    </div>
  );
}

export { FilterBar };
export type { FilterBarProps, FilterConfig };
