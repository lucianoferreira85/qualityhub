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
  X,
  Save,
  FolderKanban,
  User,
  Calendar,
  FileSearch,
  Plus,
  AlertTriangle,
} from "lucide-react";
import {
  getStatusColor,
  getStatusLabel,
  getAuditTypeLabel,
  getConclusionLabel,
  getConclusionColor,
  getClassificationLabel,
  getClassificationColor,
  formatDate,
} from "@/lib/utils";
import { toast } from "sonner";
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

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;
  const { tenant, can } = useTenant();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editConclusion, setEditConclusion] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [showAddFinding, setShowAddFinding] = useState(false);
  const [findingClassification, setFindingClassification] = useState("observation");
  const [findingDescription, setFindingDescription] = useState("");
  const [findingEvidence, setFindingEvidence] = useState("");
  const [savingFinding, setSavingFinding] = useState(false);

  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editFindingClassification, setEditFindingClassification] = useState("");
  const [editFindingDescription, setEditFindingDescription] = useState("");
  const [editFindingEvidence, setEditFindingEvidence] = useState("");
  const [savingEditFinding, setSavingEditFinding] = useState(false);
  const [deletingFindingId, setDeletingFindingId] = useState<string | null>(null);
  const [confirmDeleteFindingId, setConfirmDeleteFindingId] = useState<string | null>(null);

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
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/audits/${auditId}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erro ao excluir"); }
      toast.success("Auditoria excluída com sucesso");
      router.push(`/${tenant.slug}/audits`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir";
      setError(message);
      toast.error(message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFinding(true);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/audits/${auditId}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classification: findingClassification,
          description: findingDescription,
          evidence: findingEvidence || null,
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erro ao adicionar constatação"); }
      setShowAddFinding(false);
      setFindingClassification("observation");
      setFindingDescription("");
      setFindingEvidence("");
      fetchAudit();
      toast.success("Constatação adicionada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao adicionar";
      setError(message);
      toast.error(message);
    } finally { setSavingFinding(false); }
  };

  const startEditFinding = (f: FindingWithRelations) => {
    setEditingFindingId(f.id);
    setEditFindingClassification(f.classification);
    setEditFindingDescription(f.description);
    setEditFindingEvidence(f.evidence || "");
  };

  const handleSaveEditFinding = async () => {
    if (!editingFindingId) return;
    setSavingEditFinding(true);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/audits/${auditId}/findings/${editingFindingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classification: editFindingClassification,
          description: editFindingDescription,
          evidence: editFindingEvidence || null,
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erro ao atualizar"); }
      setEditingFindingId(null);
      fetchAudit();
      toast.success("Constatação atualizada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar constatação";
      setError(message);
      toast.error(message);
    } finally { setSavingEditFinding(false); }
  };

  const handleDeleteFinding = async (findingId: string) => {
    setDeletingFindingId(findingId);
    setError("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/audits/${auditId}/findings/${findingId}`, {
        method: "DELETE",
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erro ao excluir"); }
      setConfirmDeleteFindingId(null);
      fetchAudit();
      toast.success("Constatação excluída com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir constatação";
      setError(message);
      toast.error(message);
    } finally { setDeletingFindingId(null); }
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

  const findings = audit.findings || [];
  const statusIndex = STATUSES.findIndex((s) => s.value === audit.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/${tenant.slug}/audits`}>
          <Button variant="ghost" size="icon-sm" className="mt-1"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-title-1 text-foreground-primary">{audit.title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={getStatusColor(audit.status)}>{getStatusLabel(audit.status)}</Badge>
            <Badge variant="bg-info-bg text-info-fg">{getAuditTypeLabel(audit.type)}</Badge>
            {audit.conclusion && (
              <Badge variant={getConclusionColor(audit.conclusion)}>{getConclusionLabel(audit.conclusion)}</Badge>
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

      {showDeleteConfirm && (
        <Card className="border-danger/30 bg-danger-bg/30">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-body-1 font-medium text-foreground-primary">Excluir esta auditoria?</p>
              <p className="text-body-2 text-foreground-secondary">Todas as constatações serão excluídas.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>Excluir</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Badge variant={getStatusColor("cancelled")}>Cancelada</Badge>
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
                <select value={editType} onChange={(e) => setEditType(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent">
                  {AUDIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent">
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
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
                <select value={editConclusion} onChange={(e) => setEditConclusion(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent">
                  {CONCLUSIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Observações</label>
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none" />
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
            {can("auditFinding", "create") && !showAddFinding && (
              <Button variant="outline" size="sm" onClick={() => setShowAddFinding(true)}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAddFinding && (
            <form onSubmit={handleAddFinding} className="mb-4 p-4 border border-stroke-secondary rounded-button space-y-3">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Classificação *</label>
                <select value={findingClassification} onChange={(e) => setFindingClassification(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent">
                  {CLASSIFICATIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição *</label>
                <textarea value={findingDescription} onChange={(e) => setFindingDescription(e.target.value)} required rows={2} placeholder="Descreva a constatação" className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">Evidência</label>
                <textarea value={findingEvidence} onChange={(e) => setFindingEvidence(e.target.value)} rows={2} placeholder="Evidência objetiva" className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddFinding(false)}>Cancelar</Button>
                <Button type="submit" size="sm" loading={savingFinding}>Salvar</Button>
              </div>
            </form>
          )}

          {findings.length === 0 && !showAddFinding ? (
            <div className="flex flex-col items-center py-8">
              <FileSearch className="h-10 w-10 text-foreground-tertiary mb-3" />
              <p className="text-body-1 text-foreground-primary mb-1">Nenhuma constatação registrada</p>
              <p className="text-body-2 text-foreground-secondary mb-3">Adicione constatações encontradas durante a auditoria</p>
              {can("auditFinding", "create") && (
                <Button variant="outline" size="sm" onClick={() => setShowAddFinding(true)}>
                  <Plus className="h-4 w-4" /> Adicionar primeira constatação
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {findings.map((f) => (
                <div key={f.id} className="p-3 rounded-button border border-stroke-secondary">
                  {editingFindingId === f.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-body-2 font-medium text-foreground-primary mb-1">Classificação</label>
                        <select value={editFindingClassification} onChange={(e) => setEditFindingClassification(e.target.value)} className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent">
                          {CLASSIFICATIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
                        <textarea value={editFindingDescription} onChange={(e) => setEditFindingDescription(e.target.value)} rows={2} className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none" />
                      </div>
                      <div>
                        <label className="block text-body-2 font-medium text-foreground-primary mb-1">Evidência</label>
                        <textarea value={editFindingEvidence} onChange={(e) => setEditFindingEvidence(e.target.value)} rows={2} className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingFindingId(null)}>Cancelar</Button>
                        <Button size="sm" onClick={handleSaveEditFinding} loading={savingEditFinding}><Save className="h-3 w-3" /> Salvar</Button>
                      </div>
                    </div>
                  ) : confirmDeleteFindingId === f.id ? (
                    <div className="flex items-center justify-between">
                      <p className="text-body-2 text-foreground-primary">Excluir esta constatação?</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteFindingId(null)}>Não</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteFinding(f.id)} loading={deletingFindingId === f.id}>Sim</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <p className="text-body-1 text-foreground-primary">{f.description}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={getClassificationColor(f.classification)}>
                            {getClassificationLabel(f.classification)}
                          </Badge>
                          {can("auditFinding", "update") && (
                            <Button variant="ghost" size="icon-sm" onClick={() => startEditFinding(f)} className="text-foreground-tertiary hover:text-foreground-primary">
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          {can("auditFinding", "delete") && (
                            <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDeleteFindingId(f.id)} className="text-foreground-tertiary hover:text-danger-fg">
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
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
