"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandPalette, openCommandPalette } from "../command-palette";
import { useIsMobile } from "@/hooks/use-media-query";

interface AppShellProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "qualityhub:sidebar-collapsed";

export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileSidebarOpen]);

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-tertiary">
      {!isMobile && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      )}

      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 modal-glass-overlay animate-fade-in"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
          <div className="relative z-10 animate-slide-in-left">
            <Sidebar
              collapsed={false}
              onToggle={toggleSidebar}
              mobile
              onClose={closeMobileSidebar}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <Header
          showHamburger={isMobile}
          onOpenSidebar={openMobileSidebar}
          onOpenCommandPalette={openCommandPalette}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="page-enter max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
