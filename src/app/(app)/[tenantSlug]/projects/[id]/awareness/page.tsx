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
import { Plus, X, Pencil, Trash2, Megaphone, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { AwarenessCampaign, AwarenessParticipant } from "@/types";

const STATUSES: Record<string, { label: string; color: string }> = {
  planned: { label: "Planejada", color: "bg-surface-tertiary text-foreground-secondary" },
  in_progress: { label: "Em Andamento", color: "bg-brand-light text-brand" },
  completed: { label: "Concluída", color: "bg-success-bg text-success-fg" },
  cancelled: { label: "Cancelada", color: "bg-danger-bg text-danger-fg" },
};

const TYPES: Record<string, string> = {
  training: "Treinamento",
  workshop: "Workshop",
  e_learning: "E-Learning",
  awareness_session: "Sessão de Conscientização",
  phishing_simulation: "Simulação de Phishing",
  other: "Outro",
};

const PARTICIPANT_STATUSES: Record<string, { label: string; color: string }> = {
  invited: { label: "Convidado", color: "bg-surface-tertiary text-foreground-secondary" },
  confirmed: { label: "Confirmado", color: "bg-brand-light text-brand" },
  attended: { label: "Participou", color: "bg-success-bg text-success-fg" },
  completed: { label: "Concluído", color: "bg-success-bg text-success-fg" },
  absent: { label: "Ausente", color: "bg-danger-bg text-danger-fg" },
};

const TYPE_OPTIONS = Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v }));

const STATUS_OPTIONS = Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }));

const PARTICIPANT_STATUS_OPTIONS = Object.entries(PARTICIPANT_STATUSES).map(([k, v]) => ({ value: k, label: v.label }));

interface AwarenessFormData {
  title: string;
  description: string;
  type: string;
  audience: string;
  startDate: string;
  endDate: string;
  duration: string;
  location: string;
  instructor: string;
  notes: string;
  status: string;
}

const INITIAL_FORM: AwarenessFormData = {
  title: "", description: "", type: "training", audience: "",
  startDate: "", endDate: "", duration: "", location: "",
  instructor: "", notes: "", status: "planned",
};

export default function AwarenessPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [campaigns, setCampaigns] = useState<AwarenessCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<AwarenessParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AwarenessFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [partName, setPartName] = useState("");
  const [partEmail, setPartEmail] = useState("");
  const [addingPart, setAddingPart] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateForm = (field: keyof AwarenessFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchData = useCallback(() => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set("status", filterStatus);
    const qsStr = qs.toString() ? `?${qs.toString()}` : "";
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/awareness${qsStr}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([awrRes, projRes]) => {
        setCampaigns(awrRes.data || []);
        setProjectName(projRes.data?.name || "Projeto");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchParticipants = async (campaignId: string) => {
    if (expandedId === campaignId) { setExpandedId(null); return; }
    setExpandedId(campaignId);
    setLoadingParticipants(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/awareness/${campaignId}/participants`);
      const data = await res.json();
      setParticipants(data.data || []);
    } catch { setParticipants([]); }
    finally { setLoadingParticipants(false); }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: AwarenessCampaign) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      type: item.type,
      audience: item.targetAudience || "",
      startDate: new Date(item.startDate).toISOString().split("T")[0],
      endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : "",
      duration: item.duration ? String(item.duration) : "",
      location: item.location || "",
      instructor: item.instructor || "",
      notes: item.notes || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.startDate) { toast.error("Título e data de início são obrigatórios"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title, description: form.description || null, type: form.type, targetAudience: form.audience || null,
        startDate: form.startDate, endDate: form.endDate || null, duration: form.duration ? Number(form.duration) : null,
        location: form.location || null, instructor: form.instructor || null, notes: form.notes || null,
        status: form.status, projectId,
      };
      const url = editingId
        ? `/api/tenants/${tenant.slug}/projects/${projectId}/awareness/${editingId}`
        : `/api/tenants/${tenant.slug}/projects/${projectId}/awareness`;
      const res = await fetch(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      toast.success(editingId ? "Atualizado" : "Criado");
      resetForm(); fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try { await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/awareness/${itemToDelete}`, { method: "DELETE" }); toast.success("Excluído"); fetchData(); }
    catch { toast.error("Erro ao excluir"); }
    finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleAddParticipant = async (campaignId: string) => {
    if (!partName.trim() && !partEmail.trim()) { toast.error("Nome ou email é obrigatório"); return; }
    setAddingPart(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/awareness/${campaignId}/participants`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalName: partName || null, externalEmail: partEmail || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      toast.success("Participante adicionado");
      setPartName(""); setPartEmail(""); setShowAddParticipant(false);
      fetchParticipants(campaignId);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erro"); }
    finally { setAddingPart(false); }
  };

  const handleUpdateParticipant = async (campaignId: string, participantId: string, status: string) => {
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/awareness/${campaignId}/participants/${participantId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      fetchParticipants(campaignId); fetchData();
    } catch { toast.error("Erro ao atualizar"); }
  };

  const handleDeleteParticipant = async (campaignId: string, participantId: string) => {
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/awareness/${campaignId}/participants/${participantId}`, { method: "DELETE" });
      fetchParticipants(campaignId); fetchData();
    } catch { toast.error("Erro ao remover"); }
  };

  const stats = {
    total: campaigns.length,
    planned: campaigns.filter((c) => c.status === "planned").length,
    inProgress: campaigns.filter((c) => c.status === "in_progress").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
    avgCompletion: campaigns.length > 0 ? Math.round(campaigns.reduce((sum, c) => sum + (Number(c.completionRate) || 0), 0) / campaigns.length) : 0,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "Conscientização" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Programa de Conscientização</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">ISO 27001 cláusula 7.3</p>
        </div>
        {can("awarenessCampaign", "create") && (
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Nova</Button>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground-primary" },
            { label: "Planejadas", value: stats.planned, color: "text-foreground-secondary" },
            { label: "Em Andamento", value: stats.inProgress, color: "text-brand" },
            { label: "Concluídas", value: stats.completed, color: "text-success-fg" },
            { label: "Taxa Média", value: `${stats.avgCompletion}%`, color: "text-brand" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="p-3 text-center">
              <p className="text-caption-1 text-foreground-tertiary">{s.label}</p>
              <p className={`text-title-2 font-semibold ${s.color}`}>{s.value}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-body-2 text-foreground-tertiary">Status:</span>
        {["", "planned", "in_progress", "completed", "cancelled"].map((s) => (
          <button key={s} onClick={() => { setFilterStatus(s); setLoading(true); }}
            className={`px-2.5 py-1 rounded-button text-caption-1 transition-colors ${filterStatus === s ? "bg-brand text-white" : "bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary"}`}>
            {s === "" ? "Todos" : STATUSES[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <CardSkeleton />
      ) : campaigns.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Megaphone className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
          <p className="text-body-1 text-foreground-primary mb-1">Nenhuma campanha registrada</p>
          <p className="text-body-2 text-foreground-secondary">Crie campanhas de conscientização em segurança</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp) => {
            const rate = Number(camp.completionRate) || 0;
            const partCount = camp._count?.participants || 0;
            return (
              <Card key={camp.id} className="hover:shadow-card-glow transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-caption-1 font-medium text-brand">{camp.code}</span>
                        <Badge variant={STATUSES[camp.status]?.color}>{STATUSES[camp.status]?.label}</Badge>
                        <Badge className="text-caption-2 bg-surface-tertiary text-foreground-secondary">{TYPES[camp.type] || camp.type}</Badge>
                      </div>
                      <h3 className="text-body-1 font-medium text-foreground-primary">{camp.title}</h3>
                      {camp.description && <p className="text-body-2 text-foreground-secondary mt-1 line-clamp-2">{camp.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {can("awarenessCampaign", "update") && (
                        <button onClick={() => openEdit(camp)} className="p-1.5 rounded hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      )}
                      {can("awarenessCampaign", "delete") && (
                        <button onClick={() => { setItemToDelete(camp.id); setShowDeleteConfirm(true); }} className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-caption-1 text-foreground-tertiary">
                    <span>{formatDate(camp.startDate)}{camp.endDate ? ` - ${formatDate(camp.endDate)}` : ""}</span>
                    {camp.duration && <span>{camp.duration} min</span>}
                    <span>{partCount} participante{partCount !== 1 ? "s" : ""}</span>
                    {camp.responsible && <span>Resp: {camp.responsible.name}</span>}
                  </div>

                  {partCount > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-caption-1 mb-1">
                        <span className="text-foreground-tertiary">Conclusão</span>
                        <span className="text-foreground-secondary">{rate}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-tertiary rounded-full">
                        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  )}

                  <button onClick={() => fetchParticipants(camp.id)} className="flex items-center gap-1 text-caption-1 text-brand hover:text-brand-hover">
                    {expandedId === camp.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {expandedId === camp.id ? "Ocultar" : "Ver"} participantes
                  </button>

                  {expandedId === camp.id && (
                    <div className="border-t border-stroke-secondary pt-3 space-y-3">
                      {can("awarenessCampaign", "update") && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setShowAddParticipant(!showAddParticipant)}>
                            <UserPlus className="h-3.5 w-3.5" /> Adicionar
                          </Button>
                        </div>
                      )}
                      {showAddParticipant && (
                        <div className="flex items-center gap-2 p-3 bg-surface-secondary rounded-button">
                          <Input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Nome" className="flex-1" />
                          <Input value={partEmail} onChange={(e) => setPartEmail(e.target.value)} placeholder="Email" className="flex-1" />
                          <Button size="sm" onClick={() => handleAddParticipant(camp.id)} loading={addingPart}>Add</Button>
                          <button onClick={() => setShowAddParticipant(false)} className="text-foreground-tertiary"><X className="h-4 w-4" /></button>
                        </div>
                      )}
                      {loadingParticipants ? (
                        <CardSkeleton lines={2} />
                      ) : participants.length === 0 ? (
                        <p className="text-body-2 text-foreground-tertiary text-center py-3">Nenhum participante</p>
                      ) : (
                        <table className="w-full text-body-2">
                          <thead>
                            <tr className="border-b border-stroke-secondary">
                              <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-3 py-2">Nome</th>
                              <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-3 py-2">Email</th>
                              <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-3 py-2">Status</th>
                              <th className="text-left text-caption-1 font-medium text-foreground-tertiary px-3 py-2">Nota</th>
                              <th className="w-16"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants.map((p) => (
                              <tr key={p.id} className="border-b border-stroke-secondary last:border-0">
                                <td className="px-3 py-2 text-foreground-primary">{p.user?.name || p.externalName || "—"}</td>
                                <td className="px-3 py-2 text-foreground-secondary">{p.user?.email || p.externalEmail || "—"}</td>
                                <td className="px-3 py-2">
                                  {can("awarenessCampaign", "update") ? (
                                    <Select
                                      value={p.status}
                                      onChange={(e) => handleUpdateParticipant(camp.id, p.id, e.target.value)}
                                      options={PARTICIPANT_STATUS_OPTIONS}
                                      className="h-7 !text-caption-1"
                                    />
                                  ) : (
                                    <Badge variant={PARTICIPANT_STATUSES[p.status]?.color}>{PARTICIPANT_STATUSES[p.status]?.label}</Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-foreground-secondary">{p.score != null ? Number(p.score) : "—"}</td>
                                <td className="px-3 py-2">
                                  {can("awarenessCampaign", "update") && (
                                    <button onClick={() => handleDeleteParticipant(camp.id, p.id)} className="p-1 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={showForm}
        onOpenChange={(open) => { if (!open) resetForm(); }}
        title={`${editingId ? "Editar" : "Nova"} Campanha`}
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Título *</label>
            <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Ex: Treinamento de Phishing Q1 2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Tipo *</label>
              <Select value={form.type} onChange={(e) => updateForm("type", e.target.value)} options={TYPE_OPTIONS} />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Público-alvo</label>
              <Input value={form.audience} onChange={(e) => updateForm("audience", e.target.value)} placeholder="Ex: Todos os colaboradores" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Data Início *</label>
              <Input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Data Fim</label>
              <Input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Duração (min)</label>
              <Input type="number" value={form.duration} onChange={(e) => updateForm("duration", e.target.value)} />
            </div>
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Local</label>
              <Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="Ex: Sala de treinamento" />
            </div>
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Instrutor</label>
            <Input value={form.instructor} onChange={(e) => updateForm("instructor", e.target.value)} />
          </div>
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
            <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className="h-16 resize-none" />
          </div>
          {editingId && (
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
              <Select value={form.status} onChange={(e) => updateForm("status", e.target.value)} options={STATUS_OPTIONS} />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editingId ? "Salvar" : "Criar"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir campanha"
        description="Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
