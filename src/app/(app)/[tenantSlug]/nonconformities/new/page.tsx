"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";

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

interface MemberOption {
  user: { id: string; name: string };
}

export default function NewNonconformityPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [origin, setOrigin] = useState("internal");
  const [severity, setSeverity] = useState("minor");
  const [responsibleId, setResponsibleId] = useState("");
  const [dueDate, setDueDate] = useState("");
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
            responsibleId: responsibleId || null,
            dueDate: dueDate || null,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar não conformidade");
      }
      const data = await res.json();
      toast.success("Não conformidade criada com sucesso");
      router.push(`/${tenant.slug}/nonconformities/${data.data.id}`);
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
      <Breadcrumb items={[{ label: "Não Conformidades", href: `/${tenant.slug}/nonconformities` }, { label: "Nova" }]} />
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
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhe a não conformidade encontrada, evidências, local, etc."
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
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  placeholder={loadingData ? "Carregando..." : "Selecione o projeto"}
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Origem *
                </label>
                <Select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  options={ORIGINS}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Severidade *
                </label>
                <Select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  options={SEVERITIES}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Responsável
                </label>
                <Select
                  value={responsibleId}
                  onChange={(e) => setResponsibleId(e.target.value)}
                  placeholder={loadingData ? "Carregando..." : "Selecione o responsável"}
                  options={members.map((m) => ({ value: m.user.id, label: m.user.name }))}
                />
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
