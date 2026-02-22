import { FileQuestion } from "lucide-react";

export default function TenantNotFound() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center px-6">
        <FileQuestion className="h-16 w-16 text-foreground-tertiary mx-auto mb-6" />
        <h1 className="text-title-1 text-foreground-primary mb-2">
          Pagina nao encontrada
        </h1>
        <p className="text-body-1 text-foreground-secondary mb-6">
          Este recurso nao existe ou voce nao tem permissao para acessa-lo.
        </p>
      </div>
    </div>
  );
}
