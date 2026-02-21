"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";

export default function SignupPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-surface-tertiary p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-primary rounded-card shadow-card border border-stroke-secondary p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-title-1 text-foreground-primary">Criar conta</h1>
            <p className="text-body-1 text-foreground-secondary mt-1">
              Comece seu trial gratuito de 14 dias
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Nome completo
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

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

            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Criar conta grátis
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-body-1 text-brand hover:text-brand-hover transition-colors"
            >
              Já tem conta? Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
