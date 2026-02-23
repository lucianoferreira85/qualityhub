"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { OrganizationContext } from "@/types";

const SWOT_CONFIG = {
  strength: { label: "Forças", color: "bg-success-bg", textColor: "text-success-fg", borderColor: "border-success/30" },
  weakness: { label: "Fraquezas", color: "bg-danger-bg", textColor: "text-danger-fg", borderColor: "border-danger/30" },
  opportunity: { label: "Oportunidades", color: "bg-info-bg", textColor: "text-info", borderColor: "border-brand/30" },
  threat: { label: "Ameaças", color: "bg-warning-bg", textColor: "text-warning-fg", borderColor: "border-warning/30" },
} as const;

const CATEGORY_OPTIONS = [
  { value: "financial", label: "Financeiro" },
  { value: "technological", label: "Tecnológico" },
  { value: "legal", label: "Legal" },
  { value: "market", label: "Mercado" },
  { value: "organizational", label: "Organizacional" },
  { value: "human_resources", label: "Recursos Humanos" },
];

const IMPACT_OPTIONS = [
  { value: "high", label: "Alto" },
  { value: "medium", label: "Médio" },
  { value: "low", label: "Baixo" },
];

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: "Alto", color: "bg-danger-bg text-danger-fg" },
  medium: { label: "Médio", color: "bg-warning-bg text-warning-fg" },
  low: { label: "Baixo", color: "bg-success-bg text-success-fg" },
};

interface ContextFormData {
  type: string;
  title: string;
  description: string;
  category: string;
  impact: string;
}

const INITIAL_FORM: ContextFormData = {
  type: "strength",
  title: "",
  description: "",
  category: "",
  impact: "",
};

export default function ProjectContextPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [contexts, setContexts] = useState<OrganizationContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContextFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const updateForm = (field: keyof ContextFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/contexts?projectId=${projectId}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([ctxRes, projRes]) => {
        setContexts(ctxRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openCreate = (type: string) => {
    resetForm();
    setForm({ ...INITIAL_FORM, type });
    setShowForm(true);
  };

  const openEdit = (item: OrganizationContext) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      description: item.description || "",
      category: item.category || "",
      impact: item.impact || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        impact: form.impact || null,
        projectId,
      };

      const url = editingId
        ? `/api/tenants/${tenant.slug}/contexts/${editingId}`
        : `/api/tenants/${tenant.slug}/contexts`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar");
      toast.success(editingId ? "Atualizado" : "Criado com sucesso");
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/tenants/${tenant.slug}/contexts/${deleteTargetId}`, { method: "DELETE" });
      toast.success("Excluído");
      fetchData();
    } catch {
      toast.error("Erro ao excluir");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const getItemsByType = (type: string) => contexts.filter((c) => c.type === type);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Contexto" },
      ]} />

      <div>
        <h1 className="text-title-1 text-foreground-primary">Análise de Contexto</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          SWOT do projeto - ISO 27001 cláusula 4.1
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(Object.entries(SWOT_CONFIG) as [string, typeof SWOT_CONFIG.strength][]).map(([type, config]) => (
          <Card key={type} className={`border ${config.borderColor}`}>
            <CardHeader className={`${config.color} rounded-t-card`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-title-3 ${config.textColor}`}>{config.label}</h2>
                {can("context", "create") && (
                  <Button size="sm" variant="outline" onClick={() => openCreate(type)} className={config.textColor}>
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <CardSkeleton key={i} lines={2} />)}
                </div>
              ) : getItemsByType(type).length === 0 ? (
                <p className="text-body-2 text-foreground-tertiary py-4 text-center">Nenhum item</p>
              ) : (
                <div className="space-y-2">
                  {getItemsByType(type).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-button border border-stroke-secondary hover:bg-surface-secondary transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-body-1 font-medium text-foreground-primary">{item.title}</p>
                        {item.description && (
                          <p className="text-body-2 text-foreground-secondary mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          {item.category && (
                            <Badge className="text-caption-2">
                              {CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label || item.category}
                            </Badge>
                          )}
                          {item.impact && (
                            <Badge variant={IMPACT_CONFIG[item.impact]?.color} className="text-caption-2">
                              {IMPACT_CONFIG[item.impact]?.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {(can("context", "update") || can("context", "delete")) && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {can("context", "update") && (
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {can("context", "delete") && (
                            <button onClick={() => { setDeleteTargetId(item.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={showForm}
        onOpenChange={(open) => { if (!open) resetForm(); }}
        title={`${editingId ? "Editar" : "Novo"} - ${SWOT_CONFIG[form.type as keyof typeof SWOT_CONFIG]?.label}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
            <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
            <Textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              className="h-20 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
              <Select
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                options={CATEGORY_OPTIONS}
                placeholder="Selecionar..."
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Impacto</label>
              <Select
                value={form.impact}
                onChange={(e) => updateForm("impact", e.target.value)}
                options={IMPACT_OPTIONS}
                placeholder="Selecionar..."
              />
            </div>
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
        title="Excluir este item?"
        description="Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </div>
  );
}
