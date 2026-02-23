import Link from "next/link";
import { Shield, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-tertiary p-6">
      <div className="text-center max-w-md">
        {/* 404 illustration */}
        <div className="relative mb-8">
          <div className="text-[120px] font-bold leading-none text-stroke-secondary select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center shadow-card-glow">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-title-1 text-foreground-primary mb-3">
          Pagina nao encontrada
        </h1>
        <p className="text-body-1 text-foreground-secondary mb-8">
          A pagina que voce esta procurando nao existe, foi removida ou voce
          pode ter digitado o endereco incorretamente.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-brand text-white rounded-button font-medium hover:bg-brand-hover transition-colors"
        >
          <Home className="h-4 w-4" />
          Pagina inicial
        </Link>
      </div>
    </div>
  );
}
