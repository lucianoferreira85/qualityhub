"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";

export default function LoginPage() {
  usePageTitle("Entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      window.location.href = "/organizations";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center mb-8 lg:hidden">
        <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mb-4 shadow-card-glow">
          <Shield className="h-7 w-7 text-white" />
        </div>
      </div>

      <div className="bg-surface-primary rounded-xl shadow-lg border border-stroke-secondary p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] gradient-brand" />

        <div className="mb-8">
          <h1 className="text-title-1 text-foreground-primary tracking-tight-1">Bem-vindo de volta</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Acesse sua conta no QualityHub
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-body-2 font-medium text-foreground-primary mb-1.5">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-body-2 font-medium text-foreground-primary">
                Senha
              </label>
              <Link
                href="/forgot-password"
                className="text-caption-1 text-brand hover:text-brand-hover transition-colors"
              >
                Esqueceu?
              </Link>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button border border-danger/20">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-stroke-secondary text-center">
          <span className="text-body-2 text-foreground-secondary">Nao tem conta? </span>
          <Link
            href="/signup"
            className="text-body-2 text-brand font-medium hover:text-brand-hover transition-colors"
          >
            Criar agora
          </Link>
        </div>
      </div>
    </div>
  );
}
