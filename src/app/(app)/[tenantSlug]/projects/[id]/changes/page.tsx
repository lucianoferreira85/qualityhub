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
import { Plus, Pencil, Trash2, GitPullRequest } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { ChangeRequest } from "@/types";

const STATUSES: Record<string, { label: string; color: string }> = {
  requested: { label: "Solicitada", color: "bg-surface-tertiary text-foreground-secondary" },
  under_review: { label: "Em Revisão", color: "bg-brand-light text-brand" },
  approved: { label: "Aprovada", color: "bg-success-bg text-success-fg" },
  in_progress: { label: "Em Progresso", color: "bg-warning-bg text-warning-fg" },
  implemented: { label: "Implementada", color: "bg-success-bg text-success-fg" },
  verified: { label: "Verificada", color: "bg-success-bg text-success-fg" },
  rejected: { label: "Rejeitada", color: "bg-danger-bg text-danger-fg" },
  cancelled: { label: "Cancelada", color: "bg-surface-tertiary text-foreground-secondary" },
};

const TYPES: Record<string, string> = {
  process: "Processo",
  technology: "Tecnologia",
  organizational: "Organizacional",
  documentation: "Documentação",
  control: "Controle",
  scope: "Escopo",
  other: "Outro",
};

const PRIORITIES: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-surface-tertiary text-foreground-tertiary" },
  medium: { label: "Média", color: "bg-warning-bg text-warning-fg" },
  high: { label: "Alta", color: "bg-brand-light text-brand" },
  urgent: { label: "Urgente", color: "bg-danger-bg text-danger-fg" },
};

interface ChangeFormData {
  title: string;
  description: string;
  type: string;
  reason: string;
  impactAnalysis: string;
  riskAssessment: string;
  rollbackPlan: string;
  priority: string;
  assignedToId: string;
  plannedDate: string;
  affectedAreas: string;
  notes: string;
  status: string;
}

const INITIAL_FORM: ChangeFormData = {
  title: "", description: "", type: "process", reason: "", impactAnalysis: "",
  riskAssessment: "", rollbackPlan: "", priority: "medium", assignedToId: "",
  plannedDate: "", affectedAreas: "", notes: "", status: "requested",
};

export default function ChangesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterType, setFilterType] = useState("");
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChangeFormData>(INITIAL_FORM);
  const updateForm = (field: keyof ChangeFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set("status", filterStatus);
    if (filterPriority) qs.set("priority", filterPriority);
    if (filterType) qs.set("type", filterType);
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/changes${qsStr}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([chRes, projRes]) => {
        setChanges(chRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
        setMembers(projRes.data?.members?.map((m: { user: { id: string; name: string } }) => m.user) || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId, filterStatus, filterPriority, filterType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: ChangeRequest) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      type: item.type,
      reason: item.reason || "",
      impactAnalysis: item.impactAnalysis || "",
      riskAssessment: item.riskAssessment || "",
      rollbackPlan: item.rollbackPlan || "",
      priority: item.priority,
      assignedToId: item.assignedToId || "",
      plannedDate: item.plannedDate ? new Date(item.plannedDate).toISOString().split("T")[0] : "",
      affectedAreas: item.affectedAreas || "",
      notes: item.notes || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Titulo e obrigatorio"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        type: form.type,
        reason: form.reason || null,
        impactAnalysis: form.impactAnalysis || null,
        riskAssessment: form.riskAssessment || null,
        rollbackPlan: form.rollbackPlan || null,
        priority: form.priority,
        assignedToId: form.assignedToId || null,
        plannedDate: form.plannedDate || null,
        affectedAreas: form.affectedAreas || null,
        notes: form.notes || null,
        status: form.status,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/changes/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/changes`;
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
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/changes/${id}`, { method: "DELETE" });
      toast.success("Excluído");
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
    finally { setDeleting(false); }
  };

  const stats = {
    total: changes.length,
    requested: changes.filter((c) => c.status === "requested").length,
    approved: changes.filter((c) => c.status === "approved").length,
    inProgress: changes.filter((c) => c.status === "in_progress").length,
    implemented: changes.filter((c) => c.status === "implemented").length,
    rejected: changes.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Gestão de Mudanças" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Gestão de Mudanças</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 cláusula 6.3</p>
        </div>
        {can("changeRequest", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Nova
          </Button>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground-primary" },
            { label: "Solicitadas", value: stats.requested, color: "text-foreground-secondary" },
            { label: "Aprovadas", value: stats.approved, color: "text-success-fg" },
            { label: "Em Progresso", value: stats.inProgress, color: "text-warning" },
            { label: "Implementadas", value: stats.implemented, color: "text-success-fg" },
            { label: "Rejeitadas", value: stats.rejected, color: "text-danger-fg" },
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
          {["", "requested", "under_review", "approved", "in_progress", "implemented", "verified", "rejected", "cancelled"].map((s) => (
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
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setLoading(true); }}
          options={[{ value: "", label: "Todos tipos" }, ...Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v }))]}
        />
      </div>

      {loading ? (
        <CardSkeleton />
      ) : changes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitPullRequest className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhuma solicitação de mudança</p>
            <p className="text-body-2 text-foreground-secondary">Registre e gerencie mudanças no SGSI</p>
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
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Tipo</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Prioridade</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Solicitante</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Data Planejada</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {changes.map((ch) => (
                  <tr key={ch.id} className="border-b border-stroke-secondary last:border-0 hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3 text-body-2 font-mono text-foreground-secondary">{ch.code}</td>
                    <td className="px-4 py-3">
                      <p className="text-body-2 font-medium text-foreground-primary">{ch.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{TYPES[ch.type] || ch.type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={PRIORITIES[ch.priority]?.color}>{PRIORITIES[ch.priority]?.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{ch.requestedBy?.name || "—"}</td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{ch.plannedDate ? formatDate(ch.plannedDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUSES[ch.status]?.color}>{STATUSES[ch.status]?.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can("changeRequest", "update") && (
                          <button onClick={() => openEdit(ch)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {can("changeRequest", "delete") && (
                          <button onClick={() => { setItemToDelete(ch.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
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
        title={`${editingId ? "Editar" : "Nova"} Solicitação de Mudança`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
            <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Ex: Migração do firewall para nova solução" />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
            <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Tipo *</label>
              <Select
                value={form.type}
                onChange={(e) => updateForm("type", e.target.value)}
                options={Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v }))}
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Prioridade</label>
              <Select
                value={form.priority}
                onChange={(e) => updateForm("priority", e.target.value)}
                options={Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Justificativa</label>
            <Textarea value={form.reason} onChange={(e) => updateForm("reason", e.target.value)} rows={2} />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Análise de Impacto</label>
            <Textarea value={form.impactAnalysis} onChange={(e) => updateForm("impactAnalysis", e.target.value)} rows={2} />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Avaliação de Riscos</label>
            <Textarea value={form.riskAssessment} onChange={(e) => updateForm("riskAssessment", e.target.value)} rows={2} />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Plano de Rollback</label>
            <Textarea value={form.rollbackPlan} onChange={(e) => updateForm("rollbackPlan", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Responsável</label>
              <Select
                value={form.assignedToId}
                onChange={(e) => updateForm("assignedToId", e.target.value)}
                options={[{ value: "", label: "Selecionar..." }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Data Planejada</label>
              <Input type="date" value={form.plannedDate} onChange={(e) => updateForm("plannedDate", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Áreas Afetadas</label>
            <Textarea value={form.affectedAreas} onChange={(e) => updateForm("affectedAreas", e.target.value)} rows={2} />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Observações</label>
            <Textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} rows={2} />
          </div>
          {editingId && (
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
              <Select
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value)}
                options={Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editingId ? "Salvar" : "Criar"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir esta solicitação de mudança?"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => handleDelete(itemToDelete!)}
        loading={deleting}
      />
    </div>
  );
}
