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
import { Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { SecurityIncident } from "@/types";

const STATUSES: Record<string, { label: string; color: string }> = {
  reported: { label: "Reportado", color: "bg-surface-tertiary text-foreground-secondary" },
  triaged: { label: "Triagem", color: "bg-brand-light text-brand" },
  contained: { label: "Contido", color: "bg-warning-bg text-warning-fg" },
  investigating: { label: "Em Investigação", color: "bg-warning-bg text-warning-fg" },
  resolved: { label: "Resolvido", color: "bg-success-bg text-success-fg" },
  closed: { label: "Fechado", color: "bg-success-bg text-success-fg" },
};

const TYPES: Record<string, { label: string; color: string }> = {
  data_breach: { label: "Violação de Dados", color: "bg-danger-bg text-danger-fg" },
  unauthorized_access: { label: "Acesso Não Autorizado", color: "bg-danger-bg text-danger-fg" },
  malware: { label: "Malware", color: "bg-danger-bg text-danger-fg" },
  phishing: { label: "Phishing", color: "bg-warning-bg text-warning-fg" },
  denial_of_service: { label: "DoS", color: "bg-brand-light text-brand" },
  physical: { label: "Físico", color: "bg-surface-tertiary text-foreground-secondary" },
  social_engineering: { label: "Engenharia Social", color: "bg-warning-bg text-warning-fg" },
  other: { label: "Outro", color: "bg-surface-tertiary text-foreground-secondary" },
};

const SEVERITIES: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-surface-tertiary text-foreground-tertiary" },
  medium: { label: "Média", color: "bg-warning-bg text-warning-fg" },
  high: { label: "Alta", color: "bg-brand-light text-brand" },
  critical: { label: "Crítica", color: "bg-danger-bg text-danger-fg" },
};

const CATEGORIES: Record<string, string> = {
  confidentiality: "Confidencialidade",
  integrity: "Integridade",
  availability: "Disponibilidade",
  multiple: "Múltiplas",
};

interface IncidentFormData {
  title: string;
  description: string;
  type: string;
  severity: string;
  category: string;
  detectedAt: string;
  assignedToId: string;
  affectedAssets: string;
  affectedSystems: string;
  impactDescription: string;
  rootCause: string;
  containmentActions: string;
  correctiveActions: string;
  lessonsLearned: string;
  notes: string;
  status: string;
}

const INITIAL_FORM: IncidentFormData = {
  title: "", description: "", type: "other", severity: "medium", category: "",
  detectedAt: "", assignedToId: "", affectedAssets: "", affectedSystems: "",
  impactDescription: "", rootCause: "", containmentActions: "", correctiveActions: "",
  lessonsLearned: "", notes: "", status: "reported",
};

export default function IncidentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterType, setFilterType] = useState("");
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IncidentFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const updateForm = <K extends keyof IncidentFormData>(key: K, value: IncidentFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchData = useCallback(() => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set("status", filterStatus);
    if (filterSeverity) qs.set("severity", filterSeverity);
    if (filterType) qs.set("type", filterType);
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/incidents${qsStr}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([incRes, projRes]) => {
        setIncidents(incRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
        setMembers(projRes.data?.members?.map((m: { user: { id: string; name: string } }) => m.user) || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId, filterStatus, filterSeverity, filterType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: SecurityIncident) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      type: item.type,
      severity: item.severity,
      category: item.category || "",
      detectedAt: item.detectedAt ? new Date(item.detectedAt).toISOString().slice(0, 16) : "",
      assignedToId: item.assignedToId || "",
      affectedAssets: item.affectedAssets || "",
      affectedSystems: item.affectedSystems || "",
      impactDescription: item.impactDescription || "",
      rootCause: item.rootCause || "",
      containmentActions: item.containmentActions || "",
      correctiveActions: item.correctiveActions || "",
      lessonsLearned: item.lessonsLearned || "",
      notes: item.notes || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Título é obrigatório"); return; }
    if (!form.detectedAt) { toast.error("Data de detecção é obrigatória"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        type: form.type,
        severity: form.severity,
        category: form.category || null,
        detectedAt: form.detectedAt || null,
        assignedToId: form.assignedToId || null,
        affectedAssets: form.affectedAssets || null,
        affectedSystems: form.affectedSystems || null,
        impactDescription: form.impactDescription || null,
        rootCause: form.rootCause || null,
        containmentActions: form.containmentActions || null,
        correctiveActions: form.correctiveActions || null,
        lessonsLearned: form.lessonsLearned || null,
        notes: form.notes || null,
        status: form.status,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/incidents/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/incidents`;
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
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/incidents/${id}`, { method: "DELETE" });
      toast.success("Excluído");
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
    finally { setDeleting(false); }
  };

  const stats = {
    total: incidents.length,
    reported: incidents.filter((i) => i.status === "reported").length,
    investigating: incidents.filter((i) => i.status === "investigating").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
    closed: incidents.filter((i) => i.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Incidentes de Segurança" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Incidentes de Segurança</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 A.5.24-A.5.28</p>
        </div>
        {can("securityIncident", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Novo
          </Button>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground-primary" },
            { label: "Reportados", value: stats.reported, color: "text-foreground-secondary" },
            { label: "Em Investigação", value: stats.investigating, color: "text-warning" },
            { label: "Resolvidos", value: stats.resolved, color: "text-success-fg" },
            { label: "Fechados", value: stats.closed, color: "text-success-fg" },
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
          {["", "reported", "triaged", "contained", "investigating", "resolved", "closed"].map((s) => (
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
          value={filterSeverity}
          onChange={(e) => { setFilterSeverity(e.target.value); setLoading(true); }}
          options={[{ value: "", label: "Todas severidades" }, ...Object.entries(SEVERITIES).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
        <Select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setLoading(true); }}
          options={[{ value: "", label: "Todos tipos" }, ...Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
      </div>

      {loading ? (
        <CardSkeleton />
      ) : incidents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldAlert className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhum incidente de segurança</p>
            <p className="text-body-2 text-foreground-secondary">Registre e gerencie incidentes de segurança da informação</p>
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
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Severidade</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Detectado Em</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Atribuído A</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-stroke-secondary last:border-0 hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3 text-body-2 font-mono text-foreground-secondary">{inc.code}</td>
                    <td className="px-4 py-3">
                      <p className="text-body-2 font-medium text-foreground-primary">{inc.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={TYPES[inc.type]?.color}>{TYPES[inc.type]?.label || inc.type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={SEVERITIES[inc.severity]?.color}>{SEVERITIES[inc.severity]?.label || inc.severity}</Badge>
                    </td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{inc.detectedAt ? formatDate(inc.detectedAt) : "—"}</td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{inc.assignedTo?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUSES[inc.status]?.color}>{STATUSES[inc.status]?.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can("securityIncident", "update") && (
                          <button onClick={() => openEdit(inc)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {can("securityIncident", "delete") && (
                          <button onClick={() => { setItemToDelete(inc.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
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
        title={`${editingId ? "Editar" : "Novo"} Incidente`}
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
            <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Ex: Tentativa de acesso não autorizado ao servidor" />
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
                options={Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Severidade *</label>
              <Select
                value={form.severity}
                onChange={(e) => updateForm("severity", e.target.value)}
                options={Object.entries(SEVERITIES).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
              <Select
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                options={[{ value: "", label: "Selecionar..." }, ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v }))]}
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Detectado Em *</label>
              <Input type="datetime-local" value={form.detectedAt} onChange={(e) => updateForm("detectedAt", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Atribuído A</label>
            <Select
              value={form.assignedToId}
              onChange={(e) => updateForm("assignedToId", e.target.value)}
              options={[{ value: "", label: "Selecionar..." }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
            />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Ativos Afetados</label>
            <Textarea value={form.affectedAssets} onChange={(e) => updateForm("affectedAssets", e.target.value)} rows={2} placeholder="Ex: Servidor de banco de dados, laptop do colaborador" />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Sistemas Afetados</label>
            <Textarea value={form.affectedSystems} onChange={(e) => updateForm("affectedSystems", e.target.value)} rows={2} placeholder="Ex: ERP, sistema de e-mail" />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição do Impacto</label>
            <Textarea value={form.impactDescription} onChange={(e) => updateForm("impactDescription", e.target.value)} rows={2} placeholder="Descreva o impacto do incidente" />
          </div>
          {editingId && (
            <>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Causa Raiz</label>
                <Textarea value={form.rootCause} onChange={(e) => updateForm("rootCause", e.target.value)} rows={2} placeholder="Análise da causa raiz do incidente" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Ações de Contenção</label>
                <Textarea value={form.containmentActions} onChange={(e) => updateForm("containmentActions", e.target.value)} rows={2} placeholder="Ações tomadas para conter o incidente" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Ações Corretivas</label>
                <Textarea value={form.correctiveActions} onChange={(e) => updateForm("correctiveActions", e.target.value)} rows={2} placeholder="Ações corretivas implementadas" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Lições Aprendidas</label>
                <Textarea value={form.lessonsLearned} onChange={(e) => updateForm("lessonsLearned", e.target.value)} rows={2} placeholder="O que foi aprendido com este incidente" />
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
        title="Excluir este incidente de segurança?"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => handleDelete(itemToDelete!)}
        loading={deleting}
      />
    </div>
  );
}
