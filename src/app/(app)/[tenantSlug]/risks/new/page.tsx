"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getRiskLevel, getRiskLevelLabel } from "@/lib/utils";

const CATEGORIES = [
  { value: "strategic", label: "Estratégico" },
  { value: "operational", label: "Operacional" },
  { value: "compliance", label: "Conformidade" },
  { value: "financial", label: "Financeiro" },
  { value: "technology", label: "Tecnologia" },
  { value: "legal", label: "Legal" },
];

const TREATMENTS = [
  { value: "accept", label: "Aceitar" },
  { value: "mitigate", label: "Mitigar" },
  { value: "transfer", label: "Transferir" },
  { value: "avoid", label: "Evitar" },
];

const PROBABILITIES = [
  { value: "1", label: "1 - Muito Baixa" },
  { value: "2", label: "2 - Baixa" },
  { value: "3", label: "3 - Média" },
  { value: "4", label: "4 - Alta" },
  { value: "5", label: "5 - Muito Alta" },
];

const IMPACTS = [
  { value: "1", label: "1 - Muito Baixo" },
  { value: "2", label: "2 - Baixo" },
  { value: "3", label: "3 - Médio" },
  { value: "4", label: "4 - Alto" },
  { value: "5", label: "5 - Muito Alto" },
];

const LEVEL_COLORS: Record<string, string> = {
  critical: "bg-danger-bg text-danger-fg",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  medium: "bg-warning-bg text-warning-fg",
  low: "bg-success-bg text-success-fg",
};

interface ProjectOption {
  id: string;
  name: string;
}

interface MemberOption {
  user: { id: string; name: string };
}

interface RiskFormData {
  title: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  treatment: string;
  treatmentPlan: string;
  responsibleId: string;
  projectId: string;
}

const INITIAL_FORM: RiskFormData = {
  title: "",
  description: "",
  category: "operational",
  probability: 1,
  impact: 1,
  treatment: "",
  treatmentPlan: "",
  responsibleId: "",
  projectId: "",
};

export default function NewRiskPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [form, setForm] = useState<RiskFormData>(INITIAL_FORM);
  const [formTouched, setFormTouched] = useState(false);
  useUnsavedChanges(formTouched);
  const updateForm = (field: keyof RiskFormData, value: string | number) => {
    setFormTouched(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/members`).then((r) => r.json()),
    ])
      .then(([projRes, membRes]) => {
        setProjects(projRes.data || []);
        setMembers(membRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [tenant.slug]);

  const calculatedLevel = getRiskLevel(form.probability, form.impact);
  const score = form.probability * form.impact;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          probability: form.probability,
          impact: form.impact,
          treatment: form.treatment || null,
          treatmentPlan: form.treatmentPlan || null,
          responsibleId: form.responsibleId || null,
          projectId: form.projectId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar risco");
      }
      const data = await res.json();
      toast.success("Risco criado com sucesso");
      setFormTouched(false);
      router.push(`/${tenant.slug}/risks/${data.data.id}`);
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
      <Breadcrumb
        items={[
          { label: "Riscos", href: `/${tenant.slug}/risks` },
          { label: "Novo" },
        ]}
      />

      <h1 className="text-title-1 text-foreground-primary">Novo Risco</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Informações do Risco
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Título *
              </label>
              <Input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="Descreva brevemente o risco"
                required
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Descrição *
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Detalhe o risco, causas potenciais, consequências..."
                required
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Projeto *
                </label>
                <Select
                  value={form.projectId}
                  onChange={(e) => updateForm("projectId", e.target.value)}
                  required
                  placeholder={loadingData ? "Carregando..." : "Selecione o projeto"}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Categoria *
                </label>
                <Select
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                  options={CATEGORIES}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-title-3 text-foreground-primary">
                Avaliação de Risco
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-body-2 text-foreground-secondary">
                  Score: {score}
                </span>
                <Badge variant={LEVEL_COLORS[calculatedLevel] || ""}>
                  {getRiskLevelLabel(calculatedLevel)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Probabilidade (1-5) *
                </label>
                <Select
                  value={String(form.probability)}
                  onChange={(e) => updateForm("probability", Number(e.target.value))}
                  options={PROBABILITIES}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Impacto (1-5) *
                </label>
                <Select
                  value={String(form.impact)}
                  onChange={(e) => updateForm("impact", Number(e.target.value))}
                  options={IMPACTS}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">Tratamento</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Tipo de Tratamento
                </label>
                <Select
                  value={form.treatment}
                  onChange={(e) => updateForm("treatment", e.target.value)}
                  placeholder="Selecione..."
                  options={TREATMENTS}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Responsável
                </label>
                <Select
                  value={form.responsibleId}
                  onChange={(e) => updateForm("responsibleId", e.target.value)}
                  placeholder={loadingData ? "Carregando..." : "Selecione o responsável"}
                  options={members.map((m) => ({
                    value: m.user.id,
                    label: m.user.name,
                  }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Plano de Tratamento
              </label>
              <Textarea
                value={form.treatmentPlan}
                onChange={(e) => updateForm("treatmentPlan", e.target.value)}
                placeholder="Descreva o plano de tratamento para este risco..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href={`/${tenant.slug}/risks`}>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Registrar Risco
          </Button>
        </div>
      </form>
    </div>
  );
}
