import { z } from "zod";

// ==================== Auth ====================

export const signUpSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
});

export const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// ==================== Tenant ====================

export const createTenantSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  cnpj: z.string().optional(),
  sector: z.string().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logo: z.string().url().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// ==================== Invitation ====================

export const createInvitationSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.enum([
    "tenant_admin",
    "project_manager",
    "senior_consultant",
    "junior_consultant",
    "internal_auditor",
    "external_auditor",
    "client_viewer",
  ]),
});

// ==================== Consulting Client ====================

export const createClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  cnpj: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  sector: z.string().nullable().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  cnpj: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  sector: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// ==================== Project ====================

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  description: z.string().nullable().optional(),
  clientId: z.string().uuid().nullable().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }).nullable().optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  standardIds: z.array(z.string().uuid()).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  clientId: z.string().uuid().nullable().optional(),
  status: z.enum(["planning", "in_progress", "completed", "archived"]).optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  targetMaturity: z.number().int().min(0).max(4).optional(),
});

// ==================== Requirement ====================

export const updateRequirementSchema = z.object({
  status: z.enum(["not_started", "in_progress", "implemented", "verified", "nonconforming"]).optional(),
  maturity: z.number().int().min(0).max(4).optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  notes: z.string().nullable().optional(),
  evidence: z.string().nullable().optional(),
});

// ==================== Control ====================

export const updateControlSchema = z.object({
  status: z.enum(["not_started", "in_progress", "implemented", "verified", "nonconforming"]).optional(),
  maturity: z.number().int().min(0).max(4).optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  implementationNotes: z.string().nullable().optional(),
});

// ==================== SoA ====================

export const updateSoaSchema = z.object({
  applicable: z.boolean().optional(),
  justification: z.string().nullable().optional(),
  implementationStatus: z.string().nullable().optional(),
});

// ==================== Risk ====================

export const createRiskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.enum(["strategic", "operational", "compliance", "financial", "technology", "legal"]),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  impactDimensions: z.record(z.string(), z.unknown()).optional(),
  treatment: z.enum(["accept", "mitigate", "transfer", "avoid"]).nullable().optional(),
  treatmentPlan: z.string().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateRiskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(["strategic", "operational", "compliance", "financial", "technology", "legal"]).optional(),
  probability: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  impactDimensions: z.record(z.string(), z.unknown()).optional(),
  treatment: z.enum(["accept", "mitigate", "transfer", "avoid"]).nullable().optional(),
  treatmentPlan: z.string().nullable().optional(),
  status: z.enum(["identified", "assessed", "treating", "monitored", "closed"]).optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  residualProbability: z.number().int().min(1).max(5).nullable().optional(),
  residualImpact: z.number().int().min(1).max(5).nullable().optional(),
  nextReviewDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  monitoringFrequency: z.enum(["monthly", "quarterly", "semi_annual", "annual"]).nullable().optional(),
  riskAppetite: z.enum(["very_low", "low", "moderate", "high", "very_high"]).nullable().optional(),
  reviewNotes: z.string().nullable().optional(),
});

// ==================== Nonconformity ====================

export const createNonconformitySchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().min(1, "Descrição é obrigatória"),
  origin: z.enum(["audit", "customer_complaint", "internal", "supplier", "process", "management_review"]),
  type: z.string().nullable().optional(),
  severity: z.enum(["observation", "minor", "major", "critical"]),
  clauseId: z.string().uuid().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateNonconformitySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  severity: z.enum(["observation", "minor", "major", "critical"]).optional(),
  status: z.enum(["open", "analysis", "action_defined", "in_execution", "effectiveness_check", "closed"]).optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
});

export const createRootCauseSchema = z.object({
  method: z.enum(["five_whys", "ishikawa", "fault_tree", "brainstorming"]),
  analysis: z.record(z.string(), z.unknown()),
  conclusion: z.string().nullable().optional(),
});

// ==================== Action Plan ====================

export const createActionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["corrective", "preventive", "improvement"]),
  responsibleId: z.string().uuid().nullable().optional(),
  nonconformityId: z.string().uuid().nullable().optional(),
  riskId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }).nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateActionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(["corrective", "preventive", "improvement"]).optional(),
  status: z.enum(["planned", "in_progress", "completed", "verified", "effective", "ineffective"]).optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  verificationNotes: z.string().nullable().optional(),
  isEffective: z.boolean().nullable().optional(),
});

// ==================== Audit ====================

export const createAuditSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  type: z.enum(["internal", "external", "supplier", "certification"]),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  leadAuditorId: z.string().uuid().nullable().optional(),
  scope: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateAuditSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  type: z.enum(["internal", "external", "supplier", "certification"]).optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
  conclusion: z.enum(["conforming", "minor_nc", "major_nc"]).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const createFindingSchema = z.object({
  clauseId: z.string().uuid().nullable().optional(),
  classification: z.enum(["conformity", "observation", "opportunity", "minor_nc", "major_nc"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  evidence: z.string().nullable().optional(),
  nonconformityId: z.string().uuid().nullable().optional(),
});

export const updateFindingSchema = z.object({
  clauseId: z.string().uuid().nullable().optional(),
  classification: z.enum(["conformity", "observation", "opportunity", "minor_nc", "major_nc"]).optional(),
  description: z.string().min(1).optional(),
  evidence: z.string().nullable().optional(),
  nonconformityId: z.string().uuid().nullable().optional(),
});

// ==================== Document ====================

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  type: z.enum(["policy", "procedure", "work_instruction", "form", "record", "manual"]),
  category: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  reviewerId: z.string().uuid().nullable().optional(),
  nextReviewDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  type: z.enum(["policy", "procedure", "work_instruction", "form", "record", "manual"]).optional(),
  category: z.string().nullable().optional(),
  version: z.string().optional(),
  status: z.enum(["draft", "in_review", "approved", "obsolete"]).optional(),
  content: z.string().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  reviewerId: z.string().uuid().nullable().optional(),
  approverId: z.string().uuid().nullable().optional(),
  nextReviewDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  changeNotes: z.string().nullable().optional(),
});

// ==================== Indicator ====================

export const createIndicatorSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  description: z.string().nullable().optional(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  target: z.number().positive("Meta deve ser positiva"),
  lowerLimit: z.number().nullable().optional(),
  upperLimit: z.number().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const updateIndicatorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  unit: z.string().min(1).optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).optional(),
  target: z.number().positive().optional(),
  lowerLimit: z.number().nullable().optional(),
  upperLimit: z.number().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const createMeasurementSchema = z.object({
  value: z.number(),
  period: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  notes: z.string().nullable().optional(),
});

export const updateMeasurementSchema = z.object({
  value: z.number().optional(),
  period: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }).optional(),
  notes: z.string().nullable().optional(),
});

// ==================== Process ====================

export const createProcessSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  description: z.string().nullable().optional(),
  projectId: z.string().uuid(),
  responsibleId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "inactive", "draft"]).optional(),
  category: z.string().nullable().optional(),
});

export const updateProcessSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "inactive", "draft"]).optional(),
  category: z.string().nullable().optional(),
});

// ==================== Management Review ====================

export const createManagementReviewSchema = z.object({
  projectId: z.string().uuid(),
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  minutes: z.string().nullable().optional(),
  decisions: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const updateManagementReviewSchema = z.object({
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  actualDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
  minutes: z.string().nullable().optional(),
  decisions: z.array(z.record(z.string(), z.unknown())).optional(),
});

// ==================== Onboarding ====================

export const onboardingStep1Schema = z.object({
  tenantName: z.string().min(2, "Nome da consultoria é obrigatório").max(100),
  cnpj: z.string().optional(),
  sector: z.string().optional(),
});

export const onboardingStep2Schema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
});

export const onboardingStep3Schema = z.object({
  standardIds: z.array(z.string().uuid()).min(1, "Selecione ao menos uma norma"),
});

export const onboardingStep4Schema = z.object({
  projectName: z.string().min(1).max(255).optional(),
  clientName: z.string().optional(),
  standardId: z.string().uuid().optional(),
});

export const onboardingStep5Schema = z.object({
  invitations: z.array(
    z.object({
      email: z.string().email(),
      role: z.enum([
        "project_manager",
        "senior_consultant",
        "junior_consultant",
        "internal_auditor",
      ]),
    })
  ).optional(),
});

// ==================== Organization Context (ISO 4.1) ====================

export const createContextSchema = z.object({
  type: z.enum(["strength", "weakness", "opportunity", "threat"]),
  title: z.string().min(1, "Título é obrigatório").max(255),
  category: z.enum(["financial", "technological", "legal", "market", "organizational", "human_resources"]).nullable().optional(),
  description: z.string().nullable().optional(),
  impact: z.enum(["high", "medium", "low"]).nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const updateContextSchema = z.object({
  type: z.enum(["strength", "weakness", "opportunity", "threat"]).optional(),
  title: z.string().min(1).max(255).optional(),
  category: z.enum(["financial", "technological", "legal", "market", "organizational", "human_resources"]).nullable().optional(),
  description: z.string().nullable().optional(),
  impact: z.enum(["high", "medium", "low"]).nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// ==================== Interested Parties (ISO 4.2) ====================

export const createInterestedPartySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  type: z.enum(["internal", "external"]),
  category: z.enum(["employee", "customer", "supplier", "regulator", "shareholder", "community", "partner"]).nullable().optional(),
  needsExpectations: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  influence: z.enum(["high", "medium", "low"]).nullable().optional(),
  interest: z.enum(["high", "medium", "low"]).nullable().optional(),
  strategy: z.enum(["manage_closely", "keep_satisfied", "keep_informed", "monitor"]).nullable().optional(),
  monitoringMethod: z.string().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const updateInterestedPartySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(["internal", "external"]).optional(),
  category: z.enum(["employee", "customer", "supplier", "regulator", "shareholder", "community", "partner"]).nullable().optional(),
  needsExpectations: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  influence: z.enum(["high", "medium", "low"]).nullable().optional(),
  interest: z.enum(["high", "medium", "low"]).nullable().optional(),
  strategy: z.enum(["manage_closely", "keep_satisfied", "keep_informed", "monitor"]).nullable().optional(),
  monitoringMethod: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// ==================== SGSI Scope (ISO 4.3) ====================

export const createSgsiScopeSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().nullable().optional(),
  boundaries: z.string().nullable().optional(),
  exclusions: z.string().nullable().optional(),
  justification: z.string().nullable().optional(),
  interfaces: z.string().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateSgsiScopeSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  boundaries: z.string().nullable().optional(),
  exclusions: z.string().nullable().optional(),
  justification: z.string().nullable().optional(),
  interfaces: z.string().nullable().optional(),
  status: z.enum(["draft", "approved", "under_review"]).optional(),
  version: z.string().optional(),
});

// ==================== Communication Plan (ISO 7.4) ====================

export const createCommunicationPlanSchema = z.object({
  topic: z.string().min(1, "Tópico é obrigatório").max(255),
  audience: z.string().min(1, "Público-alvo é obrigatório").max(255),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "semi_annual", "annual", "on_event"]),
  method: z.enum(["email", "meeting", "report", "intranet", "training", "newsletter", "other"]),
  responsibleId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateCommunicationPlanSchema = z.object({
  topic: z.string().min(1).max(255).optional(),
  audience: z.string().min(1).max(255).optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "semi_annual", "annual", "on_event"]).optional(),
  method: z.enum(["email", "meeting", "report", "intranet", "training", "newsletter", "other"]).optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// ==================== Competences (ISO 7.2) ====================

export const createCompetenceSchema = z.object({
  role: z.string().min(1, "Função é obrigatória").max(255),
  requiredCompetence: z.string().min(1, "Competência requerida é obrigatória"),
  currentLevel: z.enum(["none", "basic", "intermediate", "advanced"]).nullable().optional(),
  trainingAction: z.string().nullable().optional(),
  trainingType: z.enum(["course", "workshop", "mentoring", "certification", "self_study", "on_the_job"]).nullable().optional(),
  evidence: z.string().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateCompetenceSchema = z.object({
  role: z.string().min(1).max(255).optional(),
  requiredCompetence: z.string().min(1).optional(),
  currentLevel: z.enum(["none", "basic", "intermediate", "advanced"]).nullable().optional(),
  trainingAction: z.string().nullable().optional(),
  trainingType: z.enum(["course", "workshop", "mentoring", "certification", "self_study", "on_the_job"]).nullable().optional(),
  evidence: z.string().nullable().optional(),
  evidenceFileUrl: z.string().url().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  status: z.enum(["identified", "planned", "in_progress", "completed", "verified"]).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  completedAt: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ==================== Security Objectives (ISO 6.2) ====================

export const createObjectiveSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().nullable().optional(),
  category: z.enum(["confidentiality", "integrity", "availability", "compliance", "operational", "strategic"]).nullable().optional(),
  targetValue: z.number().nullable().optional(),
  targetUnit: z.string().nullable().optional(),
  currentValue: z.number().nullable().optional(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  indicatorId: z.string().uuid().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  measurable: z.boolean().optional(),
  monitoringFrequency: z.enum(["monthly", "quarterly", "semi_annual", "annual"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateObjectiveSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  category: z.enum(["confidentiality", "integrity", "availability", "compliance", "operational", "strategic"]).nullable().optional(),
  targetValue: z.number().nullable().optional(),
  targetUnit: z.string().nullable().optional(),
  currentValue: z.number().nullable().optional(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  indicatorId: z.string().uuid().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  status: z.enum(["defined", "in_progress", "achieved", "not_achieved", "cancelled"]).optional(),
  measurable: z.boolean().optional(),
  monitoringFrequency: z.enum(["monthly", "quarterly", "semi_annual", "annual"]).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ==================== Policies (ISO 5.2) ====================

export const createPolicySchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  category: z.enum(["information_security", "access_control", "data_protection", "acceptable_use", "incident_response", "business_continuity", "other"]).nullable().optional(),
  reviewerId: z.string().uuid().nullable().optional(),
  nextReviewDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  documentId: z.string().uuid().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updatePolicySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  category: z.enum(["information_security", "access_control", "data_protection", "acceptable_use", "incident_response", "business_continuity", "other"]).nullable().optional(),
  version: z.string().optional(),
  status: z.enum(["draft", "in_review", "approved", "published", "archived"]).optional(),
  reviewerId: z.string().uuid().nullable().optional(),
  approverId: z.string().uuid().nullable().optional(),
  nextReviewDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  documentId: z.string().uuid().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ==================== Awareness Campaigns (ISO 7.3) ====================

export const createCampaignSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().nullable().optional(),
  type: z.enum(["training", "workshop", "e_learning", "awareness_session", "phishing_simulation", "other"]),
  targetAudience: z.string().nullable().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  location: z.string().nullable().optional(),
  instructor: z.string().nullable().optional(),
  materials: z.string().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateCampaignSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(["training", "workshop", "e_learning", "awareness_session", "phishing_simulation", "other"]).optional(),
  targetAudience: z.string().nullable().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  location: z.string().nullable().optional(),
  instructor: z.string().nullable().optional(),
  materials: z.string().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
  notes: z.string().nullable().optional(),
});

export const addParticipantSchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  externalName: z.string().nullable().optional(),
  externalEmail: z.string().email().nullable().optional(),
});

export const updateParticipantSchema = z.object({
  attended: z.boolean().optional(),
  completedAt: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  score: z.number().min(0).max(100).nullable().optional(),
  feedback: z.string().nullable().optional(),
  status: z.enum(["invited", "confirmed", "attended", "completed", "absent"]).optional(),
});

// ==================== Improvement Opportunities (ISO 10.3) ====================

export const createImprovementSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().nullable().optional(),
  source: z.enum(["audit", "management_review", "incident", "feedback", "risk_assessment", "benchmarking", "other"]),
  category: z.enum(["process", "technology", "people", "documentation", "controls", "other"]).nullable().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  expectedImpact: z.string().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  actionPlanId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().uuid(),
});

export const updateImprovementSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  source: z.enum(["audit", "management_review", "incident", "feedback", "risk_assessment", "benchmarking", "other"]).optional(),
  category: z.enum(["process", "technology", "people", "documentation", "controls", "other"]).nullable().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  expectedImpact: z.string().nullable().optional(),
  actualImpact: z.string().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  status: z.enum(["identified", "evaluated", "approved", "in_progress", "implemented", "verified", "rejected"]).optional(),
  actionPlanId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ==================== Risk Review ====================

export const createRiskReviewSchema = z.object({
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  residualProbability: z.number().int().min(1).max(5).nullable().optional(),
  residualImpact: z.number().int().min(1).max(5).nullable().optional(),
  status: z.enum(["identified", "assessed", "treating", "monitored", "closed"]),
  reviewNotes: z.string().nullable().optional(),
});

// ==================== Inferred Types ====================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
export type CreateNonconformityInput = z.infer<typeof createNonconformitySchema>;
export type UpdateNonconformityInput = z.infer<typeof updateNonconformitySchema>;
export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type UpdateAuditInput = z.infer<typeof updateAuditSchema>;
export type CreateFindingInput = z.infer<typeof createFindingSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateIndicatorInput = z.infer<typeof createIndicatorSchema>;
export type UpdateIndicatorInput = z.infer<typeof updateIndicatorSchema>;
export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type CreateProcessInput = z.infer<typeof createProcessSchema>;
export type UpdateProcessInput = z.infer<typeof updateProcessSchema>;
export type CreateManagementReviewInput = z.infer<typeof createManagementReviewSchema>;
export type UpdateManagementReviewInput = z.infer<typeof updateManagementReviewSchema>;
export type CreateContextInput = z.infer<typeof createContextSchema>;
export type UpdateContextInput = z.infer<typeof updateContextSchema>;
export type CreateInterestedPartyInput = z.infer<typeof createInterestedPartySchema>;
export type UpdateInterestedPartyInput = z.infer<typeof updateInterestedPartySchema>;
export type CreateSgsiScopeInput = z.infer<typeof createSgsiScopeSchema>;
export type UpdateSgsiScopeInput = z.infer<typeof updateSgsiScopeSchema>;
export type CreateCommunicationPlanInput = z.infer<typeof createCommunicationPlanSchema>;
export type UpdateCommunicationPlanInput = z.infer<typeof updateCommunicationPlanSchema>;
export type CreateCompetenceInput = z.infer<typeof createCompetenceSchema>;
export type UpdateCompetenceInput = z.infer<typeof updateCompetenceSchema>;
export type CreateRiskReviewInput = z.infer<typeof createRiskReviewSchema>;
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
export type CreateImprovementInput = z.infer<typeof createImprovementSchema>;
export type UpdateImprovementInput = z.infer<typeof updateImprovementSchema>;
