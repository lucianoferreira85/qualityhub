"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Plus, X, Pencil, Trash2, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { SecurityObjective } from "@/types";

const STATUSES: Record<string, { label: string; color: string }> = {
  defined: { label: "Definido", color: "bg-surface-tertiary text-foreground-secondary" },
  in_progress: { label: "Em Andamento", color: "bg-brand-light text-brand" },
  achieved: { label: "Alcançado", color: "bg-success-bg text-success-fg" },
  not_achieved: { label: "Não Alcançado", color: "bg-danger-bg text-danger-fg" },
  cancelled: { label: "Cancelado", color: "bg-surface-tertiary text-foreground-tertiary" },
};

const CATEGORIES: Record<string, string> = {
  confidentiality: "Confidencialidade",
  integrity: "Integridade",
  availability: "Disponibilidade",
  compliance: "Conformidade",
  operational: "Operacional",
  strategic: "Estratégico",
};

const FREQUENCIES: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semi_annual: "Semestral",
  annual: "Anual",
};

export default function ObjectivesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [objectives, setObjectives] = useState<SecurityObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [indicators, setIndicators] = useState<{ id: string; name: string; unit: string }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formTargetValue, setFormTargetValue] = useState("");
  const [formTargetUnit, setFormTargetUnit] = useState("");
  const [formCurrentValue, setFormCurrentValue] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formIndicatorId, setFormIndicatorId] = useState("");
  const [formFrequency, setFormFrequency] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("defined");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set("status", filterStatus);
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/objectives${qsStr}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/indicators?projectId=${projectId}`).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([objRes, projRes, indRes]) => {
        setObjectives(objRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
        setIndicators(indRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormDescription("");
    setFormCategory("");
    setFormTargetValue("");
    setFormTargetUnit("");
    setFormCurrentValue("");
    setFormDeadline("");
    setFormIndicatorId("");
    setFormFrequency("");
    setFormNotes("");
    setFormStatus("defined");
  };

  const openEdit = (item: SecurityObjective) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormCategory(item.category || "");
    setFormTargetValue(item.targetValue != null ? String(item.targetValue) : "");
    setFormTargetUnit(item.targetUnit || "");
    setFormCurrentValue(item.currentValue != null ? String(item.currentValue) : "");
    setFormDeadline(item.deadline ? new Date(item.deadline).toISOString().split("T")[0] : "");
    setFormIndicatorId(item.indicatorId || "");
    setFormFrequency(item.monitoringFrequency || "");
    setFormNotes(item.notes || "");
    setFormStatus(item.status);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDescription || null,
        category: formCategory || null,
        targetValue: formTargetValue ? Number(formTargetValue) : null,
        targetUnit: formTargetUnit || null,
        currentValue: formCurrentValue ? Number(formCurrentValue) : null,
        deadline: formDeadline || null,
        indicatorId: formIndicatorId || null,
        monitoringFrequency: formFrequency || null,
        notes: formNotes || null,
        status: formStatus,
        projectId,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/objectives/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/objectives`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      toast.success(editingId ? "Atualizado" : "Criado");
      resetForm();
      fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este objetivo?")) return;
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/objectives/${id}`, { method: "DELETE" });
      toast.success("Excluído");
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
  };

  const stats = {
    total: objectives.length,
    defined: objectives.filter((o) => o.status === "defined").length,
    inProgress: objectives.filter((o) => o.status === "in_progress").length,
    achieved: objectives.filter((o) => o.status === "achieved").length,
    notAchieved: objectives.filter((o) => o.status === "not_achieved").length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Objetivos" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Objetivos de Segurança</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 cláusula 6.2</p>
        </div>
        {can("securityObjective", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Novo
          </Button>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground-primary" },
            { label: "Definidos", value: stats.defined, color: "text-foreground-secondary" },
            { label: "Em Andamento", value: stats.inProgress, color: "text-brand" },
            { label: "Alcançados", value: stats.achieved, color: "text-success-fg" },
            { label: "Não Alcançados", value: stats.notAchieved, color: "text-danger-fg" },
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

      <div className="flex items-center gap-2">
        <span className="text-body-2 text-foreground-tertiary">Status:</span>
        {["", "defined", "in_progress", "achieved", "not_achieved", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setLoading(true); }}
            className={`px-2.5 py-1 rounded-button text-caption-1 transition-colors ${filterStatus === s ? "bg-brand text-white" : "bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary"}`}
          >
            {s === "" ? "Todos" : STATUSES[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><CardContent className="p-4"><div className="animate-pulse h-32 bg-surface-tertiary rounded" /></CardContent></Card>
      ) : objectives.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Crosshair className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhum objetivo registrado</p>
            <p className="text-body-2 text-foreground-secondary">Defina objetivos de segurança mensuráveis para o SGSI</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke-secondary">
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Código</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Título</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Categoria</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Meta</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Progresso</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Prazo</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Responsável</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {objectives.map((obj) => {
                  const progress = obj.targetValue && obj.currentValue
                    ? Math.min(100, Math.round((Number(obj.currentValue) / Number(obj.targetValue)) * 100))
                    : null;
                  return (
                    <tr key={obj.id} className="border-b border-stroke-secondary last:border-0 hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3 text-body-2 font-medium text-brand">{obj.code}</td>
                      <td className="px-4 py-3">
                        <p className="text-body-2 font-medium text-foreground-primary">{obj.title}</p>
                        {obj.indicator && <p className="text-caption-1 text-foreground-tertiary">Indicador: {obj.indicator.name}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {obj.category ? (
                          <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{CATEGORIES[obj.category] || obj.category}</Badge>
                        ) : <span className="text-caption-1 text-foreground-tertiary">—</span>}
                      </td>
                      <td className="px-4 py-3 text-body-2 text-foreground-primary">
                        {obj.targetValue != null ? `${Number(obj.targetValue)} ${obj.targetUnit || ""}`.trim() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {progress !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 bg-surface-tertiary rounded-full">
                              <div
                                className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-success" : "bg-brand"}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-caption-1 text-foreground-secondary">{progress}%</span>
                          </div>
                        ) : <span className="text-caption-1 text-foreground-tertiary">—</span>}
                      </td>
                      <td className="px-4 py-3 text-body-2 text-foreground-secondary">
                        {obj.deadline ? formatDate(obj.deadline) : "—"}
                      </td>
                      <td className="px-4 py-3 text-body-2 text-foreground-secondary">
                        {obj.responsible?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUSES[obj.status]?.color}>{STATUSES[obj.status]?.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {can("securityObjective", "update") && (
                            <button onClick={() => openEdit(obj)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {can("securityObjective", "delete") && (
                            <button onClick={() => handleDelete(obj.id)} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-title-3 text-foreground-primary">{editingId ? "Editar" : "Novo"} Objetivo</h2>
                <button onClick={resetForm} className="text-foreground-tertiary hover:text-foreground-primary"><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Reduzir incidentes de segurança em 50%" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="w-full h-16 px-3 py-2 rounded-input border border-stroke-primary bg-surface-primary text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value="">Selecionar...</option>
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Frequência Monitoramento</label>
                  <select value={formFrequency} onChange={(e) => setFormFrequency(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value="">Selecionar...</option>
                    {Object.entries(FREQUENCIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Meta</label>
                  <Input type="number" value={formTargetValue} onChange={(e) => setFormTargetValue(e.target.value)} placeholder="100" />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Unidade</label>
                  <Input value={formTargetUnit} onChange={(e) => setFormTargetUnit(e.target.value)} placeholder="%" />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Valor Atual</label>
                  <Input type="number" value={formCurrentValue} onChange={(e) => setFormCurrentValue(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Prazo</label>
                  <Input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Indicador</label>
                  <select value={formIndicatorId} onChange={(e) => setFormIndicatorId(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value="">Nenhum</option>
                    {indicators.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                </div>
              </div>
              {editingId && (
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                    {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Observações</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="w-full h-16 px-3 py-2 rounded-input border border-stroke-primary bg-surface-primary text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSave} loading={saving}>{editingId ? "Salvar" : "Criar"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
