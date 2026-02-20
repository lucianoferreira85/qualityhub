"use client";

import { useState, useEffect, useCallback } from "react";

interface UseFetchOptions extends RequestInit {
  skip?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

function useFetch<T>(url: string, options?: UseFetchOptions): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (options?.skip) return;

    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(
            errorBody?.error || `Erro ${response.status}: ${response.statusText}`
          );
        }

        const result = await response.json();
        setData(result.data !== undefined ? result.data : result);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Ocorreu um erro inesperado"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [url, fetchKey, options?.skip]);

  return { data, error, loading, refetch };
}

export { useFetch };
