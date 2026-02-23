"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, FileText, User, Calendar, Tag } from "lucide-react";
import { getDocumentTypeLabel, formatDate } from "@/lib/utils";

interface DocItem {
  id: string;
  code: string;
  title: string;
  status: string;
  type: string;
  version: string;
  category: string | null;
  nextReviewDate: string | null;
  author?: { id: string; name: string } | null;
}

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { tenant, can } = useTenant();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/tenants/${tenant.slug}/documents?projectId=${projectId}`)
      .then((res) => res.json())
      .then((res) => setDocuments(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenant.slug, projectId]);

  const filtered = documents.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.code.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      getDocumentTypeLabel(d.type).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${tenant.slug}/projects/${projectId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-title-1 text-foreground-primary">Documentos</h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              Políticas, procedimentos e registros do projeto
            </p>
          </div>
        </div>
        {can("document", "create") && (
          <Link href={`/${tenant.slug}/documents/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Documento
            </Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Buscar por código, título ou tipo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search ? "Nenhum documento encontrado" : "Nenhum documento neste projeto"}
          description={search ? "Tente ajustar os termos de busca" : "Adicione documentos vinculados a este projeto"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <Link key={doc.id} href={`/${tenant.slug}/documents/${doc.id}`}>
              <Card className="cursor-pointer hover:shadow-card-glow transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-caption-1 text-foreground-tertiary font-mono mb-1">{doc.code}</p>
                      <h3 className="text-body-1 font-medium text-foreground-primary line-clamp-2">
                        {doc.title}
                      </h3>
                    </div>
                    <StatusBadge status={doc.type} type="documentType" className="flex-shrink-0" />
                  </div>

                  <div className="space-y-2 mb-3">
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
                    <StatusBadge status={doc.status} />
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
    </div>
  );
}
