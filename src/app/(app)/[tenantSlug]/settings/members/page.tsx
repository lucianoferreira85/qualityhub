"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Plus,
  Users,
  Mail,
  Shield,
  Clock,
} from "lucide-react";
import {
  getRoleLabel,
  getInvitationStatusLabel,
  getInvitationStatusColor,
  formatDate,
} from "@/lib/utils";
import { toast } from "sonner";

const ROLES = [
  { value: "tenant_admin", label: "Administrador" },
  { value: "project_manager", label: "Gerente de Projetos" },
  { value: "senior_consultant", label: "Consultor Sênior" },
  { value: "junior_consultant", label: "Consultor Júnior" },
  { value: "internal_auditor", label: "Auditor Interno" },
  { value: "external_auditor", label: "Auditor Externo" },
  { value: "client_viewer", label: "Visualizador (Cliente)" },
];

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy?: { id: string; name: string } | null;
}

export default function MembersPage() {
  const { tenant, can } = useTenant();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("junior_consultant");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = () => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/members`).then((r) => r.json()),
      can("invitation", "read")
        ? fetch(`/api/tenants/${tenant.slug}/invitations`).then((r) => r.json())
        : Promise.resolve({ data: [] }),
    ])
      .then(([memRes, invRes]) => {
        setMembers(memRes.data || []);
        setInvitations(invRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [tenant.slug]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invEmail, role: invRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.data?.error || "Erro ao enviar convite");
      }
      setInvEmail("");
      setInvRole("junior_consultant");
      setShowInvite(false);
      setSuccess("Convite enviado com sucesso!");
      toast.success("Convite enviado com sucesso");
      setLoading(true);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao convidar";
      setError(message);
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Configurações", href: `/${tenant.slug}/settings` },
        { label: "Membros" },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Membros</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie os membros da empresa
          </p>
        </div>
        {can("invitation", "create") && (
          <Button onClick={() => { setShowInvite(!showInvite); setError(""); setSuccess(""); }}>
            <Plus className="h-4 w-4" />
            Convidar
          </Button>
        )}
      </div>

      {success && (
        <div className="bg-success-bg text-success-fg text-body-2 p-3 rounded-button">
          {success}
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">Enviar Convite</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                    E-mail *
                  </label>
                  <Input
                    type="email"
                    value={invEmail}
                    onChange={(e) => setInvEmail(e.target.value)}
                    placeholder="nome@empresa.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                    Papel *
                  </label>
                  <Select
                    value={invRole}
                    onChange={(e) => setInvRole(e.target.value)}
                    options={ROLES}
                  />
                </div>
              </div>
              {error && (
                <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowInvite(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={inviting}>Enviar Convite</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-foreground-tertiary" />
            <h2 className="text-title-3 text-foreground-primary">
              Membros ({members.length})
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} lines={2} />
              ))}
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum membro encontrado"
            />
          ) : (
            <div className="space-y-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-card hover:bg-surface-secondary transition-colors"
                >
                  <Avatar name={m.user.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body-1 font-medium text-foreground-primary truncate">
                        {m.user.name}
                      </p>
                      {!m.user.isActive && (
                        <Badge variant="bg-gray-100 text-gray-500">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-caption-1 text-foreground-tertiary truncate">
                      {m.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="bg-brand-light text-brand">
                      <Shield className="h-3 w-3" />
                      {getRoleLabel(m.role)}
                    </Badge>
                    <span className="text-caption-1 text-foreground-tertiary hidden sm:block">
                      desde {formatDate(m.joinedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {can("invitation", "read") && pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-foreground-tertiary" />
              <h2 className="text-title-3 text-foreground-primary">
                Convites Pendentes ({pendingInvitations.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 p-3 rounded-card bg-surface-secondary"
                >
                  <div className="w-10 h-10 rounded-full bg-warning-bg text-warning-fg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-1 font-medium text-foreground-primary truncate">
                      {inv.email}
                    </p>
                    <p className="text-caption-1 text-foreground-tertiary">
                      Convidado por {inv.invitedBy?.name || "—"} &middot;{" "}
                      {formatDate(inv.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="bg-brand-light text-brand">
                      {getRoleLabel(inv.role)}
                    </Badge>
                    <Badge variant={getInvitationStatusColor(inv.status)}>
                      {getInvitationStatusLabel(inv.status)}
                    </Badge>
                    <div className="flex items-center gap-1 text-caption-1 text-foreground-tertiary">
                      <Clock className="h-3 w-3" />
                      <span>Expira {formatDate(inv.expiresAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Invitations History */}
      {can("invitation", "read") && invitations.length > pendingInvitations.length && (
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Histórico de Convites
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stroke-secondary">
                    <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">E-mail</th>
                    <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">Papel</th>
                    <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">Status</th>
                    <th className="text-left text-caption-1 font-medium text-foreground-tertiary py-2 px-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations
                    .filter((i) => i.status !== "pending")
                    .map((inv) => (
                      <tr key={inv.id} className="border-b border-stroke-secondary last:border-0">
                        <td className="py-2.5 px-3 text-body-2 text-foreground-primary">{inv.email}</td>
                        <td className="py-2.5 px-3 text-body-2 text-foreground-secondary">{getRoleLabel(inv.role)}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={getInvitationStatusColor(inv.status)}>
                            {getInvitationStatusLabel(inv.status)}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-body-2 text-foreground-tertiary">{formatDate(inv.createdAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
