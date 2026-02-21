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
  ClipboardList,
  Shield,
  FileSpreadsheet,
  AlertTriangle as RiskIcon,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  BarChart3,
  Pencil,
  Trash2,
  X,
  Save,
  Users,
  Building2,
  BookOpen,
  Calendar,
  Plus,
} from "lucide-react";
import { getStatusColor, getStatusLabel, formatDate, getInitials } from "@/lib/utils";
import type { Project } from "@/types";

interface AvailableStandard {
  id: string;
  code: string;
  name: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  // Standards management
  const [showAddStandard, setShowAddStandard] = useState(false);
  const [allStandards, setAllStandards] = useState<AvailableStandard[]>([]);
  const [selectedStandardId, setSelectedStandardId] = useState("");
  const [addingStandard, setAddingStandard] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editProgress, setEditProgress] = useState(0);

  const fetchProject = useCallback(() => {
    fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`)
      .then((res) => res.json())
      .then((res) => {
        setProject(res.data);
        if (res.data) {
          setEditName(res.data.name);
          setEditDescription(res.data.description || "");
          setEditStatus(res.data.status);
          setEditStartDate(
            res.data.startDate
              ? new Date(res.data.startDate).toISOString().split("T")[0]
              : ""
          );
          setEditEndDate(
            res.data.endDate
              ? new Date(res.data.endDate).toISOString().split("T")[0]
              : ""
          );
          setEditProgress(Number(res.data.progress));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/projects/${projectId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            description: editDescription || null,
            status: editStatus,
            startDate: editStartDate || null,
            endDate: editEndDate || null,
            progress: editProgress,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar projeto");
      }
      setEditing(false);
      fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/projects/${projectId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir projeto");
      }
      router.push(`/${tenant.slug}/projects`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShowAddStandard = async () => {
    setShowAddStandard(true);
    if (allStandards.length === 0) {
      try {
        const res = await fetch("/api/standards");
        const data = await res.json();
        setAllStandards(data.data || []);
      } catch { /* ignore */ }
    }
  };

  const handleAddStandard = async () => {
    if (!selectedStandardId) return;
    setAddingStandard(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/standards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standardId: selectedStandardId }),
      });
      if (!res.ok) throw new Error();
      setSelectedStandardId("");
      setShowAddStandard(false);
      fetchProject();
    } catch { /* ignore */ }
    finally { setAddingStandard(false); }
  };

  const handleRemoveStandard = async (standardId: string) => {
    if (!confirm("Remover esta norma e seus requisitos/controles importados?")) return;
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/standards`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standardId }),
      });
      fetchProject();
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-title-3 text-foreground-primary">
          Projeto não encontrado
        </p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const counts = (project as any)._count || {};
  const standards = project.standards || [];
  const members = project.members || [];

  const modules = [
    {
      label: "Requisitos",
      href: `/${tenant.slug}/projects/${project.id}/requirements`,
      icon: ClipboardList,
      description: "Cláusulas e requisitos normativos",
      count: counts.requirements,
    },
    {
      label: "Controles",
      href: `/${tenant.slug}/projects/${project.id}/controls`,
      icon: Shield,
      description: "Controles do Anexo A",
      count: counts.controls,
    },
    {
      label: "SoA",
      href: `/${tenant.slug}/projects/${project.id}/soa`,
      icon: FileSpreadsheet,
      description: "Declaração de Aplicabilidade",
    },
    {
      label: "Riscos",
      href: `/${tenant.slug}/projects/${project.id}/risks`,
      icon: RiskIcon,
      description: "Avaliação e tratamento de riscos",
      count: counts.risks,
    },
    {
      label: "Não Conformidades",
      href: `/${tenant.slug}/projects/${project.id}/nonconformities`,
      icon: AlertCircle,
      description: "Gestão de não conformidades",
      count: counts.nonconformities,
    },
    {
      label: "Planos de Ação",
      href: `/${tenant.slug}/projects/${project.id}/action-plans`,
      icon: CheckCircle2,
      description: "Ações corretivas e preventivas",
      count: counts.actionPlans,
    },
    {
      label: "Auditorias",
      href: `/${tenant.slug}/projects/${project.id}/audits`,
      icon: FileCheck,
      description: "Auditorias internas e externas",
      count: counts.audits,
    },
    {
      label: "Documentos",
      href: `/${tenant.slug}/projects/${project.id}/documents`,
      icon: FileSpreadsheet,
      description: "Políticas, procedimentos e registros",
      count: counts.documents,
    },
    {
      label: "Indicadores",
      href: `/${tenant.slug}/projects/${project.id}/indicators`,
      icon: BarChart3,
      description: "KPIs e métricas de desempenho",
    },
  ];

  const statusOptions = [
    { value: "planning", label: "Planejamento" },
    { value: "in_progress", label: "Em Andamento" },
    { value: "completed", label: "Concluído" },
    { value: "archived", label: "Arquivado" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/${tenant.slug}/projects`}>
          <Button variant="ghost" size="icon-sm" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            {editing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-title-1 font-semibold max-w-md"
              />
            ) : (
              <h1 className="text-title-1 text-foreground-primary truncate">
                {project.name}
              </h1>
            )}
            <Badge variant={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
          {!editing && project.description && (
            <p className="text-body-1 text-foreground-secondary mt-1">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
              >
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
              {can("project", "update") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {can("project", "delete") && (
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
                Excluir projeto?
              </p>
              <p className="text-body-2 text-foreground-secondary">
                Esta ação não pode ser desfeita. Todos os dados relacionados
                serão perdidos.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleting}
              >
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit form */}
      {editing && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Descrição
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full h-20 px-3 py-2 rounded-input border border-stroke-primary bg-surface-primary text-body-1 text-foreground-primary placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Progresso (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Início
                </label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Término
                </label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress */}
        <Card>
          <CardContent className="p-5">
            <p className="text-caption-1 text-foreground-tertiary mb-1">
              Progresso
            </p>
            <p className="text-title-lg text-foreground-primary font-semibold">
              {Number(project.progress)}%
            </p>
            <div className="h-2 w-full bg-surface-tertiary rounded-full mt-2">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${Number(project.progress)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Period */}
        <Card>
          <CardContent className="p-5">
            <p className="text-caption-1 text-foreground-tertiary mb-1">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Período
              </span>
            </p>
            <p className="text-body-1 text-foreground-primary">
              {project.startDate
                ? formatDate(project.startDate)
                : "Não definido"}
            </p>
            {project.endDate && (
              <p className="text-body-2 text-foreground-secondary">
                até {formatDate(project.endDate)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Client */}
        <Card>
          <CardContent className="p-5">
            <p className="text-caption-1 text-foreground-tertiary mb-1">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Cliente
              </span>
            </p>
            <p className="text-body-1 text-foreground-primary">
              {project.client?.name || "Sem cliente vinculado"}
            </p>
          </CardContent>
        </Card>

        {/* Standards */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-caption-1 text-foreground-tertiary">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Normas
                </span>
              </p>
              {can("project", "update") && (
                <button
                  onClick={handleShowAddStandard}
                  className="text-brand hover:text-brand-hover"
                  title="Adicionar norma"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            {standards.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {standards.map((ps) => (
                  <span key={ps.id} className="inline-flex items-center gap-1 group">
                    <Badge className="text-[10px]">
                      {ps.standard?.code || "\u2014"}
                    </Badge>
                    {can("project", "update") && (
                      <button
                        onClick={() => handleRemoveStandard(ps.standard?.id || ps.standardId)}
                        className="hidden group-hover:inline text-foreground-tertiary hover:text-danger-fg"
                        title="Remover norma"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-body-2 text-foreground-tertiary">
                Nenhuma norma vinculada
              </p>
            )}
            {showAddStandard && (
              <div className="mt-3 pt-3 border-t border-stroke-secondary space-y-2">
                <select
                  value={selectedStandardId}
                  onChange={(e) => setSelectedStandardId(e.target.value)}
                  className="h-9 w-full rounded-input border border-stroke-primary bg-surface-primary px-2 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="">Selecionar norma...</option>
                  {allStandards
                    .filter((s) => !standards.some((ps) => (ps.standard?.id || ps.standardId) === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                </select>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowAddStandard(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleAddStandard} loading={addingStandard} disabled={!selectedStandardId}>
                    Adicionar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team */}
      {members.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-title-3 text-foreground-primary">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-foreground-tertiary" />
                Equipe ({members.length})
              </span>
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-button bg-surface-secondary"
                >
                  <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                    <span className="text-caption-1 font-medium text-white">
                      {getInitials(member.user?.name || "?")}
                    </span>
                  </div>
                  <div>
                    <p className="text-body-2 font-medium text-foreground-primary leading-tight">
                      {member.user?.name}
                    </p>
                    <p className="text-caption-2 text-foreground-tertiary">
                      {member.role === "owner"
                        ? "Responsável"
                        : member.role === "member"
                        ? "Membro"
                        : member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules */}
      <div>
        <h2 className="text-title-2 text-foreground-primary mb-4">Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Link key={mod.label} href={mod.href}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-all h-full">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="h-10 w-10 rounded-button bg-brand-light flex items-center justify-center flex-shrink-0">
                    <mod.icon className="h-5 w-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-title-3 text-foreground-primary">
                        {mod.label}
                      </p>
                      {mod.count !== undefined && mod.count > 0 && (
                        <Badge className="text-caption-2">{mod.count}</Badge>
                      )}
                    </div>
                    <p className="text-body-2 text-foreground-secondary">
                      {mod.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
