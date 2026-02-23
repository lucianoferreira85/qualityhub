"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Save,
  Mail,
  User,
  FolderKanban,
} from "lucide-react";
import { toast } from "sonner";
import type { ConsultingClient, Project } from "@/types";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const SECTORS = [
  "Tecnologia",
  "Saúde",
  "Financeiro",
  "Educação",
  "Indústria",
  "Varejo",
  "Governo",
  "Energia",
  "Telecomunicações",
  "Logística",
  "Outro",
];

const SECTOR_OPTIONS = [
  { value: "", label: "Nenhum" },
  ...SECTORS.map((s) => ({ value: s, label: s })),
];

const CLIENT_STATUSES = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

interface ClientWithProjects extends ConsultingClient {
  projects?: Pick<Project, "id" | "name" | "status" | "progress" | "startDate" | "endDate">[];
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { tenant, can } = useTenant();
  const [client, setClient] = useState<ClientWithProjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  // Edit form
  const [editName, setEditName] = useState("");
  const [editCnpj, setEditCnpj] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editSector, setEditSector] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const fetchClient = useCallback(() => {
    fetch(`/api/tenants/${tenant.slug}/clients/${clientId}`)
      .then((res) => res.json())
      .then((res) => {
        setClient(res.data);
        if (res.data) {
          setEditName(res.data.name);
          setEditCnpj(res.data.cnpj || "");
          setEditContactName(res.data.contactName || "");
          setEditContactEmail(res.data.contactEmail || "");
          setEditSector(res.data.sector || "");
          setEditStatus(res.data.status);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/clients/${clientId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            cnpj: editCnpj || null,
            contactName: editContactName || null,
            contactEmail: editContactEmail || null,
            sector: editSector || null,
            status: editStatus,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar cliente");
      }
      setEditing(false);
      fetchClient();
      toast.success("Cliente atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/clients/${clientId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir cliente");
      }
      toast.success("Cliente excluído com sucesso");
      router.push(`/${tenant.slug}/clients`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir";
      setError(message);
      toast.error(message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-title-3 text-foreground-primary">
          Cliente não encontrado
        </p>
      </div>
    );
  }

  const projects = client.projects || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: "Clientes", href: `/${tenant.slug}/clients` }, { label: client.name }]} />
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/${tenant.slug}/clients`}>
          <Button variant="ghost" size="icon-sm" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <Avatar name={client.name} size="lg" className="h-12 w-12 text-body-1" />
            <div>
              <h1 className="text-title-1 text-foreground-primary">
                {client.name}
              </h1>
              <StatusBadge status={client.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </>
          ) : (
            <>
              {can("client", "update") && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {can("client", "delete") && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-foreground-tertiary hover:text-danger-fg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
          {error}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Card className="border-danger/30 bg-danger-bg/30">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-body-1 font-medium text-foreground-primary">
                Excluir cliente?
              </p>
              <p className="text-body-2 text-foreground-secondary">
                Projetos vinculados perderão a referência ao cliente.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit / View */}
      {editing ? (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Editar dados
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Nome *
                </label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  CNPJ
                </label>
                <Input value={editCnpj} onChange={(e) => setEditCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Contato
                </label>
                <Input value={editContactName} onChange={(e) => setEditContactName(e.target.value)} />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  E-mail
                </label>
                <Input type="email" value={editContactEmail} onChange={(e) => setEditContactEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Setor
                </label>
                <Select
                  value={editSector}
                  onChange={(e) => setEditSector(e.target.value)}
                  options={SECTOR_OPTIONS}
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Status
                </label>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  options={CLIENT_STATUSES}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Informações
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {client.cnpj && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">CNPJ</p>
                  <p className="text-body-1 text-foreground-primary">{client.cnpj}</p>
                </div>
              )}
              {client.sector && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">Setor</p>
                  <p className="text-body-1 text-foreground-primary">{client.sector}</p>
                </div>
              )}
              {client.contactName && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> Contato</span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">{client.contactName}</p>
                </div>
              )}
              {client.contactEmail && (
                <div>
                  <p className="text-caption-1 text-foreground-tertiary mb-0.5">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</span>
                  </p>
                  <p className="text-body-1 text-foreground-primary">{client.contactEmail}</p>
                </div>
              )}
              {!client.cnpj && !client.sector && !client.contactName && !client.contactEmail && (
                <p className="text-body-2 text-foreground-tertiary col-span-2">
                  Nenhuma informação adicional cadastrada.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked Projects */}
      <Card>
        <CardHeader>
          <h2 className="text-title-3 text-foreground-primary">
            <span className="inline-flex items-center gap-1.5">
              <FolderKanban className="h-4 w-4 text-foreground-tertiary" />
              Projetos vinculados ({projects.length})
            </span>
          </h2>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-body-2 text-foreground-tertiary py-4 text-center">
              Nenhum projeto vinculado a este cliente
            </p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/${tenant.slug}/projects/${project.id}`}
                >
                  <div className="flex items-center justify-between p-3 rounded-button border border-stroke-secondary hover:bg-surface-secondary transition-colors">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="h-4 w-4 text-foreground-tertiary" />
                      <span className="text-body-1 text-foreground-primary font-medium">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-caption-1 text-foreground-tertiary">
                        {Number(project.progress)}%
                      </span>
                      <StatusBadge status={project.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
