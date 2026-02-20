import { z } from "zod";

// Auth
export const signUpSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
});

export const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Audits
export const createAuditSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  type: z.enum(["internal", "external", "supplier"]),
  standard: z.string().min(1, "Norma é obrigatória"),
  scope: z.string().nullable().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  leadAuditorId: z.string().uuid("ID do auditor inválido"),
  notes: z.string().nullable().optional(),
});

export const updateAuditSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  type: z.enum(["internal", "external", "supplier"]).optional(),
  standard: z.string().min(1).optional(),
  scope: z.string().nullable().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
  conclusion: z.enum(["conforming", "minor_nc", "major_nc"]).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Nonconformities
export const createNonconformitySchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().min(1, "Descrição é obrigatória"),
  evidence: z.string().nullable().optional(),
  severity: z.enum(["minor", "major", "critical"]),
  source: z.enum(["audit", "customer_complaint", "internal", "supplier", "process"]),
  auditId: z.string().uuid().nullable().optional(),
  responsibleId: z.string().uuid("ID do responsável inválido"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
});

export const updateNonconformitySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  evidence: z.string().nullable().optional(),
  severity: z.enum(["minor", "major", "critical"]).optional(),
  status: z.enum(["open", "analyzing", "action_defined", "in_progress", "verification", "closed"]).optional(),
  rootCause: z.string().nullable().optional(),
  rootCauseMethod: z.enum(["ishikawa", "five_whys", "fault_tree"]).nullable().optional(),
  responsibleId: z.string().uuid().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).nullable().optional(),
});

// Actions
export const createActionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["corrective", "preventive", "improvement"]),
  responsibleId: z.string().uuid("ID do responsável inválido"),
  nonconformityId: z.string().uuid().nullable().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
});

export const updateActionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(["corrective", "preventive", "improvement"]).optional(),
  status: z.enum(["planned", "in_progress", "completed", "verified", "effective", "ineffective"]).optional(),
  responsibleId: z.string().uuid().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  verificationNotes: z.string().nullable().optional(),
  isEffective: z.boolean().nullable().optional(),
});

// Documents
export const createDocumentSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  type: z.enum(["policy", "procedure", "instruction", "form", "record"]),
  category: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  type: z.enum(["policy", "procedure", "instruction", "form", "record"]).optional(),
  category: z.string().nullable().optional(),
  version: z.string().optional(),
  status: z.enum(["draft", "review", "approved", "obsolete"]).optional(),
  content: z.string().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
});

// Indicators
export const createIndicatorSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  description: z.string().nullable().optional(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  target: z.number().positive("Meta deve ser positiva"),
  lowerLimit: z.number().nullable().optional(),
  upperLimit: z.number().nullable().optional(),
});

export const createMeasurementSchema = z.object({
  value: z.number(),
  period: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
  notes: z.string().nullable().optional(),
});

// Risk Assessments
export const createRiskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["risk", "opportunity"]),
  category: z.enum(["strategic", "operational", "compliance", "financial"]),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  treatment: z.enum(["accept", "mitigate", "transfer", "avoid"]).nullable().optional(),
  treatmentPlan: z.string().nullable().optional(),
  responsibleId: z.string().uuid("ID do responsável inválido"),
});

export const updateRiskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(["risk", "opportunity"]).optional(),
  category: z.enum(["strategic", "operational", "compliance", "financial"]).optional(),
  probability: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  treatment: z.enum(["accept", "mitigate", "transfer", "avoid"]).nullable().optional(),
  treatmentPlan: z.string().nullable().optional(),
  status: z.enum(["identified", "assessed", "treating", "monitored", "closed"]).optional(),
});

// Inferred Types
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type UpdateAuditInput = z.infer<typeof updateAuditSchema>;
export type CreateNonconformityInput = z.infer<typeof createNonconformitySchema>;
export type UpdateNonconformityInput = z.infer<typeof updateNonconformitySchema>;
export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateIndicatorInput = z.infer<typeof createIndicatorSchema>;
export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
