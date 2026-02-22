"use client";

import { useEffect, useState, useCallback } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { OrganizationContext } from "@/types";

const SWOT_CONFIG = {
  strength: { label: "Forças", color: "bg-success-bg", textColor: "text-success-fg", borderColor: "border-success/30" },
  weakness: { label: "Fraquezas", color: "bg-danger-bg", textColor: "text-danger-fg", borderColor: "border-danger/30" },
  opportunity: { label: "Oportunidades", color: "bg-info-bg", textColor: "text-info", borderColor: "border-brand/30" },
  threat: { label: "Ameaças", color: "bg-warning-bg", textColor: "text-warning-fg", borderColor: "border-warning/30" },
} as const;

const CATEGORIES = [
  { value: "financial", label: "Financeiro" },
  { value: "technological", label: "Tecnológico" },
  { value: "legal", label: "Legal" },
  { value: "market", label: "Mercado" },
  { value: "organizational", label: "Organizacional" },
  { value: "human_resources", label: "Recursos Humanos" },
];

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: "Alto", color: "bg-danger-bg text-danger-fg" },
  medium: { label: "Médio", color: "bg-warning-bg text-warning-fg" },
  low: { label: "Baixo", color: "bg-success-bg text-success-fg" },
};

export default function ContextPage() {
  const { tenant, can } = useTenant();
  const [contexts, setContexts] = useState<OrganizationContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<string>("strength");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formImpact, setFormImpact] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchContexts = useCallback(() => {
    const params = new URLSearchParams();
    if (filterCategory) params.set("category", filterCategory);
    fetch(`/api/tenants/${tenant.slug}/contexts?${params}`)
      .then((res) => res.json())
      .then((res) => setContexts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterCategory]);

  useEffect(() => {
    fetchContexts();
  }, [fetchContexts]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormDescription("");
    setFormCategory("");
    setFormImpact("");
  };

  const openCreate = (type: string) => {
    resetForm();
    setFormType(type);
    setShowForm(true);
  };

  const openEdit = (item: OrganizationContext) => {
    setEditingId(item.id);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormCategory(item.category || "");
    setFormImpact(item.impact || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: formType,
        title: formTitle,
        description: formDescription || null,
        category: formCategory || null,
        impact: formImpact || null,
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

      toast.success(editingId ? "Atualizado com sucesso" : "Criado com sucesso");
      resetForm();
      fetchContexts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este item?")) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/contexts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Excluído com sucesso");
      fetchContexts();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const getItemsByType = (type: string) => contexts.filter((c) => c.type === type);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Configurações", href: `/${tenant.slug}/settings` }, { label: "Análise de Contexto" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Análise de Contexto Organizacional</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Análise SWOT conforme ISO 27001 cláusula 4.1
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Todas categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SWOT Matrix */}
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
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-surface-tertiary rounded animate-pulse" />
                  ))}
                </div>
              ) : getItemsByType(type).length === 0 ? (
                <p className="text-body-2 text-foreground-tertiary py-4 text-center">
                  Nenhum item cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {getItemsByType(type).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-button border border-stroke-secondary hover:bg-surface-secondary transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-body-1 font-medium text-foreground-primary">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-body-2 text-foreground-secondary mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          {item.category && (
                            <Badge className="text-caption-2">
                              {CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                            </Badge>
                          )}
                          {item.impact && (
                            <Badge variant={IMPACT_CONFIG[item.impact]?.color || ""} className="text-caption-2">
                              {IMPACT_CONFIG[item.impact]?.label || item.impact}
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
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
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

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-title-3 text-foreground-primary">
                  {editingId ? "Editar Item" : "Novo Item"} - {SWOT_CONFIG[formType as keyof typeof SWOT_CONFIG]?.label}
                </h2>
                <button onClick={resetForm} className="text-foreground-tertiary hover:text-foreground-primary">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Equipe técnica qualificada" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full h-20 px-3 py-2 rounded-input border border-stroke-primary bg-surface-primary text-body-1 text-foreground-primary placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                  placeholder="Detalhes sobre o item..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Selecionar...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Impacto</label>
                  <select
                    value={formImpact}
                    onChange={(e) => setFormImpact(e.target.value)}
                    className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Selecionar...</option>
                    <option value="high">Alto</option>
                    <option value="medium">Médio</option>
                    <option value="low">Baixo</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSave} loading={saving}>
                  {editingId ? "Salvar" : "Criar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
