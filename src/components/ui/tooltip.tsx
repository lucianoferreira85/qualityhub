"use client";

import { type ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  className?: string;
}

function Tooltip({
  content,
  children,
  side = "top",
  delayDuration = 300,
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={4}
            className={cn(
              "z-50 whitespace-nowrap bg-foreground-primary text-white text-caption-2 rounded px-2 py-1 shadow-lg",
              "animate-fade-in select-none",
              className
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-foreground-primary" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip };
export type { TooltipProps };
