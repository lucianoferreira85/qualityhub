"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Save,
  FolderKanban,
  User,
  ShieldAlert,
  ClipboardCheck,
} from "lucide-react";
import {
  getRiskLevelLabel,
  getRiskLevel,
  formatDate,
} from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "strategic", label: "Estratégico" },
  { value: "operational", label: "Operacional" },
  { value: "compliance", label: "Conformidade" },
  { value: "financial", label: "Financeiro" },
  { value: "technology", label: "Tecnologia" },
  { value: "legal", label: "Legal" },
];

const STATUSES = [
  { value: "identified", label: "Identificado" },
  { value: "analyzing", label: "Em Análise" },
  { value: "treated", label: "Tratado" },
  { value: "accepted", label: "Aceito" },
  { value: "monitored", label: "Monitorado" },
  { value: "closed", label: "Fechado" },
];

const TREATMENTS = [
  { value: "accept", label: "Aceitar" },
  { value: "mitigate", label: "Mitigar" },
  { value: "transfer", label: "Transferir" },
  { value: "avoid", label: "Evitar" },
];

const PROBABILITY_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
];

const RESIDUAL_OPTIONS = [
  { value: "", label: "Não avaliado" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
];

const LEVEL_COLORS: Record<string, string> = {
  critical: "bg-danger-bg text-danger-fg",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  medium: "bg-warning-bg text-warning-fg",
  low: "bg-success-bg text-success-fg",
};

const CATEGORY_LABELS: Record<string, string> = {
  strategic: "Estratégico",
  operational: "Operacional",
  compliance: "Conformidade",
  financial: "Financeiro",
  technology: "Tecnologia",
  legal: "Legal",
};

const TREATMENT_LABELS: Record<string, string> = {
  accept: "Aceitar",
  mitigate: "Mitigar",
  transfer: "Transferir",
  avoid: "Evitar",
};

interface RiskDetail {
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
  responsibleId: string | null;
  residualProbability: number | null;
  residualImpact: number | null;
  createdAt: string;
  project?: { id: string; name: string };
  responsible?: { id: string; name: string } | null;
  treatments?: {
    id: string;
    description: string;
    status: string;
    control?: { id: string; code: string; title: string } | null;
  }[];
  actionPlans?: {
    id: string;
    title: string;
    status: string;
    responsible?: { id: string; name: string } | null;
  }[];
}

interface MemberOption {
  user: { id: string; name: string };
}

export default function RiskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const riskId = params.id as string;
  const { tenant, can } = useTenant();

  const [risk, setRisk] = useState<RiskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editProbability, setEditProbability] = useState(1);
  const [editImpact, setEditImpact] = useState(1);
  const [editTreatment, setEditTreatment] = useState("");
  const [editTreatmentPlan, setEditTreatmentPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editResponsibleId, setEditResponsibleId] = useState("");
  const [editResidualProbability, setEditResidualProbability] = useState<number | "">("");
  const [editResidualImpact, setEditResidualImpact] = useState<number | "">("");

  const [members, setMembers] = useState<MemberOption[]>([]);

  const fetchRisk = useCallback(() => {
    fetch(`/api/tenants/${tenant.slug}/risks/${riskId}`)
      .then((res) => res.json())
      .then((res) => {
        setRisk(res.data);
        if (res.data) {
          setEditTitle(res.data.title);
          setEditDescription(res.data.description);
          setEditCategory(res.data.category);
          setEditProbability(res.data.probability);
          setEditImpact(res.data.impact);
          setEditTreatment(res.data.treatment || "");
          setEditTreatmentPlan(res.data.treatmentPlan || "");
          setEditStatus(res.data.status);
          setEditResponsibleId(res.data.responsibleId || "");
          setEditResidualProbability(res.data.residualProbability ?? "");
          setEditResidualImpact(res.data.residualImpact ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, riskId]);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk]);

  useEffect(() => {
    if (editing && members.length === 0) {
      fetch(`/api/tenants/${tenant.slug}/members`)
        .then((r) => r.json())
        .then((res) => setMembers(res.data || []))
        .catch(() => {});
    }
  }, [editing, tenant.slug, members.length]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/risks/${riskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          probability: editProbability,
          impact: editImpact,
          treatment: editTreatment || null,
          treatmentPlan: editTreatmentPlan || null,
          status: editStatus,
          responsibleId: editResponsibleId || null,
          residualProbability: editResidualProbability !== "" ? Number(editResidualProbability) : null,
          residualImpact: editResidualImpact !== "" ? Number(editResidualImpact) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar risco");
      }
      setEditing(false);
      setLoading(true);
      fetchRisk();
      toast.success("Risco atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/risks/${riskId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir risco");
      }
      toast.success("Risco excluído com sucesso");
      router.push(`/${tenant.slug}/risks`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir";
      setError(message);
      toast.error(message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="text-center py-12">
        <p className="text-title-3 text-foreground-primary">
          Risco não encontrado
        </p>
      </div>
    );
  }

  const score = risk.probability * risk.impact;
  const editScore = editProbability * editImpact;
  const editLevel = getRiskLevel(editProbability, editImpact);
  const treatments = risk.treatments || [];
  const actionPlans = risk.actionPlans || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: "Riscos", href: `/${tenant.slug}/risks` },
          { label: risk.code },
        ]}
      />

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/${tenant.slug}/risks`}>
          <Button variant="ghost" size="icon-sm" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-caption-1 text-foreground-tertiary font-mono">
            {risk.code}
          </p>
          <h1 className="text-title-1 text-foreground-primary">{risk.title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={LEVEL_COLORS[risk.riskLevel] || ""}>
              {getRiskLevelLabel(risk.riskLevel)}
            </Badge>
            <StatusBadge status={risk.status} type="status" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </>
          ) : (
            <>
              {can("risk", "update") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {can("risk", "delete") && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-foreground-tertiary hover:text-danger-fg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
          {error}
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir este risco?"
        description="Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />

      {editing ? (
        <>
          {/* Edit Form */}
          <Card>
            <CardHeader>
              <h2 className="text-title-3 text-foreground-primary">Editar Risco</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Título *
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Descrição *
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                    Categoria
                  </label>
                  <Select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    options={CATEGORIES}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                    Status
                  </label>
                  <Select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    options={STATUSES}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                    Responsável
                  </label>
                  <Select
                    value={editResponsibleId}
                    onChange={(e) => setEditResponsibleId(e.target.value)}
                    options={[
                      { value: "", label: "Nenhum" },
                      ...members.map((m) => ({ value: m.user.id, label: m.user.name })),
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-title-3 text-foreground-primary">Avaliação</h2>
                <div className="flex items-center gap-2">
                  <span className="text-body-2 text-foreground-secondary">
                    Score: {editScore}
                  </span>
                  <Badge variant={LEVEL_COLORS[editLevel] || ""}>
                    {getRiskLevelLabel(editLevel)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                    Probabilidade (1-5)
                  </label>
                  <Select
                    value={String(editProbability)}
                    onChange={(e) => setEditProbability(Number(e.target.value))}
                    options={PROBABILITY_OPTIONS}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                    Impacto (1-5)
                  </label>
                  <Select
                    value={String(editImpact)}
                    onChange={(e) => setEditImpact(Number(e.target.value))}
                    options={PROBABILITY_OPTIONS}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                    Probabilidade Residual
                  </label>
                  <Select
                    value={String(editResidualProbability)}
                    onChange={(e) => setEditResidualProbability(e.target.value ? Number(e.target.value) : "")}
                    options={RESIDUAL_OPTIONS}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                    Impacto Residual
                  </label>
                  <Select
                    value={String(editResidualImpact)}
                    onChange={(e) => setEditResidualImpact(e.target.value ? Number(e.target.value) : "")}
                    options={RESIDUAL_OPTIONS}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-title-3 text-foreground-primary">Tratamento</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Tipo de Tratamento
                </label>
                <Select
                  value={editTreatment}
                  onChange={(e) => setEditTreatment(e.target.value)}
                  options={[
                    { value: "", label: "Nenhum" },
                    ...TREATMENTS,
                  ]}
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Plano de Tratamento
                </label>
                <Textarea
                  value={editTreatmentPlan}
                  onChange={(e) => setEditTreatmentPlan(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* View Mode */}
          <Card>
            <CardHeader>
              <h2 className="text-title-3 text-foreground-primary">Informações</h2>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-caption-1 text-foreground-tertiary mb-0.5">Descrição</p>
                <p className="text-body-1 text-foreground-primary whitespace-pre-wrap">
                  {risk.description}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Categoria
                    </span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {CATEGORY_LABELS[risk.category] || risk.category}
                  </p>
                </div>
                {risk.project && (
                  <div>
                    <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                      <span className="inline-flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" /> Projeto
                      </span>
                    </p>
                    <p className="text-body-1 text-foreground-primary">
                      {risk.project.name}
                    </p>
                  </div>
                )}
                {risk.responsible && (
                  <div>
                    <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" /> Responsável
                      </span>
                    </p>
                    <p className="text-body-1 text-foreground-primary">
                      {risk.responsible.name}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">Criado em</p>
                  <p className="text-body-1 text-foreground-primary">
                    {formatDate(risk.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-title-3 text-foreground-primary">Avaliação de Risco</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-caption-1 text-foreground-tertiary">Probabilidade</p>
                  <p className="text-title-2 text-foreground-primary">{risk.probability}</p>
                </div>
                <div className="text-center">
                  <p className="text-caption-1 text-foreground-tertiary">Impacto</p>
                  <p className="text-title-2 text-foreground-primary">{risk.impact}</p>
                </div>
                <div className="text-center">
                  <p className="text-caption-1 text-foreground-tertiary">Score (P×I)</p>
                  <p className="text-title-2 text-foreground-primary">{score}</p>
                </div>
                <div className="text-center">
                  <p className="text-caption-1 text-foreground-tertiary mb-1">Nível</p>
                  <Badge variant={LEVEL_COLORS[risk.riskLevel] || ""} className="text-body-1">
                    {getRiskLevelLabel(risk.riskLevel)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-title-3 text-foreground-primary">Tratamento</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">Tipo</p>
                  <p className="text-body-1 text-foreground-primary">
                    {risk.treatment ? TREATMENT_LABELS[risk.treatment] || risk.treatment : "Não definido"}
                  </p>
                </div>
                {risk.treatmentPlan && (
                  <div className="col-span-2">
                    <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                      Plano de Tratamento
                    </p>
                    <p className="text-body-1 text-foreground-primary whitespace-pre-wrap">
                      {risk.treatmentPlan}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Residual Risk */}
          {(risk.residualProbability || risk.residualImpact) && (
            <Card>
              <CardHeader>
                <h2 className="text-title-3 text-foreground-primary">Risco Residual</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-caption-1 text-foreground-tertiary">Probabilidade</p>
                    <p className="text-title-2 text-foreground-primary">
                      {risk.residualProbability ?? "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-caption-1 text-foreground-tertiary">Impacto</p>
                    <p className="text-title-2 text-foreground-primary">
                      {risk.residualImpact ?? "—"}
                    </p>
                  </div>
                  {risk.residualProbability && risk.residualImpact && (
                    <>
                      <div className="text-center">
                        <p className="text-caption-1 text-foreground-tertiary">Score</p>
                        <p className="text-title-2 text-foreground-primary">
                          {risk.residualProbability * risk.residualImpact}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-caption-1 text-foreground-tertiary mb-1">Nível</p>
                        <Badge
                          variant={
                            LEVEL_COLORS[
                              getRiskLevel(risk.residualProbability, risk.residualImpact)
                            ] || ""
                          }
                        >
                          {getRiskLevelLabel(
                            getRiskLevel(risk.residualProbability, risk.residualImpact)
                          )}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Treatments */}
          <Card>
            <CardHeader>
              <h2 className="text-title-3 text-foreground-primary">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-foreground-tertiary" />
                  Tratamentos ({treatments.length})
                </span>
              </h2>
            </CardHeader>
            <CardContent>
              {treatments.length === 0 ? (
                <p className="text-body-2 text-foreground-tertiary py-4 text-center">
                  Nenhum tratamento registrado
                </p>
              ) : (
                <div className="space-y-2">
                  {treatments.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-button border border-stroke-secondary"
                    >
                      <div>
                        <p className="text-body-1 text-foreground-primary">
                          {t.description}
                        </p>
                        {t.control && (
                          <p className="text-caption-1 text-foreground-tertiary mt-0.5">
                            Controle: {t.control.code} - {t.control.title}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={t.status} type="status" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Plans */}
          <Card>
            <CardHeader>
              <h2 className="text-title-3 text-foreground-primary">
                <span className="inline-flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-foreground-tertiary" />
                  Planos de Ação ({actionPlans.length})
                </span>
              </h2>
            </CardHeader>
            <CardContent>
              {actionPlans.length === 0 ? (
                <p className="text-body-2 text-foreground-tertiary py-4 text-center">
                  Nenhum plano de ação vinculado
                </p>
              ) : (
                <div className="space-y-2">
                  {actionPlans.map((ap) => (
                    <Link
                      key={ap.id}
                      href={`/${tenant.slug}/action-plans/${ap.id}`}
                    >
                      <div className="flex items-center justify-between p-3 rounded-button border border-stroke-secondary hover:bg-surface-secondary transition-colors">
                        <div className="flex items-center gap-3">
                          <ClipboardCheck className="h-4 w-4 text-foreground-tertiary" />
                          <span className="text-body-1 text-foreground-primary font-medium">
                            {ap.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {ap.responsible && (
                            <span className="text-caption-1 text-foreground-tertiary">
                              {ap.responsible.name.split(" ")[0]}
                            </span>
                          )}
                          <StatusBadge status={ap.status} type="status" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
