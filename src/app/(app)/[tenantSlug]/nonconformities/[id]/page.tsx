"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Save,
  FolderKanban,
  User,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Search,
  Plus,
  Download,
} from "lucide-react";
import {
  getStatusColor,
  getStatusLabel,
  getSeverityColor,
  getSeverityLabel,
  getOriginLabel,
  formatDate,
} from "@/lib/utils";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { generateNcReport } from "@/lib/pdf-reports/nc-report";
import type { Nonconformity, ActionPlan } from "@/types";

const SEVERITIES = [
  { value: "observation", label: "Observação" },
  { value: "minor", label: "Menor" },
  { value: "major", label: "Maior" },
  { value: "critical", label: "Crítica" },
];

const STATUSES = [
  { value: "open", label: "Aberta" },
  { value: "analysis", label: "Em Análise" },
  { value: "action_defined", label: "Ação Definida" },
  { value: "in_execution", label: "Em Execução" },
  { value: "effectiveness_check", label: "Verificação de Eficácia" },
  { value: "closed", label: "Fechada" },
];

const ROOT_CAUSE_METHODS: Record<string, string> = {
  five_whys: "5 Porquês",
  ishikawa: "Ishikawa",
  fault_tree: "Árvore de Falhas",
  brainstorming: "Brainstorming",
};

interface NcDetail extends Omit<Nonconformity, "clause" | "responsible" | "rootCause" | "actionPlans"> {
  project?: { id: string; name: string };
  responsible?: { id: string; name: string; email: string } | null;
  clause?: { id: string; code: string; title: string } | null;
  rootCause?: {
    id: string;
    method: string;
    analysis: Record<string, unknown>;
    conclusion: string | null;
  } | null;
  actionPlans?: (ActionPlan & {
    responsible?: { id: string; name: string } | null;
  })[];
}

export default function NonconformityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ncId = params.id as string;
  const { tenant, can } = useTenant();
  const [nc, setNc] = useState<NcDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  // Edit form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSeverity, setEditSeverity] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  // Root cause form
  const [showRootCauseForm, setShowRootCauseForm] = useState(false);
  const [editingRootCause, setEditingRootCause] = useState(false);
  const [rcMethod, setRcMethod] = useState<string>("five_whys");
  const [rcConclusion, setRcConclusion] = useState("");
  const [rcWhys, setRcWhys] = useState<string[]>(["", "", "", "", ""]);
  const [rcIshikawa, setRcIshikawa] = useState<Record<string, string>>({
    mao_de_obra: "", metodo: "", maquina: "", material: "", meio_ambiente: "", medicao: "",
  });
  const [savingRootCause, setSavingRootCause] = useState(false);
  const [deletingRootCause, setDeletingRootCause] = useState(false);

  const fetchNc = useCallback(() => {
    fetch(`/api/tenants/${tenant.slug}/nonconformities/${ncId}`)
      .then((res) => res.json())
      .then((res) => {
        setNc(res.data);
        if (res.data) {
          setEditTitle(res.data.title);
          setEditDescription(res.data.description);
          setEditSeverity(res.data.severity);
          setEditStatus(res.data.status);
          setEditDueDate(
            res.data.dueDate
              ? new Date(res.data.dueDate).toISOString().split("T")[0]
              : ""
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, ncId]);

  useEffect(() => {
    fetchNc();
  }, [fetchNc]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/nonconformities/${ncId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
            severity: editSeverity,
            status: editStatus,
            dueDate: editDueDate || null,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar NC");
      }
      setEditing(false);
      fetchNc();
      toast.success("Não conformidade atualizada com sucesso");
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
      const res = await fetch(
        `/api/tenants/${tenant.slug}/nonconformities/${ncId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir NC");
      }
      toast.success("Não conformidade excluída com sucesso");
      router.push(`/${tenant.slug}/nonconformities`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir";
      setError(message);
      toast.error(message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const initRootCauseEdit = () => {
    if (nc?.rootCause) {
      setRcMethod(nc.rootCause.method);
      setRcConclusion(nc.rootCause.conclusion || "");
      const analysis = nc.rootCause.analysis as Record<string, unknown>;
      if (nc.rootCause.method === "five_whys" && Array.isArray(analysis.whys)) {
        const whys = analysis.whys as string[];
        setRcWhys([...whys, ...Array(5 - whys.length).fill("")].slice(0, 5));
      }
      if (nc.rootCause.method === "ishikawa" && analysis.categories) {
        setRcIshikawa({
          mao_de_obra: "", metodo: "", maquina: "", material: "", meio_ambiente: "", medicao: "",
          ...(analysis.categories as Record<string, string>),
        });
      }
      setEditingRootCause(true);
    } else {
      setRcMethod("five_whys");
      setRcConclusion("");
      setRcWhys(["", "", "", "", ""]);
      setRcIshikawa({ mao_de_obra: "", metodo: "", maquina: "", material: "", meio_ambiente: "", medicao: "" });
      setShowRootCauseForm(true);
    }
  };

  const handleSaveRootCause = async () => {
    setSavingRootCause(true);
    setError("");
    try {
      let analysis: Record<string, unknown> = {};
      if (rcMethod === "five_whys") {
        analysis = { whys: rcWhys.filter((w) => w.trim()) };
      } else if (rcMethod === "ishikawa") {
        analysis = { categories: rcIshikawa };
      }

      const res = await fetch(
        `/api/tenants/${tenant.slug}/nonconformities/${ncId}/root-cause`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: rcMethod,
            analysis,
            conclusion: rcConclusion || null,
          }),
        }
      );
      if (!res.ok) throw new Error("Erro ao salvar analise");
      setShowRootCauseForm(false);
      setEditingRootCause(false);
      setLoading(true);
      fetchNc();
      toast.success("Análise de causa salva com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      setError(message);
      toast.error(message);
    } finally {
      setSavingRootCause(false);
    }
  };

  const handleDeleteRootCause = async () => {
    if (!confirm("Excluir a analise de causa raiz?")) return;
    setDeletingRootCause(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/nonconformities/${ncId}/root-cause`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erro ao excluir");
      setLoading(true);
      fetchNc();
      toast.success("Análise de causa excluída com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingRootCause(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!nc) {
    return (
      <div className="text-center py-12">
        <p className="text-title-3 text-foreground-primary">
          Não conformidade não encontrada
        </p>
      </div>
    );
  }

  const actionPlans = nc.actionPlans || [];
  const statusIndex = STATUSES.findIndex((s) => s.value === nc.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: "Não Conformidades", href: `/${tenant.slug}/nonconformities` }, { label: nc.code }]} />
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/${tenant.slug}/nonconformities`}>
          <Button variant="ghost" size="icon-sm" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-caption-1 text-foreground-tertiary font-mono">
            {nc.code}
          </p>
          <h1 className="text-title-1 text-foreground-primary">{nc.title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={getStatusColor(nc.status)}>
              {getStatusLabel(nc.status)}
            </Badge>
            <Badge variant={getSeverityColor(nc.severity)}>
              {getSeverityLabel(nc.severity)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
              >
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
              <Button variant="outline" size="sm" onClick={() => generateNcReport(nc, tenant.name)}>
                <Download className="h-4 w-4" /> Exportar PDF
              </Button>
              {can("nonconformity", "update") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {can("nonconformity", "delete") && (
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

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Card className="border-danger/30 bg-danger-bg/30">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-body-1 font-medium text-foreground-primary">
                Excluir esta não conformidade?
              </p>
              <p className="text-body-2 text-foreground-secondary">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleting}
              >
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status workflow timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-1">
            {STATUSES.map((s, i) => {
              const isCurrent = s.value === nc.status;
              const isPast = i < statusIndex;
              return (
                <div key={s.value} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        isCurrent
                          ? "bg-brand ring-4 ring-brand/20"
                          : isPast
                          ? "bg-success-fg"
                          : "bg-stroke-secondary"
                      }`}
                    />
                    <span
                      className={`text-caption-2 mt-1 text-center leading-tight ${
                        isCurrent
                          ? "text-brand font-medium"
                          : isPast
                          ? "text-success-fg"
                          : "text-foreground-tertiary"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STATUSES.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 -mt-4 ${
                        isPast ? "bg-success-fg" : "bg-stroke-secondary"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit / View */}
      {editing ? (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Editar dados
            </h2>
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
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
                rows={4}
                className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Severidade
                </label>
                <select
                  value={editSeverity}
                  onChange={(e) => setEditSeverity(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Prazo
                </label>
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Informações
            </h2>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                Descrição
              </p>
              <p className="text-body-1 text-foreground-primary whitespace-pre-wrap">
                {nc.description}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" /> Projeto
                  </span>
                </p>
                <p className="text-body-1 text-foreground-primary">
                  {nc.project?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Origem
                  </span>
                </p>
                <p className="text-body-1 text-foreground-primary">
                  {getOriginLabel(nc.origin)}
                </p>
              </div>
              {nc.responsible && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> Responsável
                    </span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {nc.responsible.name}
                  </p>
                </div>
              )}
              {nc.dueDate && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Prazo
                    </span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {formatDate(nc.dueDate)}
                  </p>
                </div>
              )}
              {nc.clause && (
                <div className="col-span-2">
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    Cláusula / Requisito
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {nc.clause.code} - {nc.clause.title}
                  </p>
                </div>
              )}
              {nc.closedAt && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Fechada em
                    </span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {formatDate(nc.closedAt)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Root Cause Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-title-3 text-foreground-primary">
              <span className="inline-flex items-center gap-1.5">
                <Search className="h-4 w-4 text-foreground-tertiary" />
                Análise de Causa Raiz
              </span>
            </h2>
            {can("nonconformity", "update") && !showRootCauseForm && !editingRootCause && (
              <div className="flex gap-2">
                {nc.rootCause ? (
                  <>
                    <Button variant="outline" size="sm" onClick={initRootCauseEdit}>
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleDeleteRootCause}
                      loading={deletingRootCause}
                      className="text-foreground-tertiary hover:text-danger-fg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={initRootCauseEdit}>
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(showRootCauseForm || editingRootCause) ? (
            <div className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Método *
                </label>
                <select
                  value={rcMethod}
                  onChange={(e) => setRcMethod(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {Object.entries(ROOT_CAUSE_METHODS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {rcMethod === "five_whys" && (
                <div className="space-y-2">
                  <p className="text-body-2 font-medium text-foreground-primary">5 Porquês</p>
                  {rcWhys.map((why, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-caption-1 text-foreground-tertiary w-6 text-right flex-shrink-0">{i + 1}.</span>
                      <Input
                        value={why}
                        onChange={(e) => {
                          const updated = [...rcWhys];
                          updated[i] = e.target.value;
                          setRcWhys(updated);
                        }}
                        placeholder={`Por que ${i + 1}?`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {rcMethod === "ishikawa" && (
                <div className="space-y-2">
                  <p className="text-body-2 font-medium text-foreground-primary">6M - Diagrama de Ishikawa</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "mao_de_obra", label: "Mão de Obra" },
                      { key: "metodo", label: "Método" },
                      { key: "maquina", label: "Máquina" },
                      { key: "material", label: "Material" },
                      { key: "meio_ambiente", label: "Meio Ambiente" },
                      { key: "medicao", label: "Medição" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-caption-1 text-foreground-secondary mb-1">{label}</label>
                        <textarea
                          value={rcIshikawa[key] || ""}
                          onChange={(e) => setRcIshikawa({ ...rcIshikawa, [key]: e.target.value })}
                          className="w-full min-h-[60px] rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-y"
                          placeholder={`Causas relacionadas a ${label}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(rcMethod === "fault_tree" || rcMethod === "brainstorming") && (
                <p className="text-body-2 text-foreground-secondary">
                  Descreva a análise na conclusão abaixo.
                </p>
              )}

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Conclusão
                </label>
                <textarea
                  value={rcConclusion}
                  onChange={(e) => setRcConclusion(e.target.value)}
                  rows={3}
                  className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-y"
                  placeholder="Causa raiz identificada..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowRootCauseForm(false); setEditingRootCause(false); }}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveRootCause} loading={savingRootCause}>
                  <Save className="h-3.5 w-3.5" />
                  Salvar
                </Button>
              </div>
            </div>
          ) : nc.rootCause ? (
            <div className="space-y-3">
              <div>
                <p className="text-caption-1 text-foreground-tertiary mb-0.5">Método</p>
                <p className="text-body-1 text-foreground-primary">
                  {ROOT_CAUSE_METHODS[nc.rootCause.method] || nc.rootCause.method}
                </p>
              </div>
              {nc.rootCause.method === "five_whys" && Array.isArray((nc.rootCause.analysis as Record<string, unknown>)?.whys) && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-1">Porquês</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {((nc.rootCause.analysis as Record<string, unknown>).whys as string[]).map((w, i) => (
                      <li key={i} className="text-body-2 text-foreground-primary">{w}</li>
                    ))}
                  </ol>
                </div>
              )}
              {nc.rootCause.method === "ishikawa" && (nc.rootCause.analysis as Record<string, unknown>)?.categories ? (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-1">Categorias (6M)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries((nc.rootCause.analysis as Record<string, Record<string, string>>).categories || {}).map(([key, val]) =>
                      val ? (
                        <div key={key} className="bg-surface-secondary rounded-button p-2">
                          <p className="text-caption-1 text-foreground-tertiary capitalize">
                            {key.replace(/_/g, " ")}
                          </p>
                          <p className="text-body-2 text-foreground-primary">{val}</p>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              ) : null}
              {nc.rootCause.conclusion && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">Conclusão</p>
                  <p className="text-body-1 text-foreground-primary whitespace-pre-wrap">
                    {nc.rootCause.conclusion}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-body-2 text-foreground-tertiary py-4 text-center">
              Nenhuma análise de causa raiz registrada
            </p>
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
              Nenhum plano de ação vinculado a esta NC
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
                      <Badge variant={getStatusColor(ap.status)}>
                        {getStatusLabel(ap.status)}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
