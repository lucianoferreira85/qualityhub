"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "./use-tenant";

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erro ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

async function mutateApi<T>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erro ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export function useTenantQuery<T>(
  key: string[],
  path: string,
  options?: { enabled?: boolean }
) {
  const { tenant } = useTenant();
  const tenantSlug = tenant.slug;
  const url = `/api/tenants/${tenantSlug}${path}`;

  return useQuery<T>({
    queryKey: [tenantSlug, ...key],
    queryFn: () => fetchApi<T>(url),
    enabled: options?.enabled !== false && !!tenantSlug,
  });
}

export function useTenantMutation<TData = unknown, TVariables = unknown>(
  path: string,
  method: "POST" | "PATCH" | "DELETE" = "POST",
  options?: {
    invalidateKeys?: string[][];
    onSuccess?: (data: TData) => void;
  }
) {
  const { tenant } = useTenant();
  const tenantSlug = tenant.slug;
  const queryClient = useQueryClient();
  const url = `/api/tenants/${tenantSlug}${path}`;

  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => mutateApi<TData>(url, method, variables),
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [tenantSlug, ...key] });
        });
      }
      options?.onSuccess?.(data);
    },
  });
}
