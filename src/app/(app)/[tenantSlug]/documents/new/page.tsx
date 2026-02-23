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
import { FileUpload } from "@/components/ui/file-upload";

const DOCUMENT_TYPES = [
  { value: "policy", label: "Política" },
  { value: "procedure", label: "Procedimento" },
  { value: "work_instruction", label: "Instrução de Trabalho" },
  { value: "form", label: "Formulário" },
  { value: "record", label: "Registro" },
  { value: "manual", label: "Manual" },
];

interface ProjectOption {
  id: string;
  name: string;
}

interface MemberOption {
  user: { id: string; name: string };
}

interface DocumentFormData {
  title: string;
  type: string;
  projectId: string;
  category: string;
  content: string;
  reviewerId: string;
  nextReviewDate: string;
  fileUrl: string;
}

const INITIAL_FORM: DocumentFormData = {
  title: "",
  type: "procedure",
  projectId: "",
  category: "",
  content: "",
  reviewerId: "",
  nextReviewDate: "",
  fileUrl: "",
};

export default function NewDocumentPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [form, setForm] = useState<DocumentFormData>(INITIAL_FORM);
  const updateForm = (field: keyof DocumentFormData, value: string) =>
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
      .then(([projRes, memRes]) => {
        setProjects(projRes.data || []);
        setMembers(memRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [tenant.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          projectId: form.projectId || null,
          category: form.category || null,
          content: form.content || null,
          fileUrl: form.fileUrl || null,
          reviewerId: form.reviewerId || null,
          nextReviewDate: form.nextReviewDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar documento");
      }
      const data = await res.json();
      toast.success("Documento criado com sucesso");
      router.push(`/${tenant.slug}/documents/${data.data.id}`);
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
      <Breadcrumb items={[{ label: "Documentos", href: `/${tenant.slug}/documents` }, { label: "Novo" }]} />
      <h1 className="text-title-1 text-foreground-primary">Novo Documento</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Informações do Documento
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
                placeholder="Ex: Política de Segurança da Informação"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Tipo *
                </label>
                <Select
                  value={form.type}
                  onChange={(e) => updateForm("type", e.target.value)}
                  options={DOCUMENT_TYPES}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Projeto
                </label>
                <Select
                  value={form.projectId}
                  onChange={(e) => updateForm("projectId", e.target.value)}
                  placeholder={loadingData ? "Carregando..." : "Documento geral (sem projeto)"}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Categoria
                </label>
                <Input
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                  placeholder="Ex: SGSI, SGQ, Compliance"
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Revisor
                </label>
                <Select
                  value={form.reviewerId}
                  onChange={(e) => updateForm("reviewerId", e.target.value)}
                  placeholder={loadingData ? "Carregando..." : "Selecione o revisor"}
                  options={members.map((m) => ({
                    value: m.user.id,
                    label: m.user.name,
                  }))}
                />
              </div>

              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Próxima revisão
                </label>
                <Input
                  type="date"
                  value={form.nextReviewDate}
                  onChange={(e) => updateForm("nextReviewDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Arquivo
              </label>
              <FileUpload
                tenantSlug={tenant.slug}
                folder="documents"
                onUpload={(result) => updateForm("fileUrl", result.url)}
                onRemove={() => updateForm("fileUrl", "")}
              />
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                Conteúdo
              </label>
              <Textarea
                value={form.content}
                onChange={(e) => updateForm("content", e.target.value)}
                placeholder="Descreva o conteúdo do documento ou cole o texto aqui..."
                rows={6}
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
          <Link href={`/${tenant.slug}/documents`}>
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" loading={loading}>Criar Documento</Button>
        </div>
      </form>
    </div>
  );
}
