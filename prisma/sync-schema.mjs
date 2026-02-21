/**
 * Sync Prisma schema to Supabase via Management API
 * Usage: node prisma/sync-schema.mjs
 */

const SUPABASE_REF = "ojvcmckffnyncyxcdisb";
const SUPABASE_TOKEN = "sbp_0d3c9f82fcfe61856b7c3262b3277ae55be1b32d";
const API_URL = `https://api.supabase.com/v1/projects/${SUPABASE_REF}/database/query`;

async function runSQL(label, sql) {
  console.log(`\n--- ${label} ---`);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`FAILED [${res.status}]: ${text}`);
    throw new Error(`SQL failed for ${label}`);
  }

  const data = await res.json();
  console.log(`OK (${JSON.stringify(data).length} bytes)`);
  return data;
}

async function main() {
  console.log("=== QualityHub Schema Sync ===\n");

  // Step 1: Drop existing enums (if any)
  await runSQL("Drop old enums", `
    DROP TYPE IF EXISTS "TenantStatus" CASCADE;
    DROP TYPE IF EXISTS "OrgRole" CASCADE;
    DROP TYPE IF EXISTS "InvitationStatus" CASCADE;
    DROP TYPE IF EXISTS "SubscriptionStatus" CASCADE;
    DROP TYPE IF EXISTS "ProjectStatus" CASCADE;
    DROP TYPE IF EXISTS "RequirementStatus" CASCADE;
    DROP TYPE IF EXISTS "NcStatus" CASCADE;
    DROP TYPE IF EXISTS "NcSeverity" CASCADE;
    DROP TYPE IF EXISTS "FindingClassification" CASCADE;
    DROP TYPE IF EXISTS "ActionType" CASCADE;
    DROP TYPE IF EXISTS "ActionStatus" CASCADE;
    DROP TYPE IF EXISTS "DocumentType" CASCADE;
    DROP TYPE IF EXISTS "DocumentStatus" CASCADE;
    DROP TYPE IF EXISTS "RootCauseMethod" CASCADE;
  `);

  // Step 2: Create enums
  await runSQL("Create enums", `
    CREATE TYPE "TenantStatus" AS ENUM ('active', 'trial', 'suspended', 'cancelled');
    CREATE TYPE "OrgRole" AS ENUM ('tenant_admin', 'project_manager', 'senior_consultant', 'junior_consultant', 'internal_auditor', 'external_auditor', 'client_viewer');
    CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired', 'revoked');
    CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'trialing', 'past_due', 'cancelled');
    CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'in_progress', 'completed', 'archived');
    CREATE TYPE "RequirementStatus" AS ENUM ('not_started', 'in_progress', 'implemented', 'verified', 'nonconforming');
    CREATE TYPE "NcStatus" AS ENUM ('open', 'analysis', 'action_defined', 'in_execution', 'effectiveness_check', 'closed');
    CREATE TYPE "NcSeverity" AS ENUM ('observation', 'minor', 'major', 'critical');
    CREATE TYPE "FindingClassification" AS ENUM ('conformity', 'observation', 'opportunity', 'minor_nc', 'major_nc');
    CREATE TYPE "ActionType" AS ENUM ('corrective', 'preventive', 'improvement');
    CREATE TYPE "ActionStatus" AS ENUM ('planned', 'in_progress', 'completed', 'verified', 'effective', 'ineffective');
    CREATE TYPE "DocumentType" AS ENUM ('policy', 'procedure', 'work_instruction', 'form', 'record', 'manual');
    CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'in_review', 'approved', 'obsolete');
    CREATE TYPE "RootCauseMethod" AS ENUM ('five_whys', 'ishikawa', 'fault_tree', 'brainstorming');
  `);

  // Step 3: Global tables (no tenant_id)
  await runSQL("Create plans table", `
    CREATE TABLE "plans" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "price" DECIMAL(10,2) NOT NULL,
      "max_users" INTEGER NOT NULL,
      "max_projects" INTEGER NOT NULL,
      "max_standards" INTEGER NOT NULL,
      "max_storage" INTEGER NOT NULL,
      "max_clients" INTEGER NOT NULL,
      "features" JSONB NOT NULL DEFAULT '{}',
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");
  `);

  await runSQL("Create standards table", `
    CREATE TABLE "standards" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "version" TEXT NOT NULL,
      "year" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'active',
      "description" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "standards_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX "standards_code_key" ON "standards"("code");
  `);

  await runSQL("Create standard_clauses table", `
    CREATE TABLE "standard_clauses" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "standard_id" UUID NOT NULL,
      "code" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "parent_id" UUID,
      "order_index" INTEGER NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "standard_clauses_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "standard_clauses_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "standard_clauses_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "standard_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "standard_clauses_standard_id_code_key" ON "standard_clauses"("standard_id", "code");
    CREATE INDEX "standard_clauses_standard_id_idx" ON "standard_clauses"("standard_id");
    CREATE INDEX "standard_clauses_parent_id_idx" ON "standard_clauses"("parent_id");
  `);

  await runSQL("Create standard_controls table", `
    CREATE TABLE "standard_controls" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "standard_id" UUID NOT NULL,
      "code" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "domain" TEXT,
      "type" TEXT,
      "attributes" JSONB NOT NULL DEFAULT '{}',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "standard_controls_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "standard_controls_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "standard_controls_standard_id_code_key" ON "standard_controls"("standard_id", "code");
    CREATE INDEX "standard_controls_standard_id_idx" ON "standard_controls"("standard_id");
  `);

  // Step 4: Tenants
  await runSQL("Create tenants table", `
    CREATE TABLE "tenants" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "logo" TEXT,
      "cnpj" TEXT,
      "settings" JSONB NOT NULL DEFAULT '{}',
      "status" "TenantStatus" NOT NULL DEFAULT 'trial',
      "trial_ends_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
  `);

  // Step 5: Users
  await runSQL("Create users table", `
    CREATE TABLE "users" (
      "id" UUID NOT NULL,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "avatar_url" TEXT,
      "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "last_login_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "users_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
  `);

  // Step 6: Membership & Invitations
  await runSQL("Create tenant_members table", `
    CREATE TABLE "tenant_members" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "user_id" UUID NOT NULL,
      "role" "OrgRole" NOT NULL DEFAULT 'junior_consultant',
      "invited_by_id" UUID,
      "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "tenant_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "tenant_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "tenant_members_tenant_id_user_id_key" ON "tenant_members"("tenant_id", "user_id");
    CREATE INDEX "tenant_members_tenant_id_idx" ON "tenant_members"("tenant_id");
    CREATE INDEX "tenant_members_user_id_idx" ON "tenant_members"("user_id");
  `);

  await runSQL("Create invitations table", `
    CREATE TABLE "invitations" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "email" TEXT NOT NULL,
      "role" "OrgRole" NOT NULL DEFAULT 'junior_consultant',
      "token" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
      "expires_at" TIMESTAMP(3) NOT NULL,
      "invited_by_id" UUID NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "invitations_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");
    CREATE INDEX "invitations_tenant_id_idx" ON "invitations"("tenant_id");
    CREATE INDEX "invitations_token_idx" ON "invitations"("token");
    CREATE INDEX "invitations_email_idx" ON "invitations"("email");
  `);

  // Step 7: Subscriptions
  await runSQL("Create subscriptions table", `
    CREATE TABLE "subscriptions" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "plan_id" UUID NOT NULL,
      "status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
      "stripe_customer_id" TEXT,
      "stripe_subscription_id" TEXT,
      "current_period_start" TIMESTAMP(3),
      "current_period_end" TIMESTAMP(3),
      "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "subscriptions_tenant_id_key" ON "subscriptions"("tenant_id");
    CREATE INDEX "subscriptions_tenant_id_idx" ON "subscriptions"("tenant_id");
    CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions"("stripe_customer_id");
  `);

  // Step 8: Consulting Clients
  await runSQL("Create consulting_clients table", `
    CREATE TABLE "consulting_clients" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "name" TEXT NOT NULL,
      "cnpj" TEXT,
      "contact_name" TEXT,
      "contact_email" TEXT,
      "sector" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "consulting_clients_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "consulting_clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX "consulting_clients_tenant_id_idx" ON "consulting_clients"("tenant_id");
  `);

  // Step 9: Projects
  await runSQL("Create projects table", `
    CREATE TABLE "projects" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "client_id" UUID,
      "status" "ProjectStatus" NOT NULL DEFAULT 'planning',
      "start_date" DATE,
      "end_date" DATE,
      "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
      "archived_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "projects_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "projects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "consulting_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX "projects_tenant_id_idx" ON "projects"("tenant_id");
    CREATE INDEX "projects_client_id_idx" ON "projects"("client_id");
    CREATE INDEX "projects_status_idx" ON "projects"("status");
  `);

  await runSQL("Create project_standards table", `
    CREATE TABLE "project_standards" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "project_id" UUID NOT NULL,
      "standard_id" UUID NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "project_standards_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "project_standards_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "project_standards_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "project_standards_project_id_standard_id_key" ON "project_standards"("project_id", "standard_id");
  `);

  await runSQL("Create project_members table", `
    CREATE TABLE "project_members" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "project_id" UUID NOT NULL,
      "user_id" UUID NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'member',
      CONSTRAINT "project_members_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");
  `);

  // Step 10: Requirements & Controls
  await runSQL("Create project_requirements table", `
    CREATE TABLE "project_requirements" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID NOT NULL,
      "clause_id" UUID NOT NULL,
      "status" "RequirementStatus" NOT NULL DEFAULT 'not_started',
      "maturity" SMALLINT NOT NULL DEFAULT 0,
      "responsible_id" UUID,
      "due_date" DATE,
      "notes" TEXT,
      "evidence" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "project_requirements_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "project_requirements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "project_requirements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "project_requirements_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "standard_clauses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "project_requirements_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "project_requirements_project_id_clause_id_key" ON "project_requirements"("project_id", "clause_id");
    CREATE INDEX "project_requirements_tenant_id_idx" ON "project_requirements"("tenant_id");
    CREATE INDEX "project_requirements_project_id_idx" ON "project_requirements"("project_id");
  `);

  await runSQL("Create project_controls table", `
    CREATE TABLE "project_controls" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID NOT NULL,
      "control_id" UUID NOT NULL,
      "status" "RequirementStatus" NOT NULL DEFAULT 'not_started',
      "maturity" SMALLINT NOT NULL DEFAULT 0,
      "responsible_id" UUID,
      "implementation_notes" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "project_controls_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "project_controls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "project_controls_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "project_controls_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "standard_controls"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "project_controls_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "project_controls_project_id_control_id_key" ON "project_controls"("project_id", "control_id");
    CREATE INDEX "project_controls_tenant_id_idx" ON "project_controls"("tenant_id");
    CREATE INDEX "project_controls_project_id_idx" ON "project_controls"("project_id");
  `);

  await runSQL("Create soa_entries table", `
    CREATE TABLE "soa_entries" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID NOT NULL,
      "control_id" UUID NOT NULL,
      "applicable" BOOLEAN NOT NULL DEFAULT true,
      "justification" TEXT,
      "implementation_status" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "soa_entries_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "soa_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "soa_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "soa_entries_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "standard_controls"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "soa_entries_project_id_control_id_key" ON "soa_entries"("project_id", "control_id");
    CREATE INDEX "soa_entries_tenant_id_idx" ON "soa_entries"("tenant_id");
    CREATE INDEX "soa_entries_project_id_idx" ON "soa_entries"("project_id");
  `);

  // Step 11: Risks
  await runSQL("Create risks table", `
    CREATE TABLE "risks" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID NOT NULL,
      "code" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "impact_dimensions" JSONB NOT NULL DEFAULT '{}',
      "probability" SMALLINT NOT NULL,
      "impact" SMALLINT NOT NULL,
      "risk_level" TEXT NOT NULL,
      "treatment" TEXT,
      "treatment_plan" TEXT,
      "responsible_id" UUID,
      "status" TEXT NOT NULL DEFAULT 'identified',
      "residual_probability" SMALLINT,
      "residual_impact" SMALLINT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "risks_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "risks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "risks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "risks_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "risks_tenant_id_code_key" ON "risks"("tenant_id", "code");
    CREATE INDEX "risks_tenant_id_idx" ON "risks"("tenant_id");
    CREATE INDEX "risks_project_id_idx" ON "risks"("project_id");
    CREATE INDEX "risks_risk_level_idx" ON "risks"("risk_level");
  `);

  await runSQL("Create risk_treatments table", `
    CREATE TABLE "risk_treatments" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "risk_id" UUID NOT NULL,
      "control_id" UUID,
      "description" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'planned',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "risk_treatments_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "risk_treatments_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "risk_treatments_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "standard_controls"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX "risk_treatments_risk_id_idx" ON "risk_treatments"("risk_id");
  `);

  // Step 12: Nonconformities
  await runSQL("Create nonconformities table", `
    CREATE TABLE "nonconformities" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID NOT NULL,
      "code" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "origin" TEXT NOT NULL,
      "type" TEXT,
      "severity" "NcSeverity" NOT NULL DEFAULT 'minor',
      "clause_id" UUID,
      "status" "NcStatus" NOT NULL DEFAULT 'open',
      "responsible_id" UUID,
      "due_date" DATE,
      "closed_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "nonconformities_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "nonconformities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "nonconformities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "nonconformities_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "standard_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "nonconformities_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "nonconformities_tenant_id_code_key" ON "nonconformities"("tenant_id", "code");
    CREATE INDEX "nonconformities_tenant_id_idx" ON "nonconformities"("tenant_id");
    CREATE INDEX "nonconformities_project_id_idx" ON "nonconformities"("project_id");
    CREATE INDEX "nonconformities_status_idx" ON "nonconformities"("status");
  `);

  await runSQL("Create nc_root_causes table", `
    CREATE TABLE "nc_root_causes" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "nonconformity_id" UUID NOT NULL,
      "method" "RootCauseMethod" NOT NULL,
      "analysis" JSONB NOT NULL DEFAULT '{}',
      "conclusion" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "nc_root_causes_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "nc_root_causes_nonconformity_id_fkey" FOREIGN KEY ("nonconformity_id") REFERENCES "nonconformities"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "nc_root_causes_nonconformity_id_key" ON "nc_root_causes"("nonconformity_id");
  `);

  // Step 13: Action Plans
  await runSQL("Create action_plans table", `
    CREATE TABLE "action_plans" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID NOT NULL,
      "code" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "type" "ActionType" NOT NULL,
      "status" "ActionStatus" NOT NULL DEFAULT 'planned',
      "responsible_id" UUID,
      "nonconformity_id" UUID,
      "risk_id" UUID,
      "due_date" DATE,
      "completed_at" TIMESTAMP(3),
      "verified_at" TIMESTAMP(3),
      "verification_notes" TEXT,
      "is_effective" BOOLEAN,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "action_plans_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "action_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "action_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "action_plans_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "action_plans_nonconformity_id_fkey" FOREIGN KEY ("nonconformity_id") REFERENCES "nonconformities"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "action_plans_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "action_plans_tenant_id_code_key" ON "action_plans"("tenant_id", "code");
    CREATE INDEX "action_plans_tenant_id_idx" ON "action_plans"("tenant_id");
    CREATE INDEX "action_plans_project_id_idx" ON "action_plans"("project_id");
    CREATE INDEX "action_plans_status_idx" ON "action_plans"("status");
    CREATE INDEX "action_plans_nonconformity_id_idx" ON "action_plans"("nonconformity_id");
  `);

  // Step 14: Audits
  await runSQL("Create audits table", `
    CREATE TABLE "audits" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "start_date" DATE NOT NULL,
      "end_date" DATE,
      "status" TEXT NOT NULL DEFAULT 'planned',
      "lead_auditor_id" UUID,
      "scope" TEXT,
      "conclusion" TEXT,
      "notes" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "audits_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "audits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "audits_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "audits_lead_auditor_id_fkey" FOREIGN KEY ("lead_auditor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX "audits_tenant_id_idx" ON "audits"("tenant_id");
    CREATE INDEX "audits_project_id_idx" ON "audits"("project_id");
    CREATE INDEX "audits_status_idx" ON "audits"("status");
  `);

  await runSQL("Create audit_findings table", `
    CREATE TABLE "audit_findings" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "audit_id" UUID NOT NULL,
      "clause_id" UUID,
      "classification" "FindingClassification" NOT NULL DEFAULT 'observation',
      "description" TEXT NOT NULL,
      "evidence" TEXT,
      "nonconformity_id" UUID,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "audit_findings_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "audit_findings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "audit_findings_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "audit_findings_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "standard_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "audit_findings_nonconformity_id_fkey" FOREIGN KEY ("nonconformity_id") REFERENCES "nonconformities"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX "audit_findings_tenant_id_idx" ON "audit_findings"("tenant_id");
    CREATE INDEX "audit_findings_audit_id_idx" ON "audit_findings"("audit_id");
  `);

  // Step 15: Documents
  await runSQL("Create documents table", `
    CREATE TABLE "documents" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID,
      "code" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "type" "DocumentType" NOT NULL,
      "category" TEXT,
      "version" TEXT NOT NULL DEFAULT '1.0',
      "status" "DocumentStatus" NOT NULL DEFAULT 'draft',
      "content" TEXT,
      "file_url" TEXT,
      "author_id" UUID NOT NULL,
      "reviewer_id" UUID,
      "approver_id" UUID,
      "approved_at" TIMESTAMP(3),
      "next_review_date" DATE,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "documents_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "documents_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "documents_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "documents_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "documents_tenant_id_code_key" ON "documents"("tenant_id", "code");
    CREATE INDEX "documents_tenant_id_idx" ON "documents"("tenant_id");
    CREATE INDEX "documents_project_id_idx" ON "documents"("project_id");
    CREATE INDEX "documents_type_idx" ON "documents"("type");
    CREATE INDEX "documents_status_idx" ON "documents"("status");
  `);

  await runSQL("Create document_versions table", `
    CREATE TABLE "document_versions" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "document_id" UUID NOT NULL,
      "version" TEXT NOT NULL,
      "content" TEXT,
      "file_url" TEXT,
      "changed_by_id" UUID NOT NULL,
      "change_notes" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "document_versions_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE INDEX "document_versions_document_id_idx" ON "document_versions"("document_id");
  `);

  // Step 16: Indicators
  await runSQL("Create indicators table", `
    CREATE TABLE "indicators" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "unit" TEXT NOT NULL,
      "frequency" TEXT NOT NULL,
      "target" DECIMAL(12,2) NOT NULL,
      "lower_limit" DECIMAL(12,2),
      "upper_limit" DECIMAL(12,2),
      "process_id" UUID,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "indicators_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "indicators_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "indicators_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE INDEX "indicators_tenant_id_idx" ON "indicators"("tenant_id");
    CREATE INDEX "indicators_project_id_idx" ON "indicators"("project_id");
  `);

  await runSQL("Create indicator_measurements table", `
    CREATE TABLE "indicator_measurements" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "indicator_id" UUID NOT NULL,
      "value" DECIMAL(12,2) NOT NULL,
      "period" DATE NOT NULL,
      "notes" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "indicator_measurements_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "indicator_measurements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "indicator_measurements_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX "indicator_measurements_tenant_id_idx" ON "indicator_measurements"("tenant_id");
    CREATE INDEX "indicator_measurements_indicator_id_period_idx" ON "indicator_measurements"("indicator_id", "period");
  `);

  // Step 17: Management Reviews
  await runSQL("Create management_reviews table", `
    CREATE TABLE "management_reviews" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "project_id" UUID NOT NULL,
      "scheduled_date" DATE NOT NULL,
      "actual_date" DATE,
      "status" TEXT NOT NULL DEFAULT 'scheduled',
      "minutes" TEXT,
      "decisions" JSONB NOT NULL DEFAULT '[]',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "management_reviews_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "management_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "management_reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX "management_reviews_tenant_id_idx" ON "management_reviews"("tenant_id");
    CREATE INDEX "management_reviews_project_id_idx" ON "management_reviews"("project_id");
  `);

  // Step 18: Audit Logs & Notifications
  await runSQL("Create audit_logs table", `
    CREATE TABLE "audit_logs" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "user_id" UUID NOT NULL,
      "action" TEXT NOT NULL,
      "entity_type" TEXT NOT NULL,
      "entity_id" TEXT NOT NULL,
      "metadata" JSONB NOT NULL DEFAULT '{}',
      "ip_address" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");
    CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
    CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
    CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
  `);

  await runSQL("Create notifications table", `
    CREATE TABLE "notifications" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "tenant_id" UUID NOT NULL,
      "user_id" UUID NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "read_at" TIMESTAMP(3),
      "entity_type" TEXT,
      "entity_id" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");
    CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
    CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");
  `);

  // Step 19: Prisma migrations table (so Prisma knows the state)
  await runSQL("Create _prisma_migrations table", `
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMP WITH TIME ZONE,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMP WITH TIME ZONE,
      "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
    );
  `);

  // Final verification
  const tables = await runSQL("Verify tables",
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );

  console.log(`\n=== DONE! ${tables.length} tables created ===`);
  tables.forEach(t => console.log(`  - ${t.table_name}`));
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
