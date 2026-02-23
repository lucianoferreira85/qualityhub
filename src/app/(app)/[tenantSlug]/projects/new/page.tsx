"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, BookOpen, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { ConsultingClient, Standard } from "@/types";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function NewProjectPage() {
  const { tenant } = useTenant();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStandardIds, setSelectedStandardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [clients, setClients] = useState<ConsultingClient[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tenants/${tenant.slug}/clients`).then((r) => r.json()),
      fetch("/api/standards").then((r) => r.json()),
    ])
      .then(([clientsRes, standardsRes]) => {
        setClients(clientsRes.data || []);
        setStandards(standardsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [tenant.slug]);

  const toggleStandard = (id: string) => {
    setSelectedStandardIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          clientId: clientId || null,
          startDate: startDate || null,
          endDate: endDate || null,
          standardIds: selectedStandardIds.length > 0 ? selectedStandardIds : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar projeto");
      }

      const data = await res.json();
      toast.success("Projeto criado com sucesso");
      router.push(`/${tenant.slug}/projects/${data.data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar projeto";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: "Projetos", href: `/${tenant.slug}/projects` }, { label: "Novo" }]} />
      <div className="flex items-center gap-3">
        <Link href={`/${tenant.slug}/projects`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-title-1 text-foreground-primary">Novo Projeto</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Informações do projeto
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Nome do projeto *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Certificação ISO 27001 - Empresa X"
                required
              />
            </div>

            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Descrição
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o escopo e objetivos do projeto..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-foreground-tertiary" />
                  Cliente
                </span>
              </label>
              {loadingData ? (
                <div className="h-10 w-full bg-surface-tertiary rounded-input animate-pulse" />
              ) : (
                <Select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Nenhum cliente selecionado"
                  options={clients.map((client) => ({
                    value: client.id,
                    label: client.name,
                  }))}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                  Data de início
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                  Data prevista de término
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standards Selection */}
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-foreground-tertiary" />
                Normas aplicáveis
              </span>
            </h2>
            <p className="text-body-2 text-foreground-secondary mt-1">
              Selecione as normas que serão trabalhadas neste projeto
            </p>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 w-full bg-surface-tertiary rounded-button animate-pulse"
                  />
                ))}
              </div>
            ) : standards.length === 0 ? (
              <p className="text-body-2 text-foreground-tertiary py-4 text-center">
                Nenhuma norma cadastrada no sistema
              </p>
            ) : (
              <div className="space-y-2">
                {standards.map((standard) => {
                  const isSelected = selectedStandardIds.includes(standard.id);
                  return (
                    <button
                      key={standard.id}
                      type="button"
                      onClick={() => toggleStandard(standard.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-button border transition-all text-left ${
                        isSelected
                          ? "border-brand bg-brand-light/50"
                          : "border-stroke-secondary hover:border-stroke-primary hover:bg-surface-secondary"
                      }`}
                    >
                      <div>
                        <p className="text-body-1 font-medium text-foreground-primary">
                          {standard.code}
                        </p>
                        <p className="text-body-2 text-foreground-secondary">
                          {standard.name} ({standard.year})
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-brand border-brand"
                            : "border-stroke-primary"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedStandardIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stroke-secondary">
                {selectedStandardIds.map((id) => {
                  const std = standards.find((s) => s.id === id);
                  if (!std) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption-1 font-medium bg-brand-light text-brand"
                    >
                      {std.code}
                      <button
                        type="button"
                        onClick={() => toggleStandard(id)}
                        className="hover:text-brand-hover"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error & Actions */}
        {error && (
          <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href={`/${tenant.slug}/projects`}>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Criar Projeto
          </Button>
        </div>
      </form>
    </div>
  );
}
