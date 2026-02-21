"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

const TYPES = [
  { value: "corrective", label: "Corretiva" },
  { value: "preventive", label: "Preventiva" },
  { value: "improvement", label: "Melhoria" },
];

interface ProjectOption {
  id: string;
  name: string;
}

interface NcOption {
  id: string;
  code: string;
  title: string;
}

export default function NewActionPlanPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("corrective");
  const [nonconformityId, setNonconformityId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [ncs, setNcs] = useState<NcOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/nonconformities`).then((r) => r.json()),
    ])
      .then(([projRes, ncRes]) => {
        setProjects(projRes.data || []);
        setNcs(
          (ncRes.data || []).map((nc: NcOption) => ({
            id: nc.id,
            code: nc.code,
            title: nc.title,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [tenant.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/action-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          projectId,
          type,
          nonconformityId: nonconformityId || null,
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar plano de ação");
      }
      router.push(`/${tenant.slug}/action-plans`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${tenant.slug}/action-plans`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-title-1 text-foreground-primary">
          Novo Plano de Ação
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Informações do Plano
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
                placeholder="Descreva brevemente o plano de ação"
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
                placeholder="Detalhe as ações a serem executadas"
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
                    {loadingData ? "Carregando..." : "Selecione o projeto"}
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
                  Tipo *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  NC vinculada
                </label>
                <select
                  value={nonconformityId}
                  onChange={(e) => setNonconformityId(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">Nenhuma</option>
                  {ncs.map((nc) => (
                    <option key={nc.id} value={nc.id}>
                      {nc.code} - {nc.title}
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
          <Link href={`/${tenant.slug}/action-plans`}>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Criar Plano de Ação
          </Button>
        </div>
      </form>
    </div>
  );
}
