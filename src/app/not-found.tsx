import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-tertiary">
      <div className="text-center px-6">
        <FileQuestion className="h-16 w-16 text-foreground-tertiary mx-auto mb-6" />
        <h1 className="text-title-1 text-foreground-primary mb-2">
          Pagina nao encontrada
        </h1>
        <p className="text-body-1 text-foreground-secondary mb-6 max-w-md">
          A pagina que voce esta procurando nao existe ou foi removida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 px-6 bg-brand text-white rounded-button font-medium hover:bg-brand-hover transition-colors"
        >
          Voltar ao inicio
        </Link>
      </div>
    </div>
  );
}
