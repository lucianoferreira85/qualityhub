"use client";

import { useEffect, useState, useCallback } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Modal } from "@/components/ui/modal";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import type { InterestedParty } from "@/types";

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  internal: { label: "Interno", color: "bg-brand-light text-brand" },
  external: { label: "Externo", color: "bg-warning-bg text-warning-fg" },
};

const CATEGORIES = [
  { value: "employee", label: "Colaborador" },
  { value: "customer", label: "Cliente" },
  { value: "supplier", label: "Fornecedor" },
  { value: "regulator", label: "Regulador" },
  { value: "shareholder", label: "Acionista" },
  { value: "community", label: "Comunidade" },
  { value: "partner", label: "Parceiro" },
];

const LEVELS: Record<string, { label: string; color: string }> = {
  high: { label: "Alto", color: "bg-danger-bg text-danger-fg" },
  medium: { label: "Médio", color: "bg-warning-bg text-warning-fg" },
  low: { label: "Baixo", color: "bg-success-bg text-success-fg" },
};

const STRATEGY_CONFIG: Record<string, { label: string; description: string }> = {
  manage_closely: { label: "Gerenciar de Perto", description: "Alta influência + Alto interesse" },
  keep_satisfied: { label: "Manter Satisfeito", description: "Alta influência + Baixo interesse" },
  keep_informed: { label: "Manter Informado", description: "Baixa influência + Alto interesse" },
  monitor: { label: "Monitorar", description: "Baixa influência + Baixo interesse" },
};

interface PartyFormData {
  name: string;
  type: string;
  category: string;
  needs: string;
  requirements: string;
  influence: string;
  interest: string;
  strategy: string;
  monitoring: string;
}

const INITIAL_FORM: PartyFormData = {
  name: "",
  type: "internal",
  category: "",
  needs: "",
  requirements: "",
  influence: "",
  interest: "",
  strategy: "",
  monitoring: "",
};

export default function InterestedPartiesPage() {
  const { tenant, can } = useTenant();
  const [parties, setParties] = useState<InterestedParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartyFormData>(INITIAL_FORM);
  const updateForm = (field: keyof PartyFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchParties = useCallback(() => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    fetch(`/api/tenants/${tenant.slug}/interested-parties?${params}`)
      .then((res) => res.json())
      .then((res) => setParties(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterType]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const filtered = parties.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: InterestedParty) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      type: item.type,
      category: item.category || "",
      needs: item.needsExpectations || "",
      requirements: item.requirements || "",
      influence: item.influence || "",
      interest: item.interest || "",
      strategy: item.strategy || "",
      monitoring: item.monitoringMethod || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        category: form.category || null,
        needsExpectations: form.needs || null,
        requirements: form.requirements || null,
        influence: form.influence || null,
        interest: form.interest || null,
        strategy: form.strategy || null,
        monitoringMethod: form.monitoring || null,
      };

      const url = editingId
        ? `/api/tenants/${tenant.slug}/interested-parties/${editingId}`
        : `/api/tenants/${tenant.slug}/interested-parties`;

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar");
      toast.success(editingId ? "Atualizado" : "Criado com sucesso");
      resetForm();
      fetchParties();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tenants/${tenant.slug}/interested-parties/${id}`, { method: "DELETE" });
      toast.success("Excluído");
      fetchParties();
    } catch {
      toast.error("Erro ao excluir");
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  // Influence x Interest matrix
  const matrixQuadrants = [
    { influence: "high", interest: "high", strategy: "manage_closely", label: "Gerenciar de Perto", color: "bg-danger-bg" },
    { influence: "high", interest: "low", strategy: "keep_satisfied", label: "Manter Satisfeito", color: "bg-warning-bg" },
    { influence: "low", interest: "high", strategy: "keep_informed", label: "Manter Informado", color: "bg-info-bg" },
    { influence: "low", interest: "low", strategy: "monitor", label: "Monitorar", color: "bg-surface-tertiary" },
  ];

  const getPartiesForQuadrant = (influence: string, interest: string) => {
    return parties.filter((p) => {
      const inf = p.influence || "low";
      const int = p.interest || "low";
      const infMatch = influence === "high" ? inf === "high" : (inf === "medium" || inf === "low");
      const intMatch = interest === "high" ? int === "high" : (int === "medium" || int === "low");
      return infMatch && intMatch;
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Configurações", href: `/${tenant.slug}/settings` }, { label: "Partes Interessadas" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Partes Interessadas</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gestão de partes interessadas conforme ISO 27001 cláusula 4.2
          </p>
        </div>
        {can("interestedParty", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nova Parte Interessada
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-9"
          />
        </div>
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          options={[
            { value: "", label: "Todos os tipos" },
            { value: "internal", label: "Internos" },
            { value: "external", label: "Externos" },
          ]}
        />
      </div>

      {/* Influence x Interest Matrix */}
      <Card>
        <CardHeader>
          <h2 className="text-title-3 text-foreground-primary">Matriz Influência x Interesse</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {matrixQuadrants.map((q) => (
              <div key={q.strategy} className={`${q.color} rounded-card p-4 min-h-[120px]`}>
                <p className="text-body-2 font-medium text-foreground-primary mb-2">{q.label}</p>
                <p className="text-caption-1 text-foreground-tertiary mb-3">
                  {q.influence === "high" ? "Alta" : "Baixa"} influência / {q.interest === "high" ? "Alto" : "Baixo"} interesse
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {getPartiesForQuadrant(q.influence, q.interest).map((p) => (
                    <Badge key={p.id} className="text-caption-2">{p.name}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parties List */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <CardSkeleton key={i} lines={2} />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhuma parte interessada encontrada"
            description="Cadastre partes interessadas para gerenciar stakeholders"
          />
        ) : (
          filtered.map((party) => (
            <Card key={party.id} className="hover:shadow-card-glow transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-body-1 font-medium text-foreground-primary">{party.name}</p>
                      <Badge variant={TYPE_CONFIG[party.type]?.color}>{TYPE_CONFIG[party.type]?.label}</Badge>
                      {party.category && (
                        <Badge className="text-caption-2">
                          {CATEGORIES.find((c) => c.value === party.category)?.label || party.category}
                        </Badge>
                      )}
                    </div>
                    {party.needsExpectations && (
                      <p className="text-body-2 text-foreground-secondary mt-1">
                        <span className="font-medium">Necessidades:</span> {party.needsExpectations}
                      </p>
                    )}
                    {party.requirements && (
                      <p className="text-body-2 text-foreground-secondary">
                        <span className="font-medium">Requisitos:</span> {party.requirements}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {party.influence && (
                        <span className="text-caption-1 text-foreground-tertiary">
                          Influência: <Badge variant={LEVELS[party.influence]?.color} className="text-caption-2">{LEVELS[party.influence]?.label}</Badge>
                        </span>
                      )}
                      {party.interest && (
                        <span className="text-caption-1 text-foreground-tertiary">
                          Interesse: <Badge variant={LEVELS[party.interest]?.color} className="text-caption-2">{LEVELS[party.interest]?.label}</Badge>
                        </span>
                      )}
                      {party.strategy && (
                        <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">
                          {STRATEGY_CONFIG[party.strategy]?.label || party.strategy}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {(can("interestedParty", "update") || can("interestedParty", "delete")) && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {can("interestedParty", "update") && (
                        <button onClick={() => openEdit(party)} className="p-2 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {can("interestedParty", "delete") && (
                        <button onClick={() => { setItemToDelete(party.id); setShowDeleteConfirm(true); }} className="p-2 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir parte interessada"
        description="Tem certeza que deseja excluir esta parte interessada? Esta ação não pode ser desfeita."
        variant="danger"
        onConfirm={() => {
          if (itemToDelete) handleDelete(itemToDelete);
        }}
      />

      {/* Form Modal */}
      <Modal
        open={showForm}
        onOpenChange={(open) => { if (!open) resetForm(); }}
        title={`${editingId ? "Editar" : "Nova"} Parte Interessada`}
        className="max-w-2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Nome *</label>
              <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="Nome da parte interessada" />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Tipo *</label>
              <Select
                value={form.type}
                onChange={(e) => updateForm("type", e.target.value)}
                options={[
                  { value: "internal", label: "Interno" },
                  { value: "external", label: "Externo" },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
            <Select
              value={form.category}
              onChange={(e) => updateForm("category", e.target.value)}
              options={CATEGORIES}
              placeholder="Selecionar..."
            />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Necessidades e Expectativas</label>
            <Textarea value={form.needs} onChange={(e) => updateForm("needs", e.target.value)} className="h-16 resize-none" />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Requisitos</label>
            <Textarea value={form.requirements} onChange={(e) => updateForm("requirements", e.target.value)} className="h-16 resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Influência</label>
              <Select
                value={form.influence}
                onChange={(e) => updateForm("influence", e.target.value)}
                options={[
                  { value: "high", label: "Alta" },
                  { value: "medium", label: "Média" },
                  { value: "low", label: "Baixa" },
                ]}
                placeholder="Selecionar..."
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Interesse</label>
              <Select
                value={form.interest}
                onChange={(e) => updateForm("interest", e.target.value)}
                options={[
                  { value: "high", label: "Alto" },
                  { value: "medium", label: "Médio" },
                  { value: "low", label: "Baixo" },
                ]}
                placeholder="Selecionar..."
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Estratégia</label>
              <Select
                value={form.strategy}
                onChange={(e) => updateForm("strategy", e.target.value)}
                options={Object.entries(STRATEGY_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
                placeholder="Selecionar..."
              />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Método de Monitoramento</label>
            <Input value={form.monitoring} onChange={(e) => updateForm("monitoring", e.target.value)} placeholder="Ex: Reunião mensal, pesquisa de satisfação..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editingId ? "Salvar" : "Criar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
