"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Plus, Pencil, Trash2, Lightbulb, ExternalLink } from "lucide-react";
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

interface ImprovementFormData {
  title: string;
  description: string;
  source: string;
  category: string;
  priority: string;
  expectedImpact: string;
  actualImpact: string;
  responsibleId: string;
  actionPlanId: string;
  dueDate: string;
  notes: string;
  status: string;
}

const INITIAL_FORM: ImprovementFormData = {
  title: "", description: "", source: "other", category: "", priority: "medium",
  expectedImpact: "", actualImpact: "", responsibleId: "", actionPlanId: "",
  dueDate: "", notes: "", status: "identified",
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
  const [form, setForm] = useState<ImprovementFormData>(INITIAL_FORM);
  const updateForm = (field: keyof ImprovementFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: ImprovementOpportunity) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      source: item.source,
      category: item.category || "",
      priority: item.priority,
      expectedImpact: item.expectedImpact || "",
      actualImpact: item.actualImpact || "",
      responsibleId: item.responsibleId || "",
      actionPlanId: item.actionPlanId || "",
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",
      notes: item.notes || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        source: form.source,
        category: form.category || null,
        priority: form.priority,
        expectedImpact: form.expectedImpact || null,
        actualImpact: form.actualImpact || null,
        responsibleId: form.responsibleId || null,
        actionPlanId: form.actionPlanId || null,
        dueDate: form.dueDate || null,
        notes: form.notes || null,
        status: form.status,
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
    setDeleting(true);
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/improvements/${id}`, { method: "DELETE" });
      toast.success("Excluído");
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
    finally { setDeleting(false); }
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
        <Select
          value={filterPriority}
          onChange={(e) => { setFilterPriority(e.target.value); setLoading(true); }}
          options={[{ value: "", label: "Todas prioridades" }, ...Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
        <Select
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setLoading(true); }}
          options={[{ value: "", label: "Todas fontes" }, ...Object.entries(SOURCES).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
      </div>

      {loading ? (
        <CardSkeleton />
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
                          <button onClick={() => { setItemToDelete(imp.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
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

      <Modal
        open={showForm}
        onOpenChange={(open) => { if (!open) resetForm(); }}
        title={`${editingId ? "Editar" : "Nova"} Oportunidade`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
            <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Ex: Automatizar processo de backup" />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
            <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Fonte *</label>
              <Select
                value={form.source}
                onChange={(e) => updateForm("source", e.target.value)}
                options={Object.entries(SOURCES).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
              <Select
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                options={[{ value: "", label: "Selecionar..." }, ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v }))]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Prioridade</label>
              <Select
                value={form.priority}
                onChange={(e) => updateForm("priority", e.target.value)}
                options={Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Prazo</label>
              <Input type="date" value={form.dueDate} onChange={(e) => updateForm("dueDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Responsável</label>
              <Select
                value={form.responsibleId}
                onChange={(e) => updateForm("responsibleId", e.target.value)}
                options={[{ value: "", label: "Selecionar..." }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Plano de Ação</label>
              <Select
                value={form.actionPlanId}
                onChange={(e) => updateForm("actionPlanId", e.target.value)}
                options={[{ value: "", label: "Nenhum" }, ...actionPlans.map((ap) => ({ value: ap.id, label: `${ap.code} - ${ap.title}` }))]}
              />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Impacto Esperado</label>
            <Input value={form.expectedImpact} onChange={(e) => updateForm("expectedImpact", e.target.value)} placeholder="Ex: Redução de 50% no tempo de recuperação" />
          </div>
          {editingId && (
            <>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Impacto Real</label>
                <Input value={form.actualImpact} onChange={(e) => updateForm("actualImpact", e.target.value)} placeholder="Resultado efetivo da implementação" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                <Select
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                  options={Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }))}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Observações</label>
            <Textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editingId ? "Salvar" : "Criar"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir esta oportunidade de melhoria?"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => handleDelete(itemToDelete!)}
        loading={deleting}
      />
    </div>
  );
}
