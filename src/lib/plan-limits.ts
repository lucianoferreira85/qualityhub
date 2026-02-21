import { prisma } from "@/lib/prisma";

interface PlanLimits {
  maxUsers: number;
  maxProjects: number;
  maxStandards: number;
  maxStorage: number; // MB
  maxClients: number;
  features: Record<string, boolean>;
}

const UNLIMITED = 999999;

const DEFAULT_PLANS: Record<string, PlanLimits> = {
  starter: {
    maxUsers: 3,
    maxProjects: 3,
    maxStandards: 1,
    maxStorage: 2048,
    maxClients: 3,
    features: {
      audits: true,
      nonconformities: true,
      actionPlans: true,
      documents: true,
      indicators: false,
      risks: false,
      soa: false,
      managementReview: false,
      customReports: false,
      apiAccess: false,
    },
  },
  professional: {
    maxUsers: 10,
    maxProjects: 15,
    maxStandards: 3,
    maxStorage: 10240,
    maxClients: 15,
    features: {
      audits: true,
      nonconformities: true,
      actionPlans: true,
      documents: true,
      indicators: true,
      risks: true,
      soa: true,
      managementReview: true,
      customReports: true,
      apiAccess: false,
    },
  },
  enterprise: {
    maxUsers: UNLIMITED,
    maxProjects: UNLIMITED,
    maxStandards: UNLIMITED,
    maxStorage: UNLIMITED,
    maxClients: UNLIMITED,
    features: {
      audits: true,
      nonconformities: true,
      actionPlans: true,
      documents: true,
      indicators: true,
      risks: true,
      soa: true,
      managementReview: true,
      customReports: true,
      apiAccess: true,
    },
  },
};

type LimitResource = "users" | "projects" | "standards" | "clients";

export async function checkPlanLimit(
  tenantId: string,
  resource: LimitResource
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription || !subscription.plan) {
    // No subscription = trial/free tenant - use starter limits
    const starterLimits = DEFAULT_PLANS.starter;
    let fallbackLimit = 0;
    switch (resource) {
      case "users": fallbackLimit = starterLimits.maxUsers; break;
      case "projects": fallbackLimit = starterLimits.maxProjects; break;
      case "standards": fallbackLimit = starterLimits.maxStandards; break;
      case "clients": fallbackLimit = starterLimits.maxClients; break;
    }
    return { allowed: true, current: 0, limit: fallbackLimit };
  }

  const plan = subscription.plan;
  let current = 0;
  let limit = 0;

  switch (resource) {
    case "users":
      current = await prisma.tenantMember.count({ where: { tenantId } });
      limit = plan.maxUsers;
      break;
    case "projects":
      current = await prisma.project.count({
        where: { tenantId, status: { not: "archived" } },
      });
      limit = plan.maxProjects;
      break;
    case "standards": {
      const distinctStandards = await prisma.projectStandard.findMany({
        where: { project: { tenantId } },
        select: { standardId: true },
        distinct: ["standardId"],
      });
      current = distinctStandards.length;
      limit = plan.maxStandards;
      break;
    }
    case "clients":
      current = await prisma.consultingClient.count({ where: { tenantId } });
      limit = plan.maxClients;
      break;
  }

  return { allowed: current < limit, current, limit };
}

export async function getPlanFeatures(
  tenantId: string
): Promise<PlanLimits | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription || !subscription.plan) return null;

  const plan = subscription.plan;
  return {
    maxUsers: plan.maxUsers,
    maxProjects: plan.maxProjects,
    maxStandards: plan.maxStandards,
    maxStorage: plan.maxStorage,
    maxClients: plan.maxClients,
    features: (plan.features as Record<string, boolean>) || {},
  };
}

export function hasFeature(
  features: PlanLimits | null,
  feature: string
): boolean {
  if (!features) return false;
  return features.features[feature] === true;
}

export { DEFAULT_PLANS, UNLIMITED };
export type { PlanLimits, LimitResource };
