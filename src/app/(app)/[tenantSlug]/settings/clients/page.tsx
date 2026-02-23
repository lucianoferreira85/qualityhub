"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Building2,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  isActive: boolean;
}

export default function SettingsClientsPage() {
  const { tenant } = useTenant();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/clients`)
      .then((r) => r.json())
      .then((res) => setClients(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug]);

  const activeCount = clients.filter((c) => c.isActive !== false).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Configurações", href: `/${tenant.slug}/settings` },
        { label: "Clientes" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Clientes</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Visao geral dos clientes da consultoria
          </p>
        </div>
        <Link href={`/${tenant.slug}/clients`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
            Gerenciar Clientes
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-caption-1 text-foreground-tertiary">Total</p>
            <p className="text-title-2 font-semibold text-foreground-primary">
              {loading ? "—" : clients.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-caption-1 text-foreground-tertiary">Ativos</p>
            <p className="text-title-2 font-semibold text-success-fg">
              {loading ? "—" : activeCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-caption-1 text-foreground-tertiary">Inativos</p>
            <p className="text-title-2 font-semibold text-foreground-tertiary">
              {loading ? "—" : clients.length - activeCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client list */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-foreground-tertiary" />
            <h2 className="text-title-3 text-foreground-primary">
              Clientes ({clients.length})
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
          ) : clients.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhum cliente cadastrado"
              action={{ label: "Cadastrar Primeiro Cliente", href: `/${tenant.slug}/clients/new` }}
            />
          ) : (
            <div className="space-y-1">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/${tenant.slug}/clients/${client.id}`}
                  className="flex items-center gap-3 p-3 rounded-card hover:bg-surface-secondary transition-colors"
                >
                  <Avatar name={client.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body-1 font-medium text-foreground-primary truncate">
                        {client.name}
                      </p>
                      {client.isActive === false && (
                        <Badge variant="bg-gray-100 text-gray-500">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      {client.cnpj && <span>{client.cnpj}</span>}
                      {client.contactName && <span>{client.contactName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-caption-1 text-foreground-tertiary">
                    {client.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="hidden sm:inline">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="hidden sm:inline">{client.phone}</span>
                      </div>
                    )}
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
