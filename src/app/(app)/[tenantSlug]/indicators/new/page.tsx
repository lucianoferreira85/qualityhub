"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

interface IndicatorFormData {
  name: string;
  description: string;
  unit: string;
  frequency: string;
  target: string;
  lowerLimit: string;
  upperLimit: string;
  projectId: string;
}

const INITIAL_FORM: IndicatorFormData = {
  name: "",
  description: "",
  unit: "",
  frequency: "monthly",
  target: "",
  lowerLimit: "",
  upperLimit: "",
  projectId: "",
};

export default function NewIndicatorPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [form, setForm] = useState<IndicatorFormData>(INITIAL_FORM);
  const [formTouched, setFormTouched] = useState(false);
  useUnsavedChanges(formTouched);
  const updateForm = (field: keyof IndicatorFormData, value: string) => {
    setFormTouched(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
          name: form.name,
          description: form.description || null,
          unit: form.unit,
          frequency: form.frequency,
          target: parseFloat(form.target),
          lowerLimit: form.lowerLimit ? parseFloat(form.lowerLimit) : null,
          upperLimit: form.upperLimit ? parseFloat(form.upperLimit) : null,
          projectId: form.projectId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar indicador");
      }
      const data = await res.json();
      toast.success("Indicador criado com sucesso");
      setFormTouched(false);
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
      <h1 className="text-title-1 text-foreground-primary">Novo Indicador</h1>

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
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Ex: Taxa de Conformidade de Controles"
                required
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Descrição
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Descreva o que este indicador mede e como é calculado"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Unidade *
                </label>
                <Input
                  value={form.unit}
                  onChange={(e) => updateForm("unit", e.target.value)}
                  placeholder="Ex: %, dias, ocorrências"
                  required
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Frequência *
                </label>
                <Select
                  value={form.frequency}
                  onChange={(e) => updateForm("frequency", e.target.value)}
                  options={FREQUENCIES}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Meta *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.target}
                  onChange={(e) => updateForm("target", e.target.value)}
                  placeholder="Ex: 95"
                  required
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Projeto
                </label>
                <Select
                  value={form.projectId}
                  onChange={(e) => updateForm("projectId", e.target.value)}
                  options={[
                    { value: "", label: loadingProjects ? "Carregando..." : "Indicador geral (sem projeto)" },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Limite inferior
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.lowerLimit}
                  onChange={(e) => updateForm("lowerLimit", e.target.value)}
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
                  value={form.upperLimit}
                  onChange={(e) => updateForm("upperLimit", e.target.value)}
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
