"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-surface-tertiary p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-primary rounded-card shadow-card border border-stroke-secondary p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-title-1 text-foreground-primary">Recuperar senha</h1>
            <p className="text-body-1 text-foreground-secondary mt-1 text-center">
              Enviaremos um link para redefinir sua senha
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="bg-success-bg text-success-fg text-body-1 p-4 rounded-button">
                E-mail enviado! Verifique sua caixa de entrada.
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-body-1 text-brand hover:text-brand-hover transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                  E-mail
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
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

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-body-1 text-brand hover:text-brand-hover transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
