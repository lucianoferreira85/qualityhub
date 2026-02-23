"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  FileSpreadsheet,
  Check,
  X,
  Minus,
  Download,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { generateSoaReport } from "@/lib/pdf-reports/soa-report";

interface StandardControl {
  id: string;
  code: string;
  title: string;
  domain: string | null;
}

interface SoaEntry {
  id: string;
  applicable: boolean;
  justification: string | null;
  implementationStatus: string | null;
  control: { id: string; code: string; title: string; domain: string | null };
}

const IMPL_STATUS_OPTIONS = [
  { value: "not_implemented", label: "Nao Implementado" },
  { value: "partially_implemented", label: "Parcialmente" },
  { value: "fully_implemented", label: "Implementado" },
];

function getImplColor(status: string | null): string {
  const c: Record<string, string> = {
    not_implemented: "bg-danger-bg text-danger-fg",
    partially_implemented: "bg-warning-bg text-warning-fg",
    fully_implemented: "bg-success-bg text-success-fg",
  };
  return c[status || ""] || "bg-gray-100 text-gray-800";
}

function getImplLabel(status: string | null): string {
  const l: Record<string, string> = {
    not_implemented: "Nao Implementado",
    partially_implemented: "Parcialmente",
    fully_implemented: "Implementado",
  };
  return l[status || ""] || "—";
}

export default function SoaPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [entries, setEntries] = useState<SoaEntry[]>([]);
  const [allControls, setAllControls] = useState<StandardControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectStandards, setProjectStandards] = useState<{ id: string; code: string; name: string }[]>([]);
  const [selectedStandardId, setSelectedStandardId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [projectName, setProjectName] = useState("");

  const standardSelectOptions = projectStandards.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));

  const fetchEntries = () => {
    fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/soa`)
      .then((r) => r.json())
      .then((res) => setEntries(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntries();
    fetch(`/api/tenants/${tenant.slug}/projects/${projectId}`)
      .then((r) => r.json())
      .then((res) => {
        setProjectName(res.data?.name || "Projeto");
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
      .then((res) => setAllControls(res.data || []))
      .catch(() => setAllControls([]));
  }, [selectedStandardId]);

  const entryMap = new Map(entries.map((e) => [e.control.id, e]));

  const handleGenerateAll = async () => {
    if (!can("soaEntry", "create")) return;
    setGenerating(true);
    const missingControls = allControls.filter((c) => !entryMap.has(c.id));
    try {
      for (const ctrl of missingControls) {
        await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/soa`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ controlId: ctrl.id, applicable: true }),
        });
      }
      setLoading(true);
      fetchEntries();
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleApplicable = async (controlId: string, currentApplicable: boolean) => {
    if (!can("soaEntry", "create")) return;
    // Optimistic
    setEntries((prev) =>
      prev.map((e) =>
        e.control.id === controlId ? { ...e, applicable: !currentApplicable } : e
      )
    );
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/soa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controlId, applicable: !currentApplicable }),
      });
    } catch {
      fetchEntries();
    }
  };

  const handleImplChange = async (controlId: string, newStatus: string) => {
    if (!can("soaEntry", "create")) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.control.id === controlId ? { ...e, implementationStatus: newStatus } : e
      )
    );
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/soa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controlId, implementationStatus: newStatus }),
      });
    } catch {
      fetchEntries();
    }
  };

  const handleJustificationChange = async (controlId: string, justification: string) => {
    if (!can("soaEntry", "create")) return;
    try {
      await fetch(`/api/tenants/${tenant.slug}/projects/${projectId}/soa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controlId, justification: justification || null }),
      });
    } catch {
      /* ignore */
    }
  };

  const stats = {
    total: entries.length,
    applicable: entries.filter((e) => e.applicable).length,
    notApplicable: entries.filter((e) => !e.applicable).length,
    implemented: entries.filter((e) => e.applicable && e.implementationStatus === "fully_implemented").length,
    partial: entries.filter((e) => e.applicable && e.implementationStatus === "partially_implemented").length,
  };
  const applicableTotal = stats.applicable;
  const implPct = applicableTotal > 0 ? Math.round((stats.implemented / applicableTotal) * 100) : 0;

  // Group by domain
  const grouped: Record<string, { control: StandardControl; entry: SoaEntry | undefined }[]> = {};
  allControls.forEach((ctrl) => {
    const domain = ctrl.domain || "Outros";
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push({ control: ctrl, entry: entryMap.get(ctrl.id) });
  });

  const hasMissing = allControls.some((c) => !entryMap.has(c.id));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Projetos", href: `/${tenant.slug}/projects` },
        { label: projectName, href: `/${tenant.slug}/projects/${projectId}` },
        { label: "SoA" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Declaracao de Aplicabilidade</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Statement of Applicability (SoA) do projeto
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => {
              const std = projectStandards.find((s) => s.id === selectedStandardId);
              generateSoaReport({
                standardName: std ? `${std.code} - ${std.name}` : "Norma",
                entries,
              }, tenant.name);
            }}>
              <Download className="h-4 w-4" /> Exportar PDF
            </Button>
          )}
          {can("soaEntry", "create") && hasMissing && allControls.length > 0 && (
            <Button onClick={handleGenerateAll} loading={generating}>
              <FileSpreadsheet className="h-4 w-4" />
              Gerar SoA Completa
            </Button>
          )}
        </div>
      </div>

      {/* Standard selector */}
      {projectStandards.length > 1 && (
        <div className="max-w-sm">
          <Select
            value={selectedStandardId}
            onChange={(e) => setSelectedStandardId(e.target.value)}
            options={standardSelectOptions}
          />
        </div>
      )}

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-caption-1 text-foreground-tertiary">Total</p>
              <p className="text-title-3 font-semibold text-foreground-primary">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-caption-1 text-foreground-tertiary">Aplicavel</p>
              <p className="text-title-3 font-semibold text-success-fg">{stats.applicable}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-caption-1 text-foreground-tertiary">Nao Aplicavel</p>
              <p className="text-title-3 font-semibold text-foreground-tertiary">{stats.notApplicable}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-caption-1 text-foreground-tertiary">Implementado</p>
              <p className="text-title-3 font-semibold text-brand">{stats.implemented}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-caption-1 text-foreground-tertiary">% Impl.</p>
              <p className="text-title-3 font-semibold text-brand">{implPct}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SOA Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : allControls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
            <p className="text-body-1 text-foreground-primary mb-1">Nenhum controle disponivel</p>
            <p className="text-body-2 text-foreground-secondary">
              {projectStandards.length === 0
                ? "Associe normas ao projeto primeiro"
                : "A norma selecionada nao possui controles cadastrados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([domain, items]) => (
            <Card key={domain}>
              <CardHeader>
                <h3 className="text-body-1 font-medium text-foreground-primary">
                  {domain} ({items.length})
                </h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stroke-secondary bg-surface-tertiary">
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-4 w-24">Codigo</th>
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-4">Controle</th>
                        <th className="text-center text-caption-1 font-medium text-foreground-tertiary py-2 px-4 w-20">Aplicavel</th>
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-4 w-36">Implementacao</th>
                        <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-4 w-48">Justificativa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(({ control, entry }) => {
                        const isApplicable = entry?.applicable !== false;
                        return (
                          <tr
                            key={control.id}
                            className={`border-b border-stroke-secondary last:border-0 transition-colors ${
                              entry && !entry.applicable ? "opacity-50" : "hover:bg-surface-secondary"
                            }`}
                          >
                            <td className="py-2.5 px-4 text-body-2 font-medium text-brand whitespace-nowrap">
                              {control.code}
                            </td>
                            <td className="py-2.5 px-4 text-body-2 text-foreground-primary">
                              {control.title}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {entry ? (
                                <button
                                  onClick={() => handleToggleApplicable(control.id, entry.applicable)}
                                  className={`h-7 w-7 rounded border-2 flex items-center justify-center mx-auto transition-colors ${
                                    entry.applicable
                                      ? "bg-success-bg border-success-fg text-success-fg"
                                      : "bg-surface-tertiary border-stroke-primary text-foreground-tertiary"
                                  }`}
                                  disabled={!can("soaEntry", "create")}
                                >
                                  {entry.applicable ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </button>
                              ) : (
                                <Minus className="h-4 w-4 text-foreground-tertiary mx-auto" />
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              {entry && isApplicable ? (
                                can("soaEntry", "create") ? (
                                  <Select
                                    value={entry.implementationStatus || ""}
                                    onChange={(e) => handleImplChange(control.id, e.target.value)}
                                    options={IMPL_STATUS_OPTIONS}
                                    placeholder="Selecionar..."
                                    className="h-8 text-caption-1"
                                  />
                                ) : (
                                  <Badge variant={getImplColor(entry.implementationStatus)}>
                                    {getImplLabel(entry.implementationStatus)}
                                  </Badge>
                                )
                              ) : (
                                <span className="text-caption-1 text-foreground-tertiary">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              {entry ? (
                                can("soaEntry", "create") ? (
                                  <input
                                    type="text"
                                    defaultValue={entry.justification || ""}
                                    onBlur={(e) => handleJustificationChange(control.id, e.target.value)}
                                    className="h-8 w-full rounded border border-stroke-primary bg-surface-primary px-2 text-caption-1 text-foreground-primary focus:outline-none focus:ring-1 focus:ring-brand"
                                    placeholder="Justificativa..."
                                  />
                                ) : (
                                  <span className="text-caption-1 text-foreground-secondary">
                                    {entry.justification || "—"}
                                  </span>
                                )
                              ) : (
                                <span className="text-caption-1 text-foreground-tertiary">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
