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
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const CATEGORIES = [
  { value: "core", label: "Principal" },
  { value: "support", label: "Suporte" },
  { value: "management", label: "Gestão" },
];

interface ProjectOption {
  id: string;
  name: string;
}

interface MemberOption {
  user: { id: string; name: string };
}

interface ProcessFormData {
  name: string;
  description: string;
  projectId: string;
  responsibleId: string;
  category: string;
}

const INITIAL_FORM: ProcessFormData = {
  name: "",
  description: "",
  projectId: "",
  responsibleId: "",
  category: "",
};

export default function NewProcessPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [form, setForm] = useState<ProcessFormData>(INITIAL_FORM);
  const updateForm = (field: keyof ProcessFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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
      const res = await fetch(`/api/tenants/${tenant.slug}/processes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          projectId: form.projectId,
          responsibleId: form.responsibleId || null,
          category: form.category || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar processo");
      }
      const data = await res.json();
      toast.success("Processo criado com sucesso");
      router.push(`/${tenant.slug}/processes/${data.data.id}`);
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
      <Breadcrumb items={[{ label: "Processos", href: `/${tenant.slug}/processes` }, { label: "Novo" }]} />
      <h1 className="text-title-1 text-foreground-primary">Novo Processo</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Informações do Processo
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
                placeholder="Nome do processo"
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
                placeholder="Descreva o processo, seus objetivos e escopo"
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
                  options={[
                    { value: "", label: loadingData ? "Carregando..." : "Selecione o projeto" },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Categoria
                </label>
                <Select
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                  options={CATEGORIES}
                  placeholder="Selecione a categoria"
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Responsável
                </label>
                <Select
                  value={form.responsibleId}
                  onChange={(e) => updateForm("responsibleId", e.target.value)}
                  options={[
                    { value: "", label: loadingData ? "Carregando..." : "Selecione o responsável" },
                    ...members.map((m) => ({ value: m.user.id, label: m.user.name })),
                  ]}
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
          <Link href={`/${tenant.slug}/processes`}>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Criar Processo
          </Button>
        </div>
      </form>
    </div>
  );
}
