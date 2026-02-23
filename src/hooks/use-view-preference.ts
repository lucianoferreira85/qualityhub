"use client";

import { useState, useEffect, useCallback } from "react";

type ViewMode = "cards" | "table";

function useViewPreference(
  key: string,
  defaultView: ViewMode = "cards"
): [ViewMode, (v: ViewMode) => void] {
  const storageKey = `view-pref:${key}`;

  const [view, setViewState] = useState<ViewMode>(defaultView);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "cards" || stored === "table") {
      setViewState(stored);
    }
    setHydrated(true);
  }, [storageKey]);

  const setView = useCallback(
    (v: ViewMode) => {
      setViewState(v);
      localStorage.setItem(storageKey, v);
    },
    [storageKey]
  );

  return [hydrated ? view : defaultView, setView];
}

export { useViewPreference };
