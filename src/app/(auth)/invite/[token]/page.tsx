"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface InvitationInfo {
  tenantName: string;
  email: string;
  role: string;
  expired: boolean;
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [needsAccount, setNeedsAccount] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setInvitation(res.data);
          if (!user) setNeedsAccount(true);
        }
      })
      .catch(() => setError("Erro ao carregar convite"))
      .finally(() => setLoading(false));
  }, [token, user]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");

    try {
      if (needsAccount) {
        const supabase = createSupabaseBrowserClient();
        const { error: signUpError } = await supabase.auth.signUp({
          email: invitation!.email,
          password,
          options: { data: { name } },
        });
        if (signUpError) {
          setError(signUpError.message);
          setAccepting(false);
          return;
        }
      }

      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao aceitar convite");
        setAccepting(false);
        return;
      }

      router.push(`/${data.data.tenantSlug}/dashboard`);
    } catch {
      setError("Erro ao aceitar convite");
      setAccepting(false);
    }
  };

  const roleLabels: Record<string, string> = {
    tenant_admin: "Administrador",
    project_manager: "Gerente de Projetos",
    senior_consultant: "Consultor Sênior",
    junior_consultant: "Consultor Júnior",
    internal_auditor: "Auditor Interno",
    external_auditor: "Auditor Externo",
    client_viewer: "Visualizador (Cliente)",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <p className="text-body-1 text-foreground-secondary">Carregando convite...</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-body-1 text-danger mb-4">{error}</p>
            <Button variant="outline" onClick={() => router.push("/login")}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-title-2 text-foreground-primary text-center">
            Convite para {invitation?.tenantName}
          </h1>
          <p className="text-body-2 text-foreground-secondary text-center mt-2">
            Você foi convidado como{" "}
            <strong>{roleLabels[invitation?.role || ""] || invitation?.role}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation?.expired && (
            <p className="text-body-2 text-danger text-center">
              Este convite expirou. Solicite um novo convite ao administrador.
            </p>
          )}

          {!invitation?.expired && needsAccount && (
            <>
              <p className="text-body-2 text-foreground-secondary">
                Crie sua conta para aceitar o convite:
              </p>
              <Input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Senha (min. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}

          {error && <p className="text-body-2 text-danger">{error}</p>}

          {!invitation?.expired && (
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={accepting || (needsAccount && (!name || password.length < 6))}
            >
              {accepting ? "Aceitando..." : "Aceitar Convite"}
            </Button>
          )}

          {user && (
            <p className="text-caption text-foreground-tertiary text-center">
              Logado como {user.email}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
