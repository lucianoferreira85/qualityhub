import type { ReactNode } from "react";
import { Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const HIGHLIGHTS = [
  "Auditorias, NCs e planos de acao",
  "Gestao documental com versionamento",
  "Indicadores e matriz de riscos",
  "Multi-tenant para consultorias",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative gradient-brand p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3 blur-xl" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all duration-200 group-hover:bg-white/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-title-2 text-white">QualityHub</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-[2rem] font-semibold text-white leading-tight">
            Gestao da Qualidade e Conformidade ISO simplificada
          </h2>
          <div className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-white/90" />
                </div>
                <span className="text-body-1 text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-body-2 text-white/40">
            &copy; {new Date().getFullYear()} QualityHub. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-surface-tertiary p-6 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,var(--color-brand-subtle)_0%,transparent_70%)]" />
        {children}
      </div>
    </div>
  );
}
