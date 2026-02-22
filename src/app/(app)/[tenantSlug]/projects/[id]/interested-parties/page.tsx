"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Plus, X, Pencil, Trash2, Search } from "lucide-react";
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

const STRATEGY_CONFIG: Record<string, { label: string }> = {
  manage_closely: { label: "Gerenciar de Perto" },
  keep_satisfied: { label: "Manter Satisfeito" },
  keep_informed: { label: "Manter Informado" },
  monitor: { label: "Monitorar" },
};

export default function ProjectInterestedPartiesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [parties, setParties] = useState<InterestedParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("internal");
  const [formCategory, setFormCategory] = useState("");
  const [formNeeds, setFormNeeds] = useState("");
  const [formRequirements, setFormRequirements] = useState("");
  const [formInfluence, setFormInfluence] = useState("");
  const [formInterest, setFormInterest] = useState("");
  const [formStrategy, setFormStrategy] = useState("");
  const [formMonitoring, setFormMonitoring] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/interested-parties?projectId=${projectId}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([partiesRes, projRes]) => {
        setParties(partiesRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = parties.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormType("internal");
    setFormCategory("");
    setFormNeeds("");
    setFormRequirements("");
    setFormInfluence("");
    setFormInterest("");
    setFormStrategy("");
    setFormMonitoring("");
  };

  const openEdit = (item: InterestedParty) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormType(item.type);
    setFormCategory(item.category || "");
    setFormNeeds(item.needsExpectations || "");
    setFormRequirements(item.requirements || "");
    setFormInfluence(item.influence || "");
    setFormInterest(item.interest || "");
    setFormStrategy(item.strategy || "");
    setFormMonitoring(item.monitoringMethod || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const payload = {
        name: formName, type: formType,
        category: formCategory || null,
        needsExpectations: formNeeds || null,
        requirements: formRequirements || null,
        influence: formInfluence || null,
        interest: formInterest || null,
        strategy: formStrategy || null,
        monitoringMethod: formMonitoring || null,
        projectId,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/interested-parties/${editingId}`
        : `/api/tenants/${tenant.slug}/interested-parties`;
      const res = await fetch(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      toast.success(editingId ? "Atualizado" : "Criado");
      resetForm();
      fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir?")) return;
    try { await fetch(`/api/tenants/${tenant.slug}/interested-parties/${id}`, { method: "DELETE" }); toast.success("Excluído"); fetchData(); }
    catch { toast.error("Erro ao excluir"); }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Partes Interessadas" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Partes Interessadas</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 cláusula 4.2</p>
        </div>
        {can("interestedParty", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Nova
          </Button>
        )}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <Card key={i}><CardContent className="p-4"><div className="animate-pulse h-12 bg-surface-tertiary rounded" /></CardContent></Card>)
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center"><p className="text-body-1 text-foreground-tertiary">Nenhuma parte interessada</p></CardContent></Card>
        ) : (
          filtered.map((party) => (
            <Card key={party.id} className="hover:shadow-card-glow transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-body-1 font-medium text-foreground-primary">{party.name}</p>
                      <Badge variant={TYPE_CONFIG[party.type]?.color}>{TYPE_CONFIG[party.type]?.label}</Badge>
                      {party.category && <Badge className="text-caption-2">{CATEGORIES.find((c) => c.value === party.category)?.label}</Badge>}
                    </div>
                    {party.needsExpectations && <p className="text-body-2 text-foreground-secondary"><span className="font-medium">Necessidades:</span> {party.needsExpectations}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      {party.influence && <span className="text-caption-1 text-foreground-tertiary">Influência: <Badge variant={LEVELS[party.influence]?.color} className="text-caption-2">{LEVELS[party.influence]?.label}</Badge></span>}
                      {party.interest && <span className="text-caption-1 text-foreground-tertiary">Interesse: <Badge variant={LEVELS[party.interest]?.color} className="text-caption-2">{LEVELS[party.interest]?.label}</Badge></span>}
                      {party.strategy && <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{STRATEGY_CONFIG[party.strategy]?.label}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {can("interestedParty", "update") && <button onClick={() => openEdit(party)} className="p-2 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary"><Pencil className="h-4 w-4" /></button>}
                    {can("interestedParty", "delete") && <button onClick={() => handleDelete(party.id)} className="p-2 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-title-3 text-foreground-primary">{editingId ? "Editar" : "Nova"} Parte Interessada</h2>
                <button onClick={resetForm} className="text-foreground-tertiary hover:text-foreground-primary"><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-body-2 font-medium text-foreground-primary mb-1">Nome *</label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
                <div><label className="block text-body-2 font-medium text-foreground-primary mb-1">Tipo *</label><select value={formType} onChange={(e) => setFormType(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand"><option value="internal">Interno</option><option value="external">Externo</option></select></div>
              </div>
              <div><label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label><select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand"><option value="">Selecionar...</option>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className="block text-body-2 font-medium text-foreground-primary mb-1">Necessidades</label><textarea value={formNeeds} onChange={(e) => setFormNeeds(e.target.value)} className="w-full h-16 px-3 py-2 rounded-input border border-stroke-primary bg-surface-primary text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand resize-none" /></div>
              <div><label className="block text-body-2 font-medium text-foreground-primary mb-1">Requisitos</label><textarea value={formRequirements} onChange={(e) => setFormRequirements(e.target.value)} className="w-full h-16 px-3 py-2 rounded-input border border-stroke-primary bg-surface-primary text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand resize-none" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-body-2 font-medium text-foreground-primary mb-1">Influência</label><select value={formInfluence} onChange={(e) => setFormInfluence(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand"><option value="">Sel...</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select></div>
                <div><label className="block text-body-2 font-medium text-foreground-primary mb-1">Interesse</label><select value={formInterest} onChange={(e) => setFormInterest(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand"><option value="">Sel...</option><option value="high">Alto</option><option value="medium">Médio</option><option value="low">Baixo</option></select></div>
                <div><label className="block text-body-2 font-medium text-foreground-primary mb-1">Estratégia</label><select value={formStrategy} onChange={(e) => setFormStrategy(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand"><option value="">Sel...</option>{Object.entries(STRATEGY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              </div>
              <div><label className="block text-body-2 font-medium text-foreground-primary mb-1">Método de Monitoramento</label><Input value={formMonitoring} onChange={(e) => setFormMonitoring(e.target.value)} /></div>
              <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={resetForm}>Cancelar</Button><Button onClick={handleSave} loading={saving}>{editingId ? "Salvar" : "Criar"}</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
