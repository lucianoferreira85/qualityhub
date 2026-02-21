"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, TrendingUp } from "lucide-react";
import { getProcessStatusLabel, getProcessStatusColor } from "@/lib/utils";

const STATUSES = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "draft", label: "Rascunho" },
];

const CATEGORY_LABELS: Record<string, string> = {
  core: "Principal",
  support: "Suporte",
  management: "Gestão",
};

interface ProcessDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  responsible?: { id: string; name: string; email: string } | null;
  indicators?: { id: string; name: string; unit: string; frequency: string; target: number }[];
}

interface MemberOption {
  user: { id: string; name: string };
}

export default function ProcessDetailPage() {
  const params = useParams();
  const processId = params.id as string;
  const router = useRouter();
  const { tenant, can } = useTenant();

  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [responsibleId, setResponsibleId] = useState("");
  const [members, setMembers] = useState<MemberOption[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/processes/${processId}`).then((r) => r.json()),
      fetch(`/api/tenants/${tenant.slug}/members`).then((r) => r.json()),
    ])
      .then(([procRes, membRes]) => {
        const p = procRes.data;
        if (p) {
          setProcess(p);
          setName(p.name);
          setDescription(p.description || "");
          setStatus(p.status);
          setResponsibleId(p.responsible?.id || "");
        }
        setMembers(membRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, processId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/processes/${processId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          status,
          responsibleId: responsibleId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProcess((prev) => prev ? { ...prev, ...data.data, responsible: prev.responsible } : prev);
        setEditing(false);
        window.location.reload();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este processo?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/tenants/${tenant.slug}/processes/${processId}`, {
        method: "DELETE",
      });
      router.push(`/${tenant.slug}/processes`);
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-tertiary rounded w-1/3" />
          <div className="h-64 bg-surface-tertiary rounded" />
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="text-center py-12">
        <p className="text-title-3 text-foreground-primary">Processo não encontrado</p>
        <Link href={`/${tenant.slug}/processes`}>
          <Button variant="outline" className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${tenant.slug}/processes`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-caption-1 text-foreground-tertiary font-mono">{process.code}</p>
            <h1 className="text-title-1 text-foreground-primary">{process.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {can("process" as never, "update") && !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
          {can("process" as never, "delete") && (
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-title-3 text-foreground-primary">Detalhes</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Nome</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-body-2 font-medium text-foreground-primary mb-1">Descrição</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-input border border-stroke-primary bg-surface-primary px-3 py-2 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-body-2 font-medium text-foreground-primary mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-body-2 font-medium text-foreground-primary mb-1">Responsável</label>
                      <select
                        value={responsibleId}
                        onChange={(e) => setResponsibleId(e.target.value)}
                        className="h-10 w-full rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-1 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                      >
                        <option value="">Sem responsável</option>
                        {members.map((m) => (
                          <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                    <Button onClick={handleSave} loading={saving}>Salvar</Button>
                  </div>
                </>
              ) : (
                <>
                  {process.description && (
                    <p className="text-body-1 text-foreground-secondary whitespace-pre-wrap">
                      {process.description}
                    </p>
                  )}
                  {!process.description && (
                    <p className="text-body-1 text-foreground-tertiary italic">
                      Sem descrição
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {process.indicators && process.indicators.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-title-3 text-foreground-primary">
                  Indicadores Vinculados ({process.indicators.length})
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {process.indicators.map((ind) => (
                    <Link
                      key={ind.id}
                      href={`/${tenant.slug}/indicators/${ind.id}`}
                      className="flex items-center justify-between p-3 rounded-button border border-stroke-secondary hover:bg-surface-tertiary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-foreground-tertiary" />
                        <span className="text-body-1 text-foreground-primary">{ind.name}</span>
                      </div>
                      <span className="text-caption-1 text-foreground-tertiary">
                        Meta: {ind.target} {ind.unit}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-title-3 text-foreground-primary">Informações</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-caption-1 text-foreground-tertiary">Status</p>
                <Badge variant={getProcessStatusColor(process.status)} className="mt-1">
                  {getProcessStatusLabel(process.status)}
                </Badge>
              </div>
              {process.project && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary">Projeto</p>
                  <Link
                    href={`/${tenant.slug}/projects/${process.project.id}`}
                    className="text-body-1 text-brand hover:underline"
                  >
                    {process.project.name}
                  </Link>
                </div>
              )}
              {process.category && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary">Categoria</p>
                  <p className="text-body-1 text-foreground-primary">
                    {CATEGORY_LABELS[process.category] || process.category}
                  </p>
                </div>
              )}
              {process.responsible && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary">Responsável</p>
                  <p className="text-body-1 text-foreground-primary">{process.responsible.name}</p>
                  <p className="text-caption-1 text-foreground-tertiary">{process.responsible.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
