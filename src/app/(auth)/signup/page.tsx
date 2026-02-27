"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";

export default function SignupPage() {
  usePageTitle("Criar conta");
  const [name, setName] = useState("");
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      window.location.href = "/onboarding";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
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

      <div className="bg-surface-primary rounded-xl shadow-lg border border-stroke-secondary p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] gradient-brand" />

        <div className="mb-8">
          <h1 className="text-title-1 text-foreground-primary tracking-tight-1">Criar conta</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Comece seu trial gratuito de 14 dias
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-1 font-medium text-foreground-primary mb-1.5">
              Nome completo
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              required
              autoComplete="name"
            />
          </div>

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

          <div>
            <label className="block text-body-1 font-medium text-foreground-primary mb-1.5">
              Senha
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button border border-danger/20">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Criar conta gratis
          </Button>

          <p className="text-caption-1 text-foreground-tertiary text-center">
            Ao criar conta, voce concorda com os{" "}
            <Link href="/terms" className="text-brand hover:underline">
              Termos de uso
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-brand hover:underline">
              Politica de privacidade
            </Link>
            .
          </p>
        </form>

        <div className="mt-6 pt-6 border-t border-stroke-secondary text-center">
          <span className="text-body-2 text-foreground-secondary">Ja tem conta? </span>
          <Link
            href="/login"
            className="text-body-2 text-brand font-medium hover:text-brand-hover transition-colors"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
