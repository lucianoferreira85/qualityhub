"use client";

import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
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
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 modal-glass-overlay animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "bg-surface-elevated rounded-xl border border-stroke-secondary shadow-dialog max-w-lg w-full mx-4 p-6",
            "animate-scale-in focus:outline-none",
            className
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="text-title-3 font-semibold text-foreground-primary">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-body-2 text-foreground-secondary mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-button text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-tertiary transition-all duration-120"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { Modal };
export type { ModalProps };
