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
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, X, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { Supplier } from "@/types";

const STATUSES: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-success-bg text-success-fg" },
  under_review: { label: "Em Revisão", color: "bg-warning-bg text-warning-fg" },
  suspended: { label: "Suspenso", color: "bg-danger-bg text-danger-fg" },
  terminated: { label: "Encerrado", color: "bg-surface-tertiary text-foreground-secondary" },
};

const TYPES: Record<string, string> = {
  cloud_provider: "Provedor Cloud",
  saas: "SaaS",
  outsourcing: "Outsourcing",
  consulting: "Consultoria",
  data_processor: "Processador de Dados",
  infrastructure: "Infraestrutura",
  other: "Outro",
};

const RISK_LEVELS: Record<string, { label: string; color: string }> = {
  low: { label: "Baixo", color: "bg-surface-tertiary text-foreground-tertiary" },
  medium: { label: "Médio", color: "bg-warning-bg text-warning-fg" },
  high: { label: "Alto", color: "bg-brand-light text-brand" },
  critical: { label: "Crítico", color: "bg-danger-bg text-danger-fg" },
};

const CATEGORIES: Record<string, string> = {
  critical: "Crítico",
  important: "Importante",
  standard: "Padrão",
};

export default function SuppliersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRiskLevel, setFilterRiskLevel] = useState("");
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCnpj, setFormCnpj] = useState("");
  const [formContactName, setFormContactName] = useState("");
  const [formContactEmail, setFormContactEmail] = useState("");
  const [formContactPhone, setFormContactPhone] = useState("");
  const [formType, setFormType] = useState("other");
  const [formCategory, setFormCategory] = useState("");
  const [formServicesProvided, setFormServicesProvided] = useState("");
  const [formDataAccess, setFormDataAccess] = useState("none");
  const [formContractStartDate, setFormContractStartDate] = useState("");
  const [formContractEndDate, setFormContractEndDate] = useState("");
  const [formSlaDetails, setFormSlaDetails] = useState("");
  const [formSecurityRequirements, setFormSecurityRequirements] = useState("");
  const [formRiskLevel, setFormRiskLevel] = useState("medium");
  const [formResponsibleId, setFormResponsibleId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set("status", filterStatus);
    if (filterType) qs.set("type", filterType);
    if (filterRiskLevel) qs.set("riskLevel", filterRiskLevel);
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/suppliers${qsStr}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([supRes, projRes]) => {
        setSuppliers(supRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
        setMembers(projRes.data?.members?.map((m: { user: { id: string; name: string } }) => m.user) || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId, filterStatus, filterType, filterRiskLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormCnpj("");
    setFormContactName("");
    setFormContactEmail("");
    setFormContactPhone("");
    setFormType("other");
    setFormCategory("");
    setFormServicesProvided("");
    setFormDataAccess("none");
    setFormContractStartDate("");
    setFormContractEndDate("");
    setFormSlaDetails("");
    setFormSecurityRequirements("");
    setFormRiskLevel("medium");
    setFormResponsibleId("");
    setFormNotes("");
    setFormStatus("active");
  };

  const openEdit = (item: Supplier) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCnpj(item.cnpj || "");
    setFormContactName(item.contactName || "");
    setFormContactEmail(item.contactEmail || "");
    setFormContactPhone(item.contactPhone || "");
    setFormType(item.type);
    setFormCategory(item.category || "");
    setFormServicesProvided(item.servicesProvided || "");
    setFormDataAccess(item.dataAccess || "none");
    setFormContractStartDate(item.contractStartDate ? new Date(item.contractStartDate).toISOString().split("T")[0] : "");
    setFormContractEndDate(item.contractEndDate ? new Date(item.contractEndDate).toISOString().split("T")[0] : "");
    setFormSlaDetails(item.slaDetails || "");
    setFormSecurityRequirements(item.securityRequirements || "");
    setFormRiskLevel(item.riskLevel);
    setFormResponsibleId(item.responsibleId || "");
    setFormNotes(item.notes || "");
    setFormStatus(item.status);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const payload = {
        name: formName,
        cnpj: formCnpj || null,
        contactName: formContactName || null,
        contactEmail: formContactEmail || null,
        contactPhone: formContactPhone || null,
        type: formType,
        category: formCategory || null,
        servicesProvided: formServicesProvided || null,
        dataAccess: formDataAccess || null,
        contractStartDate: formContractStartDate || null,
        contractEndDate: formContractEndDate || null,
        slaDetails: formSlaDetails || null,
        securityRequirements: formSecurityRequirements || null,
        riskLevel: formRiskLevel,
        responsibleId: formResponsibleId || null,
        notes: formNotes || null,
        status: formStatus,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/suppliers/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/suppliers`;
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
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/suppliers/${id}`, { method: "DELETE" });
      toast.success("Excluído");
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
    finally { setDeleting(false); }
  };

  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === "active").length,
    critical: suppliers.filter((s) => s.riskLevel === "critical").length,
    nextAssessment: suppliers.filter((s) => s.nextAssessmentDate).length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Fornecedores" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Gestão de Fornecedores</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 A.5.19-A.5.23</p>
        </div>
        {can("supplier", "create") && (
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
            { label: "Críticos", value: stats.critical, color: "text-danger-fg" },
            { label: "Próxima Avaliação", value: stats.nextAssessment, color: "text-foreground-secondary" },
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
          {["", "active", "under_review", "suspended", "terminated"].map((s) => (
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
          value={filterRiskLevel}
          onChange={(e) => { setFilterRiskLevel(e.target.value); setLoading(true); }}
          options={[{ value: "", label: "Todos riscos" }, ...Object.entries(RISK_LEVELS).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
      </div>

      {loading ? (
        <CardSkeleton />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nenhum fornecedor cadastrado"
          description="Registre e avalie fornecedores críticos"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke-secondary">
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Código</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Nome</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Tipo</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Categoria</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Risco</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Serviços</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Contrato até</th>
                  <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-4 py-3">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="border-b border-stroke-secondary last:border-0 hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3 text-body-2 font-mono text-foreground-secondary">{sup.code}</td>
                    <td className="px-4 py-3">
                      <p className="text-body-2 font-medium text-foreground-primary">{sup.name}</p>
                      {sup.contactName && (
                        <p className="text-caption-1 text-foreground-tertiary mt-0.5">{sup.contactName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{TYPES[sup.type] || sup.type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {sup.category ? (
                        <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{CATEGORIES[sup.category] || sup.category}</Badge>
                      ) : <span className="text-caption-1 text-foreground-tertiary">&mdash;</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={RISK_LEVELS[sup.riskLevel]?.color}>{RISK_LEVELS[sup.riskLevel]?.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary max-w-[200px] truncate">{sup.servicesProvided || "\u2014"}</td>
                    <td className="px-4 py-3 text-body-2 text-foreground-secondary">{sup.contractEndDate ? formatDate(sup.contractEndDate) : "\u2014"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUSES[sup.status]?.color}>{STATUSES[sup.status]?.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can("supplier", "update") && (
                          <button onClick={() => openEdit(sup)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {can("supplier", "delete") && (
                          <button onClick={() => { setItemToDelete(sup.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
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
                <h2 className="text-title-3 text-foreground-primary">{editingId ? "Editar" : "Novo"} Fornecedor</h2>
                <button onClick={resetForm} className="text-foreground-tertiary hover:text-foreground-primary"><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Nome *</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: AWS, Microsoft Azure" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">CNPJ</label>
                <Input value={formCnpj} onChange={(e) => setFormCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Contato - Nome</label>
                  <Input value={formContactName} onChange={(e) => setFormContactName(e.target.value)} placeholder="Nome do contato" />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Contato - Email</label>
                  <Input type="email" value={formContactEmail} onChange={(e) => setFormContactEmail(e.target.value)} placeholder="email@fornecedor.com" />
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Contato - Telefone</label>
                <Input value={formContactPhone} onChange={(e) => setFormContactPhone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Tipo *</label>
                  <Select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    options={Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
                  <Select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    options={[{ value: "", label: "Selecionar..." }, ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v }))]}
                  />
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Serviços Fornecidos</label>
                <Textarea value={formServicesProvided} onChange={(e) => setFormServicesProvided(e.target.value)} rows={2} placeholder="Descreva os serviços prestados" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Acesso a Dados</label>
                <Select
                  value={formDataAccess}
                  onChange={(e) => setFormDataAccess(e.target.value)}
                  options={[
                    { value: "none", label: "Nenhum" },
                    { value: "limited", label: "Limitado" },
                    { value: "full", label: "Total" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Início do Contrato</label>
                  <Input type="date" value={formContractStartDate} onChange={(e) => setFormContractStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Fim do Contrato</label>
                  <Input type="date" value={formContractEndDate} onChange={(e) => setFormContractEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Detalhes do SLA</label>
                <Textarea value={formSlaDetails} onChange={(e) => setFormSlaDetails(e.target.value)} rows={2} placeholder="SLA acordado com o fornecedor" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Requisitos de Segurança</label>
                <Textarea value={formSecurityRequirements} onChange={(e) => setFormSecurityRequirements(e.target.value)} rows={2} placeholder="Requisitos de segurança exigidos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Nível de Risco</label>
                  <Select
                    value={formRiskLevel}
                    onChange={(e) => setFormRiskLevel(e.target.value)}
                    options={Object.entries(RISK_LEVELS).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Responsável</label>
                  <Select
                    value={formResponsibleId}
                    onChange={(e) => setFormResponsibleId(e.target.value)}
                    options={[{ value: "", label: "Selecionar..." }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
                  />
                </div>
              </div>
              {editingId && (
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                  <Select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    options={Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                </div>
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
        title="Excluir este fornecedor?"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => handleDelete(itemToDelete!)}
        loading={deleting}
      />
    </div>
  );
}
