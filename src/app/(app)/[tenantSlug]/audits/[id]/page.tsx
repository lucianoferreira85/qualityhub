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
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Save,
  FolderKanban,
  User,
  Calendar,
  FileSearch,
  Plus,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  getAuditTypeLabel,
  formatDate,
} from "@/lib/utils";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { generateAuditReport } from "@/lib/pdf-reports/audit-report";
import type { Audit, AuditFinding } from "@/types";

const AUDIT_TYPES = [
  { value: "internal", label: "Interna" },
  { value: "external", label: "Externa" },
  { value: "supplier", label: "Fornecedor" },
  { value: "certification", label: "Certificação" },
];

const STATUSES = [
  { value: "planned", label: "Planejada" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

const CONCLUSIONS = [
  { value: "", label: "Sem conclusão" },
  { value: "conforming", label: "Conforme" },
  { value: "minor_nc", label: "NC Menor" },
  { value: "major_nc", label: "NC Maior" },
];

const CLASSIFICATIONS = [
  { value: "conformity", label: "Conformidade" },
  { value: "observation", label: "Observação" },
  { value: "opportunity", label: "Oportunidade" },
  { value: "minor_nc", label: "NC Menor" },
  { value: "major_nc", label: "NC Maior" },
];

interface FindingWithRelations extends Omit<AuditFinding, "clause" | "nonconformity"> {
  clause?: { id: string; code: string; title: string } | null;
  nonconformity?: { id: string; code: string; title: string } | null;
}

interface AuditDetail extends Omit<Audit, "leadAuditor" | "findings"> {
  project?: { id: string; name: string };
  leadAuditor?: { id: string; name: string; email: string } | null;
  findings?: FindingWithRelations[];
}

interface FindingFormData {
  classification: string;
  description: string;
  evidence: string;
}

const EMPTY_FINDING: FindingFormData = {
  classification: "observation",
  description: "",
  evidence: "",
};

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;
  const { tenant, can } = useTenant();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Audit edit fields
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editConclusion, setEditConclusion] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Finding modal state
  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [findingModalMode, setFindingModalMode] = useState<"add" | "edit">("add");
  const [findingEditId, setFindingEditId] = useState<string | null>(null);
  const [findingForm, setFindingForm] = useState<FindingFormData>(EMPTY_FINDING);
  const [savingFinding, setSavingFinding] = useState(false);

  // Finding delete state
  const [deleteFindingId, setDeleteFindingId] = useState<string | null>(null);
  const [deletingFinding, setDeletingFinding] = useState(false);

  const fetchAudit = useCallback(() => {
    fetch(`/api/tenants/${tenant.slug}/audits/${auditId}`)
      .then((res) => res.json())
      .then((res) => {
        setAudit(res.data);
        if (res.data) {
          setEditTitle(res.data.title);
          setEditType(res.data.type);
          setEditStatus(res.data.status);
          setEditStartDate(new Date(res.data.startDate).toISOString().split("T")[0]);
          setEditEndDate(res.data.endDate ? new Date(res.data.endDate).toISOString().split("T")[0] : "");
          setEditConclusion(res.data.conclusion || "");
          setEditNotes(res.data.notes || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, auditId]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/audits/${auditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle, type: editType, status: editStatus,
          startDate: editStartDate, endDate: editEndDate || null,
          conclusion: editConclusion || null, notes: editNotes || null,
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erro ao atualizar"); }
      setEditing(false);
      fetchAudit();
      toast.success("Auditoria atualizada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar";
      setError(message);
      toast.error(message);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const toastId = toast.loading("Excluindo...");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/audits/${auditId}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erro ao excluir"); }
      toast.success("Auditoria excluída com sucesso", { id: toastId });
      router.push(`/${tenant.slug}/audits`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir";
      setError(message);
      toast.error(message, { id: toastId });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Finding modal helpers
  const openAddFinding = () => {
    setFindingForm(EMPTY_FINDING);
    setFindingEditId(null);
    setFindingModalMode("add");
    setFindingModalOpen(true);
  };

  const openEditFinding = (f: FindingWithRelations) => {
    setFindingForm({
      classification: f.classification,
      description: f.description,
      evidence: f.evidence || "",
    });
    setFindingEditId(f.id);
    setFindingModalMode("edit");
    setFindingModalOpen(true);
  };

  const handleSaveFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFinding(true);
    setError("");
    try {
      const url = findingModalMode === "add"
        ? `/api/tenants/${tenant.slug}/audits/${auditId}/findings`
        : `/api/tenants/${tenant.slug}/audits/${auditId}/findings/${findingEditId}`;
      const method = findingModalMode === "add" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classification: findingForm.classification,
          description: findingForm.description,
          evidence: findingForm.evidence || null,
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erro ao salvar constatação"); }
      setFindingModalOpen(false);
      fetchAudit();
      toast.success(findingModalMode === "add" ? "Constatação adicionada com sucesso" : "Constatação atualizada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      setError(message);
      toast.error(message);
    } finally { setSavingFinding(false); }
  };

  const handleDeleteFinding = async () => {
    if (!deleteFindingId) return;
    setDeletingFinding(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/audits/${auditId}/findings/${deleteFindingId}`, {
        method: "DELETE",
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erro ao excluir"); }
      setDeleteFindingId(null);
      fetchAudit();
      toast.success("Constatação excluída com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir constatação";
      setError(message);
      toast.error(message);
    } finally { setDeletingFinding(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
    </div>
  );

  if (!audit) return (
    <div className="text-center py-12">
      <p className="text-title-3 text-foreground-primary">Auditoria não encontrada</p>
    </div>
  );

  const handleExportPdf = async () => {
    const toastId = toast.loading("Gerando PDF...");
    try {
      await generateAuditReport(audit, tenant.name);
      toast.success("PDF gerado com sucesso", { id: toastId });
    } catch {
      toast.error("Erro ao gerar PDF", { id: toastId });
    }
  };

  const findings = audit.findings || [];
  const statusIndex = STATUSES.findIndex((s) => s.value === audit.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: "Auditorias", href: `/${tenant.slug}/audits` }, { label: audit.title }]} />
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/${tenant.slug}/audits`}>
          <Button variant="ghost" size="icon-sm" className="mt-1"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-title-1 text-foreground-primary">{audit.title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge status={audit.status} />
            <Badge variant="bg-info-bg text-info-fg">{getAuditTypeLabel(audit.type)}</Badge>
            {audit.conclusion && (
              <StatusBadge status={audit.conclusion} type="conclusion" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4" /> Cancelar</Button>
              <Button size="sm" onClick={handleSave} loading={saving}><Save className="h-4 w-4" /> Salvar</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <Download className="h-4 w-4" /> Exportar PDF
              </Button>
              {can("audit", "update") && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Editar</Button>
              )}
              {can("audit", "delete") && (
                <Button variant="ghost" size="icon-sm" onClick={() => setShowDeleteConfirm(true)} className="text-foreground-tertiary hover:text-danger-fg">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">{error}</div>}

      {/* Delete audit confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir esta auditoria?"
        description="Todas as constatações serão excluídas. Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Delete finding confirmation */}
      <ConfirmDialog
        open={!!deleteFindingId}
        onOpenChange={(open) => { if (!open) setDeleteFindingId(null); }}
        title="Excluir esta constatação?"
        description="Esta ação não pode ser desfeita."
        onConfirm={handleDeleteFinding}
        loading={deletingFinding}
      />

      {/* Finding modal (add/edit) */}
      <Modal
        open={findingModalOpen}
        onOpenChange={setFindingModalOpen}
        title={findingModalMode === "add" ? "Nova Constatação" : "Editar Constatação"}
        className="max-w-md"
      >
        <form onSubmit={handleSaveFinding} className="space-y-4">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Classificação *</label>
            <Select
              value={findingForm.classification}
              onChange={(e) => setFindingForm({ ...findingForm, classification: e.target.value })}
              options={CLASSIFICATIONS}
            />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição *</label>
            <Textarea
              value={findingForm.description}
              onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })}
              required
              rows={3}
              placeholder="Descreva a constatação"
            />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Evidência</label>
            <Textarea
              value={findingForm.evidence}
              onChange={(e) => setFindingForm({ ...findingForm, evidence: e.target.value })}
              rows={2}
              placeholder="Evidência objetiva"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setFindingModalOpen(false)}>Cancelar</Button>
            <Button type="submit" size="sm" loading={savingFinding}>
              {findingModalMode === "add" ? "Adicionar" : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-1">
            {STATUSES.filter((s) => s.value !== "cancelled").map((s, i) => {
              const isCurrent = s.value === audit.status;
              const isPast = i < statusIndex && audit.status !== "cancelled";
              return (
                <div key={s.value} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`h-3 w-3 rounded-full ${isCurrent ? "bg-brand ring-4 ring-brand/20" : isPast ? "bg-success-fg" : "bg-stroke-secondary"}`} />
                    <span className={`text-caption-2 mt-1 text-center leading-tight ${isCurrent ? "text-brand font-medium" : isPast ? "text-success-fg" : "text-foreground-tertiary"}`}>{s.label}</span>
                  </div>
                  {i < 2 && <div className={`h-0.5 flex-1 -mt-4 ${isPast ? "bg-success-fg" : "bg-stroke-secondary"}`} />}
                </div>
              );
            })}
          </div>
          {audit.status === "cancelled" && (
            <div className="mt-3 pt-3 border-t border-stroke-secondary text-center">
              <StatusBadge status="cancelled" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit / View */}
      {editing ? (
        <Card>
          <CardHeader><h2 className="text-title-3 text-foreground-primary">Editar dados</h2></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Tipo</label>
                <Select value={editType} onChange={(e) => setEditType(e.target.value)} options={AUDIT_TYPES} />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} options={STATUSES} />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Data início</label>
                <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Data fim</label>
                <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Conclusão</label>
                <Select value={editConclusion} onChange={(e) => setEditConclusion(e.target.value)} options={CONCLUSIONS} />
              </div>
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Observações</label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><h2 className="text-title-3 text-foreground-primary">Informações</h2></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                  <span className="inline-flex items-center gap-1"><FolderKanban className="h-3 w-3" /> Projeto</span>
                </p>
                <p className="text-body-1 text-foreground-primary">{audit.project?.name || "—"}</p>
              </div>
              <div>
                <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Período</span>
                </p>
                <p className="text-body-1 text-foreground-primary">
                  {formatDate(audit.startDate)}{audit.endDate && ` — ${formatDate(audit.endDate)}`}
                </p>
              </div>
              {audit.leadAuditor && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> Auditor líder</span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">{audit.leadAuditor.name}</p>
                </div>
              )}
              {audit.scope && (
                <div className="col-span-2">
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">Escopo</p>
                  <p className="text-body-1 text-foreground-primary whitespace-pre-wrap">{audit.scope}</p>
                </div>
              )}
              {audit.notes && (
                <div className="col-span-2">
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">Observações</p>
                  <p className="text-body-1 text-foreground-primary whitespace-pre-wrap">{audit.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Findings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-title-3 text-foreground-primary">
              <span className="inline-flex items-center gap-1.5">
                <FileSearch className="h-4 w-4 text-foreground-tertiary" />
                Constatações ({findings.length})
              </span>
            </h2>
            {can("auditFinding", "create") && (
              <Button variant="outline" size="sm" onClick={openAddFinding}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {findings.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <FileSearch className="h-10 w-10 text-foreground-tertiary mb-3" />
              <p className="text-body-1 text-foreground-primary mb-1">Nenhuma constatação registrada</p>
              <p className="text-body-2 text-foreground-secondary mb-3">Adicione constatações encontradas durante a auditoria</p>
              {can("auditFinding", "create") && (
                <Button variant="outline" size="sm" onClick={openAddFinding}>
                  <Plus className="h-4 w-4" /> Adicionar primeira constatação
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {findings.map((f) => (
                <div key={f.id} className="p-3 rounded-button border border-stroke-secondary">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-body-1 text-foreground-primary">{f.description}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={f.classification} type="classification" />
                      {can("auditFinding", "update") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditFinding(f)} className="text-foreground-tertiary hover:text-foreground-primary">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      {can("auditFinding", "delete") && (
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteFindingId(f.id)} className="text-foreground-tertiary hover:text-danger-fg">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {f.evidence && (
                    <p className="text-body-2 text-foreground-secondary mb-1.5">
                      <span className="font-medium">Evidência:</span> {f.evidence}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                    {f.clause && <span>{f.clause.code} - {f.clause.title}</span>}
                    {f.nonconformity && (
                      <Link href={`/${tenant.slug}/nonconformities/${f.nonconformity.id}`} className="flex items-center gap-1 text-brand hover:text-brand-hover">
                        <AlertTriangle className="h-3 w-3" />{f.nonconformity.code}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
