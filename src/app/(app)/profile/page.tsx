"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/use-page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Building2,
  Calendar,
  Shield,
  Save,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

interface UserTenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  status: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietario",
  admin: "Administrador",
  quality_manager: "Gestor da Qualidade",
  senior_consultant: "Consultor Senior",
  junior_consultant: "Consultor Junior",
  internal_auditor: "Auditor Interno",
  external_auditor: "Auditor Externo",
  viewer: "Visualizador",
};

export default function ProfilePage() {
  usePageTitle("Meu Perfil");
  useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenants, setTenants] = useState<UserTenant[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const [profileRes, tenantsRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/user/tenants"),
        ]);

        if (profileRes.ok) {
          const { data } = await profileRes.json();
          setProfile(data);
          setName(data.name || "");
        }

        if (tenantsRes.ok) {
          const { data } = await tenantsRes.json();
          setTenants(data || []);
        }
      } catch {
        setError("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      const { data } = await res.json();
      setProfile(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-foreground-secondary">
        Erro ao carregar perfil
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="h-9 w-9 flex items-center justify-center rounded-button text-foreground-secondary hover:bg-surface-tertiary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-title-1 text-foreground-primary">Meu Perfil</h1>
      </div>

      {/* Profile card */}
      <div className="bg-surface-primary rounded-card shadow-card border border-stroke-secondary overflow-hidden">
        {/* Banner */}
        <div className="h-24 gradient-brand relative">
          <div className="absolute -bottom-8 left-6">
            <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center border-4 border-surface-primary shadow-card">
              <span className="text-white text-title-1 font-semibold">
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-12 px-6 pb-6 space-y-6">
          {/* Info row */}
          <div className="flex flex-wrap items-center gap-4 text-caption-1 text-foreground-tertiary">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Membro desde {memberSince}
            </span>
            {profile.isSuperAdmin && (
              <span className="flex items-center gap-1.5 text-brand font-medium">
                <Shield className="h-3.5 w-3.5" />
                Super Admin
              </span>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1.5">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div>
              <label className="block text-body-2 font-medium text-foreground-primary mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
                <Input
                  value={profile.email}
                  disabled
                  className="pl-10 opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-caption-1 text-foreground-tertiary mt-1">
                O e-mail nao pode ser alterado
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success-bg text-success-fg text-body-2 p-3 rounded-button">
              Perfil atualizado com sucesso!
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                window.location.href = "/forgot-password";
              }}
              className="flex items-center gap-2 text-body-2 text-brand hover:text-brand-hover transition-colors"
            >
              <KeyRound className="h-4 w-4" />
              Alterar senha
            </button>

            <Button onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4 mr-2" />
              Salvar alteracoes
            </Button>
          </div>
        </div>
      </div>

      {/* Organizations */}
      {tenants.length > 0 && (
        <div className="bg-surface-primary rounded-card shadow-card border border-stroke-secondary p-6">
          <h2 className="text-title-3 text-foreground-primary mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-foreground-tertiary" />
            Organizacoes ({tenants.length})
          </h2>

          <div className="space-y-2">
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={`/${t.slug}/dashboard`}
                className="flex items-center gap-3 p-3 rounded-button hover:bg-surface-tertiary transition-colors group"
              >
                <Avatar name={t.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-1 font-medium text-foreground-primary group-hover:text-brand transition-colors truncate">
                    {t.name}
                  </p>
                  <p className="text-caption-1 text-foreground-tertiary">
                    {ROLE_LABELS[t.role] || t.role}
                  </p>
                </div>
                <span
                  className={`text-caption-1 px-2 py-0.5 rounded-full ${
                    t.status === "active"
                      ? "bg-success-bg text-success-fg"
                      : "bg-surface-tertiary text-foreground-tertiary"
                  }`}
                >
                  {t.status === "active" ? "Ativo" : t.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
