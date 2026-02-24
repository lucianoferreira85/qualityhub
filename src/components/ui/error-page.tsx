"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Erro no modulo:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-20 animate-fade-in">
      <div className="text-center max-w-md px-6">
        <div className="h-16 w-16 rounded-2xl bg-danger-bg flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-danger" />
        </div>

        <h1 className="text-title-1 text-foreground-primary mb-3">
          Algo deu errado
        </h1>
        <p className="text-body-1 text-foreground-secondary mb-2">
          Ocorreu um erro inesperado ao carregar esta pagina. Tente novamente ou
          volte para a pagina anterior.
        </p>
        {error.digest && (
          <p className="text-caption-1 text-foreground-tertiary mb-6">
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
          <button
            onClick={() =>
              typeof window !== "undefined" && window.history.back()
            }
            className="inline-flex items-center justify-center gap-2 h-10 px-5 border border-stroke-primary text-foreground-secondary rounded-button font-medium hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
