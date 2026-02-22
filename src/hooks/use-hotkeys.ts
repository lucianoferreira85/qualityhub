"use client";

import { useEffect, useCallback } from "react";

type KeyCombo = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

type HotkeyHandler = (e: KeyboardEvent) => void;

export function useHotkeys(combo: KeyCombo, handler: HotkeyHandler) {
  const stableHandler = useCallback(handler, [handler]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const matchesMeta = combo.meta ? e.metaKey : true;
      const matchesCtrl = combo.ctrl ? e.ctrlKey : true;
      const matchesShift = combo.shift ? e.shiftKey : !e.shiftKey;
      const matchesAlt = combo.alt ? e.altKey : !e.altKey;
      const matchesKey = e.key.toLowerCase() === combo.key.toLowerCase();

      if (matchesKey && matchesMeta && matchesCtrl && matchesShift && matchesAlt) {
        e.preventDefault();
        stableHandler(e);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [combo, stableHandler]);
}

export function useCmdK(handler: () => void) {
  const stableHandler = useCallback(handler, [handler]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        stableHandler();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [stableHandler]);
}
