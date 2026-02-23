"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ArrowLeft, CheckCircle2 } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";

export default function ForgotPasswordPage() {
  usePageTitle("Recuperar senha");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Mobile logo */}
      <div className="flex flex-col items-center mb-8 lg:hidden">
        <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mb-4 shadow-card-glow">
          <Shield className="h-7 w-7 text-white" />
        </div>
      </div>

      <div className="bg-surface-primary rounded-card shadow-card border border-stroke-secondary p-8">
        <div className="mb-8">
          <h1 className="text-title-1 text-foreground-primary">Recuperar senha</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Enviaremos um link para redefinir sua senha
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-6">
            <div className="h-14 w-14 rounded-2xl bg-success-bg flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <div>
              <p className="text-title-3 text-foreground-primary mb-1">E-mail enviado!</p>
              <p className="text-body-1 text-foreground-secondary">
                Verifique sua caixa de entrada e siga as instrucoes.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-body-1 text-brand font-medium hover:text-brand-hover transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1.5">
                E-mail
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Enviar link
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-body-2 text-foreground-secondary hover:text-foreground-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
