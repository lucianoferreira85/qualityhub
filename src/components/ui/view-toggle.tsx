"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "cards" | "table";
  onChange: (view: "cards" | "table") => void;
}

function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="border border-stroke-secondary rounded-lg p-0.5 flex" role="group" aria-label="Modo de visualizacao">
      <button
        onClick={() => onChange("cards")}
        className={cn(
          "p-1.5 rounded transition-colors",
          view === "cards"
            ? "bg-surface-secondary text-foreground-primary"
            : "text-foreground-tertiary hover:text-foreground-secondary"
        )}
        aria-label="Visualizar como cards"
        aria-pressed={view === "cards"}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("table")}
        className={cn(
          "p-1.5 rounded transition-colors",
          view === "table"
            ? "bg-surface-secondary text-foreground-primary"
            : "text-foreground-tertiary hover:text-foreground-secondary"
        )}
        aria-label="Visualizar como tabela"
        aria-pressed={view === "table"}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

export { ViewToggle };
export type { ViewToggleProps };
