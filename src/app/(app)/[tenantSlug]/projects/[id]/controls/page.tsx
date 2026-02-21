"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Shield,
  Plus,
  X,
  ChevronDown,
  Trash2,
} from "lucide-react";

interface StandardControl {
  id: string;
  code: string;
  title: string;
  domain: string | null;
}

interface ProjectControl {
  id: string;
  status: string;
  maturity: number;
  implementationNotes: string | null;
  control: { id: string; code: string; title: string; domain: string | null };
  responsible: { id: string; name: string } | null;
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Nao Iniciado" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "implemented", label: "Implementado" },
  { value: "verified", label: "Verificado" },
  { value: "nonconforming", label: "Nao Conforme" },
];

function getCtrlStatusColor(status: string): string {
  const c: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    implemented: "bg-brand-light text-brand",
    verified: "bg-success-bg text-success-fg",
    nonconforming: "bg-danger-bg text-danger-fg",
  };
  return c[status] || "bg-gray-100 text-gray-800";
}

function getCtrlStatusLabel(status: string): string {
  const l: Record<string, string> = {
    not_started: "Nao Iniciado",
    in_progress: "Em Andamento",
    implemented: "Implementado",
    verified: "Verificado",
    nonconforming: "Nao Conforme",
  };
  return l[status] || status;
}

const MATURITY_LABELS = ["Inexistente", "Inicial", "Definido", "Gerenciado", "Otimizado"];

export default function ControlsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [controls, setControls] = useState<ProjectControl[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [availableControls, setAvailableControls] = useState<StandardControl[]>([]);
  const [selectedControlId, setSelectedControlId] = useState("");
  const [adding, setAdding] = useState(false);
  const [projectStandards, setProjectStandards] = useState<{ id: string; code: string; name: string }[]>([]);
  const [selectedStandardId, setSelectedStandardId] = useState("");

  const fetchControls = () => {
    fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/controls`)
      .then((r) => r.json())
      .then((res) => setControls(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchControls();
    fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`)
      .then((r) => r.json())
      .then((res) => {
        const stds = (res.data?.standards || []).map((ps: { standard: { id: string; code: string; name: string } }) => ps.standard);
        setProjectStandards(stds);
        if (stds.length > 0) setSelectedStandardId(stds[0].id);
      })
      .catch(() => {});
  }, [tenant.slug, projectId]);

  useEffect(() => {
    if (!selectedStandardId) return;
    fetch(`/api/standards/${selectedStandardId}/controls`)
      .then((r) => r.json())
      .then((res) => setAvailableControls(res.data || []))
      .catch(() => setAvailableControls([]));
  }, [selectedStandardId]);

  const existingControlIds = new Set(controls.map((c) => c.control.id));
  const filteredControls = availableControls.filter((c) => !existingControlIds.has(c.id));

  const handleAdd = async () => {
    if (!selectedControlId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/controls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controlId: selectedControlId }),
      });
      if (!res.ok) throw new Error();
      setSelectedControlId("");
      setShowAdd(false);
      setLoading(true);
      fetchControls();
    } catch {
      /* ignore */
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (ctrlId: string) => {
    if (!confirm("Remover este controle do projeto?")) return;
    setControls((prev) => prev.filter((c) => c.id !== ctrlId));
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/controls`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controlId: ctrlId }),
      });
    } catch {
      fetchControls();
    }
  };

  const handleStatusChange = async (ctrlId: string, newStatus: string) => {
    setControls((prev) =>
      prev.map((c) => (c.id === ctrlId ? { ...c, status: newStatus } : c))
    );
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/controls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ctrlId, status: newStatus }),
      });
    } catch {
      fetchControls();
    }
  };

  const stats = {
    total: controls.length,
    verified: controls.filter((c) => c.status === "verified").length,
    implemented: controls.filter((c) => c.status === "implemented").length,
    inProgress: controls.filter((c) => c.status === "in_progress").length,
    nc: controls.filter((c) => c.status === "nonconforming").length,
  };
  const progressPct = stats.total > 0 ? Math.round(((stats.verified + stats.implemented) / stats.total) * 100) : 0;

  // Group by domain
  const grouped = controls.reduce<Record<string, ProjectControl[]>>((acc, ctrl) => {
    const domain = ctrl.control.domain || "Outros";
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(ctrl);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${tenant.slug}/projects/${projectId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-title-1 text-foreground-primary">Controles</h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              Controles do Anexo A aplicaveis ao projeto
            </p>
          </div>
        </div>
        {can("control", "create") && (
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4" />
            Importar Controle
          </Button>
        )}
      </div>

      {/* Progress */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-body-2 text-foreground-secondary">
                Progresso: {stats.verified + stats.implemented} de {stats.total} ({progressPct}%)
              </p>
              <div className="flex gap-3 text-caption-1">
                <span className="text-success-fg">{stats.verified} verificado</span>
                <span className="text-brand">{stats.implemented} implementado</span>
                <span className="text-blue-600">{stats.inProgress} em andamento</span>
                {stats.nc > 0 && <span className="text-danger-fg">{stats.nc} NC</span>}
              </div>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-title-3 text-foreground-primary">Importar Controle</h2>
              <button onClick={() => setShowAdd(false)} className="text-foreground-tertiary hover:text-foreground-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectStandards.length === 0 ? (
              <p className="text-body-2 text-foreground-tertiary">
                Nenhuma norma associada ao projeto.
              </p>
            ) : (
              <>
                {projectStandards.length > 1 && (
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Norma</label>
                    <select
                      value={selectedStandardId}
                      onChange={(e) => setSelectedStandardId(e.target.value)}
                      className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    >
                      {projectStandards.map((s) => (
                        <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">Controle</label>
                  <select
                    value={selectedControlId}
                    onChange={(e) => setSelectedControlId(e.target.value)}
                    className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="">Selecionar controle...</option>
                    {filteredControls.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
                  <Button onClick={handleAdd} loading={adding} disabled={!selectedControlId}>
                    Importar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Controls list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface-primary rounded-card animate-pulse" />
          ))}
        </div>
      ) : controls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhum controle importado</p>
            <p className="text-body-2 text-foreground-secondary">
              Importe controles das normas associadas ao projeto
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([domain, domainControls]) => (
            <Card key={domain}>
              <CardHeader>
                <h3 className="text-body-1 font-medium text-foreground-primary">
                  {domain} ({domainControls.length})
                </h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stroke-secondary bg-surface-tertiary">
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-4">Codigo</th>
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-4">Titulo</th>
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-4 w-40">Status</th>
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-4 w-32">Maturidade</th>
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-4">Responsavel</th>
                        {can("control", "delete") && (
                          <th className="text-right text-caption-1 font-medium text-foreground-tertiary py-2 px-4 w-16"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {domainControls.map((ctrl) => (
                        <tr key={ctrl.id} className="border-b border-stroke-secondary last:border-0 hover:bg-surface-secondary transition-colors">
                          <td className="py-2.5 px-4 text-body-2 font-medium text-brand whitespace-nowrap">
                            {ctrl.control.code}
                          </td>
                          <td className="py-2.5 px-4">
                            <p className="text-body-2 text-foreground-primary">{ctrl.control.title}</p>
                            {ctrl.implementationNotes && (
                              <p className="text-caption-1 text-foreground-tertiary mt-0.5 line-clamp-1">
                                {ctrl.implementationNotes}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {can("control", "update") ? (
                              <div className="relative">
                                <select
                                  value={ctrl.status}
                                  onChange={(e) => handleStatusChange(ctrl.id, e.target.value)}
                                  className="h-8 w-full appearance-none rounded border border-stroke-primary bg-surface-primary pl-2 pr-7 text-caption-1 text-foreground-primary focus:outline-none focus:ring-1 focus:ring-brand"
                                >
                                  {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground-tertiary pointer-events-none" />
                              </div>
                            ) : (
                              <Badge variant={getCtrlStatusColor(ctrl.status)}>
                                {getCtrlStatusLabel(ctrl.status)}
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-1">
                              {[0, 1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`h-2.5 w-5 rounded-sm ${
                                    level <= ctrl.maturity ? "bg-brand" : "bg-surface-tertiary"
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-caption-1 text-foreground-tertiary">
                                {MATURITY_LABELS[ctrl.maturity]}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-body-2 text-foreground-secondary">
                            {ctrl.responsible?.name || "—"}
                          </td>
                          {can("control", "delete") && (
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleRemove(ctrl.id)}
                                className="p-1.5 rounded hover:bg-danger-bg text-foreground-tertiary hover:text-danger-fg transition-colors"
                                title="Remover controle"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
