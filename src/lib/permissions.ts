import { OrgRole } from "@prisma/client";

type Action = "create" | "read" | "update" | "delete";

type Resource =
  | "project"
  | "risk"
  | "actionPlan"
  | "nonconformity"
  | "audit"
  | "auditFinding"
  | "document"
  | "indicator"
  | "soaEntry"
  | "requirement"
  | "control"
  | "process"
  | "client"
  | "member"
  | "invitation"
  | "settings"
  | "billing"
  | "managementReview"
  | "context"
  | "interestedParty";

type PermissionMatrix = Record<OrgRole, Partial<Record<Resource, Action[]>>>;

const PERMISSIONS: PermissionMatrix = {
  tenant_admin: {
    project: ["create", "read", "update", "delete"],
    risk: ["create", "read", "update", "delete"],
    actionPlan: ["create", "read", "update", "delete"],
    nonconformity: ["create", "read", "update", "delete"],
    audit: ["create", "read", "update", "delete"],
    auditFinding: ["create", "read", "update", "delete"],
    document: ["create", "read", "update", "delete"],
    indicator: ["create", "read", "update", "delete"],
    process: ["create", "read", "update", "delete"],
    soaEntry: ["create", "read", "update", "delete"],
    requirement: ["create", "read", "update", "delete"],
    control: ["create", "read", "update", "delete"],
    client: ["create", "read", "update", "delete"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "update", "delete"],
    settings: ["read", "update"],
    billing: ["read", "update"],
    managementReview: ["create", "read", "update", "delete"],
    context: ["create", "read", "update", "delete"],
    interestedParty: ["create", "read", "update", "delete"],
  },
  project_manager: {
    project: ["create", "read", "update"],
    risk: ["create", "read", "update"],
    actionPlan: ["create", "read", "update"],
    nonconformity: ["create", "read", "update"],
    audit: ["create", "read", "update"],
    auditFinding: ["create", "read", "update"],
    document: ["create", "read", "update"],
    indicator: ["create", "read", "update"],
    process: ["create", "read", "update"],
    soaEntry: ["create", "read", "update"],
    requirement: ["create", "read", "update", "delete"],
    control: ["create", "read", "update", "delete"],
    client: ["read"],
    member: ["read"],
    invitation: ["create", "read"],
    settings: ["read"],
    managementReview: ["create", "read", "update"],
    context: ["create", "read", "update", "delete"],
    interestedParty: ["create", "read", "update", "delete"],
  },
  senior_consultant: {
    project: ["read"],
    risk: ["create", "read", "update"],
    actionPlan: ["create", "read", "update"],
    nonconformity: ["create", "read", "update"],
    audit: ["read"],
    auditFinding: ["read"],
    document: ["create", "read", "update"],
    indicator: ["create", "read", "update"],
    process: ["create", "read", "update"],
    soaEntry: ["create", "read", "update"],
    requirement: ["create", "read", "update"],
    control: ["create", "read", "update"],
    client: ["read"],
    member: ["read"],
    managementReview: ["read"],
    context: ["create", "read", "update"],
    interestedParty: ["create", "read", "update"],
  },
  junior_consultant: {
    project: ["read"],
    risk: ["read", "update"],
    actionPlan: ["read", "update"],
    nonconformity: ["read", "update"],
    audit: ["read"],
    auditFinding: ["read"],
    document: ["read", "update"],
    indicator: ["read"],
    process: ["read"],
    soaEntry: ["read"],
    requirement: ["read", "update"],
    control: ["read", "update"],
    client: ["read"],
    member: ["read"],
    managementReview: ["read"],
    context: ["read", "update"],
    interestedParty: ["read", "update"],
  },
  internal_auditor: {
    project: ["read"],
    risk: ["read"],
    actionPlan: ["read"],
    nonconformity: ["create", "read"],
    audit: ["create", "read", "update"],
    auditFinding: ["create", "read", "update"],
    document: ["read"],
    indicator: ["read"],
    process: ["read"],
    soaEntry: ["read"],
    requirement: ["read"],
    control: ["read"],
    client: ["read"],
    member: ["read"],
    managementReview: ["read"],
    context: ["read"],
    interestedParty: ["read"],
  },
  external_auditor: {
    project: ["read"],
    risk: ["read"],
    actionPlan: ["read"],
    nonconformity: ["read"],
    audit: ["read"],
    auditFinding: ["read"],
    document: ["read"],
    indicator: ["read"],
    process: ["read"],
    soaEntry: ["read"],
    requirement: ["read"],
    control: ["read"],
    managementReview: ["read"],
    context: ["read"],
    interestedParty: ["read"],
  },
  client_viewer: {
    project: ["read"],
    risk: ["read"],
    actionPlan: ["read"],
    nonconformity: ["read"],
    audit: ["read"],
    document: ["read"],
    indicator: ["read"],
    process: ["read"],
    managementReview: ["read"],
    context: ["read"],
    interestedParty: ["read"],
  },
};

export function hasPermission(
  role: OrgRole,
  resource: Resource,
  action: Action
): boolean {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;
  return resourcePerms.includes(action);
}

export function canCreate(role: OrgRole, resource: Resource): boolean {
  return hasPermission(role, resource, "create");
}

export function canRead(role: OrgRole, resource: Resource): boolean {
  return hasPermission(role, resource, "read");
}

export function canUpdate(role: OrgRole, resource: Resource): boolean {
  return hasPermission(role, resource, "update");
}

export function canDelete(role: OrgRole, resource: Resource): boolean {
  return hasPermission(role, resource, "delete");
}

export function isAdmin(role: OrgRole): boolean {
  return role === "tenant_admin";
}

export function isManager(role: OrgRole): boolean {
  return role === "tenant_admin" || role === "project_manager";
}

export function isConsultant(role: OrgRole): boolean {
  return (
    role === "senior_consultant" ||
    role === "junior_consultant" ||
    role === "project_manager"
  );
}

export function isAuditor(role: OrgRole): boolean {
  return role === "internal_auditor" || role === "external_auditor";
}

export function isViewer(role: OrgRole): boolean {
  return role === "client_viewer" || role === "external_auditor";
}

export type { Action, Resource };
