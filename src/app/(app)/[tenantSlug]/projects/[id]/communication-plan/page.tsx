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
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Pencil, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { CommunicationPlan } from "@/types";

const FREQUENCIES: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  quarterly: "Trimestral",
  semi_annual: "Semestral",
  annual: "Anual",
  on_event: "Por Evento",
};

const FREQUENCY_OPTIONS = Object.entries(FREQUENCIES).map(([value, label]) => ({ value, label }));

const METHODS: Record<string, string> = {
  email: "E-mail",
  meeting: "Reunião",
  report: "Relatório",
  intranet: "Intranet",
  training: "Treinamento",
  newsletter: "Newsletter",
  other: "Outro",
};

const METHOD_OPTIONS = Object.entries(METHODS).map(([value, label]) => ({ value, label }));

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-success-bg text-success-fg" },
  inactive: { label: "Inativo", color: "bg-surface-tertiary text-foreground-secondary" },
};

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

interface CommPlanFormData {
  topic: string;
  audience: string;
  frequency: string;
  method: string;
  notes: string;
  status: string;
}

const INITIAL_FORM: CommPlanFormData = {
  topic: "",
  audience: "",
  frequency: "monthly",
  method: "email",
  notes: "",
  status: "active",
};

export default function CommunicationPlanPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [plans, setPlans] = useState<CommunicationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CommPlanFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const updateForm = (field: keyof CommPlanFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const fetchData = useCallback(() => {
    const statusParam = filterStatus ? `?status=${filterStatus}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/communication-plan${statusParam}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([plansRes, projRes]) => {
        setPlans(plansRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
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
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: CommunicationPlan) => {
    setEditingId(item.id);
    setForm({
      topic: item.topic,
      audience: item.audience,
      frequency: item.frequency,
      method: item.method,
      notes: item.notes || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.topic.trim() || !form.audience.trim()) { toast.error("Tópico e público-alvo são obrigatórios"); return; }
    setSaving(true);
    try {
      const payload = {
        topic: form.topic,
        audience: form.audience,
        frequency: form.frequency,
        method: form.method,
        notes: form.notes || null,
        status: form.status,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/communication-plan/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/communication-plan`;
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
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/communication-plan/${id}`, { method: "DELETE" });
      toast.success("Excluído");
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Comunicação" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Plano de Comunicação</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 cláusula 7.4</p>
        </div>
        {can("communicationPlan", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Novo
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {["", "active", "inactive"].map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setLoading(true); }}
            className={`px-3 py-1.5 rounded-button text-body-2 transition-colors ${filterStatus === s ? "bg-brand text-white" : "bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary"}`}
          >
            {s === "" ? "Todos" : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <CardSkeleton />
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhum plano de comunicação</p>
            <p className="text-body-2 text-foreground-secondary">Defina como, quando e para quem comunicar</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke-secondary">
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Tópico</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Público-Alvo</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Frequência</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Método</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Responsável</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-stroke-secondary last:border-0 hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-body-2 font-medium text-foreground-primary">{plan.topic}</p>
                      {plan.notes && <p className="text-caption-1 text-foreground-tertiary truncate max-w-[200px]">{plan.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{plan.audience}</td>
                    <td className="px-4 py-3"><Badge className="text-caption-2 bg-brand-light text-brand">{FREQUENCIES[plan.frequency] || plan.frequency}</Badge></td>
                    <td className="px-4 py-3"><Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{METHODS[plan.method] || plan.method}</Badge></td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{plan.responsible?.name || "—"}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS_CONFIG[plan.status]?.color}>{STATUS_CONFIG[plan.status]?.label}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can("communicationPlan", "update") && (
                          <button onClick={() => openEdit(plan)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {can("communicationPlan", "delete") && (
                          <button onClick={() => { setItemToDelete(plan.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
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
        title={`${editingId ? "Editar" : "Novo"} Plano de Comunicação`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Tópico *</label>
            <Input value={form.topic} onChange={(e) => updateForm("topic", e.target.value)} placeholder="Ex: Política de Segurança da Informação" />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Público-Alvo *</label>
            <Input value={form.audience} onChange={(e) => updateForm("audience", e.target.value)} placeholder="Ex: Todos os colaboradores" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Frequência</label>
              <Select value={form.frequency} onChange={(e) => updateForm("frequency", e.target.value)} options={FREQUENCY_OPTIONS} />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Método</label>
              <Select value={form.method} onChange={(e) => updateForm("method", e.target.value)} options={METHOD_OPTIONS} />
            </div>
          </div>
          {editingId && (
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
              <Select value={form.status} onChange={(e) => updateForm("status", e.target.value)} options={STATUS_OPTIONS} />
            </div>
          )}
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Observações</label>
            <Textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} className="min-h-[64px]" placeholder="Notas adicionais..." />
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
        title="Excluir plano de comunicação"
        description="Tem certeza que deseja excluir este plano de comunicação? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => {
          if (itemToDelete) {
            handleDelete(itemToDelete);
          }
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}
