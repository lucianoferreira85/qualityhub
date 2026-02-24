"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface ProjectOption {
  id: string;
  name: string;
}

interface ReviewFormData {
  projectId: string;
  scheduledDate: string;
  minutes: string;
}

const INITIAL_FORM: ReviewFormData = {
  projectId: "",
  scheduledDate: "",
  minutes: "",
};

export default function NewManagementReviewPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [form, setForm] = useState<ReviewFormData>(INITIAL_FORM);
  const [formTouched, setFormTouched] = useState(false);
  useUnsavedChanges(formTouched);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (field: keyof ReviewFormData, value: string) => {
    setFormTouched(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/projects`)
      .then((r) => r.json())
      .then((res) => {
        const items = (res.data || []).map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }));
        setProjects(items);
        if (items.length > 0) setForm((prev) => ({ ...prev, projectId: items[0].id }));
      })
      .catch(() => {});
  }, [tenant.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.scheduledDate) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/management-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.projectId,
          scheduledDate: form.scheduledDate,
          minutes: form.minutes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar");
      }
      toast.success("Análise crítica criada com sucesso");
      setFormTouched(false);
      router.push(`/${tenant.slug}/management-reviews`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumb items={[{ label: "Análises Críticas", href: `/${tenant.slug}/management-reviews` }, { label: "Nova" }]} />
      <div>
        <h1 className="text-title-1 text-foreground-primary">Nova Analise Critica</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Agende uma reuniao de analise critica pela direcao
        </p>
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
              <Select
                value={form.projectId}
                onChange={(e) => updateForm("projectId", e.target.value)}
                required
                options={[
                  { value: "", label: "Selecionar projeto..." },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Data Agendada *
              </label>
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => updateForm("scheduledDate", e.target.value)}
                className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Observacoes
              </label>
              <Textarea
                value={form.minutes}
                onChange={(e) => updateForm("minutes", e.target.value)}
                rows={4}
                placeholder="Notas iniciais ou pauta da reuniao..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href={`/${tenant.slug}/management-reviews`}>
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit" loading={saving} disabled={!form.projectId || !form.scheduledDate}>
                Criar Analise
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
