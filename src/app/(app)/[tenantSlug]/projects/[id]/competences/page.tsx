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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { Competence } from "@/types";

interface CompetenceFormData {
  role: string;
  required: string;
  level: string;
  action: string;
  type: string;
  evidence: string;
  dueDate: string;
  notes: string;
  status: string;
}

const INITIAL_FORM: CompetenceFormData = {
  role: "", required: "", level: "", action: "", type: "",
  evidence: "", dueDate: "", notes: "", status: "identified",
};

const LEVELS: Record<string, { label: string; color: string }> = {
  none: { label: "Nenhum", color: "bg-danger-bg text-danger-fg" },
  basic: { label: "Básico", color: "bg-warning-bg text-warning-fg" },
  intermediate: { label: "Intermediário", color: "bg-brand-light text-brand" },
  advanced: { label: "Avançado", color: "bg-success-bg text-success-fg" },
};

const STATUSES: Record<string, { label: string; color: string }> = {
  identified: { label: "Identificada", color: "bg-surface-tertiary text-foreground-secondary" },
  planned: { label: "Planejada", color: "bg-brand-light text-brand" },
  in_progress: { label: "Em Andamento", color: "bg-warning-bg text-warning-fg" },
  completed: { label: "Concluída", color: "bg-success-bg text-success-fg" },
  verified: { label: "Verificada", color: "bg-success-bg text-success-fg" },
};

const TRAINING_TYPES: Record<string, string> = {
  course: "Curso",
  workshop: "Workshop",
  mentoring: "Mentoria",
  certification: "Certificação",
  self_study: "Autoestudo",
  on_the_job: "On-the-job",
};

const LEVEL_OPTIONS = [
  { value: "", label: "Selecionar..." },
  ...Object.entries(LEVELS).map(([k, v]) => ({ value: k, label: v.label })),
];

const STATUS_OPTIONS = Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }));

const TRAINING_TYPE_OPTIONS = [
  { value: "", label: "Selecionar..." },
  ...Object.entries(TRAINING_TYPES).map(([k, v]) => ({ value: k, label: v })),
];

export default function CompetencesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CompetenceFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateForm = (field: keyof CompetenceFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchData = useCallback(() => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set("status", filterStatus);
    if (filterRole) qs.set("role", filterRole);
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/competences${qsStr}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([compRes, projRes]) => {
        setCompetences(compRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId, filterStatus, filterRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: Competence) => {
    setEditingId(item.id);
    setForm({
      role: item.role,
      required: item.requiredCompetence,
      level: item.currentLevel || "",
      action: item.trainingAction || "",
      type: item.trainingType || "",
      evidence: item.evidence || "",
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",
      notes: item.notes || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.role.trim() || !form.required.trim()) { toast.error("Função e competência são obrigatórios"); return; }
    setSaving(true);
    try {
      const payload = {
        role: form.role,
        requiredCompetence: form.required,
        currentLevel: form.level || null,
        trainingAction: form.action || null,
        trainingType: form.type || null,
        evidence: form.evidence || null,
        dueDate: form.dueDate || null,
        notes: form.notes || null,
        status: form.status,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/competences/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/competences`;
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

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/competences/${itemToDelete}`, { method: "DELETE" });
      toast.success("Excluído");
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
    finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const uniqueRoles = Array.from(new Set(competences.map((c) => c.role)));

  const filterRoleOptions = [
    { value: "", label: "Todas" },
    ...uniqueRoles.map((r) => ({ value: r, label: r })),
  ];

  const stats = {
    total: competences.length,
    identified: competences.filter((c) => c.status === "identified").length,
    planned: competences.filter((c) => c.status === "planned").length,
    inProgress: competences.filter((c) => c.status === "in_progress").length,
    completed: competences.filter((c) => ["completed", "verified"].includes(c.status)).length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Competências" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Gestão de Competências</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 cláusula 7.2</p>
        </div>
        {can("competence", "create") && (
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
            { label: "Planejadas", value: stats.planned, color: "text-brand" },
            { label: "Em Andamento", value: stats.inProgress, color: "text-warning" },
            { label: "Concluídas", value: stats.completed, color: "text-success-fg" },
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
          {["", "identified", "planned", "in_progress", "completed", "verified"].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setLoading(true); }}
              className={`px-2.5 py-1 rounded-button text-caption-1 transition-colors ${filterStatus === s ? "bg-brand text-white" : "bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary"}`}
            >
              {s === "" ? "Todos" : STATUSES[s]?.label}
            </button>
          ))}
        </div>
        {uniqueRoles.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-body-2 text-foreground-tertiary">Função:</span>
            <Select
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setLoading(true); }}
              options={filterRoleOptions}
              className="h-8 !w-auto text-caption-1"
            />
          </div>
        )}
      </div>

      {loading ? (
        <CardSkeleton />
      ) : competences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhuma competência registrada</p>
            <p className="text-body-2 text-foreground-secondary">Identifique as competências necessárias para o SGSI</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke-secondary">
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Função</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Competência</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Nível</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Ação</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Tipo</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Prazo</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {competences.map((comp) => (
                  <tr key={comp.id} className="border-b border-stroke-secondary last:border-0 hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3 text-body-2 font-medium text-foreground-primary">{comp.role}</td>
                    <td className="px-4 py-3">
                      <p className="text-body-2 text-foreground-primary">{comp.requiredCompetence}</p>
                      {comp.responsible && <p className="text-caption-1 text-foreground-tertiary">{comp.responsible.name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {comp.currentLevel ? (
                        <Badge variant={LEVELS[comp.currentLevel]?.color}>{LEVELS[comp.currentLevel]?.label}</Badge>
                      ) : <span className="text-caption-1 text-foreground-tertiary">—</span>}
                    </td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary max-w-[200px] truncate">{comp.trainingAction || "—"}</td>
                    <td className="px-4 py-3">
                      {comp.trainingType ? (
                        <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{TRAINING_TYPES[comp.trainingType] || comp.trainingType}</Badge>
                      ) : <span className="text-caption-1 text-foreground-tertiary">—</span>}
                    </td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">
                      {comp.dueDate ? formatDate(comp.dueDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUSES[comp.status]?.color}>{STATUSES[comp.status]?.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can("competence", "update") && (
                          <button onClick={() => openEdit(comp)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {can("competence", "delete") && (
                          <button onClick={() => { setItemToDelete(comp.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
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
        title={`${editingId ? "Editar" : "Nova"} Competência`}
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Função/Cargo *</label>
              <Input value={form.role} onChange={(e) => updateForm("role", e.target.value)} placeholder="Ex: Analista de SI" />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Nível Atual</label>
              <Select value={form.level} onChange={(e) => updateForm("level", e.target.value)} options={LEVEL_OPTIONS} />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Competência Requerida *</label>
            <Input value={form.required} onChange={(e) => updateForm("required", e.target.value)} placeholder="Ex: Gestão de Incidentes de Segurança" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Ação de Treinamento</label>
              <Input value={form.action} onChange={(e) => updateForm("action", e.target.value)} placeholder="Ex: Curso de resposta a incidentes" />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Tipo de Treinamento</label>
              <Select value={form.type} onChange={(e) => updateForm("type", e.target.value)} options={TRAINING_TYPE_OPTIONS} />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Evidência</label>
            <Input value={form.evidence} onChange={(e) => updateForm("evidence", e.target.value)} placeholder="Ex: Certificado, lista de presença..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Prazo</label>
              <Input type="date" value={form.dueDate} onChange={(e) => updateForm("dueDate", e.target.value)} />
            </div>
            {editingId && (
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                <Select value={form.status} onChange={(e) => updateForm("status", e.target.value)} options={STATUS_OPTIONS} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Observações</label>
            <Textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} className="h-16 resize-none" />
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
        title="Excluir competência"
        description="Tem certeza que deseja excluir esta competência? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
