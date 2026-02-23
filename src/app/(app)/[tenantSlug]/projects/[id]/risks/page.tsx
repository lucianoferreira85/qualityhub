"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
  Trash2,
  Download,
  Clock,
  ClipboardCheck,
} from "lucide-react";
import { getRiskLevelLabel, formatDate } from "@/lib/utils";
import { generateRiskReport } from "@/lib/pdf-reports/risk-report";
import { toast } from "sonner";

interface Risk {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  riskLevel: string;
  treatment: string | null;
  treatmentPlan: string | null;
  status: string;
  responsible: { id: string; name: string } | null;
  treatments: { id: string; description: string; status: string; projectControl?: { id: string; control: { code: string; title: string } } | null }[];
  nextReviewDate: string | null;
  monitoringFrequency: string | null;
  riskAppetite: string | null;
  lastReviewDate: string | null;
  history?: { id: string; probability: number; impact: number; riskLevel: string; status: string; createdAt: string; reviewedBy?: { name: string } | null }[];
}

const CATEGORIES = [
  { value: "strategic", label: "Estrategico" },
  { value: "operational", label: "Operacional" },
  { value: "compliance", label: "Conformidade" },
  { value: "financial", label: "Financeiro" },
  { value: "technology", label: "Tecnologia" },
  { value: "legal", label: "Legal" },
];

const TREATMENTS = [
  { value: "accept", label: "Aceitar" },
  { value: "mitigate", label: "Mitigar" },
  { value: "transfer", label: "Transferir" },
  { value: "avoid", label: "Evitar" },
];

const FREQUENCIES: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semi_annual: "Semestral",
  annual: "Anual",
};

function getCategoryLabel(cat: string): string {
  return CATEGORIES.find((c) => c.value === cat)?.label || cat;
}

function getTreatmentLabel(t: string): string {
  return TREATMENTS.find((tr) => tr.value === t)?.label || t;
}

const TREATMENT_STATUSES = [
  { value: "planned", label: "Planejado" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluido" },
  { value: "cancelled", label: "Cancelado" },
];

const REVIEW_STATUS_OPTIONS = [
  { value: "identified", label: "Identificado" },
  { value: "analyzing", label: "Em Análise" },
  { value: "treating", label: "Em Tratamento" },
  { value: "monitoring", label: "Monitorando" },
  { value: "closed", label: "Encerrado" },
];

function getRiskColor(level: string): string {
  const c: Record<string, string> = {
    low: "bg-success-bg text-success-fg",
    medium: "bg-warning-bg text-warning-fg",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-danger-bg text-danger-fg",
  };
  return c[level] || "bg-gray-100 text-gray-800";
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function RisksPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "operational",
    probability: 3, impact: 3, treatment: "",
    treatmentPlan: "",
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // Treatment management
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [treatmentDesc, setTreatmentDesc] = useState("");
  const [addingTreatment, setAddingTreatment] = useState(false);

  // Delete treatment confirm dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ riskId: string; treatmentId: string } | null>(null);

  // Review modal
  const [reviewRisk, setReviewRisk] = useState<Risk | null>(null);
  const [reviewForm, setReviewForm] = useState({ probability: 3, impact: 3, residualProbability: 0, residualImpact: 0, status: "identified", reviewNotes: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/risks`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ]).then(([risksRes, projRes]) => {
      setRisks(risksRes.data || []);
      setProjectName(projRes.data?.name || "Projeto");
    }).catch(() => {}).finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTreatment = async (riskId: string) => {
    if (!treatmentDesc.trim()) return;
    setAddingTreatment(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/projects/${projectId}/risks/${riskId}/treatments`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: treatmentDesc }) }
      );
      if (!res.ok) throw new Error("Erro ao criar tratamento");
      setTreatmentDesc("");
      setLoading(true);
      fetchData();
    } catch { /* silently fail */ }
    finally { setAddingTreatment(false); }
  };

  const handleUpdateTreatmentStatus = async (riskId: string, treatmentId: string, status: string) => {
    try {
      await fetch(
        `/api/tenants/${tenant.slug}/projects/${projectId}/risks/${riskId}/treatments?id=${treatmentId}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }
      );
      setLoading(true);
      fetchData();
    } catch { /* silently fail */ }
  };

  const handleDeleteTreatment = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(
        `/api/tenants/${tenant.slug}/projects/${projectId}/risks/${deleteTarget.riskId}/treatments?id=${deleteTarget.treatmentId}`,
        { method: "DELETE" }
      );
      setLoading(true);
      fetchData();
    } catch { /* silently fail */ }
    finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          probability: Number(form.probability),
          impact: Number(form.impact),
          treatment: form.treatment || null,
          treatmentPlan: form.treatmentPlan || null,
          projectId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar risco");
      }
      setForm({ title: "", description: "", category: "operational", probability: 3, impact: 3, treatment: "", treatmentPlan: "" });
      setShowAdd(false);
      setLoading(true);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setAdding(false);
    }
  };

  const openReview = (risk: Risk) => {
    setReviewRisk(risk);
    setReviewForm({
      probability: risk.probability,
      impact: risk.impact,
      residualProbability: 0,
      residualImpact: 0,
      status: risk.status,
      reviewNotes: "",
    });
  };

  const handleSubmitReview = async () => {
    if (!reviewRisk) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/projects/${projectId}/risks/${reviewRisk.id}/history`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            probability: Number(reviewForm.probability),
            impact: Number(reviewForm.impact),
            residualProbability: reviewForm.residualProbability ? Number(reviewForm.residualProbability) : undefined,
            residualImpact: reviewForm.residualImpact ? Number(reviewForm.residualImpact) : undefined,
            status: reviewForm.status,
            reviewNotes: reviewForm.reviewNotes || undefined,
          }),
        }
      );
      if (!res.ok) throw new Error("Erro ao registrar revisão");
      toast.success("Revisão registrada com sucesso");
      setReviewRisk(null);
      setLoading(true);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Risk matrix counts
  const matrixCounts: Record<string, number> = {};
  risks.forEach((r) => {
    const key = `${r.probability}-${r.impact}`;
    matrixCounts[key] = (matrixCounts[key] || 0) + 1;
  });

  const overdueCount = risks.filter((r) => isOverdue(r.nextReviewDate)).length;

  const stats = {
    total: risks.length,
    critical: risks.filter((r) => r.riskLevel === "critical").length,
    high: risks.filter((r) => r.riskLevel === "high").length,
    medium: risks.filter((r) => r.riskLevel === "medium").length,
    low: risks.filter((r) => r.riskLevel === "low").length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Riscos" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Riscos</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Avaliacao e tratamento de riscos do projeto
          </p>
        </div>
        <div className="flex items-center gap-2">
          {risks.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => generateRiskReport({ projectName: projectName || projectId, risks }, tenant.name)}>
              <Download className="h-4 w-4" /> Exportar PDF
            </Button>
          )}
          {can("risk", "create") && (
            <Button onClick={() => { setShowAdd(!showAdd); setError(""); }}>
              <Plus className="h-4 w-4" />
              Novo Risco
            </Button>
          )}
        </div>
      </div>

      {/* Overdue reviews alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-danger-bg border border-danger/20 rounded-card p-4">
          <Clock className="h-5 w-5 text-danger-fg flex-shrink-0" />
          <div className="flex-1">
            <p className="text-body-1 font-medium text-danger-fg">
              {overdueCount} risco(s) com revisão vencida
            </p>
            <p className="text-body-2 text-danger-fg/80">
              Revise os riscos para manter o monitoramento atualizado
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground-primary" },
            { label: "Critico", value: stats.critical, color: "text-danger-fg" },
            { label: "Alto", value: stats.high, color: "text-orange-600" },
            { label: "Medio", value: stats.medium, color: "text-warning" },
            { label: "Baixo", value: stats.low, color: "text-success-fg" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 text-center">
                <p className="text-caption-1 text-foreground-tertiary">{s.label}</p>
                <p className={`text-title-2 font-semibold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Risk Matrix 5x5 */}
      {stats.total > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">Matriz de Riscos</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="flex flex-col items-center mr-1">
                <span className="text-caption-1 text-foreground-tertiary -rotate-90 whitespace-nowrap mb-8">Probabilidade</span>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-1">
                  {[5, 4, 3, 2, 1].map((prob) =>
                    [1, 2, 3, 4, 5].map((imp) => {
                      const score = prob * imp;
                      const count = matrixCounts[`${prob}-${imp}`] || 0;
                      let bg = "bg-success-bg";
                      if (score >= 17) bg = "bg-danger-bg";
                      else if (score >= 10) bg = "bg-orange-100";
                      else if (score >= 5) bg = "bg-warning-bg";
                      return (
                        <div
                          key={`${prob}-${imp}`}
                          className={`${bg} rounded h-10 flex items-center justify-center text-body-2 font-medium ${
                            count > 0 ? "ring-2 ring-foreground-primary" : ""
                          }`}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex justify-between mt-1 px-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <span key={v} className="text-caption-1 text-foreground-tertiary">{v}</span>
                  ))}
                </div>
                <p className="text-caption-1 text-foreground-tertiary text-center mt-1">Impacto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-title-3 text-foreground-primary">Novo Risco</h2>
              <button onClick={() => setShowAdd(false)} className="text-foreground-tertiary hover:text-foreground-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Titulo *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descricao *</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria *</label>
                  <Select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    options={CATEGORIES}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Probabilidade * ({form.probability})</label>
                  <input type="range" min="1" max="5" value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} className="w-full accent-brand" />
                  <div className="flex justify-between text-caption-1 text-foreground-tertiary"><span>1</span><span>5</span></div>
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Impacto * ({form.impact})</label>
                  <input type="range" min="1" max="5" value={form.impact} onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })} className="w-full accent-brand" />
                  <div className="flex justify-between text-caption-1 text-foreground-tertiary"><span>1</span><span>5</span></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Tratamento</label>
                  <Select
                    value={form.treatment}
                    onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                    options={TREATMENTS}
                    placeholder="Selecionar..."
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Plano de Tratamento</label>
                  <Input value={form.treatmentPlan} onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })} placeholder="Descreva o plano..." />
                </div>
              </div>
              {error && <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">{error}</div>}
              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowAdd(false)}>Cancelar</Button>
                <Button type="submit" loading={adding}>Criar Risco</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Risks list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : risks.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Nenhum risco registrado"
          description="Identifique e avalie os riscos do projeto"
        />
      ) : (
        <div className="space-y-3">
          {risks.map((risk) => {
            const isExpanded = expandedRisk === risk.id;
            const overdue = isOverdue(risk.nextReviewDate);
            return (
              <Card key={risk.id} className={overdue ? "border-danger/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-caption-1 font-mono text-brand">{risk.code}</span>
                        <h3 className="text-body-1 font-medium text-foreground-primary truncate">{risk.title}</h3>
                        {overdue && (
                          <Badge variant="bg-danger-bg text-danger-fg" className="text-caption-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Revisão vencida
                          </Badge>
                        )}
                      </div>
                      <p className="text-body-2 text-foreground-secondary line-clamp-2 mb-2">{risk.description}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={getRiskColor(risk.riskLevel)}>{getRiskLevelLabel(risk.riskLevel)}</Badge>
                        <StatusBadge status={risk.status} type="status" />
                        <span className="text-caption-1 text-foreground-tertiary">{getCategoryLabel(risk.category)}</span>
                        {risk.treatment && <span className="text-caption-1 text-foreground-tertiary">Tratamento: {getTreatmentLabel(risk.treatment)}</span>}
                        {risk.responsible && <span className="text-caption-1 text-foreground-tertiary">Resp: {risk.responsible.name}</span>}
                        {risk.monitoringFrequency && <span className="text-caption-1 text-foreground-tertiary">Freq: {FREQUENCIES[risk.monitoringFrequency] || risk.monitoringFrequency}</span>}
                        {risk.nextReviewDate && <span className={`text-caption-1 ${overdue ? "text-danger-fg font-medium" : "text-foreground-tertiary"}`}>Próx. revisão: {formatDate(risk.nextReviewDate)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-title-2 font-semibold text-foreground-primary">{risk.probability * risk.impact}</p>
                        <p className="text-caption-1 text-foreground-tertiary">Score</p>
                      </div>
                      <div className="flex gap-2 text-caption-1 text-foreground-tertiary">
                        <span>P:{risk.probability}</span>
                        <span>I:{risk.impact}</span>
                      </div>
                      {can("risk", "update") && (
                        <button
                          onClick={() => openReview(risk)}
                          className="mt-2 flex items-center gap-1 text-caption-1 text-brand hover:text-brand-hover transition-colors"
                          title="Registrar revisão"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" /> Revisar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Treatments toggle */}
                  <button
                    onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
                    className="flex items-center gap-1 mt-3 text-body-2 text-brand hover:text-brand-hover transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Tratamentos ({risk.treatments.length})
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {/* Expanded treatments section */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-stroke-secondary space-y-2">
                      {risk.treatments.length === 0 && (
                        <p className="text-body-2 text-foreground-tertiary">Nenhum tratamento cadastrado</p>
                      )}
                      {risk.treatments.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 bg-surface-secondary rounded-button p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-body-2 text-foreground-primary truncate">{t.description}</p>
                            {t.projectControl && (
                              <p className="text-caption-1 text-foreground-tertiary">
                                Controle: {t.projectControl.control.code} - {t.projectControl.control.title}
                              </p>
                            )}
                          </div>
                          <Select
                            value={t.status}
                            onChange={(e) => handleUpdateTreatmentStatus(risk.id, t.id, e.target.value)}
                            disabled={!can("risk", "update")}
                            options={TREATMENT_STATUSES}
                            className="h-7 text-caption-1 w-auto min-w-[140px]"
                          />
                          {can("risk", "update") && (
                            <button onClick={() => { setDeleteTarget({ riskId: risk.id, treatmentId: t.id }); setShowDeleteConfirm(true); }} className="text-foreground-tertiary hover:text-danger-fg p-1">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {can("risk", "update") && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={treatmentDesc}
                            onChange={(e) => setTreatmentDesc(e.target.value)}
                            placeholder="Descreva o tratamento..."
                            className="h-8 text-body-2"
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTreatment(risk.id); } }}
                          />
                          <Button size="sm" onClick={() => handleAddTreatment(risk.id)} loading={addingTreatment} disabled={!treatmentDesc.trim()}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        open={!!reviewRisk}
        onOpenChange={(open) => { if (!open) setReviewRisk(null); }}
        title={`Revisar Risco: ${reviewRisk?.code || ""}`}
        description={reviewRisk?.title}
      >
        <div className="space-y-4">
          {reviewRisk && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Probabilidade ({reviewForm.probability})</label>
                  <input type="range" min="1" max="5" value={reviewForm.probability} onChange={(e) => setReviewForm({ ...reviewForm, probability: Number(e.target.value) })} className="w-full accent-brand" />
                  <div className="flex justify-between text-caption-1 text-foreground-tertiary"><span>1</span><span>5</span></div>
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Impacto ({reviewForm.impact})</label>
                  <input type="range" min="1" max="5" value={reviewForm.impact} onChange={(e) => setReviewForm({ ...reviewForm, impact: Number(e.target.value) })} className="w-full accent-brand" />
                  <div className="flex justify-between text-caption-1 text-foreground-tertiary"><span>1</span><span>5</span></div>
                </div>
              </div>
              <div className="bg-surface-secondary rounded-button p-3 text-center">
                <p className="text-caption-1 text-foreground-tertiary">Score Inerente</p>
                <p className="text-title-2 font-semibold text-foreground-primary">{reviewForm.probability * reviewForm.impact}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Prob. Residual</label>
                  <input type="range" min="0" max="5" value={reviewForm.residualProbability} onChange={(e) => setReviewForm({ ...reviewForm, residualProbability: Number(e.target.value) })} className="w-full accent-brand" />
                  <div className="flex justify-between text-caption-1 text-foreground-tertiary"><span>0</span><span>5</span></div>
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Impacto Residual</label>
                  <input type="range" min="0" max="5" value={reviewForm.residualImpact} onChange={(e) => setReviewForm({ ...reviewForm, residualImpact: Number(e.target.value) })} className="w-full accent-brand" />
                  <div className="flex justify-between text-caption-1 text-foreground-tertiary"><span>0</span><span>5</span></div>
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                <Select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  options={REVIEW_STATUS_OPTIONS}
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Notas da Revisão</label>
                <Textarea
                  value={reviewForm.reviewNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                  className="h-20 resize-none"
                  placeholder="Observações sobre esta revisão..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setReviewRisk(null)}>Cancelar</Button>
                <Button onClick={handleSubmitReview} loading={submittingReview}>Registrar Revisão</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Remover este tratamento?"
        description="Esta ação não pode ser desfeita."
        onConfirm={handleDeleteTreatment}
      />
    </div>
  );
}
