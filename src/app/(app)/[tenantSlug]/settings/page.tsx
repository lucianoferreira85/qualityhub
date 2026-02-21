"use client";

import { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Pencil, Building2 } from "lucide-react";

export default function SettingsPage() {
  const { tenant, can, plan } = useTenant();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editName, setEditName] = useState(tenant.name);
  const [editCnpj, setEditCnpj] = useState("");

  const startEdit = () => {
    setEditName(tenant.name);
    setEditing(true);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/tenants/${tenant.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          cnpj: editCnpj || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar");
      }
      setEditing(false);
      setSuccess("Dados atualizados com sucesso. Recarregue a página para ver as mudanças.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-title-1 text-foreground-primary">Configurações</h1>
        <p className="text-body-1 text-foreground-secondary mt-1">
          Gerencie as configurações da empresa
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2">
        <Link href={`/${tenant.slug}/settings/members`}>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4" />
            Membros
          </Button>
        </Link>
        <Link href={`/${tenant.slug}/settings/billing`}>
          <Button variant="outline" size="sm">
            <CreditCard className="h-4 w-4" />
            Faturamento
          </Button>
        </Link>
        <Link href={`/${tenant.slug}/settings/clients`}>
          <Button variant="outline" size="sm">
            <Building2 className="h-4 w-4" />
            Clientes
          </Button>
        </Link>
      </div>

      {/* Org Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-title-3 text-foreground-primary">Dados da Empresa</h2>
            {can("settings", "update") && !editing && (
              <Button variant="outline" size="sm" onClick={startEdit}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  Nome da Empresa
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-body-2 font-medium text-foreground-primary mb-1">
                  CNPJ
                </label>
                <Input
                  value={editCnpj}
                  onChange={(e) => setEditCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              {error && (
                <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button onClick={handleSave} loading={saving}>Salvar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <p className="text-body-1 font-medium text-foreground-primary">{tenant.name}</p>
                  <p className="text-caption-1 text-foreground-tertiary font-mono">/{tenant.slug}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stroke-secondary">
                <div>
                  <p className="text-caption-1 text-foreground-tertiary">Status</p>
                  <Badge variant={
                    tenant.status === "active"
                      ? "bg-success-bg text-success-fg"
                      : tenant.status === "trial"
                      ? "bg-warning-bg text-warning-fg"
                      : "bg-gray-100 text-gray-800"
                  }>
                    {tenant.status === "active" ? "Ativo" : tenant.status === "trial" ? "Trial" : tenant.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-caption-1 text-foreground-tertiary">Plano</p>
                  <p className="text-body-1 text-foreground-primary font-medium">
                    {plan?.name || "Sem plano"}
                  </p>
                </div>
              </div>
              {success && (
                <div className="bg-success-bg text-success-fg text-body-2 p-3 rounded-button">
                  {success}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
