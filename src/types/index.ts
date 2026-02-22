import type {
  OrgRole,
  TenantStatus,
  ProjectStatus,
  RequirementStatus,
  NcStatus,
  NcSeverity,
  FindingClassification,
  ActionType,
  ActionStatus,
  DocumentType,
  DocumentStatus,
  RootCauseMethod,
  InvitationStatus,
  SubscriptionStatus,
} from "@prisma/client";

// Re-export enums for client usage
export type {
  OrgRole,
  TenantStatus,
  ProjectStatus,
  RequirementStatus,
  NcStatus,
  NcSeverity,
  FindingClassification,
  ActionType,
  ActionStatus,
  DocumentType,
  DocumentStatus,
  RootCauseMethod,
  InvitationStatus,
  SubscriptionStatus,
};

// ==================== Global Models ====================

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  maxUsers: number;
  maxProjects: number;
  maxStandards: number;
  maxStorage: number;
  maxClients: number;
  features: Record<string, boolean>;
  isActive: boolean;
}

export interface Standard {
  id: string;
  code: string;
  name: string;
  version: string;
  year: number;
  status: string;
  description: string | null;
  clauses?: StandardClause[];
  controls?: StandardControl[];
}

export interface StandardClause {
  id: string;
  standardId: string;
  code: string;
  title: string;
  description: string | null;
  parentId: string | null;
  orderIndex: number;
  children?: StandardClause[];
}

export interface StandardControl {
  id: string;
  standardId: string;
  code: string;
  title: string;
  domain: string | null;
  type: string | null;
  attributes: Record<string, unknown>;
}

// ==================== Tenant ====================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  cnpj: string | null;
  settings: Record<string, unknown>;
  status: TenantStatus;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantWithSubscription extends Tenant {
  subscription: Subscription | null;
}

// ==================== User & Membership ====================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: OrgRole;
  joinedAt: Date;
  user?: User;
}

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: OrgRole;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  invitedBy?: User;
}

// ==================== Billing ====================

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  plan?: Plan;
}

// ==================== Consulting Clients ====================

export interface ConsultingClient {
  id: string;
  tenantId: string;
  name: string;
  cnpj: string | null;
  contactName: string | null;
  contactEmail: string | null;
  sector: string | null;
  status: string;
  createdAt: Date;
}

// ==================== Projects ====================

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  clientId: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  targetMaturity: number;
  createdAt: Date;
  updatedAt: Date;
  client?: ConsultingClient;
  standards?: ProjectStandard[];
  members?: ProjectMember[];
}

export interface ProjectStandard {
  id: string;
  projectId: string;
  standardId: string;
  standard?: Standard;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user?: User;
}

// ==================== Requirements & Controls ====================

export interface ProjectRequirement {
  id: string;
  tenantId: string;
  projectId: string;
  clauseId: string;
  status: RequirementStatus;
  maturity: number;
  responsibleId: string | null;
  dueDate: Date | null;
  notes: string | null;
  evidence: string | null;
  clause?: StandardClause;
  responsible?: User;
}

export interface ProjectControl {
  id: string;
  tenantId: string;
  projectId: string;
  controlId: string;
  status: RequirementStatus;
  maturity: number;
  responsibleId: string | null;
  implementationNotes: string | null;
  control?: StandardControl;
  responsible?: User;
}

export interface SoaEntry {
  id: string;
  tenantId: string;
  projectId: string;
  controlId: string;
  applicable: boolean;
  justification: string | null;
  implementationStatus: string | null;
  control?: StandardControl;
}

// ==================== Organization Context (ISO 4.1) ====================

export interface OrganizationContext {
  id: string;
  tenantId: string;
  projectId: string | null;
  type: string;
  category: string | null;
  title: string;
  description: string | null;
  impact: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Interested Parties (ISO 4.2) ====================

export interface InterestedParty {
  id: string;
  tenantId: string;
  projectId: string | null;
  name: string;
  type: string;
  category: string | null;
  needsExpectations: string | null;
  requirements: string | null;
  influence: string | null;
  interest: string | null;
  strategy: string | null;
  monitoringMethod: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Risks ====================

export interface Risk {
  id: string;
  tenantId: string;
  projectId: string;
  code: string;
  title: string;
  description: string;
  category: string;
  impactDimensions: Record<string, unknown>;
  probability: number;
  impact: number;
  riskLevel: string;
  treatment: string | null;
  treatmentPlan: string | null;
  responsibleId: string | null;
  status: string;
  residualProbability: number | null;
  residualImpact: number | null;
  nextReviewDate: Date | null;
  monitoringFrequency: string | null;
  riskAppetite: string | null;
  lastReviewDate: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  responsible?: User;
  treatments?: RiskTreatment[];
  history?: RiskHistory[];
}

export interface RiskTreatment {
  id: string;
  riskId: string;
  controlId: string | null;
  projectControlId: string | null;
  description: string;
  status: string;
  control?: StandardControl;
  projectControl?: ProjectControl;
}

export interface RiskHistory {
  id: string;
  riskId: string;
  probability: number;
  impact: number;
  riskLevel: string;
  residualProbability: number | null;
  residualImpact: number | null;
  status: string;
  reviewNotes: string | null;
  reviewedById: string | null;
  createdAt: Date;
  reviewedBy?: User;
}

// ==================== Nonconformities ====================

export interface Nonconformity {
  id: string;
  tenantId: string;
  projectId: string;
  code: string;
  title: string;
  description: string;
  origin: string;
  type: string | null;
  severity: NcSeverity;
  clauseId: string | null;
  status: NcStatus;
  responsibleId: string | null;
  dueDate: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  clause?: StandardClause;
  responsible?: User;
  rootCause?: NcRootCause;
  actionPlans?: ActionPlan[];
}

export interface NcRootCause {
  id: string;
  nonconformityId: string;
  method: RootCauseMethod;
  analysis: Record<string, unknown>;
  conclusion: string | null;
}

// ==================== Action Plans ====================

export interface ActionPlan {
  id: string;
  tenantId: string;
  projectId: string;
  code: string;
  title: string;
  description: string;
  type: ActionType;
  status: ActionStatus;
  responsibleId: string | null;
  nonconformityId: string | null;
  riskId: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  verifiedAt: Date | null;
  verificationNotes: string | null;
  isEffective: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  responsible?: User;
  nonconformity?: Nonconformity;
  risk?: Risk;
}

// ==================== Audits ====================

export interface Audit {
  id: string;
  tenantId: string;
  projectId: string;
  type: string;
  title: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  leadAuditorId: string | null;
  scope: string | null;
  conclusion: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  leadAuditor?: User;
  findings?: AuditFinding[];
}

export interface AuditFinding {
  id: string;
  tenantId: string;
  auditId: string;
  clauseId: string | null;
  classification: FindingClassification;
  description: string;
  evidence: string | null;
  nonconformityId: string | null;
  clause?: StandardClause;
  nonconformity?: Nonconformity;
}

// ==================== Documents ====================

export interface Document {
  id: string;
  tenantId: string;
  projectId: string | null;
  code: string;
  title: string;
  type: DocumentType;
  category: string | null;
  version: string;
  status: DocumentStatus;
  content: string | null;
  fileUrl: string | null;
  authorId: string;
  reviewerId: string | null;
  approverId: string | null;
  approvedAt: Date | null;
  nextReviewDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
  reviewer?: User;
  approver?: User;
  versions?: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  content: string | null;
  fileUrl: string | null;
  changedById: string;
  changeNotes: string | null;
  createdAt: Date;
  changedBy?: User;
}

// ==================== Processes ====================

export interface Process {
  id: string;
  tenantId: string;
  projectId: string;
  code: string;
  name: string;
  description: string | null;
  responsibleId: string | null;
  status: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; name: string };
  responsible?: User;
  indicators?: Indicator[];
}

// ==================== Indicators ====================

export interface Indicator {
  id: string;
  tenantId: string;
  projectId: string | null;
  name: string;
  description: string | null;
  unit: string;
  frequency: string;
  target: number;
  lowerLimit: number | null;
  upperLimit: number | null;
  processId: string | null;
  createdAt: Date;
  measurements?: IndicatorMeasurement[];
}

export interface IndicatorMeasurement {
  id: string;
  tenantId: string;
  indicatorId: string;
  value: number;
  period: Date;
  notes: string | null;
  createdAt: Date;
}

// ==================== Management Review ====================

export interface ManagementReview {
  id: string;
  tenantId: string;
  projectId: string;
  scheduledDate: Date;
  actualDate: Date | null;
  status: string;
  minutes: string | null;
  decisions: Record<string, unknown>[];
  createdAt: Date;
}

// ==================== Audit Log & Notifications ====================

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
  user?: User;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  readAt: Date | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
}

// ==================== SGSI Scope (ISO 4.3) ====================

export interface SgsiScope {
  id: string;
  tenantId: string;
  projectId: string;
  title: string;
  description: string | null;
  boundaries: string | null;
  exclusions: string | null;
  justification: string | null;
  interfaces: string | null;
  status: string;
  approvedById: string | null;
  approvedAt: Date | null;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: User;
}

// ==================== Communication Plan (ISO 7.4) ====================

export interface CommunicationPlan {
  id: string;
  tenantId: string;
  projectId: string;
  topic: string;
  audience: string;
  frequency: string;
  method: string;
  responsibleId: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  responsible?: User;
}

// ==================== Competences (ISO 7.2) ====================

export interface Competence {
  id: string;
  tenantId: string;
  projectId: string;
  role: string;
  requiredCompetence: string;
  currentLevel: string | null;
  trainingAction: string | null;
  trainingType: string | null;
  evidence: string | null;
  evidenceFileUrl: string | null;
  responsibleId: string | null;
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  responsible?: User;
}

// ==================== Dashboard ====================

export interface DashboardData {
  totalProjects: number;
  totalAudits: number;
  openNonconformities: number;
  pendingActions: number;
  riskDistribution: { level: string; count: number }[];
  ncByStatus: { status: string; count: number }[];
  actionEffectiveness: number;
  projectProgress: { name: string; progress: number }[];
}

// ==================== API ====================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
