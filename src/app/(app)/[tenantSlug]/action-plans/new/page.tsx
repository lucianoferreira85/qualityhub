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

interface MemberOption {
  user: { id: string; name: string };
}

interface ActionPlanFormData {
  title: string;
  description: string;
  projectId: string;
  type: string;
  nonconformityId: string;
  responsibleId: string;
  dueDate: string;
}

const INITIAL_FORM: ActionPlanFormData = {
  title: "",
  description: "",
  projectId: "",
  type: "corrective",
  nonconformityId: "",
  responsibleId: "",
  dueDate: "",
};

export default function NewActionPlanPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [form, setForm] = useState<ActionPlanFormData>(INITIAL_FORM);
  const [formTouched, setFormTouched] = useState(false);
  useUnsavedChanges(formTouched);
  const updateForm = (field: keyof ActionPlanFormData, value: string) => {
    setFormTouched(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [ncs, setNcs] = useState<NcOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/projects`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/nonconformities`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/members`).then((r) => r.json()),
    ])
      .then(([projRes, ncRes, membRes]) => {
        setProjects(projRes.data || []);
        setNcs(
          (ncRes.data || []).map((nc: NcOption) => ({
            id: nc.id,
            code: nc.code,
            title: nc.title,
          }))
        );
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
      const res = await fetch(`/api/tenants/${tenant.slug}/action-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          projectId: form.projectId,
          type: form.type,
          nonconformityId: form.nonconformityId || null,
          responsibleId: form.responsibleId || null,
          dueDate: form.dueDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar plano de ação");
      }
      const data = await res.json();
      toast.success("Plano de ação criado com sucesso");
      setFormTouched(false);
      router.push(`/${tenant.slug}/action-plans/${data.data.id}`);
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
      <Breadcrumb items={[{ label: "Planos de Ação", href: `/${tenant.slug}/action-plans` }, { label: "Novo" }]} />
      <h1 className="text-title-1 text-foreground-primary">
        Novo Plano de Ação
      </h1>

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
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="Descreva brevemente o plano de ação"
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
                placeholder="Detalhe as ações a serem executadas"
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
                  Tipo *
                </label>
                <Select
                  value={form.type}
                  onChange={(e) => updateForm("type", e.target.value)}
                  options={TYPES}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  NC vinculada
                </label>
                <Select
                  value={form.nonconformityId}
                  onChange={(e) => updateForm("nonconformityId", e.target.value)}
                  placeholder="Nenhuma"
                  options={ncs.map((nc) => ({
                    value: nc.id,
                    label: `${nc.code} - ${nc.title}`,
                  }))}
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

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Prazo
                </label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateForm("dueDate", e.target.value)}
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
