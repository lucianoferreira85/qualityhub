"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit2, Trash2, Save, X, Plus, Download } from "lucide-react";
import { generateManagementReviewReport } from "@/lib/pdf-reports/management-review-report";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-info-bg text-info-fg",
  in_progress: "bg-warning-bg text-warning-fg",
  completed: "bg-success-bg text-success-fg",
  cancelled: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  in_progress: "Em Andamento",
  completed: "Concluida",
  cancelled: "Cancelada",
};

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Agendada" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluida" },
  { value: "cancelled", label: "Cancelada" },
];

interface Decision {
  text: string;
  responsible?: string;
  deadline?: string;
}

interface ReviewDetail {
  id: string;
  scheduledDate: string;
  actualDate: string | null;
  status: string;
  minutes: string | null;
  decisions: Decision[];
  project: { id: string; name: string };
}

export default function ManagementReviewDetailPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const router = useRouter();
  const { tenant, can } = useTenant();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editStatus, setEditStatus] = useState("");
  const [editActualDate, setEditActualDate] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editDecisions, setEditDecisions] = useState<Decision[]>([]);
  const [newDecision, setNewDecision] = useState("");

  const fetchReview = useCallback(() => {
    fetch(`/api/tenants/${tenant.slug}/management-reviews/${reviewId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setReview(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, reviewId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const startEdit = () => {
    if (!review) return;
    setEditStatus(review.status);
    setEditActualDate(review.actualDate ? review.actualDate.split("T")[0] : "");
    setEditMinutes(review.minutes || "");
    setEditDecisions(review.decisions || []);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/management-reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          actualDate: editActualDate || null,
          minutes: editMinutes || null,
          decisions: editDecisions,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setReview(updated.data);
      setEditing(false);
      toast.success("Análise crítica atualizada com sucesso");
    } catch {
      toast.error("Erro ao atualizar análise crítica");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/tenants/${tenant.slug}/management-reviews/${reviewId}`, {
        method: "DELETE",
      });
      toast.success("Análise crítica excluída com sucesso");
      router.push(`/${tenant.slug}/management-reviews`);
    } catch {
      toast.error("Erro ao excluir análise crítica");
    }
  };

  const addDecision = () => {
    if (!newDecision.trim()) return;
    setEditDecisions([...editDecisions, { text: newDecision.trim() }]);
    setNewDecision("");
  };

  const removeDecision = (idx: number) => {
    setEditDecisions(editDecisions.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!review) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-body-1 text-foreground-primary">Analise critica nao encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumb items={[{ label: "Análises Críticas", href: `/${tenant.slug}/management-reviews` }, { label: review.scheduledDate ? formatDate(review.scheduledDate) : review.id }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${tenant.slug}/management-reviews`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-title-1 text-foreground-primary">
              Analise Critica — {formatDate(review.scheduledDate)}
            </h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              {review.project.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => generateManagementReviewReport(review, tenant.name)}>
              <Download className="h-4 w-4" />
              PDF
            </Button>
          )}
          {!editing && can("managementReview", "update") && (
            <Button variant="outline" onClick={startEdit}>
              <Edit2 className="h-4 w-4" />
              Editar
            </Button>
          )}
          {can("managementReview", "delete") && (
            <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-danger-fg hover:bg-danger-bg">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir esta análise crítica?"
        description="Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
      />

      {/* Info card */}
      <Card>
        <CardHeader>
          <h2 className="text-title-3 text-foreground-primary">Informacoes</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                  <Select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    options={STATUS_OPTIONS}
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Data Realizada</label>
                  <Input
                    type="date"
                    value={editActualDate}
                    onChange={(e) => setEditActualDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Ata / Observacoes</label>
                <Textarea
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  rows={6}
                  placeholder="Registre a ata da reuniao..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-caption-1 text-foreground-tertiary">Status</p>
                <Badge variant={STATUS_COLORS[review.status] || ""}>
                  {STATUS_LABELS[review.status] || review.status}
                </Badge>
              </div>
              <div>
                <p className="text-caption-1 text-foreground-tertiary">Projeto</p>
                <p className="text-body-1 text-foreground-primary">{review.project.name}</p>
              </div>
              <div>
                <p className="text-caption-1 text-foreground-tertiary">Data Agendada</p>
                <p className="text-body-1 text-foreground-primary">{formatDate(review.scheduledDate)}</p>
              </div>
              <div>
                <p className="text-caption-1 text-foreground-tertiary">Data Realizada</p>
                <p className="text-body-1 text-foreground-primary">
                  {review.actualDate ? formatDate(review.actualDate) : "\u2014"}
                </p>
              </div>
              {review.minutes && (
                <div className="col-span-2">
                  <p className="text-caption-1 text-foreground-tertiary">Ata / Observacoes</p>
                  <p className="text-body-1 text-foreground-primary whitespace-pre-wrap">{review.minutes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decisions */}
      <Card>
        <CardHeader>
          <h2 className="text-title-3 text-foreground-primary">Decisoes</h2>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              {editDecisions.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 rounded-card bg-surface-secondary">
                  <p className="text-body-2 text-foreground-primary flex-1">{d.text}</p>
                  <button onClick={() => removeDecision(idx)} className="text-foreground-tertiary hover:text-danger-fg">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDecision())}
                  placeholder="Nova decisao..."
                  className="flex-1"
                />
                <Button variant="outline" onClick={addDecision} disabled={!newDecision.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {review.decisions.length === 0 ? (
                <p className="text-body-2 text-foreground-tertiary">Nenhuma decisao registrada</p>
              ) : (
                <div className="space-y-2">
                  {review.decisions.map((d, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-card bg-surface-secondary">
                      <span className="text-caption-1 text-foreground-tertiary font-mono mt-0.5">
                        {idx + 1}.
                      </span>
                      <p className="text-body-2 text-foreground-primary">{d.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
