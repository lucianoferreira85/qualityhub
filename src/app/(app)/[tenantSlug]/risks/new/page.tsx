"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";
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

export default function NewRiskPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("operational");
  const [probability, setProbability] = useState(1);
  const [impact, setImpact] = useState(1);
  const [treatment, setTreatment] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [projectId, setProjectId] = useState("");
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

  const calculatedLevel = getRiskLevel(probability, impact);
  const score = probability * impact;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          probability,
          impact,
          treatment: treatment || null,
          treatmentPlan: treatmentPlan || null,
          responsibleId: responsibleId || null,
          projectId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar risco");
      }
      const data = await res.json();
      toast.success("Risco criado com sucesso");
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

      <div className="flex items-center gap-3">
        <Link href={`/${tenant.slug}/risks`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-title-1 text-foreground-primary">Novo Risco</h1>
      </div>

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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Descreva brevemente o risco"
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
                placeholder="Detalhe o risco, causas potenciais, consequências..."
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
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
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
                <select
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value={1}>1 - Muito Baixa</option>
                  <option value={2}>2 - Baixa</option>
                  <option value={3}>3 - Média</option>
                  <option value={4}>4 - Alta</option>
                  <option value={5}>5 - Muito Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Impacto (1-5) *
                </label>
                <select
                  value={impact}
                  onChange={(e) => setImpact(Number(e.target.value))}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value={1}>1 - Muito Baixo</option>
                  <option value={2}>2 - Baixo</option>
                  <option value={3}>3 - Médio</option>
                  <option value={4}>4 - Alto</option>
                  <option value={5}>5 - Muito Alto</option>
                </select>
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
                <select
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {TREATMENTS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Responsável
                </label>
                <select
                  value={responsibleId}
                  onChange={(e) => setResponsibleId(e.target.value)}
                  className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">
                    {loadingData ? "Carregando..." : "Selecione o responsável"}
                  </option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Plano de Tratamento
              </label>
              <textarea
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                placeholder="Descreva o plano de tratamento para este risco..."
                rows={3}
                className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
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
