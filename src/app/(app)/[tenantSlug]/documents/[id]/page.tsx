"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  FolderKanban,
  User,
  Calendar,
  Tag,
  Clock,
  CheckCircle2,
  History,
  Save,
  X,
  RefreshCw,
} from "lucide-react";
import {
  getStatusColor,
  getStatusLabel,
  getDocumentTypeLabel,
  getDocumentTypeColor,
  formatDate,
} from "@/lib/utils";
import { toast } from "sonner";
import type { Document, DocumentVersion } from "@/types";

const DOCUMENT_STATUSES = [
  { value: "draft", label: "Rascunho" },
  { value: "in_review", label: "Em Revisão" },
  { value: "approved", label: "Aprovado" },
  { value: "obsolete", label: "Obsoleto" },
];

const DOCUMENT_TYPES = [
  { value: "policy", label: "Política" },
  { value: "procedure", label: "Procedimento" },
  { value: "work_instruction", label: "Instrução de Trabalho" },
  { value: "form", label: "Formulário" },
  { value: "record", label: "Registro" },
  { value: "manual", label: "Manual" },
];

interface DocDetail extends Omit<Document, "author" | "reviewer" | "approver" | "versions"> {
  project?: { id: string; name: string } | null;
  author?: { id: string; name: string; email: string } | null;
  reviewer?: { id: string; name: string; email: string } | null;
  approver?: { id: string; name: string; email: string } | null;
  versions?: (Omit<DocumentVersion, "changedBy"> & {
    changedBy?: { id: string; name: string } | null;
  })[];
}

interface MemberOption {
  user: { id: string; name: string };
}

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { tenant, can } = useTenant();
  const id = params.id as string;

  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editReviewerId, setEditReviewerId] = useState("");
  const [editApproverId, setEditApproverId] = useState("");
  const [editNextReviewDate, setEditNextReviewDate] = useState("");
  const [editChangeNotes, setEditChangeNotes] = useState("");

  // New revision states
  const [showNewRevision, setShowNewRevision] = useState(false);
  const [revisionVersion, setRevisionVersion] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [creatingRevision, setCreatingRevision] = useState(false);

  const [members, setMembers] = useState<MemberOption[]>([]);

  const fetchDoc = useCallback(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/documents/${id}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/members`).then((r) => r.json()),
    ])
      .then(([docRes, memRes]) => {
        if (docRes.data) setDoc(docRes.data);
        setMembers(memRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  const startEdit = () => {
    if (!doc) return;
    setEditTitle(doc.title);
    setEditType(doc.type);
    setEditStatus(doc.status);
    setEditCategory(doc.category || "");
    setEditContent(doc.content || "");
    setEditVersion(doc.version);
    setEditReviewerId(doc.reviewer?.id || "");
    setEditApproverId(doc.approver?.id || "");
    setEditNextReviewDate(
      doc.nextReviewDate
        ? new Date(doc.nextReviewDate).toISOString().split("T")[0]
        : ""
    );
    setEditChangeNotes("");
    setEditing(true);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          type: editType,
          status: editStatus,
          category: editCategory || null,
          content: editContent || null,
          version: editVersion,
          reviewerId: editReviewerId || null,
          approverId: editApproverId || null,
          nextReviewDate: editNextReviewDate || null,
          changeNotes: editChangeNotes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar");
      }
      setEditing(false);
      setLoading(true);
      fetchDoc();
      toast.success("Documento atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/documents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Documento excluído com sucesso");
      router.push(`/${tenant.slug}/documents`);
    } catch {
      setError("Erro ao excluir documento");
      toast.error("Erro ao excluir documento");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleNewRevision = async () => {
    if (!revisionVersion.trim() || !revisionNotes.trim()) return;
    setCreatingRevision(true);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/documents/${id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newVersion: revisionVersion,
          changeNotes: revisionNotes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar revisão");
      }
      setShowNewRevision(false);
      setRevisionVersion("");
      setRevisionNotes("");
      setLoading(true);
      fetchDoc();
      toast.success("Nova versão criada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar revisão";
      setError(message);
      toast.error(message);
    } finally {
      setCreatingRevision(false);
    }
  };

  // Suggest next version
  const suggestNextVersion = () => {
    if (!doc) return "";
    const parts = doc.version.split(".");
    if (parts.length >= 2) {
      const minor = parseInt(parts[1]) || 0;
      return `${parts[0]}.${minor + 1}`;
    }
    return `${doc.version}.1`;
  };

  const STATUS_STEPS = ["draft", "in_review", "approved"];
  const currentStepIndex = doc ? STATUS_STEPS.indexOf(doc.status) : 0;
  const isObsolete = doc?.status === "obsolete";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-surface-tertiary rounded animate-pulse" />
          <div className="h-6 w-48 bg-surface-tertiary rounded animate-pulse" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-5 bg-surface-tertiary rounded w-1/3" />
              <div className="h-4 bg-surface-tertiary rounded w-2/3" />
              <div className="h-4 bg-surface-tertiary rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="space-y-6">
        <Link href={`/${tenant.slug}/documents`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary">Documento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href={`/${tenant.slug}/documents`}>
            <Button variant="ghost" size="icon-sm" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-caption-1 text-foreground-tertiary font-mono mb-1">
              {doc.code} &middot; v{doc.version}
            </p>
            <h1 className="text-title-1 text-foreground-primary">{doc.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getDocumentTypeColor(doc.type)}>
                {getDocumentTypeLabel(doc.type)}
              </Badge>
              <Badge variant={getStatusColor(doc.status)}>
                {getStatusLabel(doc.status)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </>
          ) : (
            <>
              {can("document", "update") && doc.status === "approved" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRevisionVersion(suggestNextVersion());
                    setRevisionNotes("");
                    setShowNewRevision(true);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Nova Revisão
                </Button>
              )}
              {can("document", "update") && (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {can("document", "delete") && (
                <>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-body-2 text-danger-fg">Confirmar?</span>
                      <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
                        Sim, excluir
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                        Não
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
          {error}
        </div>
      )}

      {/* New Revision Modal */}
      {showNewRevision && (
        <Card className="border-brand/30">
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">Nova Revisão</h2>
            <p className="text-body-2 text-foreground-secondary">
              A versão atual ({doc.version}) será arquivada no histórico e o documento voltará ao status Rascunho.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Nova versão *
                </label>
                <Input
                  value={revisionVersion}
                  onChange={(e) => setRevisionVersion(e.target.value)}
                  placeholder="Ex: 2.0"
                />
              </div>
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Motivo da revisão *
              </label>
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Descreva o que motivou esta nova revisão..."
                rows={3}
                className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewRevision(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleNewRevision}
                loading={creatingRevision}
                disabled={!revisionVersion.trim() || !revisionNotes.trim()}
              >
                Criar Revisão
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            {STATUS_STEPS.map((step, i) => {
              const isActive = isObsolete ? false : i <= currentStepIndex;
              const isCurrent = !isObsolete && step === doc.status;
              return (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCurrent
                          ? "bg-brand text-white"
                          : isActive
                          ? "bg-success-bg text-success-fg"
                          : "bg-surface-tertiary text-foreground-tertiary"
                      }`}
                    >
                      {isActive && !isCurrent ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-caption-1 font-medium">{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-caption-1 ${
                        isCurrent
                          ? "text-foreground-primary font-medium"
                          : "text-foreground-tertiary"
                      }`}
                    >
                      {getStatusLabel(step)}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 ${
                        isObsolete
                          ? "bg-surface-tertiary"
                          : i < currentStepIndex
                          ? "bg-success-fg"
                          : "bg-surface-tertiary"
                      }`}
                    />
                  )}
                </div>
              );
            })}
            {isObsolete && (
              <div className="flex items-center gap-2 ml-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-caption-1 text-foreground-tertiary font-medium">
                  Obsoleto
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit / View */}
      {editing ? (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">Editar Documento</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Título
              </label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Tipo
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {DOCUMENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Versão
                </label>
                <Input value={editVersion} onChange={(e) => setEditVersion(e.target.value)} />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Categoria
                </label>
                <Input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="Ex: SGSI, SGQ"
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Revisor
                </label>
                <select
                  value={editReviewerId}
                  onChange={(e) => setEditReviewerId(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">Nenhum</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Aprovador
                </label>
                <select
                  value={editApproverId}
                  onChange={(e) => setEditApproverId(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">Nenhum</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Próxima revisão
                </label>
                <Input
                  type="date"
                  value={editNextReviewDate}
                  onChange={(e) => setEditNextReviewDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Conteúdo
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Notas de alteração
              </label>
              <textarea
                value={editChangeNotes}
                onChange={(e) => setEditChangeNotes(e.target.value)}
                placeholder="Descreva brevemente as alterações realizadas (registrado no histórico de versões)..."
                rows={2}
                className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
              />
              <p className="text-caption-1 text-foreground-tertiary mt-1">
                Alterações em conteúdo, versão ou status geram automaticamente um registro no histórico.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                {doc.project && (
                  <div className="flex items-center gap-2 text-body-2">
                    <FolderKanban className="h-4 w-4 text-foreground-tertiary" />
                    <span className="text-foreground-secondary">Projeto:</span>
                    <span className="text-foreground-primary font-medium">{doc.project.name}</span>
                  </div>
                )}
                {doc.category && (
                  <div className="flex items-center gap-2 text-body-2">
                    <Tag className="h-4 w-4 text-foreground-tertiary" />
                    <span className="text-foreground-secondary">Categoria:</span>
                    <span className="text-foreground-primary font-medium">{doc.category}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-body-2">
                  <User className="h-4 w-4 text-foreground-tertiary" />
                  <span className="text-foreground-secondary">Autor:</span>
                  <span className="text-foreground-primary font-medium">
                    {doc.author?.name || "—"}
                  </span>
                </div>
                {doc.reviewer && (
                  <div className="flex items-center gap-2 text-body-2">
                    <User className="h-4 w-4 text-foreground-tertiary" />
                    <span className="text-foreground-secondary">Revisor:</span>
                    <span className="text-foreground-primary font-medium">{doc.reviewer.name}</span>
                  </div>
                )}
                {doc.approver && (
                  <div className="flex items-center gap-2 text-body-2">
                    <CheckCircle2 className="h-4 w-4 text-foreground-tertiary" />
                    <span className="text-foreground-secondary">Aprovador:</span>
                    <span className="text-foreground-primary font-medium">{doc.approver.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-body-2">
                  <Calendar className="h-4 w-4 text-foreground-tertiary" />
                  <span className="text-foreground-secondary">Criado em:</span>
                  <span className="text-foreground-primary font-medium">
                    {formatDate(doc.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-body-2">
                  <Clock className="h-4 w-4 text-foreground-tertiary" />
                  <span className="text-foreground-secondary">Atualizado em:</span>
                  <span className="text-foreground-primary font-medium">
                    {formatDate(doc.updatedAt)}
                  </span>
                </div>
                {doc.approvedAt && (
                  <div className="flex items-center gap-2 text-body-2">
                    <CheckCircle2 className="h-4 w-4 text-success-fg" />
                    <span className="text-foreground-secondary">Aprovado em:</span>
                    <span className="text-foreground-primary font-medium">
                      {formatDate(doc.approvedAt)}
                    </span>
                  </div>
                )}
                {doc.nextReviewDate && (
                  <div className="flex items-center gap-2 text-body-2">
                    <Calendar className="h-4 w-4 text-warning-fg" />
                    <span className="text-foreground-secondary">Próxima revisão:</span>
                    <span className="text-foreground-primary font-medium">
                      {formatDate(doc.nextReviewDate)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          {doc.content && (
            <Card>
              <CardHeader>
                <h2 className="text-title-3 text-foreground-primary">Conteúdo</h2>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-body-1 text-foreground-primary whitespace-pre-wrap">
                  {doc.content}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Version History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-foreground-tertiary" />
                <h2 className="text-title-3 text-foreground-primary">
                  Histórico de Versões
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              {doc.versions && doc.versions.length > 0 ? (
                <div className="space-y-3">
                  {doc.versions.map((ver) => (
                    <div
                      key={ver.id}
                      className="flex items-start gap-3 p-3 bg-surface-secondary rounded-card"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
                        <span className="text-caption-1 font-medium">v{ver.version}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-body-2">
                          <span className="font-medium text-foreground-primary">
                            {ver.changedBy?.name || "—"}
                          </span>
                          <span className="text-foreground-tertiary">
                            {formatDate(ver.createdAt)}
                          </span>
                        </div>
                        {ver.changeNotes && (
                          <p className="text-body-2 text-foreground-secondary mt-1">
                            {ver.changeNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <History className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
                  <p className="text-body-2 text-foreground-tertiary">
                    Nenhuma versão anterior registrada
                  </p>
                  <p className="text-caption-1 text-foreground-tertiary mt-1">
                    O histórico será preenchido automaticamente ao editar o documento
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
