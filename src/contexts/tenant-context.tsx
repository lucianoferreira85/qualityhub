"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { OrgRole } from "@prisma/client";
import { hasPermission, isAdmin, isManager, isViewer, type Resource, type Action } from "@/lib/permissions";

export interface TenantContextValue {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    status: string;
  };
  membership: {
    role: OrgRole;
    joinedAt: string;
  };
  plan: {
    name: string;
    slug: string;
    features: Record<string, boolean>;
  } | null;
  can: (resource: Resource, action: Action) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isViewer: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  children: ReactNode;
  value: TenantContextValue;
}

export function TenantProvider({ children, value }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenantContext(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext must be used within TenantProvider");
  }
  return context;
}

export function createTenantContextValue(
  tenant: TenantContextValue["tenant"],
  membership: TenantContextValue["membership"],
  plan: TenantContextValue["plan"]
): TenantContextValue {
  const role = membership.role;
  return {
    tenant,
    membership,
    plan,
    can: (resource: Resource, action: Action) =>
      hasPermission(role, resource, action),
    isAdmin: isAdmin(role),
    isManager: isManager(role),
    isViewer: isViewer(role),
  };
}
