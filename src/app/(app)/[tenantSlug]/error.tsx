"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, RotateCcw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  useEffect(() => {
    console.error("Erro no tenant:", error);
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
          volte ao dashboard.
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
          <Link
            href={`/${tenantSlug}/dashboard`}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 border border-stroke-primary text-foreground-secondary rounded-button font-medium hover:bg-surface-secondary transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
