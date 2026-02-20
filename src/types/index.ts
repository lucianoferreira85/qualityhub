export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  createdAt: Date;
}

export interface Audit {
  id: string;
  title: string;
  type: string;
  standard: string;
  scope: string | null;
  startDate: Date;
  endDate: Date | null;
  status: string;
  leadAuditorId: string;
  conclusion: string | null;
  notes: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  findings?: AuditFinding[];
}

export interface AuditFinding {
  id: string;
  auditId: string;
  clause: string;
  type: string;
  description: string;
  evidence: string | null;
}

export interface Nonconformity {
  id: string;
  code: string;
  title: string;
  description: string;
  evidence: string | null;
  severity: string;
  source: string;
  status: string;
  rootCause: string | null;
  rootCauseMethod: string | null;
  auditId: string | null;
  responsibleId: string;
  userId: string;
  dueDate: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  actions?: Action[];
}

export interface Action {
  id: string;
  code: string;
  title: string;
  description: string;
  type: string;
  status: string;
  responsibleId: string;
  nonconformityId: string | null;
  dueDate: Date;
  completedAt: Date | null;
  verifiedAt: Date | null;
  verificationNotes: string | null;
  isEffective: boolean | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  nonconformity?: Nonconformity | null;
}

export interface Document {
  id: string;
  code: string;
  title: string;
  type: string;
  category: string | null;
  version: string;
  status: string;
  content: string | null;
  fileUrl: string | null;
  authorId: string;
  reviewerId: string | null;
  approverId: string | null;
  approvedAt: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Indicator {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  frequency: string;
  target: number;
  lowerLimit: number | null;
  upperLimit: number | null;
  processId: string | null;
  userId: string;
  createdAt: Date;
  measurements?: IndicatorMeasurement[];
}

export interface IndicatorMeasurement {
  id: string;
  indicatorId: string;
  value: number;
  period: Date;
  notes: string | null;
  createdAt: Date;
}

export interface RiskAssessment {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  probability: number;
  impact: number;
  riskLevel: string;
  treatment: string | null;
  treatmentPlan: string | null;
  responsibleId: string;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface DashboardData {
  totalAudits: number;
  openNonconformities: number;
  pendingActions: number;
  riskDistribution: RiskDistribution[];
  ncByMonth: MonthlyNcData[];
  actionEffectiveness: number;
}

export interface RiskDistribution {
  level: string;
  count: number;
}

export interface MonthlyNcData {
  month: number;
  year: number;
  opened: number;
  closed: number;
}
