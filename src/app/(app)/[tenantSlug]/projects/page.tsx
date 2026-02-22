"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Plus, FolderKanban, Building2, Users, Filter } from "lucide-react";
import { getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Project } from "@/types";

const PROJECT_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "planning", label: "Planejamento" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluído" },
  { value: "archived", label: "Arquivado" },
];

export default function ProjectsPage() {
  const { tenant, can } = useTenant();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/projects${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setProjects(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterStatus, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Projetos</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie seus projetos de conformidade
          </p>
        </div>
        {can("project", "create") && (
          <Link href={`/${tenant.slug}/projects/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Projeto
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por projeto ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {filterStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterStatus(""); setPage(1); }}
              className="text-foreground-tertiary"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-5 w-3/4 bg-surface-tertiary rounded animate-pulse mb-3" />
                <div className="h-4 w-1/2 bg-surface-tertiary rounded animate-pulse mb-2" />
                <div className="h-3 w-1/3 bg-surface-tertiary rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FolderKanban className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              Nenhum projeto encontrado
            </p>
            <p className="text-body-1 text-foreground-secondary">
              {search || filterStatus
                ? "Tente ajustar os filtros ou termos de busca"
                : "Crie seu primeiro projeto para começar"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const counts = (project as any)._count || {};
            const standards = project.standards || [];

            return (
              <Link
                key={project.id}
                href={`/${tenant.slug}/projects/${project.id}`}
              >
                <Card className="cursor-pointer hover:shadow-card-glow transition-all h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-title-3 text-foreground-primary line-clamp-1">
                        {project.name}
                      </h3>
                      <Badge variant={getStatusColor(project.status)} className="flex-shrink-0 ml-2">
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>

                    {project.client && (
                      <p className="text-body-2 text-foreground-secondary flex items-center gap-1 mb-1">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{project.client.name}</span>
                      </p>
                    )}

                    {project.description && (
                      <p className="text-body-2 text-foreground-tertiary line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}

                    {/* Standards badges */}
                    {standards.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {standards.map((ps) => (
                          <span
                            key={ps.id}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-light text-brand"
                          >
                            {ps.standard?.code || "—"}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer: progress + meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-stroke-secondary">
                      <div className="flex items-center gap-3">
                        <span className="text-caption-1 text-foreground-tertiary">
                          {Number(project.progress)}%
                        </span>
                        <div className="h-1.5 w-16 bg-surface-tertiary rounded-full">
                          <div
                            className="h-full bg-brand rounded-full transition-all"
                            style={{
                              width: `${Number(project.progress)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                        {counts.members > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <Users className="h-3 w-3" />
                            {counts.members}
                          </span>
                        )}
                        {counts.risks > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <RiskIcon className="h-3 w-3" />
                            {counts.risks}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function RiskIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
