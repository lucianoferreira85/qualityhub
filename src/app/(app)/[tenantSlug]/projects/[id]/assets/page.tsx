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
import { Plus, Pencil, Trash2, Server } from "lucide-react";
import { toast } from "sonner";
import type { InformationAsset } from "@/types";

const STATUSES: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-success-bg text-success-fg" },
  inactive: { label: "Inativo", color: "bg-surface-tertiary text-foreground-secondary" },
  decommissioned: { label: "Descomissionado", color: "bg-danger-bg text-danger-fg" },
  under_review: { label: "Em Revisão", color: "bg-warning-bg text-warning-fg" },
};

const TYPES: Record<string, string> = {
  hardware: "Hardware",
  software: "Software",
  data: "Dados",
  service: "Serviço",
  people: "Pessoas",
  facility: "Instalação",
  network: "Rede",
  other: "Outro",
};

const CLASSIFICATIONS: Record<string, { label: string; color: string }> = {
  public: { label: "Público", color: "bg-success-bg text-success-fg" },
  internal: { label: "Interno", color: "bg-brand-light text-brand" },
  confidential: { label: "Confidencial", color: "bg-warning-bg text-warning-fg" },
  restricted: { label: "Restrito", color: "bg-danger-bg text-danger-fg" },
};

const CRITICALITIES: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-surface-tertiary text-foreground-tertiary" },
  medium: { label: "Média", color: "bg-warning-bg text-warning-fg" },
  high: { label: "Alta", color: "bg-brand-light text-brand" },
  critical: { label: "Crítica", color: "bg-danger-bg text-danger-fg" },
};

const CATEGORIES: Record<string, string> = {
  primary: "Primário",
  support: "Suporte",
  infrastructure: "Infraestrutura",
};

interface AssetFormData {
  name: string;
  description: string;
  type: string;
  category: string;
  owner: string;
  custodian: string;
  location: string;
  classification: string;
  criticality: string;
  businessValue: string;
  acquisitionDate: string;
  endOfLifeDate: string;
  lastReviewDate: string;
  nextReviewDate: string;
  responsibleId: string;
  notes: string;
  status: string;
}

const INITIAL_FORM: AssetFormData = {
  name: "", description: "", type: "hardware", category: "", owner: "", custodian: "",
  location: "", classification: "internal", criticality: "medium", businessValue: "",
  acquisitionDate: "", endOfLifeDate: "", lastReviewDate: "", nextReviewDate: "",
  responsibleId: "", notes: "", status: "active",
};

export default function AssetsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [assets, setAssets] = useState<InformationAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterClassification, setFilterClassification] = useState("");
  const [filterCriticality, setFilterCriticality] = useState("");
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssetFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const updateForm = <K extends keyof AssetFormData>(key: K, value: AssetFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchData = useCallback(() => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set("status", filterStatus);
    if (filterType) qs.set("type", filterType);
    if (filterClassification) qs.set("classification", filterClassification);
    if (filterCriticality) qs.set("criticality", filterCriticality);
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/assets${qsStr}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([assetsRes, projRes]) => {
        setAssets(assetsRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
        setMembers(projRes.data?.members?.map((m: { user: { id: string; name: string } }) => m.user) || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId, filterStatus, filterType, filterClassification, filterCriticality]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: InformationAsset) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      type: item.type,
      category: item.category || "",
      owner: item.owner || "",
      custodian: item.custodian || "",
      location: item.location || "",
      classification: item.classification,
      criticality: item.criticality,
      businessValue: item.businessValue || "",
      acquisitionDate: item.acquisitionDate ? new Date(item.acquisitionDate).toISOString().split("T")[0] : "",
      endOfLifeDate: item.endOfLifeDate ? new Date(item.endOfLifeDate).toISOString().split("T")[0] : "",
      lastReviewDate: item.lastReviewDate ? new Date(item.lastReviewDate).toISOString().split("T")[0] : "",
      nextReviewDate: item.nextReviewDate ? new Date(item.nextReviewDate).toISOString().split("T")[0] : "",
      responsibleId: item.responsibleId || "",
      notes: item.notes || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        type: form.type,
        category: form.category || null,
        owner: form.owner || null,
        custodian: form.custodian || null,
        location: form.location || null,
        classification: form.classification,
        criticality: form.criticality,
        businessValue: form.businessValue || null,
        acquisitionDate: form.acquisitionDate || null,
        endOfLifeDate: form.endOfLifeDate || null,
        lastReviewDate: form.lastReviewDate || null,
        nextReviewDate: form.nextReviewDate || null,
        responsibleId: form.responsibleId || null,
        notes: form.notes || null,
        status: form.status,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/assets/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/assets`;
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
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/assets/${id}`, { method: "DELETE" });
      toast.success("Excluído");
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
    finally { setDeleting(false); }
  };

  const stats = {
    total: assets.length,
    active: assets.filter((a) => a.status === "active").length,
    underReview: assets.filter((a) => a.status === "under_review").length,
    decommissioned: assets.filter((a) => a.status === "decommissioned").length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Ativos de Informação" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Ativos de Informação</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 A.5.9-A.5.11</p>
        </div>
        {can("informationAsset", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Novo
          </Button>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground-primary" },
            { label: "Ativos", value: stats.active, color: "text-success-fg" },
            { label: "Em Revisão", value: stats.underReview, color: "text-warning" },
            { label: "Descomissionados", value: stats.decommissioned, color: "text-danger-fg" },
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
          {["", "active", "inactive", "under_review", "decommissioned"].map((s) => (
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
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setLoading(true); }}
          options={[{ value: "", label: "Todos tipos" }, ...Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v }))]}
        />
        <Select
          value={filterClassification}
          onChange={(e) => { setFilterClassification(e.target.value); setLoading(true); }}
          options={[{ value: "", label: "Todas classificações" }, ...Object.entries(CLASSIFICATIONS).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
        <Select
          value={filterCriticality}
          onChange={(e) => { setFilterCriticality(e.target.value); setLoading(true); }}
          options={[{ value: "", label: "Todas criticidades" }, ...Object.entries(CRITICALITIES).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
      </div>

      {loading ? (
        <CardSkeleton />
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhum ativo de informação</p>
            <p className="text-body-2 text-foreground-secondary">Registre e gerencie os ativos de informação</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke-secondary">
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Código</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Nome</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Tipo</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Classificação</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Criticidade</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Proprietário</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Responsável</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-stroke-secondary last:border-0 hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3 text-body-2 font-mono text-foreground-secondary">{asset.code}</td>
                    <td className="px-4 py-3">
                      <p className="text-body-2 font-medium text-foreground-primary">{asset.name}</p>
                      {asset.description && (
                        <p className="text-caption-1 text-foreground-tertiary mt-0.5 truncate max-w-[200px]">{asset.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{TYPES[asset.type] || asset.type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CLASSIFICATIONS[asset.classification]?.color}>{CLASSIFICATIONS[asset.classification]?.label || asset.classification}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CRITICALITIES[asset.criticality]?.color}>{CRITICALITIES[asset.criticality]?.label || asset.criticality}</Badge>
                    </td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{asset.owner || "—"}</td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{asset.responsible?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUSES[asset.status]?.color}>{STATUSES[asset.status]?.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can("informationAsset", "update") && (
                          <button onClick={() => openEdit(asset)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {can("informationAsset", "delete") && (
                          <button onClick={() => { setItemToDelete(asset.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
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
        title={`${editingId ? "Editar" : "Novo"} Ativo`}
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Nome *</label>
            <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="Ex: Servidor de produção" />
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
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Proprietário</label>
              <Input value={form.owner} onChange={(e) => updateForm("owner", e.target.value)} placeholder="Nome do proprietário" />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Custodiante</label>
              <Input value={form.custodian} onChange={(e) => updateForm("custodian", e.target.value)} placeholder="Nome do custodiante" />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Localização</label>
            <Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="Ex: Datacenter principal" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Classificação *</label>
              <Select
                value={form.classification}
                onChange={(e) => updateForm("classification", e.target.value)}
                options={Object.entries(CLASSIFICATIONS).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Criticidade *</label>
              <Select
                value={form.criticality}
                onChange={(e) => updateForm("criticality", e.target.value)}
                options={Object.entries(CRITICALITIES).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Valor de Negócio</label>
            <Input value={form.businessValue} onChange={(e) => updateForm("businessValue", e.target.value)} placeholder="Ex: Suporta operações críticas de TI" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Data de Aquisição</label>
              <Input type="date" value={form.acquisitionDate} onChange={(e) => updateForm("acquisitionDate", e.target.value)} />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Fim de Vida</label>
              <Input type="date" value={form.endOfLifeDate} onChange={(e) => updateForm("endOfLifeDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Última Revisão</label>
              <Input type="date" value={form.lastReviewDate} onChange={(e) => updateForm("lastReviewDate", e.target.value)} />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Próxima Revisão</label>
              <Input type="date" value={form.nextReviewDate} onChange={(e) => updateForm("nextReviewDate", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Responsável</label>
            <Select
              value={form.responsibleId}
              onChange={(e) => updateForm("responsibleId", e.target.value)}
              options={[{ value: "", label: "Selecionar..." }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
            />
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
        title="Excluir este ativo de informação?"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => handleDelete(itemToDelete!)}
        loading={deleting}
      />
    </div>
  );
}
