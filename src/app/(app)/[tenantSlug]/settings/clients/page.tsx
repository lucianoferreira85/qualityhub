"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${tenant.slug}/settings`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-title-1 text-foreground-primary">Clientes</h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              Visao geral dos clientes da consultoria
            </p>
          </div>
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
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-surface-tertiary rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-tertiary rounded w-1/3" />
                    <div className="h-3 bg-surface-tertiary rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 text-foreground-tertiary mx-auto mb-2" />
              <p className="text-body-2 text-foreground-secondary">Nenhum cliente cadastrado</p>
              <Link href={`/${tenant.slug}/clients/new`}>
                <Button variant="outline" size="sm" className="mt-3">
                  Cadastrar Primeiro Cliente
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/${tenant.slug}/clients/${client.id}`}
                  className="flex items-center gap-3 p-3 rounded-card hover:bg-surface-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
                    <span className="text-body-2 font-medium">
                      {getInitials(client.name)}
                    </span>
                  </div>
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
