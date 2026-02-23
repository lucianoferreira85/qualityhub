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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Plus, X, Pencil, Trash2, Globe, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { SgsiScope } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-surface-tertiary text-foreground-secondary" },
  approved: { label: "Aprovado", color: "bg-success-bg text-success-fg" },
  under_review: { label: "Em Revisão", color: "bg-warning-bg text-warning-fg" },
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "under_review", label: "Em Revisão" },
  { value: "approved", label: "Aprovado" },
];

export default function ScopePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [scopes, setScopes] = useState<SgsiScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBoundaries, setFormBoundaries] = useState("");
  const [formExclusions, setFormExclusions] = useState("");
  const [formJustification, setFormJustification] = useState("");
  const [formInterfaces, setFormInterfaces] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [formVersion, setFormVersion] = useState("1.0");
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/scope`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([scopeRes, projRes]) => {
        setScopes(scopeRes.data || []);
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
    setFormTitle("");
    setFormDescription("");
    setFormBoundaries("");
    setFormExclusions("");
    setFormJustification("");
    setFormInterfaces("");
    setFormStatus("draft");
    setFormVersion("1.0");
  };

  const openEdit = (item: SgsiScope) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormBoundaries(item.boundaries || "");
    setFormExclusions(item.exclusions || "");
    setFormJustification(item.justification || "");
    setFormInterfaces(item.interfaces || "");
    setFormStatus(item.status);
    setFormVersion(item.version);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDescription || null,
        boundaries: formBoundaries || null,
        exclusions: formExclusions || null,
        justification: formJustification || null,
        interfaces: formInterfaces || null,
        status: formStatus,
        version: formVersion,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/scope/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/scope`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      toast.success(editingId ? "Escopo atualizado" : "Escopo criado");
      resetForm();
      fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/scope/${itemToDelete}`, { method: "DELETE" });
      toast.success("Excluído");
      fetchData();
    } catch { toast.error("Erro ao excluir"); }
    finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Escopo" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Escopo do SGSI</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 cláusula 4.3</p>
        </div>
        {can("sgsiScope", "create") && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Definir Escopo
          </Button>
        )}
      </div>

      {loading ? (
        [1, 2].map((i) => <CardSkeleton key={i} />)
      ) : scopes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhum escopo definido</p>
            <p className="text-body-2 text-foreground-secondary">Defina o escopo do SGSI para este projeto</p>
          </CardContent>
        </Card>
      ) : (
        scopes.map((scope) => (
          <Card key={scope.id} className="hover:shadow-card-glow transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-title-3 text-foreground-primary">{scope.title}</h2>
                  <Badge variant={STATUS_CONFIG[scope.status]?.color}>{STATUS_CONFIG[scope.status]?.label}</Badge>
                  <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">v{scope.version}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  {can("sgsiScope", "update") && (
                    <button onClick={() => openEdit(scope)} className="p-2 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {can("sgsiScope", "delete") && (
                    <button onClick={() => { setItemToDelete(scope.id); setShowDeleteConfirm(true); }} className="p-2 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {scope.description && (
                <div>
                  <p className="text-body-2 font-medium text-foreground-primary mb-1">Descrição</p>
                  <p className="text-body-2 text-foreground-secondary whitespace-pre-wrap">{scope.description}</p>
                </div>
              )}
              {scope.boundaries && (
                <div>
                  <p className="text-body-2 font-medium text-foreground-primary mb-1">Limites</p>
                  <p className="text-body-2 text-foreground-secondary whitespace-pre-wrap">{scope.boundaries}</p>
                </div>
              )}
              {(scope.exclusions || scope.justification) && (
                <div>
                  <p className="text-body-2 font-medium text-foreground-primary mb-1">Exclusões</p>
                  {scope.exclusions && <p className="text-body-2 text-foreground-secondary whitespace-pre-wrap">{scope.exclusions}</p>}
                  {scope.justification && (
                    <p className="text-body-2 text-foreground-tertiary mt-1">
                      <span className="font-medium">Justificativa:</span> {scope.justification}
                    </p>
                  )}
                </div>
              )}
              {scope.interfaces && (
                <div>
                  <p className="text-body-2 font-medium text-foreground-primary mb-1">Interfaces</p>
                  <p className="text-body-2 text-foreground-secondary whitespace-pre-wrap">{scope.interfaces}</p>
                </div>
              )}
              {scope.status === "approved" && scope.approvedBy && (
                <div className="flex items-center gap-2 pt-2 border-t border-stroke-secondary text-caption-1 text-foreground-tertiary">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-fg" />
                  Aprovado por {scope.approvedBy.name} em {scope.approvedAt ? formatDate(scope.approvedAt) : "—"}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-title-3 text-foreground-primary">{editingId ? "Editar" : "Definir"} Escopo</h2>
                <button onClick={resetForm} className="text-foreground-tertiary hover:text-foreground-primary"><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Escopo do SGSI 2024" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                    <Select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} options={STATUS_OPTIONS} />
                  </div>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Versão</label>
                    <Input value={formVersion} onChange={(e) => setFormVersion(e.target.value)} placeholder="1.0" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="h-20 resize-none" placeholder="Descrição geral do escopo..." />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Limites e Fronteiras</label>
                <Textarea value={formBoundaries} onChange={(e) => setFormBoundaries(e.target.value)} className="h-20 resize-none" placeholder="Defina os limites organizacionais, físicos e tecnológicos..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Exclusões</label>
                  <Textarea value={formExclusions} onChange={(e) => setFormExclusions(e.target.value)} className="h-20 resize-none" placeholder="Itens excluídos do escopo..." />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Justificativa</label>
                  <Textarea value={formJustification} onChange={(e) => setFormJustification(e.target.value)} className="h-20 resize-none" placeholder="Justificativa para as exclusões..." />
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Interfaces e Dependências</label>
                <Textarea value={formInterfaces} onChange={(e) => setFormInterfaces(e.target.value)} className="h-16 resize-none" placeholder="Interfaces com partes externas, dependências..." />
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
        title="Excluir escopo"
        description="Tem certeza que deseja excluir este escopo? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
