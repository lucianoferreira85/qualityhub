"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, Building2, Users } from "lucide-react";
import { getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const { tenant, can } = useTenant();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/projects`)
      .then((res) => res.json())
      .then((res) => setProjects(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug]);

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

      <Input
        placeholder="Buscar por projeto ou cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

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
              {search
                ? "Tente outra busca"
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
