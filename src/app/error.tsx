"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-surface-tertiary">
      <div className="text-center px-6">
        <AlertTriangle className="h-16 w-16 text-danger mx-auto mb-6" />
        <h1 className="text-title-1 text-foreground-primary mb-2">
          Algo deu errado
        </h1>
        <p className="text-body-1 text-foreground-secondary mb-6 max-w-md">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o
          suporte.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center h-10 px-6 bg-brand text-white rounded-button font-medium hover:bg-brand-hover transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
