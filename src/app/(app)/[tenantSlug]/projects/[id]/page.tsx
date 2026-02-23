"use client";

import { useEffect, useState, useCallback, useMemo, type ElementType } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar } from "@/components/ui/avatar";
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
  Target,
  Handshake,
  Pencil,
  Trash2,
  X,
  Save,
  Users,
  Building2,
  BookOpen,
  Calendar,
  Plus,
  Globe,
  MessageSquare,
  GraduationCap,
  Crosshair,
  ScrollText,
  Megaphone,
  Lightbulb,
  ShieldAlert,
  Server,
  Truck,
  GitPullRequest,
  Download,
  Layout,
  ClipboardCheck,
  Wrench,
  HeadphonesIcon,
  Activity,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Project } from "@/types";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tabs } from "@/components/ui/tabs";
import { generateProjectReport } from "@/lib/pdf-reports/project-report";

type ModuleCategory = "overview" | "planning" | "operations" | "support" | "monitoring";

const MODULE_CATEGORIES: Record<ModuleCategory, { label: string; moduleLabels: string[] }> = {
  overview: {
    label: "Visao Geral",
    moduleLabels: [],
  },
  planning: {
    label: "Planejamento",
    moduleLabels: [
      "Contexto",
      "Partes Interessadas",
      "Escopo",
      "Objetivos",
      "Políticas",
      "Análise de Gaps",
    ],
  },
  operations: {
    label: "Operacao",
    moduleLabels: [
      "Requisitos",
      "Controles",
      "SoA",
      "Riscos",
      "Ativos",
      "Fornecedores",
      "Mudanças",
    ],
  },
  support: {
    label: "Suporte",
    moduleLabels: [
      "Documentos",
      "Competências",
      "Conscientização",
      "Comunicação",
    ],
  },
  monitoring: {
    label: "Monitoramento",
    moduleLabels: [
      "Auditorias",
      "Não Conformidades",
      "Planos de Ação",
      "Indicadores",
      "Incidentes",
      "Melhoria Contínua",
    ],
  },
};

interface AvailableStandard {
  id: string;
  code: string;
  name: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const activeTab = (searchParams.get("tab") as ModuleCategory) || "overview";
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
      toast.success("Projeto atualizado com sucesso");
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
        `/api/tenants/${tenant.slug}/projects/${projectId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir projeto");
      }
      toast.success("Projeto excluído com sucesso");
      router.push(`/${tenant.slug}/projects`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir";
      setError(message);
      toast.error(message);
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

  const [removeStandardId, setRemoveStandardId] = useState<string | null>(null);

  const handleRemoveStandard = async (standardId: string) => {
    setRemoveStandardId(null);
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/standards?id=${standardId}`, {
        method: "DELETE",
      });
      fetchProject();
    } catch { /* ignore */ }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const counts = (project as any)?._count || {};

  const modules = useMemo(() => {
    const pid = project?.id || projectId;
    return [
      {
        label: "Requisitos",
        href: `/${tenant.slug}/projects/${pid}/requirements`,
        icon: ClipboardList,
        description: "Cláusulas e requisitos normativos",
        count: counts.requirements,
      },
      {
        label: "Controles",
        href: `/${tenant.slug}/projects/${pid}/controls`,
        icon: Shield,
        description: "Controles do Anexo A",
        count: counts.controls,
      },
      {
        label: "SoA",
        href: `/${tenant.slug}/projects/${pid}/soa`,
        icon: FileSpreadsheet,
        description: "Declaração de Aplicabilidade",
      },
      {
        label: "Riscos",
        href: `/${tenant.slug}/projects/${pid}/risks`,
        icon: RiskIcon,
        description: "Avaliação e tratamento de riscos",
        count: counts.risks,
      },
      {
        label: "Não Conformidades",
        href: `/${tenant.slug}/projects/${pid}/nonconformities`,
        icon: AlertCircle,
        description: "Gestão de não conformidades",
        count: counts.nonconformities,
      },
      {
        label: "Planos de Ação",
        href: `/${tenant.slug}/projects/${pid}/action-plans`,
        icon: CheckCircle2,
        description: "Ações corretivas e preventivas",
        count: counts.actionPlans,
      },
      {
        label: "Auditorias",
        href: `/${tenant.slug}/projects/${pid}/audits`,
        icon: FileCheck,
        description: "Auditorias internas e externas",
        count: counts.audits,
      },
      {
        label: "Documentos",
        href: `/${tenant.slug}/projects/${pid}/documents`,
        icon: FileSpreadsheet,
        description: "Políticas, procedimentos e registros",
        count: counts.documents,
      },
      {
        label: "Indicadores",
        href: `/${tenant.slug}/projects/${pid}/indicators`,
        icon: BarChart3,
        description: "KPIs e métricas de desempenho",
      },
      {
        label: "Contexto",
        href: `/${tenant.slug}/projects/${pid}/context`,
        icon: Target,
        description: "Análise SWOT - ISO 27001 cláusula 4.1",
      },
      {
        label: "Partes Interessadas",
        href: `/${tenant.slug}/projects/${pid}/interested-parties`,
        icon: Handshake,
        description: "Stakeholders - ISO 27001 cláusula 4.2",
      },
      {
        label: "Análise de Gaps",
        href: `/${tenant.slug}/projects/${pid}/gap-analysis`,
        icon: BarChart3,
        description: "Maturidade e conformidade do projeto",
      },
      {
        label: "Escopo",
        href: `/${tenant.slug}/projects/${pid}/scope`,
        icon: Globe,
        description: "Escopo do SGSI - ISO 27001 cláusula 4.3",
      },
      {
        label: "Comunicação",
        href: `/${tenant.slug}/projects/${pid}/communication-plan`,
        icon: MessageSquare,
        description: "Plano de Comunicação - ISO 27001 cláusula 7.4",
      },
      {
        label: "Competências",
        href: `/${tenant.slug}/projects/${pid}/competences`,
        icon: GraduationCap,
        description: "Gestão de Competências - ISO 27001 cláusula 7.2",
      },
      {
        label: "Objetivos",
        href: `/${tenant.slug}/projects/${pid}/objectives`,
        icon: Crosshair,
        description: "Objetivos de Segurança - ISO 27001 cláusula 6.2",
        count: counts.securityObjectives,
      },
      {
        label: "Políticas",
        href: `/${tenant.slug}/projects/${pid}/policies`,
        icon: ScrollText,
        description: "Gestão de Políticas - ISO 27001 cláusula 5.2",
        count: counts.policies,
      },
      {
        label: "Conscientização",
        href: `/${tenant.slug}/projects/${pid}/awareness`,
        icon: Megaphone,
        description: "Programa de Conscientização - ISO 27001 cláusula 7.3",
        count: counts.awarenessCampaigns,
      },
      {
        label: "Melhoria Contínua",
        href: `/${tenant.slug}/projects/${pid}/improvements`,
        icon: Lightbulb,
        description: "Oportunidades de Melhoria - ISO 27001 cláusula 10.3",
        count: counts.improvementOpportunities,
      },
      {
        label: "Incidentes",
        href: `/${tenant.slug}/projects/${pid}/incidents`,
        icon: ShieldAlert,
        description: "Gestão de Incidentes - ISO 27001 A.5.24-A.5.28",
        count: counts.securityIncidents,
      },
      {
        label: "Ativos",
        href: `/${tenant.slug}/projects/${pid}/assets`,
        icon: Server,
        description: "Ativos de Informação - ISO 27001 A.5.9-A.5.11",
        count: counts.informationAssets,
      },
      {
        label: "Fornecedores",
        href: `/${tenant.slug}/projects/${pid}/suppliers`,
        icon: Truck,
        description: "Gestão de Fornecedores - ISO 27001 A.5.19-A.5.23",
        count: counts.suppliers,
      },
      {
        label: "Mudanças",
        href: `/${tenant.slug}/projects/${pid}/changes`,
        icon: GitPullRequest,
        description: "Gestão de Mudanças - ISO 27001 cláusula 6.3",
        count: counts.changeRequests,
      },
    ];
  }, [tenant.slug, project?.id, projectId, counts]);

  const handleTabChange = useCallback(
    (tab: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (tab === "overview") {
        p.delete("tab");
      } else {
        p.set("tab", tab);
      }
      const qs = p.toString();
      router.replace(`/${tenant.slug}/projects/${projectId}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, tenant.slug, projectId, searchParams]
  );

  const filteredModules = useMemo(() => {
    const cat = MODULE_CATEGORIES[activeTab];
    if (!cat || activeTab === "overview") return [];
    return modules.filter((m) => cat.moduleLabels.includes(m.label));
  }, [activeTab, modules]);

  const TAB_ICONS: Record<string, ElementType> = {
    overview: Layout,
    planning: ClipboardCheck,
    operations: Wrench,
    support: HeadphonesIcon,
    monitoring: Activity,
  };

  const tabItems = useMemo(() => {
    return (Object.entries(MODULE_CATEGORIES) as [ModuleCategory, typeof MODULE_CATEGORIES[ModuleCategory]][]).map(
      ([key, cat]) => {
        let count: number | undefined;
        if (key !== "overview") {
          const catModules = modules.filter((m) => cat.moduleLabels.includes(m.label));
          const total = catModules.reduce((sum, m) => sum + (m.count ?? 0), 0);
          if (total > 0) count = total;
        }
        return {
          value: key,
          label: cat.label,
          icon: TAB_ICONS[key],
          count,
        };
      }
    );
  }, [modules]);

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

  const standards = project.standards || [];
  const members = project.members || [];

  const statusOptions = [
    { value: "planning", label: "Planejamento" },
    { value: "in_progress", label: "Em Andamento" },
    { value: "completed", label: "Concluído" },
    { value: "archived", label: "Arquivado" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Projetos", href: `/${tenant.slug}/projects` }, { label: project.name }]} />
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
            <StatusBadge status={project.status} />
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
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  generateProjectReport(
                    {
                      name: project.name,
                      description: project.description || null,
                      status: project.status,
                      progress: Number(project.progress),
                      targetMaturity: project.targetMaturity || 3,
                      startDate: project.startDate,
                      endDate: project.endDate,
                      createdAt: project.createdAt,
                      client: project.client,
                      standards: standards.map((ps) => ({
                        standard: {
                          code: ps.standard?.code || "",
                          name: ps.standard?.name || "",
                        },
                      })),
                      members: members.map((m) => ({
                        role: m.role,
                        user: {
                          name: m.user?.name || "",
                          email: m.user?.email || "",
                        },
                      })),
                      _count: counts,
                    },
                    tenant.name
                  )
                }
              >
                <Download className="h-4 w-4" />
                Relatório PDF
              </Button>
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
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir projeto?"
        description="Esta ação não pode ser desfeita. Todos os dados relacionados serão perdidos."
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Remove standard confirmation */}
      <ConfirmDialog
        open={!!removeStandardId}
        onOpenChange={(open) => !open && setRemoveStandardId(null)}
        title="Remover norma?"
        description="Remover esta norma e seus requisitos/controles importados?"
        confirmLabel="Remover"
        onConfirm={() => removeStandardId && handleRemoveStandard(removeStandardId)}
      />

      {/* Edit form */}
      {editing && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Descrição
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="h-20"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Status
                </label>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  options={statusOptions}
                />
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
                        onClick={() => setRemoveStandardId(ps.standard?.id || ps.standardId)}
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
                <Select
                  value={selectedStandardId}
                  onChange={(e) => setSelectedStandardId(e.target.value)}
                  placeholder="Selecionar norma..."
                  options={allStandards
                    .filter((s) => !standards.some((ps) => (ps.standard?.id || ps.standardId) === s.id))
                    .map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
                />
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

      {/* Tabs */}
      <Tabs tabs={tabItems} value={activeTab} onChange={handleTabChange} />

      {/* Tab Content: Overview */}
      {activeTab === "overview" && (
        <>
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
                      <Avatar name={member.user?.name || "?"} />
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
        </>
      )}

      {/* Tab Content: Module categories */}
      {activeTab !== "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => (
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
      )}
    </div>
  );
}
