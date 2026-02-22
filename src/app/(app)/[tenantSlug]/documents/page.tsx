"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, FolderKanban, User, Calendar, Tag, Filter, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { getStatusColor, getStatusLabel, getDocumentTypeLabel, getDocumentTypeColor, formatDate } from "@/lib/utils";
import { exportToCSV, type CsvColumn } from "@/lib/export";
import { toast } from "sonner";
import type { Document } from "@/types";

const DOCUMENT_TYPES = [
  { value: "", label: "Todos os tipos" },
  { value: "policy", label: "Política" },
  { value: "procedure", label: "Procedimento" },
  { value: "work_instruction", label: "Instrução de Trabalho" },
  { value: "form", label: "Formulário" },
  { value: "record", label: "Registro" },
  { value: "manual", label: "Manual" },
];

const DOCUMENT_STATUSES = [
  { value: "", label: "Todos os status" },
  { value: "draft", label: "Rascunho" },
  { value: "in_review", label: "Em Revisão" },
  { value: "approved", label: "Aprovado" },
  { value: "obsolete", label: "Obsoleto" },
];

const CSV_COLUMNS: CsvColumn<DocWithRelations>[] = [
  { key: "code", label: "Código" },
  { key: "title", label: "Título" },
  { key: "type", label: "Tipo", formatter: (v) => getDocumentTypeLabel(String(v ?? "")) },
  { key: "version", label: "Versão" },
  { key: "status", label: "Status", formatter: (v) => getStatusLabel(String(v ?? "")) },
];

interface DocWithRelations extends Omit<Document, "author"> {
  project?: { id: string; name: string } | null;
  author?: { id: string; name: string } | null;
}

export default function DocumentsPage() {
  const { tenant, can } = useTenant();
  const [documents, setDocuments] = useState<DocWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDocuments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("pageSize", "20");
    const qs = params.toString();

    fetch(`/api/tenants/${tenant.slug}/documents${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((res) => {
        setDocuments(res.data || []);
        if (res.totalPages !== undefined) {
          setTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, filterType, filterStatus, page]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filtered = documents.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.code.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.project?.name.toLowerCase().includes(q) ||
      d.category?.toLowerCase().includes(q) ||
      false
    );
  });

  const hasFilters = filterType || filterStatus;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 text-foreground-primary">Documentos</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Gerencie políticas, procedimentos e registros do sistema de gestão
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportToCSV(filtered, CSV_COLUMNS, "documentos");
              toast.success("CSV exportado com sucesso");
            }}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          {can("document", "create") && (
            <Link href={`/${tenant.slug}/documents/new`}>
              <Button>
                <Plus className="h-4 w-4" />
                Novo Documento
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por código, título, projeto ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-foreground-tertiary flex-shrink-0" />
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-10 rounded-input border border-stroke-primary bg-surface-primary px-3 text-body-2 text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {DOCUMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterType(""); setFilterStatus(""); setPage(1); }}
              className="text-foreground-tertiary"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-surface-tertiary rounded w-1/4" />
                  <div className="h-5 bg-surface-tertiary rounded w-3/4" />
                  <div className="h-4 bg-surface-tertiary rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-title-3 text-foreground-primary mb-1">
              {search || hasFilters ? "Nenhum documento encontrado" : "Nenhum documento registrado"}
            </p>
            <p className="text-body-1 text-foreground-secondary">
              {search || hasFilters ? "Tente ajustar os filtros ou termos de busca" : "Adicione o primeiro documento para começar"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <Link key={doc.id} href={`/${tenant.slug}/documents/${doc.id}`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-caption-1 text-foreground-tertiary font-mono mb-1">
                        {doc.code}
                      </p>
                      <h3 className="text-body-1 font-medium text-foreground-primary line-clamp-2">
                        {doc.title}
                      </h3>
                    </div>
                    <Badge variant={getDocumentTypeColor(doc.type)} className="flex-shrink-0">
                      {getDocumentTypeLabel(doc.type)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    {doc.project && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span className="truncate">{doc.project.name}</span>
                      </div>
                    )}
                    {doc.category && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <Tag className="h-3.5 w-3.5" />
                        <span className="truncate">{doc.category}</span>
                      </div>
                    )}
                    {doc.nextReviewDate && (
                      <div className="flex items-center gap-1.5 text-body-2 text-foreground-secondary">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Revisão: {formatDate(doc.nextReviewDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stroke-secondary">
                    <Badge variant={getStatusColor(doc.status)}>
                      {getStatusLabel(doc.status)}
                    </Badge>
                    <div className="flex items-center gap-3 text-caption-1 text-foreground-tertiary">
                      <span className="font-mono">v{doc.version}</span>
                      {doc.author && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {doc.author.name.split(" ")[0]}
                        </span>
                      )}
                    </div>
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
