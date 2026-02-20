"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-surface-primary rounded-card shadow-card border border-stroke-secondary p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-title-1 text-foreground-primary">QualityHub</h1>
          <p className="text-body-1 text-foreground-secondary mt-1">
            Sistema de Gestão da Qualidade
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-body-1 font-medium text-foreground-primary mb-1">
                Nome
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required={!isLogin}
              />
            </div>
          )}

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
            />
          </div>

          {error && (
            <div className="bg-danger-bg text-danger-fg text-body-2 p-3 rounded-button">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-body-1 text-brand hover:text-brand-hover transition-colors"
          >
            {isLogin
              ? "Não tem conta? Criar agora"
              : "Já tem conta? Fazer login"}
          </button>
        </div>
      </div>
    </div>
  );
}
