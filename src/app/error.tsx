"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na aplicacao:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-tertiary p-6">
      <div className="text-center max-w-md">
        {/* Error icon with pulse */}
        <div className="relative inline-flex mb-8">
          <div className="absolute inset-0 h-20 w-20 rounded-2xl bg-danger/20 animate-ping" />
          <div className="relative h-20 w-20 rounded-2xl bg-danger-bg flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-danger" />
          </div>
        </div>

        <h1 className="text-title-1 text-foreground-primary mb-3">
          Algo deu errado
        </h1>
        <p className="text-body-1 text-foreground-secondary mb-2">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o
          suporte se o problema persistir.
        </p>
        {error.digest && (
          <p className="text-caption-1 text-foreground-tertiary mb-8">
            Codigo: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-brand text-white rounded-button font-medium hover:bg-brand-hover transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 border border-stroke-primary text-foreground-secondary rounded-button font-medium hover:bg-surface-secondary transition-colors"
          >
            <Home className="h-4 w-4" />
            Pagina inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
