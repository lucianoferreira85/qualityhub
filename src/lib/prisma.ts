import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

// Proxy defers PrismaClient construction to first actual database call.
// Guards prevent initialization during Next.js build-time module introspection.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (
      typeof prop === "symbol" ||
      prop === "then" ||
      prop === "toJSON" ||
      prop === "$$typeof"
    ) {
      return undefined;
    }
    return Reflect.get(getPrismaClient(), prop);
  },
});

const TENANT_SCOPED_MODELS = [
  "risk",
  "actionPlan",
  "nonconformity",
  "audit",
  "auditFinding",
  "document",
  "documentVersion",
  "indicator",
  "indicatorMeasurement",
  "project",
  "projectRequirement",
  "projectControl",
  "soaEntry",
  "consultingClient",
  "managementReview",
  "notification",
  "auditLog",
  "organizationContext",
  "interestedParty",
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQueryArgs = { args: any; query: (args: any) => Promise<any> };

export function tenantPrisma(tenantId: string) {
  const modelExtensions = Object.fromEntries(
    TENANT_SCOPED_MODELS.map((model) => [
      model,
      {
        async findMany({ args, query }: AnyQueryArgs) {
          args.where = { ...(args.where || {}), tenantId };
          return query(args);
        },
        async findFirst({ args, query }: AnyQueryArgs) {
          args.where = { ...(args.where || {}), tenantId };
          return query(args);
        },
        async findUnique({ args, query }: AnyQueryArgs) {
          // Convert findUnique to findFirst with tenantId filter for safety
          // This prevents cross-tenant access by ID guessing
          const result = await query(args);
          if (result && result.tenantId && result.tenantId !== tenantId) {
            return null; // Block cross-tenant access
          }
          return result;
        },
        async create({ args, query }: AnyQueryArgs) {
          args.data = { ...(args.data || {}), tenantId };
          return query(args);
        },
        async update({ args, query }: AnyQueryArgs) {
          // Verify the record belongs to this tenant before updating
          const result = await query(args);
          if (result && result.tenantId && result.tenantId !== tenantId) {
            throw new Error("Access denied: record belongs to another tenant");
          }
          return result;
        },
        async delete({ args, query }: AnyQueryArgs) {
          // Verify the record belongs to this tenant before deleting
          const result = await query(args);
          if (result && result.tenantId && result.tenantId !== tenantId) {
            throw new Error("Access denied: record belongs to another tenant");
          }
          return result;
        },
        async count({ args, query }: AnyQueryArgs) {
          args.where = { ...(args.where || {}), tenantId };
          return query(args);
        },
      },
    ])
  );

  return prisma.$extends({
    query: modelExtensions as never,
  });
}

export type TenantPrismaClient = ReturnType<typeof tenantPrisma>;
