"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, X, Pencil, Trash2, ShieldAlert } from "lucide-react";
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
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("other");
  const [formSeverity, setFormSeverity] = useState("medium");
  const [formCategory, setFormCategory] = useState("");
  const [formDetectedAt, setFormDetectedAt] = useState("");
  const [formAssignedToId, setFormAssignedToId] = useState("");
  const [formAffectedAssets, setFormAffectedAssets] = useState("");
  const [formAffectedSystems, setFormAffectedSystems] = useState("");
  const [formImpactDescription, setFormImpactDescription] = useState("");
  const [formRootCause, setFormRootCause] = useState("");
  const [formContainmentActions, setFormContainmentActions] = useState("");
  const [formCorrectiveActions, setFormCorrectiveActions] = useState("");
  const [formLessonsLearned, setFormLessonsLearned] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("reported");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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
    setFormTitle("");
    setFormDescription("");
    setFormType("other");
    setFormSeverity("medium");
    setFormCategory("");
    setFormDetectedAt("");
    setFormAssignedToId("");
    setFormAffectedAssets("");
    setFormAffectedSystems("");
    setFormImpactDescription("");
    setFormRootCause("");
    setFormContainmentActions("");
    setFormCorrectiveActions("");
    setFormLessonsLearned("");
    setFormNotes("");
    setFormStatus("reported");
  };

  const openEdit = (item: SecurityIncident) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormType(item.type);
    setFormSeverity(item.severity);
    setFormCategory(item.category || "");
    setFormDetectedAt(item.detectedAt ? new Date(item.detectedAt).toISOString().slice(0, 16) : "");
    setFormAssignedToId(item.assignedToId || "");
    setFormAffectedAssets(item.affectedAssets || "");
    setFormAffectedSystems(item.affectedSystems || "");
    setFormImpactDescription(item.impactDescription || "");
    setFormRootCause(item.rootCause || "");
    setFormContainmentActions(item.containmentActions || "");
    setFormCorrectiveActions(item.correctiveActions || "");
    setFormLessonsLearned(item.lessonsLearned || "");
    setFormNotes(item.notes || "");
    setFormStatus(item.status);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("Título é obrigatório"); return; }
    if (!formDetectedAt) { toast.error("Data de detecção é obrigatória"); return; }
    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDescription || null,
        type: formType,
        severity: formSeverity,
        category: formCategory || null,
        detectedAt: formDetectedAt || null,
        assignedToId: formAssignedToId || null,
        affectedAssets: formAffectedAssets || null,
        affectedSystems: formAffectedSystems || null,
        impactDescription: formImpactDescription || null,
        rootCause: formRootCause || null,
        containmentActions: formContainmentActions || null,
        correctiveActions: formCorrectiveActions || null,
        lessonsLearned: formLessonsLearned || null,
        notes: formNotes || null,
        status: formStatus,
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-title-3 text-foreground-primary">{editingId ? "Editar" : "Novo"} Incidente</h2>
                <button onClick={resetForm} className="text-foreground-tertiary hover:text-foreground-primary"><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Tentativa de acesso não autorizado ao servidor" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Tipo *</label>
                  <Select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    options={Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Severidade *</label>
                  <Select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value)}
                    options={Object.entries(SEVERITIES).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
                  <Select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    options={[{ value: "", label: "Selecionar..." }, ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v }))]}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Detectado Em *</label>
                  <Input type="datetime-local" value={formDetectedAt} onChange={(e) => setFormDetectedAt(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Atribuído A</label>
                <Select
                  value={formAssignedToId}
                  onChange={(e) => setFormAssignedToId(e.target.value)}
                  options={[{ value: "", label: "Selecionar..." }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Ativos Afetados</label>
                <Textarea value={formAffectedAssets} onChange={(e) => setFormAffectedAssets(e.target.value)} rows={2} placeholder="Ex: Servidor de banco de dados, laptop do colaborador" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Sistemas Afetados</label>
                <Textarea value={formAffectedSystems} onChange={(e) => setFormAffectedSystems(e.target.value)} rows={2} placeholder="Ex: ERP, sistema de e-mail" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição do Impacto</label>
                <Textarea value={formImpactDescription} onChange={(e) => setFormImpactDescription(e.target.value)} rows={2} placeholder="Descreva o impacto do incidente" />
              </div>
              {editingId && (
                <>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Causa Raiz</label>
                    <Textarea value={formRootCause} onChange={(e) => setFormRootCause(e.target.value)} rows={2} placeholder="Análise da causa raiz do incidente" />
                  </div>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Ações de Contenção</label>
                    <Textarea value={formContainmentActions} onChange={(e) => setFormContainmentActions(e.target.value)} rows={2} placeholder="Ações tomadas para conter o incidente" />
                  </div>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Ações Corretivas</label>
                    <Textarea value={formCorrectiveActions} onChange={(e) => setFormCorrectiveActions(e.target.value)} rows={2} placeholder="Ações corretivas implementadas" />
                  </div>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Lições Aprendidas</label>
                    <Textarea value={formLessonsLearned} onChange={(e) => setFormLessonsLearned(e.target.value)} rows={2} placeholder="O que foi aprendido com este incidente" />
                  </div>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                    <Select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      options={Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }))}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Observações</label>
                <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSave} loading={saving}>{editingId ? "Salvar" : "Criar"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
