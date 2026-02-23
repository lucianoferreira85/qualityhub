-- ============================================================
-- Fase 13: Prisma Schema Cleanup - Enums + Indexes + Fixes
-- ============================================================
-- IMPORTANT: Run via: npx prisma db execute --file prisma/migrations/fase13_enums.sql --config prisma/prisma.config.ts

BEGIN;

-- ==================== STEP 1: CREATE ENUM TYPES ====================

CREATE TYPE "ActiveStatus" AS ENUM ('active', 'inactive');

CREATE TYPE "RiskStatus" AS ENUM ('identified', 'analyzing', 'treated', 'accepted', 'monitored', 'closed');

CREATE TYPE "RiskLevel" AS ENUM ('very_low', 'low', 'medium', 'high', 'very_high');

CREATE TYPE "RiskTreatmentType" AS ENUM ('avoid', 'mitigate', 'transfer', 'accept');

CREATE TYPE "TreatmentStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

CREATE TYPE "MonitoringFrequency" AS ENUM ('weekly', 'monthly', 'quarterly', 'semiannual', 'annual');

CREATE TYPE "RiskAppetite" AS ENUM ('averse', 'minimal', 'cautious', 'flexible', 'open');

CREATE TYPE "AuditType" AS ENUM ('internal', 'external', 'certification', 'surveillance');

CREATE TYPE "AuditStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

CREATE TYPE "ReviewStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

CREATE TYPE "PolicyStatus" AS ENUM ('draft', 'in_review', 'approved', 'published', 'archived');

CREATE TYPE "CampaignType" AS ENUM ('training', 'workshop', 'awareness_session', 'e_learning', 'exercise');

CREATE TYPE "CampaignStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

CREATE TYPE "ParticipantStatus" AS ENUM ('invited', 'confirmed', 'attended', 'completed', 'absent');

CREATE TYPE "ImprovementStatus" AS ENUM ('identified', 'analyzing', 'planned', 'in_progress', 'implemented', 'verified', 'closed');

CREATE TYPE "PriorityLevel" AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE "IncidentType" AS ENUM ('data_breach', 'unauthorized_access', 'malware', 'phishing', 'denial_of_service', 'physical', 'social_engineering', 'other');

CREATE TYPE "IncidentSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE "IncidentCategory" AS ENUM ('confidentiality', 'integrity', 'availability', 'multiple');

CREATE TYPE "IncidentStatus" AS ENUM ('reported', 'triaged', 'contained', 'investigating', 'resolved', 'closed');

CREATE TYPE "IncidentActionType" AS ENUM ('containment', 'eradication', 'recovery', 'preventive');

CREATE TYPE "IncidentActionStatus" AS ENUM ('pending', 'in_progress', 'completed');

CREATE TYPE "AssetType" AS ENUM ('hardware', 'software', 'data', 'service', 'people', 'facility', 'network', 'other');

CREATE TYPE "AssetCategory" AS ENUM ('primary', 'support', 'infrastructure');

CREATE TYPE "AssetClassification" AS ENUM ('public', 'internal', 'confidential', 'restricted');

CREATE TYPE "AssetCriticality" AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE "AssetStatus" AS ENUM ('active', 'inactive', 'decommissioned', 'under_review');

CREATE TYPE "SupplierType" AS ENUM ('cloud_provider', 'saas', 'outsourcing', 'consulting', 'data_processor', 'infrastructure', 'other');

CREATE TYPE "SupplierCategory" AS ENUM ('critical', 'important', 'standard');

CREATE TYPE "DataAccessLevel" AS ENUM ('none', 'limited', 'full');

CREATE TYPE "SupplierStatus" AS ENUM ('active', 'under_review', 'suspended', 'terminated');

CREATE TYPE "AssessmentStatus" AS ENUM ('planned', 'in_progress', 'completed');

CREATE TYPE "ChangeType" AS ENUM ('process', 'technology', 'organizational', 'documentation', 'control', 'scope', 'other');

CREATE TYPE "ChangeStatus" AS ENUM ('requested', 'under_review', 'approved', 'in_progress', 'implemented', 'verified', 'rejected', 'cancelled');

CREATE TYPE "ContextType" AS ENUM ('strength', 'weakness', 'opportunity', 'threat');

CREATE TYPE "ImpactLevel" AS ENUM ('high', 'medium', 'low');

CREATE TYPE "PartyType" AS ENUM ('internal', 'external');

CREATE TYPE "EngagementStrategy" AS ENUM ('manage_closely', 'keep_satisfied', 'keep_informed', 'monitor');

CREATE TYPE "ScopeStatus" AS ENUM ('draft', 'active', 'approved', 'archived');

CREATE TYPE "CompetenceStatus" AS ENUM ('identified', 'planned', 'in_progress', 'completed', 'verified');


-- ==================== STEP 2: ALTER COLUMNS String -> Enum ====================
-- Pattern: DROP DEFAULT -> UPDATE legacy values -> ALTER TYPE -> SET DEFAULT

-- --- Risk ---
ALTER TABLE "risks" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "risks" SET "status" = 'analyzing' WHERE "status" = 'assessed';
UPDATE "risks" SET "status" = 'treated' WHERE "status" = 'treating';
ALTER TABLE "risks" ALTER COLUMN "status" TYPE "RiskStatus" USING "status"::"RiskStatus";
ALTER TABLE "risks" ALTER COLUMN "status" SET DEFAULT 'identified'::"RiskStatus";

UPDATE "risks" SET "risk_level" = 'very_high' WHERE "risk_level" = 'critical';
ALTER TABLE "risks" ALTER COLUMN "risk_level" TYPE "RiskLevel" USING "risk_level"::"RiskLevel";

ALTER TABLE "risks" ALTER COLUMN "treatment" TYPE "RiskTreatmentType" USING "treatment"::"RiskTreatmentType";

UPDATE "risks" SET "monitoring_frequency" = 'semiannual' WHERE "monitoring_frequency" = 'semi_annual';
ALTER TABLE "risks" ALTER COLUMN "monitoring_frequency" TYPE "MonitoringFrequency" USING "monitoring_frequency"::"MonitoringFrequency";

UPDATE "risks" SET "risk_appetite" = 'averse' WHERE "risk_appetite" = 'very_low';
UPDATE "risks" SET "risk_appetite" = 'minimal' WHERE "risk_appetite" = 'low';
UPDATE "risks" SET "risk_appetite" = 'cautious' WHERE "risk_appetite" = 'moderate';
UPDATE "risks" SET "risk_appetite" = 'flexible' WHERE "risk_appetite" = 'high';
UPDATE "risks" SET "risk_appetite" = 'open' WHERE "risk_appetite" = 'very_high';
ALTER TABLE "risks" ALTER COLUMN "risk_appetite" TYPE "RiskAppetite" USING "risk_appetite"::"RiskAppetite";

-- --- RiskTreatment ---
ALTER TABLE "risk_treatments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "risk_treatments" ALTER COLUMN "status" TYPE "TreatmentStatus" USING "status"::"TreatmentStatus";
ALTER TABLE "risk_treatments" ALTER COLUMN "status" SET DEFAULT 'planned'::"TreatmentStatus";

-- --- RiskHistory ---
UPDATE "risk_history" SET "status" = 'analyzing' WHERE "status" = 'assessed';
UPDATE "risk_history" SET "status" = 'treated' WHERE "status" = 'treating';
ALTER TABLE "risk_history" ALTER COLUMN "status" TYPE "RiskStatus" USING "status"::"RiskStatus";
ALTER TABLE "risk_history" ALTER COLUMN "risk_level" TYPE "RiskLevel" USING "risk_level"::"RiskLevel";

-- --- Audit ---
UPDATE "audits" SET "type" = 'surveillance' WHERE "type" = 'supplier';
ALTER TABLE "audits" ALTER COLUMN "type" TYPE "AuditType" USING "type"::"AuditType";
ALTER TABLE "audits" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "audits" ALTER COLUMN "status" TYPE "AuditStatus" USING "status"::"AuditStatus";
ALTER TABLE "audits" ALTER COLUMN "status" SET DEFAULT 'planned'::"AuditStatus";

-- --- ManagementReview ---
ALTER TABLE "management_reviews" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "management_reviews" ALTER COLUMN "status" TYPE "ReviewStatus" USING "status"::"ReviewStatus";
ALTER TABLE "management_reviews" ALTER COLUMN "status" SET DEFAULT 'scheduled'::"ReviewStatus";

-- --- Policy ---
ALTER TABLE "policies" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "policies" ALTER COLUMN "status" TYPE "PolicyStatus" USING "status"::"PolicyStatus";
ALTER TABLE "policies" ALTER COLUMN "status" SET DEFAULT 'draft'::"PolicyStatus";

-- --- AwarenessCampaign ---
UPDATE "awareness_campaigns" SET "type" = 'exercise' WHERE "type" IN ('phishing_simulation', 'other');
ALTER TABLE "awareness_campaigns" ALTER COLUMN "type" TYPE "CampaignType" USING "type"::"CampaignType";
ALTER TABLE "awareness_campaigns" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "awareness_campaigns" ALTER COLUMN "status" TYPE "CampaignStatus" USING "status"::"CampaignStatus";
ALTER TABLE "awareness_campaigns" ALTER COLUMN "status" SET DEFAULT 'planned'::"CampaignStatus";

-- --- AwarenessParticipant ---
ALTER TABLE "awareness_participants" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "awareness_participants" ALTER COLUMN "status" TYPE "ParticipantStatus" USING "status"::"ParticipantStatus";
ALTER TABLE "awareness_participants" ALTER COLUMN "status" SET DEFAULT 'invited'::"ParticipantStatus";

-- --- ImprovementOpportunity ---
ALTER TABLE "improvement_opportunities" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "improvement_opportunities" SET "status" = 'analyzing' WHERE "status" = 'evaluated';
UPDATE "improvement_opportunities" SET "status" = 'planned' WHERE "status" = 'approved';
UPDATE "improvement_opportunities" SET "status" = 'closed' WHERE "status" = 'rejected';
ALTER TABLE "improvement_opportunities" ALTER COLUMN "status" TYPE "ImprovementStatus" USING "status"::"ImprovementStatus";
ALTER TABLE "improvement_opportunities" ALTER COLUMN "status" SET DEFAULT 'identified'::"ImprovementStatus";
ALTER TABLE "improvement_opportunities" ALTER COLUMN "priority" DROP DEFAULT;
UPDATE "improvement_opportunities" SET "priority" = 'urgent' WHERE "priority" = 'critical';
ALTER TABLE "improvement_opportunities" ALTER COLUMN "priority" TYPE "PriorityLevel" USING "priority"::"PriorityLevel";
ALTER TABLE "improvement_opportunities" ALTER COLUMN "priority" SET DEFAULT 'medium'::"PriorityLevel";

-- --- SecurityIncident ---
ALTER TABLE "security_incidents" ALTER COLUMN "type" TYPE "IncidentType" USING "type"::"IncidentType";
ALTER TABLE "security_incidents" ALTER COLUMN "severity" DROP DEFAULT;
ALTER TABLE "security_incidents" ALTER COLUMN "severity" TYPE "IncidentSeverity" USING "severity"::"IncidentSeverity";
ALTER TABLE "security_incidents" ALTER COLUMN "severity" SET DEFAULT 'medium'::"IncidentSeverity";
ALTER TABLE "security_incidents" ALTER COLUMN "category" TYPE "IncidentCategory" USING "category"::"IncidentCategory";
ALTER TABLE "security_incidents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "security_incidents" ALTER COLUMN "status" TYPE "IncidentStatus" USING "status"::"IncidentStatus";
ALTER TABLE "security_incidents" ALTER COLUMN "status" SET DEFAULT 'reported'::"IncidentStatus";

-- --- IncidentAction ---
ALTER TABLE "incident_actions" ALTER COLUMN "type" TYPE "IncidentActionType" USING "type"::"IncidentActionType";
ALTER TABLE "incident_actions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "incident_actions" ALTER COLUMN "status" TYPE "IncidentActionStatus" USING "status"::"IncidentActionStatus";
ALTER TABLE "incident_actions" ALTER COLUMN "status" SET DEFAULT 'pending'::"IncidentActionStatus";

-- --- InformationAsset ---
ALTER TABLE "information_assets" ALTER COLUMN "type" TYPE "AssetType" USING "type"::"AssetType";
ALTER TABLE "information_assets" ALTER COLUMN "category" TYPE "AssetCategory" USING "category"::"AssetCategory";
ALTER TABLE "information_assets" ALTER COLUMN "classification" DROP DEFAULT;
ALTER TABLE "information_assets" ALTER COLUMN "classification" TYPE "AssetClassification" USING "classification"::"AssetClassification";
ALTER TABLE "information_assets" ALTER COLUMN "classification" SET DEFAULT 'internal'::"AssetClassification";
ALTER TABLE "information_assets" ALTER COLUMN "criticality" DROP DEFAULT;
ALTER TABLE "information_assets" ALTER COLUMN "criticality" TYPE "AssetCriticality" USING "criticality"::"AssetCriticality";
ALTER TABLE "information_assets" ALTER COLUMN "criticality" SET DEFAULT 'medium'::"AssetCriticality";
ALTER TABLE "information_assets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "information_assets" ALTER COLUMN "status" TYPE "AssetStatus" USING "status"::"AssetStatus";
ALTER TABLE "information_assets" ALTER COLUMN "status" SET DEFAULT 'active'::"AssetStatus";

-- --- Supplier ---
ALTER TABLE "suppliers" ALTER COLUMN "type" TYPE "SupplierType" USING "type"::"SupplierType";
ALTER TABLE "suppliers" ALTER COLUMN "category" TYPE "SupplierCategory" USING "category"::"SupplierCategory";
ALTER TABLE "suppliers" ALTER COLUMN "data_access" TYPE "DataAccessLevel" USING "data_access"::"DataAccessLevel";
-- NOTE: suppliers.riskLevel is camelCase in DB (no @map in schema)
ALTER TABLE "suppliers" ALTER COLUMN "riskLevel" DROP DEFAULT;
ALTER TABLE "suppliers" ALTER COLUMN "riskLevel" TYPE "AssetCriticality" USING "riskLevel"::"AssetCriticality";
ALTER TABLE "suppliers" ALTER COLUMN "riskLevel" SET DEFAULT 'medium'::"AssetCriticality";
ALTER TABLE "suppliers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "suppliers" ALTER COLUMN "status" TYPE "SupplierStatus" USING "status"::"SupplierStatus";
ALTER TABLE "suppliers" ALTER COLUMN "status" SET DEFAULT 'active'::"SupplierStatus";

-- --- SupplierAssessment ---
ALTER TABLE "supplier_assessments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "supplier_assessments" ALTER COLUMN "status" TYPE "AssessmentStatus" USING "status"::"AssessmentStatus";
ALTER TABLE "supplier_assessments" ALTER COLUMN "status" SET DEFAULT 'completed'::"AssessmentStatus";

-- --- ChangeRequest ---
ALTER TABLE "change_requests" ALTER COLUMN "type" TYPE "ChangeType" USING "type"::"ChangeType";
ALTER TABLE "change_requests" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "change_requests" ALTER COLUMN "priority" TYPE "PriorityLevel" USING "priority"::"PriorityLevel";
ALTER TABLE "change_requests" ALTER COLUMN "priority" SET DEFAULT 'medium'::"PriorityLevel";
ALTER TABLE "change_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "change_requests" ALTER COLUMN "status" TYPE "ChangeStatus" USING "status"::"ChangeStatus";
ALTER TABLE "change_requests" ALTER COLUMN "status" SET DEFAULT 'requested'::"ChangeStatus";

-- --- OrganizationContext ---
ALTER TABLE "organization_contexts" ALTER COLUMN "type" TYPE "ContextType" USING "type"::"ContextType";
ALTER TABLE "organization_contexts" ALTER COLUMN "impact" TYPE "ImpactLevel" USING "impact"::"ImpactLevel";
ALTER TABLE "organization_contexts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "organization_contexts" ALTER COLUMN "status" TYPE "ActiveStatus" USING "status"::"ActiveStatus";
ALTER TABLE "organization_contexts" ALTER COLUMN "status" SET DEFAULT 'active'::"ActiveStatus";

-- --- InterestedParty ---
ALTER TABLE "interested_parties" ALTER COLUMN "type" TYPE "PartyType" USING "type"::"PartyType";
ALTER TABLE "interested_parties" ALTER COLUMN "influence" TYPE "ImpactLevel" USING "influence"::"ImpactLevel";
ALTER TABLE "interested_parties" ALTER COLUMN "interest" TYPE "ImpactLevel" USING "interest"::"ImpactLevel";
ALTER TABLE "interested_parties" ALTER COLUMN "strategy" TYPE "EngagementStrategy" USING "strategy"::"EngagementStrategy";
ALTER TABLE "interested_parties" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "interested_parties" ALTER COLUMN "status" TYPE "ActiveStatus" USING "status"::"ActiveStatus";
ALTER TABLE "interested_parties" ALTER COLUMN "status" SET DEFAULT 'active'::"ActiveStatus";

-- --- SgsiScope ---
ALTER TABLE "sgsi_scopes" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "sgsi_scopes" SET "status" = 'active' WHERE "status" = 'under_review';
ALTER TABLE "sgsi_scopes" ALTER COLUMN "status" TYPE "ScopeStatus" USING "status"::"ScopeStatus";
ALTER TABLE "sgsi_scopes" ALTER COLUMN "status" SET DEFAULT 'draft'::"ScopeStatus";

-- --- CommunicationPlan ---
ALTER TABLE "communication_plans" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "communication_plans" ALTER COLUMN "status" TYPE "ActiveStatus" USING "status"::"ActiveStatus";
ALTER TABLE "communication_plans" ALTER COLUMN "status" SET DEFAULT 'active'::"ActiveStatus";

-- --- Competence ---
ALTER TABLE "competences" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "competences" ALTER COLUMN "status" TYPE "CompetenceStatus" USING "status"::"CompetenceStatus";
ALTER TABLE "competences" ALTER COLUMN "status" SET DEFAULT 'identified'::"CompetenceStatus";

-- --- SecurityObjective ---
ALTER TABLE "security_objectives" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "security_objectives" SET "status" = 'identified' WHERE "status" = 'defined';
UPDATE "security_objectives" SET "status" = 'implemented' WHERE "status" = 'achieved';
UPDATE "security_objectives" SET "status" = 'closed' WHERE "status" IN ('not_achieved', 'cancelled');
ALTER TABLE "security_objectives" ALTER COLUMN "status" TYPE "ImprovementStatus" USING "status"::"ImprovementStatus";
ALTER TABLE "security_objectives" ALTER COLUMN "status" SET DEFAULT 'identified'::"ImprovementStatus";

-- --- Process ---
ALTER TABLE "processes" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "processes" SET "status" = 'inactive' WHERE "status" NOT IN ('active', 'inactive');
ALTER TABLE "processes" ALTER COLUMN "status" TYPE "ActiveStatus" USING "status"::"ActiveStatus";
ALTER TABLE "processes" ALTER COLUMN "status" SET DEFAULT 'active'::"ActiveStatus";


-- ==================== STEP 3: User.id DEFAULT ====================

ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();


-- ==================== STEP 4: Add tenantId to RiskTreatment & RiskHistory ====================

-- Add column as nullable first
ALTER TABLE "risk_treatments" ADD COLUMN "tenant_id" UUID;
ALTER TABLE "risk_history" ADD COLUMN "tenant_id" UUID;

-- Backfill from parent risk
UPDATE "risk_treatments" SET "tenant_id" = r."tenant_id" FROM "risks" r WHERE "risk_treatments"."risk_id" = r."id";
UPDATE "risk_history" SET "tenant_id" = r."tenant_id" FROM "risks" r WHERE "risk_history"."risk_id" = r."id";

-- Set NOT NULL after backfill
ALTER TABLE "risk_treatments" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "risk_history" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Add FK constraints
ALTER TABLE "risk_treatments" ADD CONSTRAINT "risk_treatments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "risk_history" ADD CONSTRAINT "risk_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ==================== STEP 5: Add Missing FK Indexes ====================

CREATE INDEX "documents_author_id_idx" ON "documents"("author_id");
CREATE INDEX "document_versions_changed_by_id_idx" ON "document_versions"("changed_by_id");
CREATE INDEX "change_requests_requested_by_id_idx" ON "change_requests"("requested_by_id");
CREATE INDEX "security_incidents_reported_by_id_idx" ON "security_incidents"("reported_by_id");
CREATE INDEX "nonconformities_responsible_id_idx" ON "nonconformities"("responsible_id");
CREATE INDEX "policies_author_id_idx" ON "policies"("author_id");
CREATE INDEX "risk_treatments_tenant_id_idx" ON "risk_treatments"("tenant_id");
CREATE INDEX "risk_history_tenant_id_idx" ON "risk_history"("tenant_id");

COMMIT;
