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

const AUDIT_TYPES = [
  { value: "internal", label: "Interna" },
  { value: "external", label: "Externa" },
  { value: "supplier", label: "Fornecedor" },
  { value: "certification", label: "Certificação" },
];

interface ProjectOption {
  id: string;
  name: string;
}

interface MemberOption {
  user: { id: string; name: string };
}

interface AuditFormData {
  title: string;
  type: string;
  projectId: string;
  leadAuditorId: string;
  startDate: string;
  endDate: string;
  scope: string;
  notes: string;
}

const INITIAL_FORM: AuditFormData = {
  title: "",
  type: "internal",
  projectId: "",
  leadAuditorId: "",
  startDate: "",
  endDate: "",
  scope: "",
  notes: "",
};

export default function NewAuditPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [form, setForm] = useState<AuditFormData>(INITIAL_FORM);
  const updateForm = (field: keyof AuditFormData, value: string) =>
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
      const res = await fetch(`/api/tenants/${tenant.slug}/audits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          projectId: form.projectId,
          leadAuditorId: form.leadAuditorId || null,
          startDate: form.startDate,
          endDate: form.endDate || null,
          scope: form.scope || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar auditoria");
      }
      const data = await res.json();
      toast.success("Auditoria criada com sucesso");
      router.push(`/${tenant.slug}/audits/${data.data.id}`);
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
      <Breadcrumb items={[{ label: "Auditorias", href: `/${tenant.slug}/audits` }, { label: "Nova" }]} />
      <h1 className="text-title-1 text-foreground-primary">Nova Auditoria</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Dados da Auditoria
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
                placeholder="Ex: Auditoria Interna ISO 27001 - Q1 2026"
                required
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
                  options={AUDIT_TYPES}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Auditor líder
                </label>
                <Select
                  value={form.leadAuditorId}
                  onChange={(e) => updateForm("leadAuditorId", e.target.value)}
                  placeholder={loadingData ? "Carregando..." : "Selecione o auditor"}
                  options={members.map((m) => ({
                    value: m.user.id,
                    label: m.user.name,
                  }))}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Data início *
                </label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateForm("startDate", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Data fim
                </label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateForm("endDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Escopo
              </label>
              <Textarea
                value={form.scope}
                onChange={(e) => updateForm("scope", e.target.value)}
                placeholder="Defina o escopo da auditoria (processos, áreas, requisitos)"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Observações
              </label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                placeholder="Observações adicionais"
                rows={2}
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
          <Link href={`/${tenant.slug}/audits`}>
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" loading={loading}>Agendar Auditoria</Button>
        </div>
      </form>
    </div>
  );
}
