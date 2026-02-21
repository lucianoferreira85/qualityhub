"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
}

export default function NewManagementReviewPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/projects`)
      .then((r) => r.json())
      .then((res) => {
        const items = (res.data || []).map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }));
        setProjects(items);
        if (items.length > 0) setProjectId(items[0].id);
      })
      .catch(() => {});
  }, [tenant.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !scheduledDate) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/management-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          scheduledDate,
          minutes: minutes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar");
      }
      router.push(`/${tenant.slug}/management-reviews`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${tenant.slug}/management-reviews`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-title-1 text-foreground-primary">Nova Analise Critica</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Agende uma reuniao de analise critica pela direcao
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-card bg-danger-bg text-danger-fg text-body-2">
                {error}
              </div>
            )}

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Projeto *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              >
                <option value="">Selecionar projeto...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Data Agendada *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Observacoes
              </label>
              <textarea
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                rows={4}
                className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Notas iniciais ou pauta da reuniao..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href={`/${tenant.slug}/management-reviews`}>
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit" loading={saving} disabled={!projectId || !scheduledDate}>
                Criar Analise
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
