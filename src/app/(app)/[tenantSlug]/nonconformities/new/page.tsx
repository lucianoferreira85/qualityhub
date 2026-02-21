"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

const ORIGINS = [
  { value: "internal", label: "Interna" },
  { value: "audit", label: "Auditoria" },
  { value: "customer_complaint", label: "Reclamação de Cliente" },
  { value: "supplier", label: "Fornecedor" },
  { value: "process", label: "Processo" },
  { value: "management_review", label: "Análise Crítica" },
];

const SEVERITIES = [
  { value: "observation", label: "Observação" },
  { value: "minor", label: "Menor" },
  { value: "major", label: "Maior" },
  { value: "critical", label: "Crítica" },
];

interface ProjectOption {
  id: string;
  name: string;
}

export default function NewNonconformityPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [origin, setOrigin] = useState("internal");
  const [severity, setSeverity] = useState("minor");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/projects`)
      .then((res) => res.json())
      .then((res) => setProjects(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, [tenant.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/nonconformities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            projectId,
            origin,
            severity,
            dueDate: dueDate || null,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar não conformidade");
      }
      router.push(`/${tenant.slug}/nonconformities`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${tenant.slug}/nonconformities`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-title-1 text-foreground-primary">
          Nova Não Conformidade
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Informações da NC
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Título *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Descreva brevemente a não conformidade"
                required
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Descrição *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhe a não conformidade encontrada, evidências, local, etc."
                required
                rows={4}
                className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Projeto *
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">
                    {loadingProjects ? "Carregando..." : "Selecione o projeto"}
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Origem *
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {ORIGINS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Severidade *
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Prazo
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href={`/${tenant.slug}/nonconformities`}>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Registrar NC
          </Button>
        </div>
      </form>
    </div>
  );
}
