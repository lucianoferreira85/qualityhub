"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowRight } from "lucide-react";

interface ProjectProgress {
  id: string;
  name: string;
  status: string;
  controls: number;
  requirements: number;
  risks: number;
  ncs: number;
}

interface ProjectsOverviewProps {
  data: ProjectProgress[];
  tenantSlug: string;
}

function ProjectsOverview({ data, tenantSlug }: ProjectsOverviewProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-title-3 text-foreground-primary">Projetos</h2>
          <Link href={`/${tenantSlug}/projects`}>
            <span className="text-caption-1 text-brand hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((p) => (
            <Link
              key={p.id}
              href={`/${tenantSlug}/projects/${p.id}`}
              className="block p-3 rounded-button border border-stroke-secondary hover:bg-surface-secondary transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-body-1 font-medium text-foreground-primary truncate">{p.name}</p>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-4 text-caption-1 text-foreground-tertiary">
                <span>{p.controls} controle{p.controls !== 1 ? "s" : ""}</span>
                <span>{p.requirements} requisito{p.requirements !== 1 ? "s" : ""}</span>
                <span>{p.risks} risco{p.risks !== 1 ? "s" : ""}</span>
                {p.ncs > 0 && (
                  <span className="text-warning">{p.ncs} NC{p.ncs !== 1 ? "s" : ""}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { ProjectsOverview };
