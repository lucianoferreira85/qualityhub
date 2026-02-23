"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div
        className={cn(
          "relative z-50 bg-surface-primary rounded-xl shadow-dialog max-w-lg w-full mx-4 p-6 animate-scale-in",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-title-3 font-semibold text-foreground-primary">{title}</h2>
            {description && (
              <p className="text-body-2 text-foreground-secondary mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-button text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-tertiary transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {children}
      </div>
    </div>
  );
}

export { Modal };
export type { ModalProps };
