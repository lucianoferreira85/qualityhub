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
import { Plus, Pencil, Trash2, ScrollText, CheckCircle2, Send, ShieldCheck, Globe, Archive } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { Policy } from "@/types";

const STATUSES: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-surface-tertiary text-foreground-secondary" },
  in_review: { label: "Em Revisão", color: "bg-warning-bg text-warning-fg" },
  approved: { label: "Aprovada", color: "bg-brand-light text-brand" },
  published: { label: "Publicada", color: "bg-success-bg text-success-fg" },
  archived: { label: "Arquivada", color: "bg-surface-tertiary text-foreground-tertiary" },
};

const CATEGORIES: Record<string, string> = {
  information_security: "Segurança da Informação",
  access_control: "Controle de Acesso",
  data_protection: "Proteção de Dados",
  acceptable_use: "Uso Aceitável",
  incident_response: "Resposta a Incidentes",
  business_continuity: "Continuidade de Negócio",
  other: "Outro",
};

const CATEGORY_OPTIONS = [
  { value: "", label: "Todas categorias" },
  ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v })),
];

const FORM_CATEGORY_OPTIONS = [
  { value: "", label: "Selecionar..." },
  ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v })),
];

interface PolicyFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  notes: string;
  status: string;
}

const INITIAL_FORM: PolicyFormData = {
  title: "",
  description: "",
  content: "",
  category: "",
  notes: "",
  status: "draft",
};

export default function PoliciesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [totalMembers, setTotalMembers] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PolicyFormData>(INITIAL_FORM);
  const updateForm = (field: keyof PolicyFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(() => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set("status", filterStatus);
    if (filterCategory) qs.set("category", filterCategory);
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/policies${qsStr}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/members`).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([polRes, projRes, memRes]) => {
        setPolicies(polRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
        setTotalMembers((memRes.data || []).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId, filterStatus, filterCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: Policy) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      content: item.content || "",
      category: item.category || "",
      notes: item.notes || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        content: form.content || null,
        category: form.category || null,
        notes: form.notes || null,
        status: form.status,
        projectId,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/policies/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/policies`;
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/policies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      toast.success("Status atualizado");
      fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
  };

  const handleAcknowledge = async (policyId: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/policies/${policyId}/acknowledge`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      toast.success("Política reconhecida");
      fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/policies/${itemToDelete}`, { method: "DELETE" });
      toast.success("Excluído");
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
    finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const stats = {
    total: policies.length,
    draft: policies.filter((p) => p.status === "draft").length,
    inReview: policies.filter((p) => p.status === "in_review").length,
    approved: policies.filter((p) => p.status === "approved").length,
    published: policies.filter((p) => p.status === "published").length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Políticas" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Gestão de Políticas</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 cláusula 5.2</p>
        </div>
        {can("policy", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Nova
          </Button>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground-primary" },
            { label: "Rascunho", value: stats.draft, color: "text-foreground-secondary" },
            { label: "Em Revisão", value: stats.inReview, color: "text-warning-fg" },
            { label: "Aprovadas", value: stats.approved, color: "text-brand" },
            { label: "Publicadas", value: stats.published, color: "text-success-fg" },
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
          {["", "draft", "in_review", "approved", "published", "archived"].map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setLoading(true); }}
              className={`px-2.5 py-1 rounded-button text-caption-1 transition-colors ${filterStatus === s ? "bg-brand text-white" : "bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary"}`}>
              {s === "" ? "Todos" : STATUSES[s]?.label}
            </button>
          ))}
        </div>
        <Select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setLoading(true); }}
          options={CATEGORY_OPTIONS}
          className="h-8 !w-auto text-caption-1"
        />
      </div>

      {loading ? (
        <CardSkeleton />
      ) : policies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ScrollText className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhuma política registrada</p>
            <p className="text-body-2 text-foreground-secondary">Crie políticas de segurança da informação</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((pol) => {
            const ackCount = pol._count?.acknowledgments || 0;
            const ackPct = totalMembers > 0 ? Math.round((ackCount / totalMembers) * 100) : 0;
            return (
              <Card key={pol.id} className="hover:shadow-card-glow transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-caption-1 font-medium text-brand">{pol.code}</span>
                        <Badge variant={STATUSES[pol.status]?.color}>{STATUSES[pol.status]?.label}</Badge>
                        {pol.category && <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{CATEGORIES[pol.category] || pol.category}</Badge>}
                      </div>
                      <h3 className="text-body-1 font-medium text-foreground-primary truncate">{pol.title}</h3>
                      {pol.description && <p className="text-body-2 text-foreground-secondary mt-1 line-clamp-2">{pol.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {can("policy", "update") && (
                        <button onClick={() => openEdit(pol)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {can("policy", "delete") && (
                        <button onClick={() => { setItemToDelete(pol.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-caption-1 text-foreground-tertiary">
                    <span>v{pol.version}</span>
                    <span>Autor: {pol.author?.name || "—"}</span>
                    {pol.approvedAt && <span>Aprovada: {formatDate(pol.approvedAt)}</span>}
                  </div>

                  {pol.status === "published" && (
                    <div>
                      <div className="flex items-center justify-between text-caption-1 mb-1">
                        <span className="text-foreground-tertiary">Reconhecimento</span>
                        <span className="text-foreground-secondary">{ackCount}/{totalMembers} ({ackPct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-tertiary rounded-full">
                        <div className="h-full bg-success rounded-full transition-all" style={{ width: `${ackPct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {pol.status === "draft" && can("policy", "update") && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(pol.id, "in_review")}>
                        <Send className="h-3.5 w-3.5" /> Enviar p/ Revisão
                      </Button>
                    )}
                    {pol.status === "in_review" && can("policy", "update") && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(pol.id, "approved")}>
                        <ShieldCheck className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                    )}
                    {pol.status === "approved" && can("policy", "update") && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(pol.id, "published")}>
                        <Globe className="h-3.5 w-3.5" /> Publicar
                      </Button>
                    )}
                    {pol.status === "published" && can("policy", "update") && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(pol.id, "archived")}>
                        <Archive className="h-3.5 w-3.5" /> Arquivar
                      </Button>
                    )}
                    {pol.status === "published" && (
                      <Button size="sm" onClick={() => handleAcknowledge(pol.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Reconhecer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={showForm}
        onOpenChange={(open) => { if (!open) resetForm(); }}
        title={editingId ? "Editar Política" : "Nova Política"}
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
            <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Ex: Política de Segurança da Informação" />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Categoria</label>
            <Select value={form.category} onChange={(e) => updateForm("category", e.target.value)} options={FORM_CATEGORY_OPTIONS} />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
            <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className="h-16 resize-none" />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Conteúdo</label>
            <Textarea value={form.content} onChange={(e) => updateForm("content", e.target.value)} className="h-32 resize-none" placeholder="Texto completo da política..." />
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
        title="Excluir política"
        description="Tem certeza que deseja excluir esta política? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
