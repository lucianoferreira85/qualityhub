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
      {/* Left side: branding hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative gradient-brand p-12 flex-col justify-between">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
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
                <CheckCircle2 className="h-5 w-5 text-white/80 flex-shrink-0" />
                <span className="text-body-1 text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-body-2 text-white/50">
            &copy; {new Date().getFullYear()} QualityHub. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right side: form */}
      <div className="flex-1 flex items-center justify-center bg-surface-tertiary p-6">
        {children}
      </div>
    </div>
  );
}
