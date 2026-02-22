"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const FREQUENCIES = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
];

interface ProjectOption {
  id: string;
  name: string;
}

export default function NewIndicatorPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [target, setTarget] = useState("");
  const [lowerLimit, setLowerLimit] = useState("");
  const [upperLimit, setUpperLimit] = useState("");
  const [projectId, setProjectId] = useState("");
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
      const res = await fetch(`/api/tenants/${tenant.slug}/indicators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          unit,
          frequency,
          target: parseFloat(target),
          lowerLimit: lowerLimit ? parseFloat(lowerLimit) : null,
          upperLimit: upperLimit ? parseFloat(upperLimit) : null,
          projectId: projectId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar indicador");
      }
      const data = await res.json();
      toast.success("Indicador criado com sucesso");
      router.push(`/${tenant.slug}/indicators/${data.data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: "Indicadores", href: `/${tenant.slug}/indicators` }, { label: "Novo" }]} />
      <div className="flex items-center gap-3">
        <Link href={`/${tenant.slug}/indicators`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-title-1 text-foreground-primary">Novo Indicador</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Dados do Indicador
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Nome *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Taxa de Conformidade de Controles"
                required
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que este indicador mede e como é calculado"
                rows={3}
                className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Unidade *
                </label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Ex: %, dias, ocorrências"
                  required
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Frequência *
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Meta *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="Ex: 95"
                  required
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Projeto
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">
                    {loadingProjects ? "Carregando..." : "Indicador geral (sem projeto)"}
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Limite inferior
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={lowerLimit}
                  onChange={(e) => setLowerLimit(e.target.value)}
                  placeholder="Ex: 80"
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Limite superior
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={upperLimit}
                  onChange={(e) => setUpperLimit(e.target.value)}
                  placeholder="Ex: 100"
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
          <Link href={`/${tenant.slug}/indicators`}>
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" loading={loading}>Criar Indicador</Button>
        </div>
      </form>
    </div>
  );
}
