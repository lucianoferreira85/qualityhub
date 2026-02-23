"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const SECTORS = [
  { value: "Tecnologia", label: "Tecnologia" },
  { value: "Saúde", label: "Saúde" },
  { value: "Financeiro", label: "Financeiro" },
  { value: "Educação", label: "Educação" },
  { value: "Indústria", label: "Indústria" },
  { value: "Varejo", label: "Varejo" },
  { value: "Governo", label: "Governo" },
  { value: "Energia", label: "Energia" },
  { value: "Telecomunicações", label: "Telecomunicações" },
  { value: "Logística", label: "Logística" },
  { value: "Outro", label: "Outro" },
];

export default function NewClientPage() {
  const { tenant } = useTenant();
  const router = useRouter();
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sector, setSector] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/tenants/${tenant.slug}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cnpj: cnpj || null,
          contactName: contactName || null,
          contactEmail: contactEmail || null,
          sector: sector || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar cliente");
      }

      const data = await res.json();
      toast.success("Cliente criado com sucesso");
      router.push(`/${tenant.slug}/clients/${data.data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar cliente";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: "Clientes", href: `/${tenant.slug}/clients` }, { label: "Novo" }]} />
      <div className="flex items-center gap-3">
        <Link href={`/${tenant.slug}/clients`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-title-1 text-foreground-primary">Novo Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Dados do cliente
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Razão social / Nome *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Empresa ABC Ltda"
                required
              />
            </div>

            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                CNPJ
              </label>
              <Input
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Setor
              </label>
              <Select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                options={SECTORS}
                placeholder="Selecione o setor"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-title-3 text-foreground-primary">
              Contato principal
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Nome do contato
              </label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>

            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                E-mail do contato
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="joao@empresa.com"
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
          <Link href={`/${tenant.slug}/clients`}>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Criar Cliente
          </Button>
        </div>
      </form>
    </div>
  );
}
