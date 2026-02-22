"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Plus, X, Pencil, Trash2, Lightbulb, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { ImprovementOpportunity } from "@/types";

const STATUSES: Record<string, { label: string; color: string }> = {
  identified: { label: "Identificada", color: "bg-surface-tertiary text-foreground-secondary" },
  evaluated: { label: "Avaliada", color: "bg-brand-light text-brand" },
  approved: { label: "Aprovada", color: "bg-brand-light text-brand" },
  in_progress: { label: "Em Progresso", color: "bg-warning-bg text-warning-fg" },
  implemented: { label: "Implementada", color: "bg-success-bg text-success-fg" },
  verified: { label: "Verificada", color: "bg-success-bg text-success-fg" },
  rejected: { label: "Rejeitada", color: "bg-danger-bg text-danger-fg" },
};

const SOURCES: Record<string, { label: string; color: string }> = {
  audit: { label: "Auditoria", color: "bg-brand-light text-brand" },
  management_review: { label: "Análise Crítica", color: "bg-warning-bg text-warning-fg" },
  incident: { label: "Incidente", color: "bg-danger-bg text-danger-fg" },
  feedback: { label: "Feedback", color: "bg-success-bg text-success-fg" },
  risk_assessment: { label: "Avaliação de Risco", color: "bg-brand-light text-brand" },
  benchmarking: { label: "Benchmarking", color: "bg-surface-tertiary text-foreground-secondary" },
  other: { label: "Outro", color: "bg-surface-tertiary text-foreground-secondary" },
};

const CATEGORIES: Record<string, string> = {
  process: "Processo",
  technology: "Tecnologia",
  people: "Pessoas",
  documentation: "Documentação",
  controls: "Controles",
  other: "Outro",
};

const PRIORITIES: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-surface-tertiary text-foreground-tertiary" },
  medium: { label: "Média", color: "bg-warning-bg text-warning-fg" },
  high: { label: "Alta", color: "bg-brand-light text-brand" },
  critical: { label: "Crítica", color: "bg-danger-bg text-danger-fg" },
};

export default function ImprovementsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [improvements, setImprovements] = useState<ImprovementOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [actionPlans, setActionPlans] = useState<{ id: string; code: string; title: string }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSource, setFormSource] = useState("other");
  const [formCategory, setFormCategory] = useState("");
  const [formPriority, setFormPriority] = useState("medium");
  const [formExpectedImpact, setFormExpectedImpact] = useState("");
  const [formActualImpact, setFormActualImpact] = useState("");
  const [formResponsibleId, setFormResponsibleId] = useState("");
  const [formActionPlanId, setFormActionPlanId] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("identified");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set("status", filterStatus);
    if (filterPriority) qs.set("priority", filterPriority);
    if (filterSource) qs.set("source", filterSource);
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/improvements${qsStr}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/action-plans`).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([impRes, projRes, apRes]) => {
        setImprovements(impRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
        setMembers(projRes.data?.members?.map((m: { user: { id: string; name: string } }) => m.user) || []);
        setActionPlans(apRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId, filterStatus, filterPriority, filterSource]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormDescription("");
    setFormSource("other");
    setFormCategory("");
    setFormPriority("medium");
    setFormExpectedImpact("");
    setFormActualImpact("");
    setFormResponsibleId("");
    setFormActionPlanId("");
    setFormDueDate("");
    setFormNotes("");
    setFormStatus("identified");
  };

  const openEdit = (item: ImprovementOpportunity) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormSource(item.source);
    setFormCategory(item.category || "");
    setFormPriority(item.priority);
    setFormExpectedImpact(item.expectedImpact || "");
    setFormActualImpact(item.actualImpact || "");
    setFormResponsibleId(item.responsibleId || "");
    setFormActionPlanId(item.actionPlanId || "");
    setFormDueDate(item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "");
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
        source: formSource,
        category: formCategory || null,
        priority: formPriority,
        expectedImpact: formExpectedImpact || null,
        actualImpact: formActualImpact || null,
        responsibleId: formResponsibleId || null,
        actionPlanId: formActionPlanId || null,
        dueDate: formDueDate || null,
        notes: formNotes || null,
        status: formStatus,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/improvements/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/improvements`;
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
    if (!confirm("Excluir esta oportunidade de melhoria?")) return;
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/improvements/${id}`, { method: "DELETE" });
      toast.success("Excluído");
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
  };

  const stats = {
    total: improvements.length,
    identified: improvements.filter((i) => i.status === "identified").length,
    inProgress: improvements.filter((i) => i.status === "in_progress").length,
    implemented: improvements.filter((i) => i.status === "implemented").length,
    verified: improvements.filter((i) => i.status === "verified").length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Melhoria Contínua" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Melhoria Contínua</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 cláusula 10.3</p>
        </div>
        {can("improvement", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Nova
          </Button>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground-primary" },
            { label: "Identificadas", value: stats.identified, color: "text-foreground-secondary" },
            { label: "Em Progresso", value: stats.inProgress, color: "text-warning" },
            { label: "Implementadas", value: stats.implemented, color: "text-success-fg" },
            { label: "Verificadas", value: stats.verified, color: "text-success-fg" },
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

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-body-2 text-foreground-tertiary">Status:</span>
          {["", "identified", "evaluated", "approved", "in_progress", "implemented", "verified", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setLoading(true); }}
              className={`px-2.5 py-1 rounded-button text-caption-1 transition-colors ${filterStatus === s ? "bg-brand text-white" : "bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary"}`}
            >
              {s === "" ? "Todos" : STATUSES[s]?.label}
            </button>
          ))}
        </div>
        <select
          value={filterPriority}
          onChange={(e) => { setFilterPriority(e.target.value); setLoading(true); }}
          className="h-8 rounded-input border border-stroke-primary bg-surface-primary px-2 text-caption-1 text-foreground-primary focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="">Todas prioridades</option>
          {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setLoading(true); }}
          className="h-8 rounded-input border border-stroke-primary bg-surface-primary px-2 text-caption-1 text-foreground-primary focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="">Todas fontes</option>
          {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? (
        <Card><CardContent className="p-4"><div className="animate-pulse h-32 bg-surface-tertiary rounded" /></CardContent></Card>
      ) : improvements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhuma oportunidade de melhoria</p>
            <p className="text-body-2 text-foreground-secondary">Registre oportunidades de melhoria contínua do SGSI</p>
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
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Fonte</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Categoria</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Prioridade</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Responsável</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Prazo</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {improvements.map((imp) => (
                  <tr key={imp.id} className="border-b border-stroke-secondary last:border-0 hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3 text-body-2 font-mono text-foreground-secondary">{imp.code}</td>
                    <td className="px-4 py-3">
                      <p className="text-body-2 font-medium text-foreground-primary">{imp.title}</p>
                      {imp.status === "implemented" && imp.actualImpact && (
                        <p className="text-caption-1 text-success-fg mt-0.5">Impacto: {imp.actualImpact}</p>
                      )}
                      {imp.actionPlan && (
                        <a href={`/${tenant.slug}/projects/${projectId}/action-plans`} className="inline-flex items-center gap-1 text-caption-1 text-brand hover:underline mt-0.5">
                          <ExternalLink className="h-3 w-3" /> {imp.actionPlan.code}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={SOURCES[imp.source]?.color}>{SOURCES[imp.source]?.label || imp.source}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {imp.category ? (
                        <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{CATEGORIES[imp.category] || imp.category}</Badge>
                      ) : <span className="text-caption-1 text-foreground-tertiary">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={PRIORITIES[imp.priority]?.color}>{PRIORITIES[imp.priority]?.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{imp.responsible?.name || "—"}</td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{imp.dueDate ? formatDate(imp.dueDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUSES[imp.status]?.color}>{STATUSES[imp.status]?.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can("improvement", "update") && (
                          <button onClick={() => openEdit(imp)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {can("improvement", "delete") && (
                          <button onClick={() => handleDelete(imp.id)} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
                <h2 className="text-title-3 text-foreground-primary">{editingId ? "Editar" : "Nova"} Oportunidade</h2>
                <button onClick={resetForm} className="text-foreground-tertiary hover:text-foreground-primary"><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Automatizar processo de backup" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="w-full h-16 px-3 py-2 rounded-input border border-stroke-primary bg-surface-primary text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Fonte *</label>
                  <select value={formSource} onChange={(e) => setFormSource(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                    {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value="">Selecionar...</option>
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Prioridade</label>
                  <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                    {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Prazo</label>
                  <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Responsável</label>
                  <select value={formResponsibleId} onChange={(e) => setFormResponsibleId(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value="">Selecionar...</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Plano de Ação</label>
                  <select value={formActionPlanId} onChange={(e) => setFormActionPlanId(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value="">Nenhum</option>
                    {actionPlans.map((ap) => <option key={ap.id} value={ap.id}>{ap.code} - {ap.title}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Impacto Esperado</label>
                <Input value={formExpectedImpact} onChange={(e) => setFormExpectedImpact(e.target.value)} placeholder="Ex: Redução de 50% no tempo de recuperação" />
              </div>
              {editingId && (
                <>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Impacto Real</label>
                    <Input value={formActualImpact} onChange={(e) => setFormActualImpact(e.target.value)} placeholder="Resultado efetivo da implementação" />
                  </div>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                    <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand">
                      {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </>
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
