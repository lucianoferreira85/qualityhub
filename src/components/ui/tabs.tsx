"use client";

import { type ElementType } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  value: string;
  label: string;
  icon?: ElementType;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-stroke-secondary",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-10 text-body-1 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex-shrink-0",
              isActive
                ? "border-brand text-brand"
                : "border-transparent text-foreground-tertiary hover:text-foreground-primary"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-surface-tertiary text-foreground-secondary rounded-full px-1.5 text-caption-2 min-w-[20px] text-center">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { Tabs };
export type { Tab, TabsProps };
