"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Save,
  FolderKanban,
  User,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { ActionPlan } from "@/types";

const TYPES = [
  { value: "corrective", label: "Corretiva" },
  { value: "preventive", label: "Preventiva" },
  { value: "improvement", label: "Melhoria" },
];

const TYPE_LABELS: Record<string, string> = {
  corrective: "Corretiva",
  preventive: "Preventiva",
  improvement: "Melhoria",
};

const TYPE_COLORS: Record<string, string> = {
  corrective: "bg-danger-bg text-danger-fg",
  preventive: "bg-info-bg text-info-fg",
  improvement: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const STATUSES = [
  { value: "planned", label: "Planejada" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluída" },
  { value: "verified", label: "Verificada" },
  { value: "effective", label: "Eficaz" },
  { value: "ineffective", label: "Ineficaz" },
];

interface ApDetail extends Omit<ActionPlan, "responsible" | "nonconformity" | "risk"> {
  project?: { id: string; name: string };
  responsible?: { id: string; name: string; email: string } | null;
  nonconformity?: { id: string; code: string; title: string } | null;
  risk?: { id: string; code: string; title: string } | null;
}

export default function ActionPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const apId = params.id as string;
  const { tenant, can } = useTenant();
  const [ap, setAp] = useState<ApDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  // Edit form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editVerificationNotes, setEditVerificationNotes] = useState("");

  const fetchAp = useCallback(() => {
    fetch(`/api/tenants/${tenant.slug}/action-plans/${apId}`)
      .then((res) => res.json())
      .then((res) => {
        setAp(res.data);
        if (res.data) {
          setEditTitle(res.data.title);
          setEditDescription(res.data.description);
          setEditType(res.data.type);
          setEditStatus(res.data.status);
          setEditDueDate(
            res.data.dueDate
              ? new Date(res.data.dueDate).toISOString().split("T")[0]
              : ""
          );
          setEditVerificationNotes(res.data.verificationNotes || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, apId]);

  useEffect(() => {
    fetchAp();
  }, [fetchAp]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/action-plans/${apId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
            type: editType,
            status: editStatus,
            dueDate: editDueDate || null,
            verificationNotes: editVerificationNotes || null,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar plano");
      }
      setEditing(false);
      fetchAp();
      toast.success("Plano de ação atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/action-plans/${apId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir plano");
      }
      toast.success("Plano de ação excluído com sucesso");
      router.push(`/${tenant.slug}/action-plans`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir";
      setError(message);
      toast.error(message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!ap) {
    return (
      <div className="text-center py-12">
        <p className="text-title-3 text-foreground-primary">
          Plano de ação não encontrado
        </p>
      </div>
    );
  }

  const statusIndex = STATUSES.findIndex((s) => s.value === ap.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: "Planos de Ação", href: `/${tenant.slug}/action-plans` }, { label: ap.code }]} />
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/${tenant.slug}/action-plans`}>
          <Button variant="ghost" size="icon-sm" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-caption-1 text-foreground-tertiary font-mono">
            {ap.code}
          </p>
          <h1 className="text-title-1 text-foreground-primary">{ap.title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge status={ap.status} />
            <Badge variant={TYPE_COLORS[ap.type] || ""}>
              {TYPE_LABELS[ap.type] || ap.type}
            </Badge>
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
              {can("actionPlan", "update") && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {can("actionPlan", "delete") && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-foreground-tertiary hover:text-danger-fg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
          {error}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Card className="border-danger/30 bg-danger-bg/30">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-body-1 font-medium text-foreground-primary">
                Excluir este plano de ação?
              </p>
              <p className="text-body-2 text-foreground-secondary">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status workflow timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-1">
            {STATUSES.slice(0, 4).map((s, i) => {
              const isCurrent = s.value === ap.status;
              const isPast = i < statusIndex;
              return (
                <div key={s.value} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        isCurrent
                          ? "bg-brand ring-4 ring-brand/20"
                          : isPast
                          ? "bg-success-fg"
                          : "bg-stroke-secondary"
                      }`}
                    />
                    <span
                      className={`text-caption-2 mt-1 text-center leading-tight ${
                        isCurrent
                          ? "text-brand font-medium"
                          : isPast
                          ? "text-success-fg"
                          : "text-foreground-tertiary"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div
                      className={`h-0.5 flex-1 -mt-4 ${
                        isPast ? "bg-success-fg" : "bg-stroke-secondary"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {(ap.status === "effective" || ap.status === "ineffective") && (
            <div className="mt-3 pt-3 border-t border-stroke-secondary text-center">
              <StatusBadge status={ap.status} className="text-body-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit / View */}
      {editing ? (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">Editar dados</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Título *
              </label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Descrição *
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Tipo
                </label>
                <Select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  options={TYPES}
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Status
                </label>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  options={STATUSES}
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Prazo
                </label>
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
            </div>
            {(editStatus === "verified" || editStatus === "effective" || editStatus === "ineffective") && (
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Notas de verificação
                </label>
                <Textarea
                  value={editVerificationNotes}
                  onChange={(e) => setEditVerificationNotes(e.target.value)}
                  rows={3}
                  placeholder="Descreva os resultados da verificação de eficácia"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">Informações</h2>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-caption-1 text-foreground-tertiary mb-0.5">Descrição</p>
              <p className="text-body-1 text-foreground-primary whitespace-pre-wrap">
                {ap.description}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" /> Projeto
                  </span>
                </p>
                <p className="text-body-1 text-foreground-primary">
                  {ap.project?.name || "—"}
                </p>
              </div>
              {ap.responsible && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> Responsável
                    </span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {ap.responsible.name}
                  </p>
                </div>
              )}
              {ap.dueDate && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Prazo
                    </span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {formatDate(ap.dueDate)}
                  </p>
                </div>
              )}
              {ap.nonconformity && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> NC Vinculada
                    </span>
                  </p>
                  <Link
                    href={`/${tenant.slug}/nonconformities/${ap.nonconformity.id}`}
                    className="text-body-1 text-brand hover:text-brand-hover transition-colors"
                  >
                    {ap.nonconformity.code} - {ap.nonconformity.title}
                  </Link>
                </div>
              )}
              {ap.risk && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Risco Vinculado
                    </span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {ap.risk.code} - {ap.risk.title}
                  </p>
                </div>
              )}
              {ap.completedAt && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Concluída em
                    </span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {formatDate(ap.completedAt)}
                  </p>
                </div>
              )}
              {ap.verifiedAt && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    Verificada em
                  </p>
                  <p className="text-body-1 text-foreground-primary">
                    {formatDate(ap.verifiedAt)}
                  </p>
                </div>
              )}
            </div>
            {ap.verificationNotes && (
              <div className="mt-4 pt-4 border-t border-stroke-secondary">
                <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                  Notas de verificação
                </p>
                <p className="text-body-1 text-foreground-primary whitespace-pre-wrap">
                  {ap.verificationNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
