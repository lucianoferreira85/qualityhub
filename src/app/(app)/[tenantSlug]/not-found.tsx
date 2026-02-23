import { Shield, ArrowLeft } from "lucide-react";

export default function TenantNotFound() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-md px-6">
        {/* 404 with icon */}
        <div className="relative mb-8">
          <div className="text-[80px] font-bold leading-none text-stroke-secondary select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-card-glow">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-title-1 text-foreground-primary mb-3">
          Recurso nao encontrado
        </h1>
        <p className="text-body-1 text-foreground-secondary mb-8">
          Este recurso nao existe, foi removido ou voce nao tem permissao para
          acessa-lo.
        </p>

        <button
          onClick={() => typeof window !== "undefined" && window.history.back()}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-brand text-white rounded-button font-medium hover:bg-brand-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>
    </div>
  );
}
