"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Mail, User, Filter, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { exportToCSV, type CsvColumn } from "@/lib/export";
import { toast } from "sonner";
import type { ConsultingClient } from "@/types";

const CLIENT_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

const CSV_COLUMNS: CsvColumn<ConsultingClient>[] = [
  { key: "name", label: "Nome" },
  { key: "cnpj", label: "CNPJ" },
  { key: "contactName", label: "Contato" },
  { key: "contactEmail", label: "Email" },
  { key: "sector", label: "Setor" },
];

export default function ClientsPage() {
  const { tenant, can } = useTenant();
  const [clients, setClients] = useState<ConsultingClient[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchClients = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/clients${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setClients(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterStatus, page]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      c.sector?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Clientes</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie os clientes da sua consultoria
          </p>
        </div>
        {can("client", "create") && (
          <Link href={`/${tenant.slug}/clients/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por nome, contato ou setor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
          <Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            options={CLIENT_STATUSES}
          />
          {filterStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterStatus(""); setPage(1); }}
              className="text-foreground-tertiary"
            >
              Limpar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportToCSV(filtered, CSV_COLUMNS, "clientes");
              toast.success("CSV exportado com sucesso");
            }}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            search || filterStatus
              ? "Nenhum cliente encontrado"
              : "Nenhum cliente cadastrado"
          }
          description={
            search || filterStatus
              ? "Tente ajustar os filtros ou termos de busca"
              : "Cadastre seu primeiro cliente para começar"
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Link
              key={client.id}
              href={`/${tenant.slug}/clients/${client.id}`}
            >
              <Card className="cursor-pointer hover:shadow-card-glow transition-all h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar name={client.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-title-3 text-foreground-primary truncate">
                          {client.name}
                        </h3>
                        <Badge
                          variant={
                            client.status === "active"
                              ? "bg-success-bg text-success-fg"
                              : "bg-gray-100 text-gray-500"
                          }
                          className="flex-shrink-0"
                        >
                          {client.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {client.cnpj && (
                        <p className="text-caption-1 text-foreground-tertiary">
                          {client.cnpj}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {client.contactName && (
                      <p className="text-body-2 text-foreground-secondary flex items-center gap-1.5">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{client.contactName}</span>
                      </p>
                    )}
                    {client.contactEmail && (
                      <p className="text-body-2 text-foreground-secondary flex items-center gap-1.5">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{client.contactEmail}</span>
                      </p>
                    )}
                    {client.sector && (
                      <p className="text-caption-1 text-foreground-tertiary mt-2">
                        {client.sector}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
